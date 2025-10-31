import React, { useState } from 'react';
import { Search, CreditCard, User, Phone, IndianRupee, Receipt, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/utils/database';

interface Member {
  id: string;
  name: string;
  mobile_no: string;
  custom_member_id?: string;
  total_membership_fee: number;
  paid_amount: number;
  current_due_amount: number;
  membership_status: string;
  member_image?: string;
}

interface PaymentResult {
  success: boolean;
  member_id: string;
  updated_member_data: {
    amount_paid: number;
    due_amount: number;
    membership_status: string;
    total_membership_fee: number;
  };
  new_receipt: {
    receipt_id: string;
    receipt_number: string;
    receipt_type: string;
    amount_paid_now: number;
    previous_paid: number;
    new_total_paid: number;
    total_amount: number;
    remaining_due: number;
    payment_date: string;
    payment_type: string;
    remarks: string;
  };
  confirmation_message: string;
}

export const DuePaymentForm: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentType, setPaymentType] = useState<string>('cash');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Error",
        description: "Please enter a mobile number to search",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    try {
      const result = await db.findMemberByMobile(searchTerm.trim()) as any;
      
      if (result.success && result.member) {
        setSelectedMember(result.member);
        setPaymentResult(null); // Clear previous payment result
        
        if (result.member.current_due_amount <= 0) {
          toast({
            title: "No Due Amount",
            description: `${result.member.name} has no pending dues.`,
          });
        }
      } else {
        setSelectedMember(null);
        toast({
          title: "Member Not Found",
          description: result.error || "No member found with this mobile number",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedMember) {
      toast({
        title: "Error",
        description: "Please select a member first",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    if (amount > selectedMember.current_due_amount) {
      toast({
        title: "Amount Too High",
        description: `Payment amount (₹${amount}) cannot exceed due amount (₹${selectedMember.current_due_amount})`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await db.payMemberDueAmount(
        selectedMember.id,
        amount,
        paymentType,
        'Receptionist'
      ) as PaymentResult;

      if (result.success) {
        setPaymentResult(result);
        setPaymentAmount('');
        
        // Update the selected member with new data
        setSelectedMember({
          ...selectedMember,
          paid_amount: result.updated_member_data.amount_paid,
          current_due_amount: result.updated_member_data.due_amount,
          membership_status: result.updated_member_data.membership_status
        });

        toast({
          title: "Payment Successful",
          description: result.confirmation_message,
        });
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

  const resetForm = () => {
    setSearchTerm('');
    setSelectedMember(null);
    setPaymentAmount('');
    setPaymentType('cash');
    setPaymentResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Member
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                placeholder="Enter mobile number"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={searching}>
                {searching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Member Details Section */}
      {selectedMember && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Member Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4 mb-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={selectedMember.member_image} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {selectedMember.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{selectedMember.name}</h3>
                <p className="text-muted-foreground">ID: {selectedMember.custom_member_id || selectedMember.id}</p>
                <p className="text-muted-foreground">📱 {selectedMember.mobile_no}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Badge variant={selectedMember.current_due_amount > 0 ? "destructive" : "default"}>
                  {selectedMember.membership_status}
                </Badge>
              </div>

              <div>
                <Label>Status</Label>
                <Badge variant={selectedMember.current_due_amount > 0 ? "destructive" : "default"}>
                  {selectedMember.membership_status}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <Label>Total Fee</Label>
                <p className="text-lg font-bold text-blue-600">₹{selectedMember.total_membership_fee}</p>
              </div>
              <div className="text-center">
                <Label>Paid Amount</Label>
                <p className="text-lg font-bold text-green-600">₹{selectedMember.paid_amount}</p>
              </div>
              <div className="text-center">
                <Label>Due Amount</Label>
                <p className="text-lg font-bold text-red-600">₹{selectedMember.current_due_amount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Section */}
      {selectedMember && selectedMember.current_due_amount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Process Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Payment Amount</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="pl-10"
                    max={selectedMember.current_due_amount}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Maximum: ₹{selectedMember.current_due_amount}
                </p>
              </div>
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
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handlePayment} 
                disabled={loading || !paymentAmount}
                className="flex-1"
              >
                {loading ? 'Processing...' : 'Process Payment'}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Result Section */}
      {paymentResult && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              Payment Successful
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Receipt Number</Label>
                <p className="font-medium">{paymentResult.new_receipt.receipt_number}</p>
              </div>
              <div>
                <Label>Payment Date</Label>
                <p className="font-medium">
                  {new Date(paymentResult.new_receipt.payment_date).toLocaleString()}
                </p>
              </div>
              <div>
                <Label>Amount Paid</Label>
                <p className="font-medium text-green-600">₹{paymentResult.new_receipt.amount_paid_now}</p>
              </div>
              <div>
                <Label>Remaining Due</Label>
                <p className="font-medium text-red-600">₹{paymentResult.new_receipt.remaining_due}</p>
              </div>
            </div>
            
            <div className="p-3 bg-white rounded border">
              <Label>Remarks</Label>
              <p className="font-medium">{paymentResult.new_receipt.remarks}</p>
            </div>
            
            <p className="text-center text-green-700 font-medium">
              {paymentResult.confirmation_message}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};