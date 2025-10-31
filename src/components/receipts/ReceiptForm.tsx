import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Receipt, LegacyMember, db } from '@/utils/database';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTaxSelection } from '@/hooks/useTaxSelection';
import { CalendarDays, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';

const receiptSchema = z.object({
  member_id: z.string().min(1, 'Please select a member'),
  member_name: z.string().min(1, 'Member name is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  amount_paid: z.number().min(0, 'Amount paid must be positive').optional(),
  payment_type: z.enum(['cash', 'card', 'upi', 'bank_transfer']),
  description: z.string().min(1, 'Description is required'),
  transaction_type: z.enum(['payment', 'partial_payment', 'renewal', 'adjustment']),
  // Plan selection fields
  selected_plan_type: z.string().min(1, 'Please select a plan'),
  subscription_start_date: z.string().min(1, 'Start date is required'),
  subscription_end_date: z.string().min(1, 'End date is required'),
  // Fee structure fields
  registration_fee: z.number().min(0, 'Registration fee must be positive').optional(),
  package_fee: z.number().min(0.01, 'Package fee is required and must be greater than 0'),
  discount: z.number().min(0, 'Discount must be positive').optional(),
  // Tax fields
  cgst: z.number().min(0, 'CGST must be positive').optional(),
  sgst: z.number().min(0, 'SGST must be positive').optional(),
  // Display fields
  payment_mode: z.string().optional(),
  mobile_no: z.string().optional(),
  email: z.string().optional(),
  custom_member_id: z.string().optional(),
});

type ReceiptFormData = z.infer<typeof receiptSchema>;

interface ReceiptFormProps {
  initialData?: Receipt;
  onSubmit: (data: Omit<Receipt, 'id'> | Partial<Receipt>) => void;
  onMemberUpdate?: (memberId: string) => void; // Callback when member data is updated
  prefilledMember?: {
    id: string;
    name: string;
    mobile?: string;
    email?: string;
    customMemberId?: string;
  };
}

// Plan configuration (no predefined pricing)
const PLAN_CONFIG = {
  monthly: { duration: 1, label: 'Monthly Plan' },
  quarterly: { duration: 3, label: 'Quarterly Plan (3 months)' },
  half_yearly: { duration: 6, label: 'Half Yearly Plan (6 months)' },
  yearly: { duration: 12, label: 'Yearly Plan (12 months)' }
};

// Helper function to calculate subscription end date
const calculateEndDate = (startDate: string, planType: string, masterPackages: Record<string, any>[] = []): string => {
  const start = new Date(startDate);
  let duration = 1; // Default to 1 month
  let foundPackage = null;

  console.log('=== calculateEndDate called ===');
  console.log('startDate:', startDate);
  console.log('planType:', planType);
  console.log('masterPackages count:', masterPackages.length);
  console.log('masterPackages:', masterPackages.map(pkg => ({
    id: pkg.id,
    name: pkg.name,
    duration_type: pkg.duration_type,
    duration_months: pkg.duration_months
  })));

  // First, try to find duration in master packages
  if (masterPackages.length > 0) {
    foundPackage = masterPackages.find(pkg => {
      const nameMatch = pkg.name?.toLowerCase() === planType.toLowerCase();
      const durationTypeMatch = pkg.duration_type?.toLowerCase() === planType.toLowerCase();
      const idMatch = pkg.id?.toString() === planType;
      
      console.log('Checking package:', {
        pkgId: pkg.id,
        pkgName: pkg.name,
        pkgDurationType: pkg.duration_type,
        pkgDurationMonths: pkg.duration_months,
        searchPlanType: planType,
        nameMatch,
        durationTypeMatch,
        idMatch
      });
      
      return nameMatch || durationTypeMatch || idMatch;
    });

    if (foundPackage && foundPackage.duration_months) {
      duration = parseInt(foundPackage.duration_months, 10) || 1;
      console.log('✓ Found matching package:', foundPackage.name || foundPackage.duration_type);
      console.log('✓ Using master package duration:', duration, 'months');
    } else {
      console.log('✗ No matching package found in master packages');
    }
  }

  // Fallback to PLAN_CONFIG if no master package found
  if (!foundPackage && PLAN_CONFIG[planType as keyof typeof PLAN_CONFIG]) {
    duration = PLAN_CONFIG[planType as keyof typeof PLAN_CONFIG].duration;
    console.log('→ Using fallback PLAN_CONFIG duration:', duration, 'months');
  } else if (!foundPackage) {
    console.log('→ No duration found anywhere, using default:', duration, 'month');
  }

  const endDate = new Date(start);
  endDate.setMonth(endDate.getMonth() + duration);
  const calculatedEndDate = endDate.toISOString().split('T')[0];
  
  console.log('=== Final calculated end date:', calculatedEndDate, '===');
  return calculatedEndDate;
};

// Helper function to check if membership is expired
const isMembershipExpired = (endDate: string): boolean => {
  const today = new Date();
  const expiry = new Date(endDate);
  return expiry < today;
};

// Helper function to check if membership is expiring soon (within 7 days)
const isMembershipExpiringSoon = (endDate: string): boolean => {
  const today = new Date();
  const expiry = new Date(endDate);
  const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
};

export const ReceiptForm: React.FC<ReceiptFormProps> = ({ initialData, onSubmit, onMemberUpdate, prefilledMember }) => {
  const [members, setMembers] = useState<LegacyMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<LegacyMember[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<LegacyMember | null>(null);
  const [membershipStatus, setMembershipStatus] = useState<'active' | 'expired' | 'expiring_soon' | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [taxSettings, setTaxSettings] = useState<any[]>([]);
  const [masterPackages, setMasterPackages] = useState<any[]>([]);
  const [masterPaymentTypes, setMasterPaymentTypes] = useState<unknown[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReceiptFormData>({
    resolver: zodResolver(receiptSchema),
    defaultValues: initialData ? {
      member_id: initialData.member_id,
      member_name: initialData.member_name,
      amount: initialData.amount,
      amount_paid: initialData.amount_paid || initialData.amount,
      payment_type: initialData.payment_type,
      description: initialData.description,
      transaction_type: initialData.transaction_type || 'payment',
      selected_plan_type: initialData.plan_type || 'monthly',
      registration_fee: initialData.registration_fee || 0,
      package_fee: initialData.package_fee || 0,
      discount: initialData.discount || 0,
      payment_mode: initialData.payment_mode || '',
      mobile_no: initialData.mobile_no || '',
      email: initialData.email || '',
      custom_member_id: initialData.custom_member_id || '',
      subscription_start_date: initialData.subscription_start_date || new Date().toISOString().split('T')[0],
      subscription_end_date: initialData.subscription_end_date || '',
    } : prefilledMember ? {
      member_id: prefilledMember.id,
      member_name: prefilledMember.name,
      mobile_no: prefilledMember.mobile || '',
      email: prefilledMember.email || '',
      custom_member_id: prefilledMember.customMemberId || '',
      payment_type: 'cash',
      transaction_type: 'payment',
      selected_plan_type: 'monthly',
      amount: 0,
      amount_paid: 0,
      registration_fee: 0,
      package_fee: undefined,
      discount: 0,
      cgst: 0,
      sgst: 0,
      subscription_start_date: new Date().toISOString().split('T')[0],
    } : {
      payment_type: 'cash',
      transaction_type: 'payment',
      selected_plan_type: 'monthly',
      amount: 0,
      amount_paid: 0,
      registration_fee: 0,
      package_fee: undefined, // No default package fee - must be entered manually
      discount: 0,
      cgst: 0,
      sgst: 0,
      subscription_start_date: new Date().toISOString().split('T')[0],
      subscription_end_date: '',
    }
  });

  const selectedMemberId = watch('member_id');
  const selectedPlanType = watch('selected_plan_type');
  const subscriptionStartDate = watch('subscription_start_date');
  const registrationFee = watch('registration_fee');
  const packageFee = watch('package_fee');
  const discount = watch('discount');
  const amount = watch('amount');
  const amountPaid = watch('amount_paid');

  // Enhanced tax selection hook
  const baseAmount = (registrationFee || 0) + (packageFee || 0) - (discount || 0);
  const {
    selectedTaxes,
    taxType,
    filteredTaxes,
    calculationResult,
    toggleTax,
    clearAllTaxes,
    setTaxSelection,
    isTaxSelectable,
    getTaxTypeLabel
  } = useTaxSelection({
    taxes: taxSettings,
    baseAmount,
    onTaxChange: (result) => {
      // Update form amount when tax calculation changes
      setValue('amount', result.totalAmount);
      if (!amountPaid || amountPaid === 0) {
        setValue('amount_paid', result.totalAmount);
      }
    }
  });

  // Load tax settings from master settings
  const loadTaxSettings = async () => {
    try {
      const result = await db.masterTaxSettingsGetAll();
      if (result.success && result.data) {
        const activeTaxes = result.data.filter(tax => tax.is_active);
        setTaxSettings(activeTaxes);
      } else {
        console.error('Failed to load tax settings:', result.error);
      }
    } catch (error) {
      console.error('Error loading tax settings:', error);
    }
  };

  // Load master packages from master settings
  const loadMasterPackages = async () => {
    try {
      const result = await db.masterPackagesGetAll();
      if (result.success && result.data) {
        const activePackages = result.data.filter(pkg => pkg.is_active !== false); // Include packages that don't have is_active field or are explicitly active
        setMasterPackages(activePackages);
        console.log('Master packages loaded:', activePackages);
      } else {
        console.error('Failed to load master packages:', result.error);
      }
    } catch (error) {
      console.error('Error loading master packages:', error);
    }
  };

  // Load master payment types from master settings
  const loadMasterPaymentTypes = async () => {
    try {
      const result = await db.masterPaymentTypesGetAll();
      if (result.success && result.data) {
        const activePaymentTypes = result.data.filter(pt => pt.is_active !== false); // Include payment types that don't have is_active field or are explicitly active
        setMasterPaymentTypes(activePaymentTypes);
        console.log('Master payment types loaded:', activePaymentTypes);
      } else {
        console.error('Failed to load master payment types:', result.error);
      }
    } catch (error) {
      console.error('Error loading master payment types:', error);
    }
  };

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const memberData = await db.getAllMembers();
        setMembers(memberData || []);
        setFilteredMembers(memberData || []);
      } catch (error) {
        console.error('Error loading members:', error);
        toast({
          title: "Error",
          description: "Failed to load members.",
          variant: "destructive",
        });
      }
    };

    const generateReceiptNumber = async () => {
      if (!initialData) {
        try {
          const number = await db.generateReceiptNumber();
          setReceiptNumber(number);
        } catch (error) {
          console.error('Error generating receipt number:', error);
        }
      } else {
        setReceiptNumber(initialData.receipt_number);
      }
    };

    loadMembers();
    generateReceiptNumber();
    loadTaxSettings();
    loadMasterPackages();
    loadMasterPaymentTypes();
  }, [initialData, toast]);

  // Filter members based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMembers(members);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = members.filter(member =>
        member.name.toLowerCase().includes(query) ||
        (member.customMemberId && member.customMemberId.toLowerCase().includes(query)) ||
        member.mobileNo.includes(query) ||
        member.id.toLowerCase().includes(query)
      );
      setFilteredMembers(filtered);
    }
  }, [searchQuery, members]);

  // Update member data when member is selected
  useEffect(() => {
    if (selectedMemberId) {
      const member = members.find(m => m.id === selectedMemberId);
      if (member) {
        setSelectedMember(member);
        // Update search query to show selected member name
        if (!searchQuery || searchQuery !== member.name) {
          setSearchQuery(member.name);
        }
        setValue('member_name', member.name);
        setValue('payment_mode', member.paymentMode || '');
        setValue('mobile_no', member.mobileNo || '');
        setValue('email', member.email || '');
        setValue('custom_member_id', member.customMemberId || '');

        // Check membership status
        if (member.subscriptionEndDate) {
          const endDate = member.subscriptionEndDate.split('T')[0];
          if (isMembershipExpired(endDate)) {
            setMembershipStatus('expired');
            setValue('transaction_type', 'renewal');
            setValue('subscription_start_date', new Date().toISOString().split('T')[0]);
          } else if (isMembershipExpiringSoon(endDate)) {
            setMembershipStatus('expiring_soon');
          } else {
            setMembershipStatus('active');
          }
        } else {
          setMembershipStatus('expired');
          setValue('transaction_type', 'renewal');
        }

        // Set default plan type to member's current plan or monthly
        const planType = member.planType || 'monthly';
        setValue('selected_plan_type', planType);

        // Set default fees (package fee will be manually entered)
        const regFee = member.registrationFee || 0;
        const pkgFee = member.packageFee || member.membershipFees || 0;
        const discount = member.discount || 0;

        setValue('registration_fee', regFee);
        setValue('package_fee', pkgFee); // Use member's existing package fee
        setValue('discount', discount);

        // Calculate and set total amount immediately
        const totalAmount = Math.max(0, regFee + pkgFee - discount);
        setValue('amount', totalAmount);

        console.log('Member selected - setting values:', {
          planType,
          regFee,
          pkgFee,
          discount,
          totalAmount
        });
      }
    } else {
      setSelectedMember(null);
      setMembershipStatus(null);
    }
  }, [selectedMemberId, members, setValue, searchQuery]);

  // Auto-calculate end date when plan type or start date changes
  useEffect(() => {
    if (selectedPlanType && subscriptionStartDate) {
      const endDate = calculateEndDate(subscriptionStartDate, selectedPlanType, masterPackages);
      setValue('subscription_end_date', endDate);
    }
  }, [selectedPlanType, subscriptionStartDate, setValue, masterPackages]);

  // Update description when plan changes (no automatic pricing)
  useEffect(() => {
    if (selectedPlanType && selectedMember) {
      const planLabel = PLAN_CONFIG[selectedPlanType as keyof typeof PLAN_CONFIG]?.label || selectedPlanType;
      const transactionType = watch('transaction_type');
      let description = '';

      if (transactionType === 'renewal') {
        description = `Membership renewal - ${planLabel} - ${selectedMember.name}`;
      } else {
        description = `Payment for ${planLabel} - ${selectedMember.name}`;
      }

      setValue('description', description);
    }
  }, [selectedPlanType, selectedMember, setValue, watch]);

  // Plan selection mapping logic - map selected plan from master settings to package fees and payment methods
  useEffect(() => {
    if (selectedPlanType && masterPackages.length > 0 && selectedMember) {
      console.log('Plan selection mapping triggered:', { selectedPlanType, masterPackages });
      
      // Find the selected package in master packages
      const selectedPackage = masterPackages.find(pkg => 
        pkg.name?.toLowerCase() === selectedPlanType.toLowerCase() ||
        pkg.duration_type?.toLowerCase() === selectedPlanType.toLowerCase() ||
        pkg.id?.toString() === selectedPlanType
      );

      console.log('Found selected package:', selectedPackage);

      if (selectedPackage) {
        // Map package fee from master settings
        if (selectedPackage.price && selectedPackage.price > 0) {
          setValue('package_fee', selectedPackage.price);
          console.log('Package fee mapped from master settings:', selectedPackage.price);
        }

        // Map registration fee if available
        if (selectedPackage.registration_fee && selectedPackage.registration_fee > 0) {
          setValue('registration_fee', selectedPackage.registration_fee);
          console.log('Registration fee mapped from master settings:', selectedPackage.registration_fee);
        }

        // Map discount if available
        if (selectedPackage.discount && selectedPackage.discount > 0) {
          setValue('discount', selectedPackage.discount);
          console.log('Discount mapped from master settings:', selectedPackage.discount);
        }

        // Map payment method if available and payment types are loaded
        if (selectedPackage.payment_method && masterPaymentTypes.length > 0) {
          // Find the payment method in master payment types
          const paymentType = masterPaymentTypes.find(pt => 
            pt && typeof pt === 'object' && (
              ((pt as any).name?.toLowerCase() === selectedPackage.payment_method.toLowerCase()) ||
              ((pt as unknown).type?.toLowerCase() === selectedPackage.payment_method.toLowerCase()) ||
              ((pt as unknown).id?.toString() === selectedPackage.payment_method.toString())
            )
          );

          console.log('Found payment type for package:', paymentType);

          if (paymentType && typeof paymentType === 'object') {
            // Type guard to ensure paymentType is an object with expected properties
            const typedPaymentType = paymentType as { name?: string; type?: string; id?: string | number };
            // Map to the appropriate payment type enum value
            const paymentTypeValue = typedPaymentType.name?.toLowerCase() || typedPaymentType.type?.toLowerCase();
            
            if (paymentTypeValue && ['cash', 'card', 'upi', 'bank_transfer'].includes(paymentTypeValue)) {
              setValue('payment_type', paymentTypeValue as 'cash' | 'card' | 'upi' | 'bank_transfer');
              console.log('Payment type mapped from master settings:', paymentTypeValue);
            }
          }
        }

        // Show success message
        toast({
          title: "Plan Mapped",
          description: `Package fees and payment method have been automatically mapped from ${selectedPackage.name || selectedPlanType} plan settings.`,
        });
      } else {
        console.log('No matching package found in master settings for:', selectedPlanType);
      }
    }
  }, [selectedPlanType, masterPackages, masterPaymentTypes, selectedMember, setValue, toast]);



  // Handle member selection
  const handleMemberSelect = (memberId: string) => {
    setValue('member_id', memberId);
    setIsDropdownOpen(false);
    setSearchQuery('');

    // Find and set the selected member for display
    const member = members.find(m => m.id === memberId);
    if (member) {
      setSearchQuery(member.name); // Show selected member name in search box
    }
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setIsDropdownOpen(true);
    setHighlightedIndex(-1);

    // Clear selection if search is cleared
    if (!value.trim()) {
      setValue('member_id', '');
      setSelectedMember(null);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen || filteredMembers.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredMembers.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : filteredMembers.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredMembers.length) {
          handleMemberSelect(filteredMembers[highlightedIndex].id);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsDropdownOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Function to determine receipt tag
  const getReceiptTag = (transactionType: string, isFirstReceipt: boolean = false) => {
    if (transactionType === 'renewal') {
      return 'Renewal';
    }
    
    if (isFirstReceipt || (!initialData && transactionType === 'payment')) {
      return 'New Membership';
    }
    
    return 'Payment';
  };

  const onFormSubmit = async (data: ReceiptFormData) => {
    setLoading(true);
    try {
      // Validate that member_id is present for member receipts
      if (!data.member_id) {
        toast({
          title: "Error",
          description: "Please select a member before creating the receipt.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Calculate due amount
      const totalAmount = data.amount;
      const paidAmount = data.amount_paid || totalAmount;
      const dueAmount = Math.max(0, totalAmount - paidAmount);
      
      // Auto-set transaction type based on payment status
      let transactionType = data.transaction_type;
      if (dueAmount > 0 && paidAmount > 0) {
        transactionType = 'partial_payment';
      }

      // Determine receipt tag
      const receiptTag = getReceiptTag(transactionType, !initialData);
      
      // Use enhanced tax calculation results
      const selectedTaxData: {[key: string]: number} = {};
      calculationResult.taxBreakdown.forEach(tax => {
        selectedTaxData[tax.id] = tax.amount;
      });
      const totalSelectedTaxAmount = calculationResult.taxAmount;

      // Create receipt data with proper structure
      const receiptData = {
        member_id: data.member_id,
        member_name: data.member_name,
        amount: totalAmount, // Total amount due
        amount_paid: paidAmount, // Amount actually paid
        due_amount: dueAmount, // Remaining amount due
        payment_type: data.payment_type,
        description: `${receiptTag} - ${data.description}`,
        transaction_type: transactionType,
        receipt_number: receiptNumber,
        receipt_category: 'member' as 'member' | 'staff_salary' | 'staff_bonus' | 'staff_salary_update',
        created_at: initialData?.created_at || new Date().toISOString(),
        created_by: user?.name || 'Unknown',
        // Member information for receipt printing
        custom_member_id: data.custom_member_id || selectedMember?.customMemberId || '',
        subscription_start_date: data.subscription_start_date,
        subscription_end_date: data.subscription_end_date,
        plan_type: data.selected_plan_type,
        payment_mode: data.payment_mode || selectedMember?.paymentMode || '',
        mobile_no: data.mobile_no || selectedMember?.mobileNo || '',
        email: data.email || selectedMember?.email || '',
        // Fee breakdown
        package_fee: data.package_fee || 0,
        registration_fee: data.registration_fee || 0,
        discount: data.discount || 0,
        // Legacy tax fields (for backward compatibility)
        cgst: data.cgst || 0,
        sigst: data.sgst || 0,
        // Enhanced tax information
        selected_taxes: selectedTaxData,
        total_tax_amount: totalSelectedTaxAmount,
        tax_type: taxType,
        tax_breakdown: calculationResult.taxBreakdown,
        base_amount_before_tax: calculationResult.baseAmount,
        tax_settings_used: taxSettings.filter(tax => selectedTaxes[tax.id]),
      };

      // Update member's subscription dates and fee structure
      if (selectedMember) {
        try {
          // Create a complete member data object with existing data plus updates
          // This avoids the NULL constraint issue by ensuring all required fields are present
          const updatedMemberData = {
            // Use existing member data as base (in camelCase format for frontend)
            ...selectedMember,
            // Override with new subscription data (camelCase)
            planType: data.selected_plan_type,
            subscriptionStartDate: data.subscription_start_date,
            subscriptionEndDate: data.subscription_end_date,
            subscriptionStatus: 'active',
            updatedAt: new Date().toISOString(),
            // Update fee structure with current receipt data (camelCase)
            registrationFee: data.registration_fee || 0,
            packageFee: data.package_fee || 0,
            membershipFees: data.package_fee || 0, // Keep membership_fees in sync with package_fee
            discount: data.discount || 0,
            // Update paid amount based on transaction type
            paidAmount: data.transaction_type === 'renewal' || data.transaction_type === 'payment' 
              ? (selectedMember.paidAmount || 0) + paidAmount 
              : selectedMember.paidAmount || 0,
          };

          console.log('Updating member with data:', updatedMemberData);
          const updateResult = await db.updateMember(selectedMember.id, updatedMemberData);
          console.log('Member update result:', updateResult);

          // Update the selected member state to reflect changes
          setSelectedMember({
            ...selectedMember,
            planType: data.selected_plan_type as 'monthly' | 'quarterly' | 'half_yearly' | 'yearly',
            subscriptionStartDate: data.subscription_start_date,
            subscriptionEndDate: data.subscription_end_date,
            registrationFee: data.registration_fee || 0,
            packageFee: data.package_fee || 0,
            membershipFees: data.package_fee || 0,
            discount: data.discount || 0,
            paidAmount: data.transaction_type === 'renewal' || data.transaction_type === 'payment' 
              ? (selectedMember.paidAmount || 0) + paidAmount 
              : selectedMember.paidAmount || 0,
          });

          // Sync member and receipt data to ensure consistency first
          const syncResult = await db.syncMemberReceiptData(selectedMember.id);
          console.log('Member sync result:', syncResult);

          // Notify parent component that member data was updated
          if (onMemberUpdate) {
            onMemberUpdate(selectedMember.id);
          }

          // Add a small delay to ensure database operations complete, then trigger refresh
          setTimeout(() => {
            console.log('Triggering member refresh after receipt creation/update');
            db.triggerMemberRefresh();
          }, 200);

          const successMessage = data.transaction_type === 'renewal' 
            ? "Member subscription renewed and member data updated successfully!" 
            : "Receipt created and member information updated successfully!";

          toast({
            title: "Success",
            description: successMessage,
          });
        } catch (error) {
          console.error('Error updating member subscription:', error);
          toast({
            title: "Warning",
            description: "Receipt created but failed to update member information.",
            variant: "destructive",
          });
        }
      }

      console.log('Submitting receipt data:', receiptData);
      onSubmit(receiptData);
    } catch (error) {
      console.error('Error submitting receipt:', error);
      toast({
        title: "Error",
        description: "Failed to submit receipt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Receipt Number */}
      <div className="space-y-2">
        <Label htmlFor="receipt_number">Receipt Number</Label>
        <Input
          id="receipt_number"
          value={receiptNumber}
          disabled
          className="bg-muted"
        />
      </div>

      {/* Member Selection with Search */}
      <div className="space-y-2 relative">
        <Label htmlFor="member_search">Member *</Label>
        <div className="relative">
          <Input
            id="member_search"
            type="text"
            placeholder="🔍 Search member by name, ID, or mobile number..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setIsDropdownOpen(true)}
            onKeyDown={handleKeyDown}
            className={`${!selectedMember ? 'border-amber-300 bg-amber-50' : 'border-green-300 bg-green-50'} pr-20`}
            autoComplete="off"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-200"
                onClick={() => {
                  setSearchQuery('');
                  setValue('member_id', '');
                  setSelectedMember(null);
                  setIsDropdownOpen(false);
                }}
              >
                ✕
              </Button>
            )}
            {selectedMember && (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
          </div>
        </div>

        {/* Dropdown Results */}
        {isDropdownOpen && searchQuery && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {filteredMembers.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                {members.length === 0 ?
                  "No members found. Please add members first." :
                  `No members found matching "${searchQuery}"`
                }
              </div>
            ) : (
              filteredMembers.map((member, index) => (
                <div
                  key={member.id}
                  className={`p-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${index === highlightedIndex
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50'
                    }`}
                  onClick={() => handleMemberSelect(member.id)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.memberImage} className="object-cover" />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{member.name}</span>
                        <div className="flex items-center gap-1">
                          {member.subscriptionEndDate && isMembershipExpired(member.subscriptionEndDate) && (
                            <Badge variant="destructive" className="text-xs">Expired</Badge>
                          )}
                          {member.subscriptionEndDate && isMembershipExpiringSoon(member.subscriptionEndDate) && (
                            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">Expiring</Badge>
                          )}
                          {member.subscriptionEndDate && !isMembershipExpired(member.subscriptionEndDate) && !isMembershipExpiringSoon(member.subscriptionEndDate) && (
                            <Badge variant="default" className="text-xs bg-green-100 text-green-800">Active</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span>📱 {member.mobileNo}</span>
                        <span>📋 {member.planType}</span>
                        <span>🆔 {member.customMemberId || member.id.slice(0, 8)}</span>
                      </div>
                      {member.subscriptionEndDate && (
                        <div className="text-xs text-gray-400 mt-1">
                          Expires: {member.subscriptionEndDate.split('T')[0]}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Click outside to close dropdown */}
        {isDropdownOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsDropdownOpen(false)}
          />
        )}

        {errors.member_id && (
          <p className="text-sm text-destructive">{errors.member_id.message}</p>
        )}

        {!selectedMember && searchQuery && (
          <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
            ⚠️ Please select a member from the search results to continue
          </p>
        )}

        {!selectedMember && !searchQuery && (
          <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
            💡 Start typing to search for members by name, member ID, or mobile number
          </p>
        )}
      </div>

      {/* Member Name (Auto-filled) */}
      <div className="space-y-2">
        <Label htmlFor="member_name">Member Name *</Label>
        <Input
          id="member_name"
          {...register('member_name')}
          disabled
          className="bg-muted"
        />
        {errors.member_name && (
          <p className="text-sm text-destructive">{errors.member_name.message}</p>
        )}
      </div>

      {/* Member Information Display */}
      {selectedMember && (
        <Card className={`${membershipStatus === 'expired' ? 'bg-red-50 border-red-200' :
            membershipStatus === 'expiring_soon' ? 'bg-yellow-50 border-yellow-200' :
              'bg-blue-50 border-blue-200'
          }`}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-lg flex items-center gap-2 ${membershipStatus === 'expired' ? 'text-red-800' :
                membershipStatus === 'expiring_soon' ? 'text-yellow-800' :
                  'text-blue-800'
              }`}>
              Selected Member Information
              {membershipStatus === 'expired' && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Expired
                </Badge>
              )}
              {membershipStatus === 'expiring_soon' && (
                <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800">
                  <Clock className="w-3 h-3" />
                  Expiring Soon
                </Badge>
              )}
              {membershipStatus === 'active' && (
                <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3" />
                  Active
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className={`font-medium ${membershipStatus === 'expired' ? 'text-red-700' :
                    membershipStatus === 'expiring_soon' ? 'text-yellow-700' :
                      'text-blue-700'
                  }`}>Name:</span>
                <p className={`${membershipStatus === 'expired' ? 'text-red-600' :
                    membershipStatus === 'expiring_soon' ? 'text-yellow-600' :
                      'text-blue-600'
                  }`}>{selectedMember.name}</p>
              </div>
              <div>
                <span className={`font-medium ${membershipStatus === 'expired' ? 'text-red-700' :
                    membershipStatus === 'expiring_soon' ? 'text-yellow-700' :
                      'text-blue-700'
                  }`}>Mobile:</span>
                <p className={`${membershipStatus === 'expired' ? 'text-red-600' :
                    membershipStatus === 'expiring_soon' ? 'text-yellow-600' :
                      'text-blue-600'
                  }`}>{selectedMember.mobileNo}</p>
              </div>
              <div>
                <span className={`font-medium ${membershipStatus === 'expired' ? 'text-red-700' :
                    membershipStatus === 'expiring_soon' ? 'text-yellow-700' :
                      'text-blue-700'
                  }`}>Current Plan:</span>
                <p className={`capitalize ${membershipStatus === 'expired' ? 'text-red-600' :
                    membershipStatus === 'expiring_soon' ? 'text-yellow-600' :
                      'text-blue-600'
                  }`}>{selectedMember.planType}</p>
              </div>
              <div>
                <span className={`font-medium ${membershipStatus === 'expired' ? 'text-red-700' :
                    membershipStatus === 'expiring_soon' ? 'text-yellow-700' :
                      'text-blue-700'
                  }`}>Member ID:</span>
                <p className={`${membershipStatus === 'expired' ? 'text-red-600' :
                    membershipStatus === 'expiring_soon' ? 'text-yellow-600' :
                      'text-blue-600'
                  }`}>{selectedMember.customMemberId || selectedMember.id.slice(0, 8)}</p>
              </div>
            </div>

            {selectedMember.subscriptionEndDate && (
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="w-4 h-4" />
                  <span className="font-medium">Current Subscription:</span>
                  <span>
                    {selectedMember.subscriptionStartDate?.split('T')[0]} to {selectedMember.subscriptionEndDate.split('T')[0]}
                  </span>
                </div>
              </div>
            )}

            {membershipStatus === 'expired' && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  This member's subscription has expired. Creating a receipt will automatically renew their membership.
                </AlertDescription>
              </Alert>
            )}

            {membershipStatus === 'expiring_soon' && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <Clock className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-700">
                  This member's subscription is expiring soon. Consider renewing their membership.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Plan Selection */}
      {selectedMember && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Plan Selection & Subscription Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Plan Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="selected_plan_type">Select Plan *</Label>
                <Select
                  onValueChange={(value) => setValue('selected_plan_type', value)}
                  defaultValue={watch('selected_plan_type')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose membership plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Show Master Packages if available */}
                    {masterPackages.length > 0 ? (
                      masterPackages.map((pkg, index) => {
                        // Generate a unique key using multiple fallbacks
                        const uniqueKey = pkg.id || pkg.name || `package-${index}`;
                        // Ensure value is never null
                        const uniqueValue = pkg.name || pkg.duration_type || pkg.id?.toString() || `package-${index}`;
                        
                        return (
                          <SelectItem key={uniqueKey} value={uniqueValue}>
                            <div className="flex flex-col">
                              <span className="font-medium">{pkg.name || pkg.duration_type || 'Unnamed Plan'}</span>
                              <div className="text-xs text-muted-foreground flex gap-2">
                                {pkg.duration_months && (
                                  <span>{pkg.duration_months} month{pkg.duration_months > 1 ? 's' : ''}</span>
                                )}
                                {pkg.price && (
                                  <span>₹{pkg.price}</span>
                                )}
                                {pkg.description && (
                                  <span>{pkg.description}</span>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })
                    ) : (
                      /* Fallback to hardcoded PLAN_CONFIG if no master packages */
                      Object.entries(PLAN_CONFIG).map(([key, plan]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex flex-col">
                            <span className="font-medium">{plan.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {plan.duration} month{plan.duration > 1 ? 's' : ''} duration
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.selected_plan_type && (
                  <p className="text-sm text-destructive">{errors.selected_plan_type.message}</p>
                )}
                
                {/* Show master packages info */}
                {masterPackages.length > 0 && (
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                    💡 Plans loaded from Master Settings ({masterPackages.length} available). Selecting a plan will automatically map fees and payment methods.
                  </div>
                )}
                
                {/* Show fallback info */}
                {masterPackages.length === 0 && (
                  <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                    ⚠️ Using default plans. Configure plans in Master Settings for automatic fee mapping.
                  </div>
                )}
              </div>

              {/* Transaction Type */}
              <div className="space-y-2">
                <Label htmlFor="transaction_type">Transaction Type *</Label>
                <Select
                  onValueChange={(value) => setValue('transaction_type', value as 'payment' | 'partial_payment' | 'renewal' | 'adjustment')}
                  defaultValue={watch('transaction_type')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select transaction type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payment">💳 Regular Payment</SelectItem>
                    <SelectItem value="partial_payment">💰 Partial Payment</SelectItem>
                    <SelectItem value="renewal">🔄 Membership Renewal</SelectItem>
                    <SelectItem value="adjustment">⚖️ Fee Adjustment</SelectItem>
                  </SelectContent>
                </Select>
                {errors.transaction_type && (
                  <p className="text-sm text-destructive">{errors.transaction_type.message}</p>
                )}
              </div>

               {/* Payment Type */}
        <div className="space-y-2">
          <Label htmlFor="payment_type">Payment Method *</Label>
          <Select
            onValueChange={(value) => setValue('payment_type', value as 'cash' | 'card' | 'upi' | 'bank_transfer')}
            defaultValue={initialData?.payment_type || selectedMember?.paymentMode || 'cash'}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">💵 Cash Payment</SelectItem>
              <SelectItem value="card">💳 Card Payment</SelectItem>
              <SelectItem value="upi">📱 UPI Payment</SelectItem>
              <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
          {errors.payment_type && (
            <p className="text-sm text-destructive">{errors.payment_type.message}</p>
          )}
        </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Subscription Start Date */}
              <div className="space-y-2">
                <Label htmlFor="subscription_start_date">Subscription Start Date *</Label>
                <Input
                  id="subscription_start_date"
                  type="date"
                  {...register('subscription_start_date')}
                />
                {errors.subscription_start_date && (
                  <p className="text-sm text-destructive">{errors.subscription_start_date.message}</p>
                )}
              </div>

              {/* Subscription End Date (Auto-calculated but editable) */}
              <div className="space-y-2">
                <Label htmlFor="subscription_end_date">
                  Subscription End Date *
                  <span className="text-xs text-muted-foreground ml-2">
                    (Auto-calculated, but editable)
                  </span>
                </Label>
                <Input
                  id="subscription_end_date"
                  type="date"
                  {...register('subscription_end_date')}
                  className="bg-blue-50 border-blue-300"
                />
                {errors.subscription_end_date && (
                  <p className="text-sm text-destructive">{errors.subscription_end_date.message}</p>
                )}
                {/* Show duration info */}
                {selectedPlanType && (() => {
                  // First check master packages if available
                  let selectedPackage = null;
                  let duration = 1;
                  let source = 'default';
                  
                  if (masterPackages.length > 0) {
                    selectedPackage = masterPackages.find(pkg => {
                      const nameMatch = pkg.name?.toLowerCase() === selectedPlanType.toLowerCase();
                      const durationTypeMatch = pkg.duration_type?.toLowerCase() === selectedPlanType.toLowerCase();
                      const idMatch = pkg.id?.toString() === selectedPlanType;
                      return nameMatch || durationTypeMatch || idMatch;
                    });
                    
                    if (selectedPackage && selectedPackage.duration_months) {
                      duration = parseInt(selectedPackage.duration_months, 10) || 1;
                      source = 'master settings';
                    }
                  }
                  
                  // Fallback to PLAN_CONFIG if no master package found
                  if (!selectedPackage && PLAN_CONFIG[selectedPlanType as keyof typeof PLAN_CONFIG]) {
                    duration = PLAN_CONFIG[selectedPlanType as keyof typeof PLAN_CONFIG].duration;
                    source = 'default config';
                  }
                  
                  return (
                    <div className="space-y-1">
                      <p className="text-xs text-blue-600">
                        📅 Duration: {duration} month{duration > 1 ? 's' : ''} (from {source})
                      </p>
                      {selectedPackage && (
                        <p className="text-xs text-green-600">
                          ✓ Found plan: {selectedPackage.name || selectedPackage.plan_type || 'Unnamed'}
                        </p>
                      )}
                      {!selectedPackage && masterPackages.length > 0 && (
                        <p className="text-xs text-amber-600">
                          ⚠️ Plan not found in master packages, using fallback duration
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Member Fee Structure */}
      {selectedMember && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fee Structure & Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="registration_fee">Registration Fee (₹)</Label>
                <Input
                  id="registration_fee"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('registration_fee', {
                    valueAsNumber: true,
                    onChange: (e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setValue('registration_fee', value);
                      console.log('Registration fee changed:', value);
                    }
                  })}
                  placeholder="0.00"
                />
                {errors.registration_fee && (
                  <p className="text-sm text-destructive">{errors.registration_fee.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="package_fee">Package Fee (₹) *</Label>
                <Input
                  id="package_fee"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('package_fee', {
                    valueAsNumber: true,
                    onChange: (e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setValue('package_fee', value);
                      console.log('Package fee changed:', value);
                    }
                  })}
                  placeholder="Enter package fee"
                />
                {errors.package_fee && (
                  <p className="text-sm text-destructive">{errors.package_fee.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount">Discount (₹)</Label>
                <Input
                  id="discount"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('discount', {
                    valueAsNumber: true,
                    onChange: (e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setValue('discount', value);
                      console.log('Discount changed:', value);
                    }
                  })}
                  placeholder="0.00"
                />
                {errors.discount && (
                  <p className="text-sm text-destructive">{errors.discount.message}</p>
                )}
              </div>
            </div>

            {/* Enhanced Tax Settings Section */}
            {taxSettings.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold text-gray-900">Tax Settings</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{getTaxTypeLabel()}</Badge>
                    {Object.values(selectedTaxes).some(selected => selected) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearAllTaxes}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Tax Selection Dropdowns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Inclusive Tax Dropdown */}
                  {taxSettings.filter(tax => tax.is_inclusive).length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                          Tax Inclusive
                        </Badge>
                        Select Inclusive Tax
                      </Label>
                      <Select
                        value={Object.keys(selectedTaxes).find(id => selectedTaxes[id] && taxSettings.find(t => t.id === id)?.is_inclusive) || undefined}
                        onValueChange={(value) => {
                          if (value && value !== "none") {
                            // Clear all taxes and select only this inclusive tax
                            const newSelection: {[key: string]: boolean} = {};
                            taxSettings.forEach(tax => {
                              newSelection[tax.id] = tax.id === value;
                            });
                            setTaxSelection(newSelection);
                          } else {
                            clearAllTaxes();
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose inclusive tax (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Tax</SelectItem>
                          {taxSettings
                            .filter(tax => tax.is_inclusive)
                            .map(tax => (
                              <SelectItem key={tax.id} value={tax.id}>
                                {tax.name} ({tax.rate}%) - {tax.tax_type.toUpperCase()}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-blue-600">
                        Tax amount is already included in the price. Total won't change.
                      </p>
                    </div>
                  )}

                  {/* Exclusive Tax Dropdown */}
                  {taxSettings.filter(tax => !tax.is_inclusive).length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-green-700 flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300 text-xs">
                          Tax Exclusive
                        </Badge>
                        Select Exclusive Tax
                      </Label>
                      <Select
                        value={Object.keys(selectedTaxes).find(id => selectedTaxes[id] && taxSettings.find(t => t.id === id && !t.is_inclusive)) || undefined}
                        onValueChange={(value) => {
                          if (value && value !== "none") {
                            // Clear all taxes and select only this exclusive tax
                            const newSelection: {[key: string]: boolean} = {};
                            taxSettings.forEach(tax => {
                              newSelection[tax.id] = tax.id === value;
                            });
                            setTaxSelection(newSelection);
                          } else {
                            clearAllTaxes();
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose exclusive tax (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Tax</SelectItem>
                          {taxSettings
                            .filter(tax => !tax.is_inclusive)
                            .map(tax => (
                              <SelectItem key={tax.id} value={tax.id}>
                                {tax.name} ({tax.rate}%) - {tax.tax_type.toUpperCase()}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-green-600">
                        Tax amount will be added to the total price.
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Tax Summary */}
                {calculationResult.taxAmount > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded border">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Base Amount:</span>
                        <span>₹{calculationResult.baseAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Tax ({getTaxTypeLabel()}):</span>
                        <span>₹{calculationResult.taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-1">
                        <span>Final Amount:</span>
                        <span>₹{calculationResult.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Manual Tax Fields (Fallback) */}
            {taxSettings.length === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cgst">CGST (₹)</Label>
                  <Input
                    id="cgst"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('cgst', {
                      valueAsNumber: true,
                      onChange: (e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setValue('cgst', value);
                        console.log('CGST changed:', value);
                      }
                    })}
                    placeholder="0.00"
                  />
                  {errors.cgst && (
                    <p className="text-sm text-destructive">{errors.cgst.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sgst">SGST (₹)</Label>
                  <Input
                    id="sgst"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('sgst', {
                      valueAsNumber: true,
                      onChange: (e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setValue('sgst', value);
                        console.log('SGST changed:', value);
                      }
                    })}
                    placeholder="0.00"
                  />
                  {errors.sgst && (
                    <p className="text-sm text-destructive">{errors.sgst.message}</p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount">
                Total Amount (₹) *
                <span className="text-xs text-muted-foreground ml-2">
                  (Auto-calculated or manually editable)
                </span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                {...register('amount', {
                  valueAsNumber: true,
                  onChange: (e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setValue('amount', value);
                    console.log('Total amount manually changed:', value);
                  }
                })}
                placeholder="0.00"
                className="bg-green-50 border-green-300 font-bold text-lg text-green-800"
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
              <p className="text-xs text-green-600">
                Auto-calculation: ₹{registrationFee || 0} + ₹{packageFee || 0} - ₹{discount || 0} = ₹{Math.max(0, (registrationFee || 0) + (packageFee || 0) - (discount || 0))}
              </p>
            </div>

            {/* Amount Paid and Due Amount Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount_paid">
                  Amount Paid (₹) *
                  <span className="text-xs text-muted-foreground ml-2">
                    (Amount actually received)
                  </span>
                </Label>
                <Input
                  id="amount_paid"
                  type="number"
                  step="0.01"
                  min="0"
                  max={amount || 0}
                  {...register('amount_paid', {
                    valueAsNumber: true,
                    onChange: (e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setValue('amount_paid', value);
                      console.log('Amount paid changed:', value);
                    }
                  })}
                  placeholder="Enter amount paid"
                  className="bg-blue-50 border-blue-300 font-semibold text-blue-800"
                />
                {errors.amount_paid && (
                  <p className="text-sm text-destructive">{errors.amount_paid.message}</p>
                )}
                {amountPaid > amount && (
                  <p className="text-sm text-destructive">Amount paid cannot exceed total amount</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  Due Amount (₹)
                  <span className="text-xs text-muted-foreground ml-2">
                    (Remaining balance)
                  </span>
                </Label>
                <div className={`p-3 rounded-md border-2 font-bold text-lg ${
                  Math.max(0, (amount || 0) - (amountPaid || 0)) > 0 
                    ? 'bg-red-50 border-red-300 text-red-800' 
                    : 'bg-green-50 border-green-300 text-green-800'
                }`}>
                  ₹{Math.max(0, (amount || 0) - (amountPaid || 0)).toFixed(2)}
                </div>
                {Math.max(0, (amount || 0) - (amountPaid || 0)) > 0 && (
                  <p className="text-xs text-red-600">
                    This will be marked as a partial payment
                  </p>
                )}
                {Math.max(0, (amount || 0) - (amountPaid || 0)) === 0 && amountPaid > 0 && (
                  <p className="text-xs text-green-600">
                    Payment complete - no due amount
                  </p>
                )}
              </div>
            </div>

            {/* Fee Calculation Summary */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-green-800">Payment Calculation Summary</span>
                <div className="flex items-center gap-2">
                  {selectedPlanType && (
                    <Badge variant="outline" className="bg-white">
                      {PLAN_CONFIG[selectedPlanType as keyof typeof PLAN_CONFIG]?.label}
                    </Badge>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const regFee = registrationFee || 0;
                      const pkgFee = packageFee || 0;
                      const disc = discount || 0;
                      const total = Math.max(0, regFee + pkgFee - disc);
                      setValue('amount', total);
                      console.log('Manual calculation triggered:', { regFee, pkgFee, disc, total });
                    }}
                  >
                    🔄 Recalculate
                  </Button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Registration Fee:</span>
                  <span className="font-medium">₹{(registrationFee || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Package Fee ({selectedPlanType}):</span>
                  <span className="font-medium">₹{(packageFee || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Discount Applied:</span>
                  <span className="font-medium">-₹{(discount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-green-300 pt-2 text-green-800">
                  <span>Total Amount to Pay:</span>
                  <span>₹{Math.max(0, (registrationFee || 0) + (packageFee || 0) - (discount || 0)).toFixed(2)}</span>
                </div>
                {watch('subscription_start_date') && watch('subscription_end_date') && (
                  <div className="flex justify-between text-blue-600 text-xs pt-2 border-t border-blue-200">
                    <span>Subscription Period:</span>
                    <span>{watch('subscription_start_date')} to {watch('subscription_end_date')}</span>
                  </div>
                )}

                {/* Debug Information */}
                <div className="mt-3 p-2 bg-gray-100 rounded text-xs">
                  <strong>Debug Info:</strong><br />
                  Registration: {registrationFee || 0} | Package: {packageFee || 0} | Discount: {discount || 0}<br />
                  Calculation: {registrationFee || 0} + {packageFee || 0} - {discount || 0} = {(registrationFee || 0) + (packageFee || 0) - (discount || 0)}<br />
                  Final Amount: {watch('amount')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Amount (for non-member receipts or manual override) */}
        {!selectedMember && (
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
          </div>
        )}

        {/* Payment Type */}
        {/* <div className="space-y-2">
          <Label htmlFor="payment_type">Payment Method *</Label>
          <Select
            onValueChange={(value) => setValue('payment_type', value as 'cash' | 'card' | 'upi' | 'bank_transfer')}
            defaultValue={initialData?.payment_type || selectedMember?.paymentMode || 'cash'}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">💵 Cash Payment</SelectItem>
              <SelectItem value="card">💳 Card Payment</SelectItem>
              <SelectItem value="upi">📱 UPI Payment</SelectItem>
              <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
          {errors.payment_type && (
            <p className="text-sm text-destructive">{errors.payment_type.message}</p>
          )}
        </div> */}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Payment Description *
          {selectedMember && (
            <span className="text-xs text-muted-foreground ml-2">
              (Auto-generated based on member plan)
            </span>
          )}
        </Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder={selectedMember
            ? `Payment for ${selectedMember.planType} membership plan - ${selectedMember.name}`
            : "Enter payment description (e.g., Monthly membership fee, Personal training session)"
          }
          rows={3}
          className={selectedMember ? "bg-muted" : ""}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

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
        <Button
          type="submit"
          disabled={loading || !selectedMember}
          className={`${!selectedMember ? 'opacity-50 cursor-not-allowed' : ''} ${membershipStatus === 'expired' ? 'bg-red-600 hover:bg-red-700' :
              membershipStatus === 'expiring_soon' ? 'bg-yellow-600 hover:bg-yellow-700' :
                'bg-blue-600 hover:bg-blue-700'
            }`}
        >
          {loading ? 'Processing...' : (
            membershipStatus === 'expired' ? 'Create Receipt & Renew Membership' :
              membershipStatus === 'expiring_soon' ? 'Create Receipt & Extend Membership' :
                initialData ? 'Update Receipt' : 'Create Receipt'
          )}
        </Button>
        {!selectedMember && (
          <p className="text-sm text-muted-foreground mt-2">
            Please select a member to create a receipt
          </p>
        )}
      </div>
    </form>
  );
};