import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Eye, 
  CreditCard, 
  DollarSign, 
  Receipt, 
  Download,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  UserCheck,
  Briefcase,
  Clock,
  Award
} from 'lucide-react';
import { LegacyStaff as Staff, Receipt as ReceiptType, db } from '@/utils/database';
import { StaffSalaryPDFGenerator } from '@/utils/staffSalaryPdfUtils';
import { getStaffSalaryReceipts } from '@/utils/staffSalaryStorage';

interface StaffDetailsProps {
  staff: Staff;
  isOpen: boolean;
  onClose: () => void;
}

export const StaffDetails: React.FC<StaffDetailsProps> = ({ staff, isOpen, onClose }) => {
  const [staffReceipts, setStaffReceipts] = useState<ReceiptType[]>([]);
  const [loadingReceipts, setLoadingReceipts] = useState(false);

  useEffect(() => {
    if (isOpen && staff) {
      const loadStaffReceipts = async () => {
        try {
          setLoadingReceipts(true);
          const receipts = await getStaffSalaryReceipts(staff.id);
          setStaffReceipts(receipts || []);
        } catch (error) {
          console.error('Error loading staff receipts:', error);
          setStaffReceipts([]);
        } finally {
          setLoadingReceipts(false);
        }
      };

      loadStaffReceipts();
    }
  }, [staff, isOpen]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleDownloadReceipt = async (receipt: ReceiptType) => {
    try {
      const salaryReceiptData = {
        receipt,
        staff,
        salaryDetails: {
          baseSalary: receipt.amount,
          month: new Date(receipt.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          receiptType: receipt.description?.includes('Bonus') ? 'bonus' as const : 
                      receipt.description?.includes('adjustment') ? 'adjustment' as const : 
                      'salary' as const
        }
      };
      
      await StaffSalaryPDFGenerator.downloadSalaryReceiptPDF(salaryReceiptData);
    } catch (error) {
      console.error('Error downloading salary receipt:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'inactive': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'manager': return 'bg-purple-100 text-purple-800';
      case 'trainer': return 'bg-blue-100 text-blue-800';
      case 'receptionist': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const getTotalPaid = () => {
    return staffReceipts.reduce((total, receipt) => total + receipt.amount, 0);
  };

  if (!staff) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={staff.profileImage || undefined} className="object-cover" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(staff.name)}
                  </AvatarFallback>
                </Avatar>
                {staff.profileImage && (
                  <div className="absolute inset-0 rounded-full ring-2 ring-primary/20"></div>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{staff.name}</h2>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={getStatusColor(staff.status)}>
                    {staff.status.charAt(0).toUpperCase() + staff.status.slice(1)}
                  </Badge>
                  <Badge className={getRoleColor(staff.role)}>
                    {staff.role.charAt(0).toUpperCase() + staff.role.slice(1)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Joined {format(new Date(staff.joiningDate), 'MMMM yyyy')}
                  </span>
                </div>
              </div>
            </div>

            {/* ID Card Preview in Header */}
            {staff.idCardImage && (
              <div className="flex flex-col items-center space-y-2">
                <div className="relative">
                  <div className="h-12 w-18 border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                    <img 
                      src={staff.idCardImage} 
                      alt="Staff ID Card" 
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
                        <span>Staff ID Card - {staff.name}</span>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex justify-center p-4">
                      <img 
                        src={staff.idCardImage} 
                        alt="Staff ID Card" 
                        className="max-w-full max-h-96 object-contain rounded-lg border"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

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
                    <p className="text-sm text-muted-foreground">{staff.email || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{staff.phone}</p>
                  </div>
                </div>

                {staff.dateOfBirth && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Date of Birth</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(staff.dateOfBirth), 'PPP')} ({calculateAge(staff.dateOfBirth)} years old)
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Joining Date</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(staff.joiningDate), 'PPP')}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {staff.address && (
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">{staff.address}</p>
                  </div>
                </div>
              )}
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
                    <AvatarImage src={staff.profileImage || undefined} className="object-cover" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {getInitials(staff.name)}
                    </AvatarFallback>
                  </Avatar>
                  {staff.profileImage ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span className="text-xs">View Photo</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Profile Photo - {staff.name}</DialogTitle>
                        </DialogHeader>
                        <div className="flex justify-center p-4">
                          <img 
                            src={staff.profileImage} 
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
                    {staff.idCardImage ? (
                      <img 
                        src={staff.idCardImage} 
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
                  {staff.idCardImage ? (
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
                            <span>Staff ID Card - {staff.name}</span>
                          </DialogTitle>
                        </DialogHeader>
                        <div className="flex justify-center p-4">
                          <img 
                            src={staff.idCardImage} 
                            alt="Staff ID Card" 
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

          {/* Emergency Contact */}
          {(staff.emergencyContact || staff.emergencyPhone) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="h-5 w-5" />
                  <span>Emergency Contact</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {staff.emergencyContact && (
                  <div>
                    <p className="text-sm font-medium">Contact Name</p>
                    <p className="text-sm text-muted-foreground">{staff.emergencyContact}</p>
                  </div>
                )}
                {staff.emergencyPhone && (
                  <div>
                    <p className="text-sm font-medium">Contact Phone</p>
                    <p className="text-sm text-muted-foreground">{staff.emergencyPhone}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Employment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5" />
                <span>Employment Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">Role</p>
                <Badge className={getRoleColor(staff.role)}>
                  {staff.role.charAt(0).toUpperCase() + staff.role.slice(1)}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Salary</p>
                <div className="flex items-center space-x-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-semibold text-green-600">
                    ${staff.salary.toLocaleString()}
                  </p>
                </div>
              </div>
              {staff.specialization && (
                <div>
                  <p className="text-sm font-medium">Specialization</p>
                  <p className="text-sm text-muted-foreground">{staff.specialization}</p>
                </div>
              )}
              {staff.shift && (
                <div>
                  <p className="text-sm font-medium">Shift</p>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground capitalize">{staff.shift}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Salary Receipts */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Receipt className="h-5 w-5" />
                <span>Salary Receipts</span>
                <Badge variant="secondary" className="ml-2">
                  {staffReceipts.length}
                </Badge>
                {staffReceipts.length > 0 && (
                  <div className="ml-auto flex items-center space-x-1 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>Total: ${getTotalPaid().toLocaleString()}</span>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingReceipts ? (
                <p className="text-sm text-muted-foreground">Loading salary receipts...</p>
              ) : staffReceipts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No salary receipts found for this staff member.</p>
              ) : (
                <div className="space-y-3">
                  {staffReceipts.slice(0, 5).map((receipt) => (
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
                          {receipt.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {receipt.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-green-600">
                            ${receipt.amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {receipt.payment_type.replace('_', ' ')}
                          </p>
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
                  {staffReceipts.length > 5 && (
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
                <p className="text-sm font-medium">Staff ID</p>
                <p className="text-sm text-muted-foreground font-mono">#{staff.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(staff.createdAt), 'PPP')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Last Updated</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(staff.updatedAt), 'PPP')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};