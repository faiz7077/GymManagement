import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Eye,
  CreditCard,
  Activity,
  Scale,
  Ruler,
  Receipt,
  Download,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  UserCheck,
  DollarSign,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { LegacyMember as Member, Receipt as ReceiptType, db } from '@/utils/database';
import { ReceiptPDFGenerator } from '@/utils/pdfUtils';
import { calculateBMI, getBMICategory, getBMIBadgeColor, convertCmToFeetInches, getIdealWeightRange } from '@/utils/bmiUtils';

interface MemberDetailsProps {
  member: Member;
  isOpen: boolean;
  onClose: () => void;
}

interface SubscriptionAlertProps {
  member: Member;
  type: 'expiring_soon' | 'expired';
  onRenewal: () => void;
}

const SubscriptionAlert: React.FC<SubscriptionAlertProps> = ({ member, type, onRenewal }) => {
  const [isRenewalDialogOpen, setIsRenewalDialogOpen] = useState(false);
  const [renewalPlanType, setRenewalPlanType] = useState(member.planType || 'monthly');
  const [renewalFees, setRenewalFees] = useState(member.membershipFees || 0);
  const [isRenewing, setIsRenewing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const daysUntilExpiration = member.subscriptionEndDate ?
    db.getDaysUntilExpiration(member.subscriptionEndDate) : 0;

  const handleRenewal = async () => {
    if (!renewalFees || renewalFees <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid membership fee amount.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsRenewing(true);
      const result = await db.renewMembership(
        member.id,
        renewalPlanType,
        renewalFees,
        user?.name || 'System'
      );

      if (result.success) {
        toast({
          title: "Membership Renewed",
          description: `${member.name}'s membership has been successfully renewed for ${renewalPlanType} plan.`,
        });
        setIsRenewalDialogOpen(false);
        onRenewal();
      } else {
        throw new Error(result.error || 'Failed to renew membership');
      }
    } catch (error) {
      console.error('Renewal error:', error);
      toast({
        title: "Renewal Failed",
        description: error instanceof Error ? error.message : "Failed to renew membership. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRenewing(false);
    }
  };

  const alertConfig = {
    expiring_soon: {
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-500',
      iconColor: 'text-amber-500',
      textColor: 'text-amber-700',
      subtextColor: 'text-amber-600',
      title: 'Subscription Expiring Soon',
      message: daysUntilExpiration > 0
        ? `This membership expires in ${daysUntilExpiration} day${daysUntilExpiration !== 1 ? 's' : ''} on ${format(new Date(member.subscriptionEndDate), 'PPP')}.`
        : `This membership expires today (${format(new Date(member.subscriptionEndDate), 'PPP')}).`,
      buttonColor: 'bg-amber-600 hover:bg-amber-700'
    },
    expired: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-500',
      iconColor: 'text-red-500',
      textColor: 'text-red-700',
      subtextColor: 'text-red-600',
      title: 'Subscription Expired',
      message: `This membership expired ${Math.abs(daysUntilExpiration)} day${Math.abs(daysUntilExpiration) !== 1 ? 's' : ''} ago on ${format(new Date(member.subscriptionEndDate), 'PPP')}.`,
      buttonColor: 'bg-red-600 hover:bg-red-700'
    }
  };

  const config = alertConfig[type];

  return (
    <>
      <div className={`${config.bgColor} border-l-4 ${config.borderColor} p-4 mb-6`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertTriangle className={`h-5 w-5 ${config.iconColor}`} />
            </div>
            <div className="ml-3">
              <p className={`text-sm ${config.textColor} font-medium`}>{config.title}</p>
              <p className={`mt-1 text-sm ${config.subtextColor}`}>
                {config.message}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsRenewalDialogOpen(true)}
            className={`${config.buttonColor} text-white`}
            size="sm"
          >
            Renew Now
          </Button>
        </div>
      </div>

      {/* Renewal Dialog */}
      <Dialog open={isRenewalDialogOpen} onOpenChange={setIsRenewalDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Renew Membership - {member.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="planType">Plan Type</Label>
              <Select value={renewalPlanType} onValueChange={setRenewalPlanType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly (3 months)</SelectItem>
                  <SelectItem value="half_yearly">Half Yearly (6 months)</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="fees">Membership Fees (₹)</Label>
              <Input
                id="fees"
                type="number"
                value={renewalFees}
                onChange={(e) => setRenewalFees(Number(e.target.value))}
                placeholder="Enter membership fees"
                min="0"
                step="0.01"
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>New subscription period:</strong><br />
                Start: {format(new Date(), 'PPP')}<br />
                End: {format(new Date(db.calculateSubscriptionEndDate(new Date().toISOString().split('T')[0], renewalPlanType)), 'PPP')}
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                onClick={() => setIsRenewalDialogOpen(false)}
                disabled={isRenewing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRenewal}
                disabled={isRenewing}
                className="flex items-center space-x-2"
              >
                {isRenewing && <RefreshCw className="h-4 w-4 animate-spin" />}
                <span>{isRenewing ? 'Renewing...' : 'Renew Membership'}</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const MemberDetails: React.FC<MemberDetailsProps> = ({ member, isOpen, onClose }) => {
  const [memberReceipts, setMemberReceipts] = useState<ReceiptType[]>([]);
  const [loadingReceipts, setLoadingReceipts] = useState(false);
  const [dueAmount, setDueAmount] = useState<{ dueAmount: number; unpaidInvoices: number }>({ dueAmount: 0, unpaidInvoices: 0 });

  useEffect(() => {
    if (isOpen && member) {
      const loadMemberReceipts = async () => {
        try {
          setLoadingReceipts(true);
          const receipts = await db.getReceiptsByMemberId(member.id);
          setMemberReceipts(receipts || []);

          // Load due amount using the same method as receipts
          const due = await db.getMemberDueAmount(member.id);
          setDueAmount(due);

          // Debug: Log the member data to see what fields are available
          console.log('Member data in MemberDetails:', {
            name: member.name,
            id: member.id,
            due_amount: member.due_amount,
            dueAmount: member.dueAmount,
            paidAmount: member.paidAmount,
            amount_paid: member.amount_paid,
            paid_amount: member.paid_amount,
            membershipFees: member.membershipFees,
            packageFee: member.packageFee,
            registrationFee: member.registrationFee,
            discount: member.discount,
            calculatedDue: due,
            receiptsCount: receipts?.length || 0
          });
        } catch (error) {
          console.error('Error loading member receipts:', error);
          setMemberReceipts([]);
          setDueAmount({ dueAmount: 0, unpaidInvoices: 0 });
        } finally {
          setLoadingReceipts(false);
        }
      };

      loadMemberReceipts();
    }
  }, [member, isOpen]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleDownloadReceipt = async (receipt: ReceiptType) => {
    try {
      await ReceiptPDFGenerator.downloadReceiptPDF(receipt);
    } catch (error) {
      console.error('Error downloading receipt:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'inactive': return 'bg-destructive text-destructive-foreground';
      case 'frozen': return 'bg-warning text-warning-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={member.memberImage || undefined} className="object-cover" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                {member.memberImage && (
                  <div className="absolute inset-0 rounded-full ring-2 ring-primary/20"></div>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{member.name}</h2>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={getStatusColor(member.status)}>
                    {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                  </Badge>
                  {member.subscriptionStatus === 'expiring_soon' && (
                    <Badge className="bg-amber-500 text-white">
                      Expiring Soon
                    </Badge>
                  )}
                  {member.subscriptionStatus === 'expired' && (
                    <Badge className="bg-red-500 text-white">
                      Subscription Expired
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    Member since {format(new Date(member.dateOfRegistration), 'MMMM yyyy')}
                  </span>
                </div>
              </div>
            </div>

            {/* ID Card Preview in Header */}
            {member.idProofImage && (
              <div className="flex flex-col items-center space-y-2">
                <div className="relative">
                  <div className="h-12 w-18 border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                    <img
                      src={member.idProofImage}
                      alt="Official ID Card"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center space-x-1">
                      <Eye className="h-3 w-3" />
                      <span className="text-xs">View ID</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <CreditCard className="h-5 w-5" />
                        <span>Official ID Card - {member.name}</span>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex justify-center p-4">
                      <img
                        src={member.idProofImage}
                        alt="Official ID Card"
                        className="max-w-full max-h-96 object-contain rounded-lg border"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Subscription Status Alert */}
        {member.subscriptionStatus === 'expiring_soon' && (
          <SubscriptionAlert
            member={member}
            type="expiring_soon"
            onRenewal={() => {
              // Refresh member data after renewal
              window.location.reload();
            }}
          />
        )}

        {member.subscriptionStatus === 'expired' && (
          <SubscriptionAlert
            member={member}
            type="expired"
            onRenewal={() => {
              // Refresh member data after renewal
              window.location.reload();
            }}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

          {/* Personal Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Mobile</p>
                    <p className="text-sm text-muted-foreground">{member.mobileNo}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Date of Birth</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(member.dateOfBirth), 'PPP')} ({calculateAge(member.dateOfBirth)} years old)
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Registration Date</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(member.dateOfRegistration), 'PPP')}
                    </p>
                  </div>
                </div>

                {member.subscriptionStartDate && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Subscription Start</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(member.subscriptionStartDate), 'PPP')}
                      </p>
                    </div>
                  </div>
                )}

                {member.subscriptionEndDate && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Subscription End</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(member.subscriptionEndDate), 'PPP')}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Occupation</p>
                    <p className="text-sm text-muted-foreground">{member.occupation}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Marital Status</p>
                    <p className="text-sm text-muted-foreground capitalize">{member.maritalStatus}</p>
                  </div>
                </div>

                {member.anniversaryDate && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Anniversary Date</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(member.anniversaryDate), 'PPP')}
                      </p>
                    </div>
                  </div>
                )}

                {member.bloodGroup && (
                  <div className="flex items-center space-x-3">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Blood Group</p>
                      <p className="text-sm text-muted-foreground">{member.bloodGroup}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Gender</p>
                    <p className="text-sm text-muted-foreground capitalize">{member.sex}</p>
                  </div>
                </div>

                {member.telephoneNo && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Telephone</p>
                      <p className="text-sm text-muted-foreground">{member.telephoneNo}</p>
                    </div>
                  </div>
                )}

                {member.alternateNo && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Alternate Number</p>
                      <p className="text-sm text-muted-foreground">{member.alternateNo}</p>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">{member.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile & ID Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Documents</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Profile Photo</p>
                <div className="flex flex-col items-center space-y-2">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={member.memberImage || undefined} className="object-cover" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  {member.memberImage ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span className="text-xs">View Photo</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Profile Photo - {member.name}</DialogTitle>
                        </DialogHeader>
                        <div className="flex justify-center p-4">
                          <img
                            src={member.memberImage}
                            alt="Profile Photo"
                            className="max-w-full max-h-96 object-contain rounded-lg border"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <p className="text-xs text-muted-foreground">No photo uploaded</p>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-2">ID Card</p>
                <div className="flex flex-col items-center space-y-2">
                  <div className="h-24 w-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    {member.idProofImage ? (
                      <img
                        src={member.idProofImage}
                        alt="ID Card"
                        className="h-full w-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-center">
                        <CreditCard className="h-6 w-6 mx-auto text-gray-400" />
                        <p className="text-xs text-gray-500 mt-1">No ID Card</p>
                      </div>
                    )}
                  </div>
                  {member.idProofImage ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center space-x-1">
                          <CreditCard className="h-3 w-3" />
                          <span className="text-xs">View ID Card</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center space-x-2">
                            <CreditCard className="h-5 w-5" />
                            <span>Official ID Card - {member.name}</span>
                          </DialogTitle>
                        </DialogHeader>
                        <div className="flex justify-center p-4">
                          <img
                            src={member.idProofImage}
                            alt="Official ID Card"
                            className="max-w-full max-h-96 object-contain rounded-lg border"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <p className="text-xs text-muted-foreground">No ID card uploaded</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Membership Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Membership Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {member.customMemberId && (
                <div>
                  <p className="text-sm font-medium">Member ID</p>
                  <p className="text-sm text-muted-foreground font-semibold">
                    {member.customMemberId}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium">Plan Type</p>
                <p className="text-sm text-muted-foreground font-semibold capitalize">
                  {member.planType.replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Services</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(typeof member.services === 'string' ? JSON.parse(member.services) : member.services || []).map((service: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {service.charAt(0).toUpperCase() + service.slice(1)}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Payment Mode</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {member.paymentMode.replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Fee Structure</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Registration Fee:</span>
                    <span>₹{member.registrationFee || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Package Fee:</span>
                    <span>₹{member.packageFee || member.membershipFees || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Discount:</span>
                    <span className="text-green-600">-₹{member.discount || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t pt-1">
                    <span>Total Amount:</span>
                    <span>₹{(member.registrationFee || 0) + (member.packageFee || member.membershipFees || 0) - (member.discount || 0)}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium">Payment Status</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Total Amount:</span>
                    <span>₹{(member.registrationFee || 0) + (member.packageFee || member.membershipFees || 0) - (member.discount || 0)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-blue-600">
                    <span>Amount Paid:</span>
                    <span>₹{(() => {
                      // Use the database-calculated due amount to determine paid amount
                      const totalAmount = (member.registrationFee || 0) + (member.packageFee || member.membershipFees || 0) - (member.discount || 0);
                      const actualDueAmount = member.due_amount || member.dueAmount || dueAmount.dueAmount || 0;
                      return Math.max(0, totalAmount - actualDueAmount);
                    })()}</span>
                  </div>
                  <div className={`flex justify-between text-sm font-semibold border-t pt-1 ${(member.due_amount || member.dueAmount || dueAmount.dueAmount || 0) > 0
                    ? 'text-red-600'
                    : 'text-green-600'
                    }`}>
                    <span>Due Amount:</span>
                    <span>₹{member.due_amount || member.dueAmount || dueAmount.dueAmount || 0}</span>
                  </div>
                </div>
                {dueAmount.unpaidInvoices > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {dueAmount.unpaidInvoices} unpaid invoice(s)
                  </p>
                )}
              </div>
              {member.receiptNo && (
                <div>
                  <p className="text-sm font-medium">Receipt Number</p>
                  <p className="text-sm text-muted-foreground">{member.receiptNo}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          {/* <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Additional Info</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {member.medicalIssues && (
                <div>
                  <p className="text-sm font-medium">Medical Issues</p>
                  <p className="text-sm text-muted-foreground">{member.medicalIssues}</p>
                </div>
              )}
              {member.goals && (
                <div>
                  <p className="text-sm font-medium">Fitness Goals</p>
                  <p className="text-sm text-muted-foreground">{member.goals}</p>
                </div>
              )}
            </CardContent>
          </Card> */}

          {/* Physical Measurements */}
          {(member.height && member.weight) && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Physical Measurements</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Ruler className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{member.height} cm</p>
                    <p className="text-sm text-muted-foreground">Height</p>
                    <p className="text-xs text-muted-foreground">{convertCmToFeetInches(member.height)}</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Scale className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{member.weight} kg</p>
                    <p className="text-sm text-muted-foreground">Weight</p>
                    <p className="text-xs text-muted-foreground">{Math.round(member.weight * 2.205)} lbs</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Activity className="h-8 w-8 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{calculateBMI(member.weight, member.height)}</p>
                    <p className="text-sm text-muted-foreground">BMI</p>
                    <Badge className={`text-xs ${getBMIBadgeColor(calculateBMI(member.weight, member.height))}`}>
                      {getBMICategory(calculateBMI(member.weight, member.height))}
                    </Badge>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Scale className="h-8 w-8 text-orange-600" />
                    </div>
                    <p className="text-sm font-bold text-foreground">
                      {getIdealWeightRange(member.height).min} - {getIdealWeightRange(member.height).max} kg
                    </p>
                    <p className="text-sm text-muted-foreground">Ideal Weight</p>
                    <p className="text-xs text-muted-foreground">
                      {member.weight >= getIdealWeightRange(member.height).min &&
                        member.weight <= getIdealWeightRange(member.height).max ? (
                        <span className="text-green-600">✓ Healthy Range</span>
                      ) : (
                        <span className="text-yellow-600">Outside Range</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Member Receipts */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Receipt className="h-5 w-5" />
                  <span>Payment Receipts</span>
                  <Badge variant="secondary" className="ml-2">
                    {memberReceipts.length}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      setLoadingReceipts(true);
                      const receipts = await db.getReceiptsByMemberId(member.id);
                      setMemberReceipts(receipts || []);
                      const due = await db.getMemberDueAmount(member.id);
                      setDueAmount(due);
                    } catch (error) {
                      console.error('Error refreshing receipts:', error);
                    } finally {
                      setLoadingReceipts(false);
                    }
                  }}
                  disabled={loadingReceipts}
                  title="Refresh receipt data"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingReceipts ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingReceipts ? (
                <p className="text-sm text-muted-foreground">Loading receipts...</p>
              ) : memberReceipts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No receipts found for this member.</p>
              ) : (
                <div className="space-y-3">
                  {memberReceipts.slice(0, 5).map((receipt) => (
                    <div key={receipt.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Receipt className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{receipt.receipt_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(receipt.created_at), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-green-600">
                            ₹{receipt.amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {receipt.payment_type}
                          </p>
                          {/* Show receipt payment details like in receipts page */}
                          <div className="text-xs text-muted-foreground">
                            <span className="text-blue-600">Paid: ₹{(receipt.amount_paid || receipt.amount || 0).toFixed(2)}</span>
                            {(receipt.due_amount || 0) > 0 && (
                              <span className="text-red-600 ml-1">Due: ₹{(receipt.due_amount || 0).toFixed(2)}</span>
                            )}
                            {(receipt.due_amount || 0) === 0 && (
                              <span className="text-green-600 ml-1">✓ Paid</span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadReceipt(receipt)}
                          className="flex items-center space-x-1"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {memberReceipts.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center">
                      Showing latest 5 receipts. View all receipts in the Receipts page.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>System Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">Member ID</p>
                <p className="text-sm text-muted-foreground font-mono">#{member.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(member.createdAt), 'PPP')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Last Updated</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(member.updatedAt), 'PPP')}
                </p>
              </div>
              {process.env.NODE_ENV === 'development' && (
                <div className="pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      console.log('🔍 Raw member data:', member);
                      console.log('🔍 Due amount state:', dueAmount);
                    }}
                    className="text-xs"
                  >
                    🔍 Debug Data
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
