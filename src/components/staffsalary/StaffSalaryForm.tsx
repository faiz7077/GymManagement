import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { LegacyStaff as Staff } from '@/utils/database';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const staffSalarySchema = z.object({
  staffId: z.string().min(1, 'Please select a staff member'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  paymentType: z.enum(['cash', 'card', 'upi', 'bank_transfer']),
  receiptType: z.enum(['salary', 'bonus', 'adjustment']),
  description: z.string().min(1, 'Description is required'),
});

type StaffSalaryFormData = z.infer<typeof staffSalarySchema>;

interface StaffSalaryFormProps {
  staff: Staff[];
  onSubmit: (data: StaffSalaryFormData) => void;
  initialData?: {
    staffId: string;
    amount: number;
    paymentType: 'cash' | 'card' | 'upi' | 'bank_transfer';
    receiptType: 'salary' | 'bonus' | 'adjustment';
    description: string;
  };
}

export const StaffSalaryForm: React.FC<StaffSalaryFormProps> = ({ staff, onSubmit, initialData }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StaffSalaryFormData>({
    resolver: zodResolver(staffSalarySchema),
    defaultValues: initialData || {
      paymentType: 'bank_transfer',
      receiptType: 'salary',
      amount: 0,
    }
  });

  const selectedStaffId = watch('staffId');
  const receiptType = watch('receiptType');

  // Get selected staff member
  const selectedStaff = staff.find(s => s.id === selectedStaffId);

  // Auto-generate description based on receipt type and staff
  React.useEffect(() => {
    if (selectedStaff && receiptType) {
      const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      let description = '';
      
      switch (receiptType) {
        case 'salary':
          description = `Salary payment for ${currentMonth} - ${selectedStaff.role || 'Staff'}`;
          setValue('amount', selectedStaff.salary || 0);
          break;
        case 'bonus':
          description = `Bonus payment for ${currentMonth} - ${selectedStaff.role || 'Staff'}`;
          setValue('amount', 0);
          break;
        case 'adjustment':
          description = `Salary adjustment for ${currentMonth} - ${selectedStaff.role || 'Staff'}`;
          setValue('amount', 0);
          break;
        default:
          description = `Staff payment for ${currentMonth} - ${selectedStaff.role || 'Staff'}`;
      }
      
      setValue('description', description);
    }
  }, [selectedStaff, receiptType, setValue]);

  const onFormSubmit = async (data: StaffSalaryFormData) => {
    setLoading(true);
    try {
      // Validate that staff member is selected
      if (!data.staffId) {
        toast({
          title: "Staff Member Required",
          description: "Please select a staff member before creating the receipt.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate amount
      if (data.amount <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Amount must be greater than 0.",
          variant: "destructive",
        });
        return;
      }
      
      onSubmit(data);
    } catch (error) {
      console.error('Error submitting salary receipt:', error);
      toast({
        title: "Error",
        description: "Failed to submit salary receipt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Staff Selection */}
      <div className="space-y-2">
        <Label htmlFor="staffId">Staff Member *</Label>
        <Select 
          onValueChange={(value) => setValue('staffId', value)}
          defaultValue={initialData?.staffId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a staff member" />
          </SelectTrigger>
          <SelectContent>
            {staff.filter(s => s.status === 'active').map((staffMember) => (
              <SelectItem key={staffMember.id} value={staffMember.id}>
                {staffMember.name} - {staffMember.role} (${staffMember.salary?.toFixed(2) || '0.00'})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.staffId && (
          <p className="text-sm text-destructive">{errors.staffId.message}</p>
        )}
      </div>

      {/* Receipt Type */}
      <div className="space-y-2">
        <Label htmlFor="receiptType">Receipt Type *</Label>
        <Select 
          onValueChange={(value) => setValue('receiptType', value as 'salary' | 'bonus' | 'adjustment')}
          defaultValue={initialData?.receiptType || "salary"}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select receipt type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="salary">Salary Payment</SelectItem>
            <SelectItem value="bonus">Bonus Payment</SelectItem>
            <SelectItem value="adjustment">Salary Adjustment</SelectItem>
          </SelectContent>
        </Select>
        {errors.receiptType && (
          <p className="text-sm text-destructive">{errors.receiptType.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount ($) *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            {...register('amount', { valueAsNumber: true })}
            placeholder="0.00"
          />
          {errors.amount && (
            <p className="text-sm text-destructive">{errors.amount.message}</p>
          )}
          {selectedStaff && receiptType === 'salary' && (
            <p className="text-xs text-muted-foreground">
              Base salary: ${selectedStaff.salary?.toFixed(2) || '0.00'}
            </p>
          )}
        </div>

        {/* Payment Type */}
        <div className="space-y-2">
          <Label htmlFor="paymentType">Payment Type *</Label>
          <Select 
            onValueChange={(value) => setValue('paymentType', value as 'cash' | 'card' | 'upi' | 'bank_transfer')}
            defaultValue={initialData?.paymentType || "bank_transfer"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select payment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
          {errors.paymentType && (
            <p className="text-sm text-destructive">{errors.paymentType.message}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Enter payment description"
          rows={3}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Staff Information Display */}
      {selectedStaff && (
        <div className="bg-muted/50 p-4 rounded-lg border">
          <h4 className="font-medium mb-2">Staff Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Name:</span> {selectedStaff.name}
            </div>
            <div>
              <span className="text-muted-foreground">Role:</span> {selectedStaff.role}
            </div>
            <div>
              <span className="text-muted-foreground">Base Salary:</span> ${selectedStaff.salary?.toFixed(2) || '0.00'}
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span> {selectedStaff.status}
            </div>
          </div>
        </div>
      )}

      {/* Created By */}
      <div className="space-y-2">
        <Label htmlFor="created_by">Created By</Label>
        <Input
          id="created_by"
          value={user?.name || 'Unknown'}
          disabled
          className="bg-muted"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Processing...' : (initialData ? 'Update Salary Receipt' : 'Create Salary Receipt')}
        </Button>
      </div>
    </form>
  );
};