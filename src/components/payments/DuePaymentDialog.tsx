import React, { useState } from 'react';
import { CreditCard, IndianRupee, Receipt, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/utils/database';

interface MemberWithDue {
  id: string;
  name: string;
  customMemberId?: string;
  mobileNo: string;
  email: string;
  dueAmount: number;
  registrationFee?: number;
  packageFee?: number;
  membershipFees?: number;
  discount?: number;
  paidAmount?: number;
}

interface DuePaymentDialogProps {
  member: MemberWithDue | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export const DuePaymentDialog: React.FC<DuePaymentDialogProps> = ({
  member,
  isOpen,
  onClose,
  onPaymentSuccess
}) => {
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentType, setPaymentType] = useState<string>('cash');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Set the payment amount to the exact due amount when dialog opens
  React.useEffect(() => {
    if (member && isOpen) {
      setPaymentAmount(member.dueAmount.toString());
    }
  }, [member, isOpen]);

  const handleClose = () => {
    setPaymentAmount('');
    setPaymentType('cash');
    onClose();
  };

  const handlePayment = async () => {
    if (!member) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    if (amount > member.dueAmount) {
      toast({
        title: "Amount Too High",
        description: `Payment amount (₹${amount}) cannot exceed due amount (₹${member.dueAmount})`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('💰 Processing due payment:', {
        memberId: member.id,
        memberName: member.name,
        dueAmount: member.dueAmount,
        paymentAmount: amount,
        paymentType
      });

      const result = await db.payMemberDueAmount(
        member.id,
        amount,
        paymentType,
        'Receptionist'
      ) as any;

      if (result.success) {
        toast({
          title: "Payment Successful",
          description: result.confirmation_message || `₹${amount} payment received successfully`,
        });
        
        handleClose();
        onPaymentSuccess();
      } else {
        toast({
          title: "Payment Failed",
          description: result.error || "Failed to process payment",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!member) return null;

  const totalFee = (member.registrationFee || 0) + (member.packageFee || 0) - (member.discount || 0);
  const paidAmount = member.paidAmount || 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pay Due Amount
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Member Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <User className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-gray-500">ID: {member.customMemberId || member.id}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center p-2 bg-blue-50 rounded">
                  <p className="text-gray-600">Total Fee</p>
                  <p className="font-bold text-blue-600">₹{totalFee.toLocaleString()}</p>
                </div>
                <div className="text-center p-2 bg-green-50 rounded">
                  <p className="text-gray-600">Paid</p>
                  <p className="font-bold text-green-600">₹{paidAmount.toLocaleString()}</p>
                </div>
                <div className="text-center p-2 bg-red-50 rounded">
                  <p className="text-gray-600">Due</p>
                  <p className="font-bold text-red-600">₹{member.dueAmount.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Amount */}
          <div>
            <Label htmlFor="amount">Payment Amount</Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="amount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="pl-10"
                max={member.dueAmount}
                step="0.01"
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <p className="text-sm text-amber-600">
                Maximum payable: ₹{member.dueAmount.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <Label htmlFor="paymentType">Payment Method</Label>
            <Select value={paymentType} onValueChange={setPaymentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Summary */}
          {paymentAmount && !isNaN(parseFloat(paymentAmount)) && (
            <Card className="bg-gray-50">
              <CardContent className="p-3">
                <div className="flex justify-between items-center text-sm">
                  <span>Payment Amount:</span>
                  <span className="font-bold">₹{parseFloat(paymentAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Remaining Due:</span>
                  <span className="font-bold text-red-600">
                    ₹{Math.max(0, member.dueAmount - parseFloat(paymentAmount)).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handlePayment} 
              disabled={loading || !paymentAmount || parseFloat(paymentAmount) <= 0}
              className="flex-1"
            >
              {loading ? 'Processing...' : (
                <>
                  <Receipt className="h-4 w-4 mr-2" />
                  Pay ₹{paymentAmount || '0'}
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};