import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, Upload, X, User, Badge } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { LegacyMember, LegacyEnquiry, db } from '@/utils/database';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { compressImage, validateImageFile } from '@/utils/imageUtils';
import { useToast } from '@/hooks/use-toast';

import { calculateSubscriptionEndDate, getPlanDurationInMonths, formatDateForDatabase } from '@/utils/dateUtils';
import { partialMemberSchema, validatePartialMember, PartialMemberData } from '@/schemas/partialMemberSchema';

const memberSchema = z.object({
  customMemberId: z.string().min(1, 'Member ID is required').regex(/^\d+$/, 'Member ID must contain only numbers'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  telephoneNo: z.string().nullable().optional().transform(val => val || undefined),
  mobileNo: z.string().min(10, 'Mobile number must be at least 10 digits').regex(/^\d+$/, 'Mobile number must contain only digits'),
  occupation: z.string().min(2, 'Occupation is required'),
  maritalStatus: z.enum(['married', 'unmarried']),
  anniversaryDate: z.union([z.date(), z.string().transform(str => str ? new Date(str) : undefined)]).optional(),
  bloodGroup: z.string().nullable().optional().transform(val => val || undefined),
  sex: z.enum(['male', 'female']),
  dateOfBirth: z.union([
    z.date(),
    z.string().transform(str => new Date(str))
  ], {
    required_error: 'Date of birth is required',
  }),
  alternateNo: z.string().nullable().optional().transform(val => val || undefined),
  email: z.string().email('Invalid email address'),
  memberImage: z.string().nullable().optional().transform(val => val || undefined),
  idProofImage: z.string().nullable().optional().transform(val => val || undefined),
  dateOfRegistration: z.union([
    z.date(),
    z.string().transform(str => new Date(str))
  ], {
    required_error: 'Date of registration is required',
  }),
  paymentMode: z.enum(['cash', 'upi', 'bank_transfer']),
  planType: z.enum(['monthly', 'quarterly', 'half_yearly', 'yearly', 'custom']),
  services: z.array(z.string()).min(1, 'At least one service must be selected'),
  membershipFees: z.number().min(0, 'Total fees must be positive'),
  registrationFee: z.number().min(0, 'Registration fee must be positive'),
  packageFee: z.number().min(0, 'Package fee must be positive'),
  discount: z.number().min(0, 'Discount must be positive'),
  paidAmount: z.number().min(0, 'Paid amount must be positive'),
  subscriptionStartDate: z.union([
    z.date(),
    z.string().transform(str => new Date(str))
  ], {
    required_error: 'Subscription start date is required',
  }),
  subscriptionEndDate: z.union([z.date(), z.string().transform(str => str ? new Date(str) : undefined)]).optional(),
  medicalIssues: z.string().nullable().optional().transform(val => val || undefined),
  goals: z.string().nullable().optional().transform(val => val || undefined),
  status: z.enum(['active', 'inactive', 'frozen']),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface MemberFormProps {
  initialData?: LegacyMember;
  enquiryData?: LegacyEnquiry;
  onSubmit: (data: Omit<LegacyMember, 'id' | 'createdAt' | 'updatedAt'> & {
    tax?: {
      id: string;
      name: string;
      rate: number;
      type: string;
      amount: number;
    };
  }) => void;
  onPartialSave?: (data: PartialMemberData) => void;
}

const serviceOptions = [
  { id: 'gym', label: 'Gym' },
  { id: 'yoga', label: 'Yoga' },
  { id: 'aerobics', label: 'Aerobics' },
  { id: 'slimming', label: 'Slimming' },
  { id: 'combopack', label: 'Combo Pack' },
];

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const MemberForm: React.FC<MemberFormProps> = ({ initialData, enquiryData, onSubmit, onPartialSave }) => {
  const [memberImage, setMemberImage] = useState<string | null>(initialData?.memberImage || null);
  const [idProofImage, setIdProofImage] = useState<string | null>(initialData?.idProofImage || null);
  const [isUploadingMemberImage, setIsUploadingMemberImage] = useState(false);
  const [isUploadingIdProof, setIsUploadingIdProof] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>(initialData?.services || []);
  const [isGeneratingMemberId, setIsGeneratingMemberId] = useState(false);
  const [memberIdError, setMemberIdError] = useState<string | null>(null);
  const [realTimeAmounts, setRealTimeAmounts] = useState<{
    totalPaid: number;
    totalDue: number;
    receiptCount: number;
  }>({ totalPaid: 0, totalDue: 0, receiptCount: 0 });
  const [occupations, setOccupations] = useState<unknown[]>([]);
  const [packages, setPackages] = useState<unknown[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [paymentTypes, setPaymentTypes] = useState<unknown[]>([]);
  const [masterDataLoaded, setMasterDataLoaded] = useState(false);
  const [isSavingPartial, setIsSavingPartial] = useState(false);
  const [isPartialMember, setIsPartialMember] = useState(initialData?.status === 'partial');
  const memberImageInputRef = useRef<HTMLInputElement>(null);
  const idProofInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: initialData ? {
      customMemberId: initialData.customMemberId || '',
      name: initialData.name || '',
      address: initialData.address || '',
      telephoneNo: initialData.telephoneNo || '',
      mobileNo: initialData.mobileNo || '',
      occupation: initialData.occupation || '',
      maritalStatus: initialData.maritalStatus || 'unmarried',
      anniversaryDate: initialData.anniversaryDate ? new Date(initialData.anniversaryDate) : undefined,
      bloodGroup: initialData.bloodGroup || '',
      sex: initialData.sex || 'male',
      dateOfBirth: new Date(initialData.dateOfBirth),
      alternateNo: initialData.alternateNo || '',
      email: initialData.email || '',
      memberImage: initialData.memberImage || '',
      idProofImage: initialData.idProofImage || '',
      dateOfRegistration: new Date(initialData.dateOfRegistration),
      paymentMode: initialData.paymentMode || 'cash',
      planType: initialData.planType || 'monthly',
      services: initialData.services || [],
      membershipFees: initialData.membershipFees || 0,
      registrationFee: initialData.registrationFee || 0,
      packageFee: initialData.packageFee || initialData.membershipFees || 0,
      discount: initialData.discount || 0,
      paidAmount: initialData.paidAmount || 0,
      subscriptionStartDate: initialData.subscriptionStartDate ? new Date(initialData.subscriptionStartDate) : new Date(),
      subscriptionEndDate: initialData.subscriptionEndDate ? new Date(initialData.subscriptionEndDate) : undefined,
      medicalIssues: initialData.medicalIssues || '',
      goals: initialData.goals || '',
      status: initialData.status || 'active',
    } : enquiryData ? {
      // Pre-fill from enquiry data
      customMemberId: '',
      name: enquiryData.name || '',
      address: enquiryData.address || '',
      telephoneNo: enquiryData.telephoneNo || '',
      mobileNo: enquiryData.mobileNo || '',
      occupation: enquiryData.occupation || '',
      maritalStatus: 'unmarried',
      anniversaryDate: undefined,
      bloodGroup: '',
      sex: enquiryData.sex || 'male',
      dateOfBirth: new Date(),
      alternateNo: '',
      email: '', // Enquiry doesn't have email, will need to be filled
      memberImage: '',
      idProofImage: '',
      dateOfRegistration: new Date(),
      paymentMode: enquiryData.paymentMode === 'cheque' ? 'bank_transfer' : 'cash', // Map cheque to bank_transfer
      planType: enquiryData.paymentFrequency || 'monthly',
      services: enquiryData.interestedIn || [],
      membershipFees: enquiryData.membershipFees || 0,
      registrationFee: 0,
      packageFee: enquiryData.membershipFees || 0,
      discount: 0,
      paidAmount: 0,
      subscriptionStartDate: new Date(),
      subscriptionEndDate: undefined,
      medicalIssues: '',
      goals: '',
      status: 'active',
    } : {
      customMemberId: '',
      name: '',
      address: '',
      telephoneNo: '',
      mobileNo: '',
      occupation: '',
      maritalStatus: 'unmarried',
      anniversaryDate: undefined,
      bloodGroup: '',
      sex: 'male',
      dateOfBirth: new Date(),
      alternateNo: '',
      email: '',
      memberImage: '',
      idProofImage: '',
      dateOfRegistration: new Date(),
      paymentMode: 'cash',
      planType: 'monthly',
      services: [],
      membershipFees: 0,
      registrationFee: 0,
      packageFee: 0,
      discount: 0,
      paidAmount: 0,
      subscriptionStartDate: new Date(),
      subscriptionEndDate: undefined,
      medicalIssues: '',
      goals: '',
      status: 'active',
    }
  });

  const dateOfBirth = watch('dateOfBirth');
  const dateOfRegistration = watch('dateOfRegistration');
  const subscriptionStartDate = watch('subscriptionStartDate');
  const subscriptionEndDate = watch('subscriptionEndDate');
  const anniversaryDate = watch('anniversaryDate');
  const maritalStatus = watch('maritalStatus');
  const planType = watch('planType');
  const registrationFee = watch('registrationFee');
  const packageFee = watch('packageFee');
  const discount = watch('discount');
  const paidAmount = watch('paidAmount');

  // Calculate total amount without tax
  const baseAmount = (registrationFee || 0) + (packageFee || 0) - (discount || 0);
  
  // Update membership fees when base amount changes
  useEffect(() => {
    setValue('membershipFees', baseAmount);
  }, [baseAmount, setValue]);

  // Load real-time amounts from receipts
  const loadRealTimeAmounts = useCallback(async () => {
    if (initialData?.id) {
      try {
        // Get member's due amount using the same method as the database
        const memberDueData = await db.getMemberDueAmount(initialData.id);

        // Get member's receipts to calculate real-time amounts
        const receipts = await db.getReceiptsByMemberId(initialData.id);

        let totalPaidFromReceipts = 0;
        let totalDueFromReceipts = 0;

        receipts.forEach(receipt => {
          totalPaidFromReceipts += receipt.amount_paid || receipt.amount || 0;
          totalDueFromReceipts += receipt.due_amount || 0;
        });

        // Use the database-calculated due amount for consistency
        setRealTimeAmounts({
          totalPaid: totalPaidFromReceipts,
          totalDue: memberDueData.dueAmount || 0,
          receiptCount: receipts.length
        });
      } catch (error) {
        console.error('Error loading real-time amounts:', error);
      }
    }
  }, [initialData?.id]);

  // Sync state with form values on initialization
  useEffect(() => {
    if (initialData?.memberImage) {
      setMemberImage(initialData.memberImage);
      setValue('memberImage', initialData.memberImage);
    }
    if (initialData?.idProofImage) {
      setIdProofImage(initialData.idProofImage);
      setValue('idProofImage', initialData.idProofImage);
    }
    if (initialData?.services) {
      setSelectedServices(initialData.services);
      setValue('services', initialData.services);
    }
  }, [initialData, setValue]);

  // Load occupations from master settings
  const loadOccupations = async () => {
    try {
      console.log('Loading occupations...');
      const result = await db.masterOccupationsGetAll();
      console.log('Occupations result:', result);
      if (result.success && result.data) {
        const activeOccupations = result.data.filter(occupation => occupation.is_active !== false);
        console.log('Active occupations:', activeOccupations);
        setOccupations(activeOccupations);
      } else {
        console.error('Failed to load occupations:', result.error);
        setOccupations([]); // Set empty array on failure
      }
    } catch (error) {
      console.error('Error loading occupations:', error);
      setOccupations([]); // Set empty array on error
    }
  };

  // Load packages from master settings
  const loadPackages = async () => {
    try {
      console.log('Loading packages...');
      const result = await db.masterPackagesGetAll();
      console.log('Packages result:', result);
      if (result.success && result.data) {
        const activePackages = result.data.filter(pkg => pkg.is_active !== false);
        console.log('Active packages:', activePackages);
        setPackages(activePackages);
      } else {
        console.error('Failed to load packages:', result.error);
        setPackages([]); // Set empty array on failure
      }
    } catch (error) {
      console.error('Error loading packages:', error);
      setPackages([]); // Set empty array on error
    }
  };

  // Load tax settings from master settings


  // Load payment types from master settings
  const loadPaymentTypes = async () => {
    try {
      console.log('Loading payment types...');
      const result = await db.masterPaymentTypesGetAll();
      console.log('Payment types result:', result);
      if (result.success && result.data) {
        const activePaymentTypes = result.data.filter(paymentType => paymentType.is_active !== false);
        console.log('Active payment types:', activePaymentTypes);
        setPaymentTypes(activePaymentTypes);
      } else {
        console.error('Failed to load payment types:', result.error);
        setPaymentTypes([]); // Set empty array on failure
      }
    } catch (error) {
      console.error('Error loading payment types:', error);
      setPaymentTypes([]); // Set empty array on error
    }
  };

  // Load real-time amounts when component mounts or initialData changes
  useEffect(() => {
    const loadAllMasterData = async () => {
      setMasterDataLoaded(false);
      await Promise.all([
        loadRealTimeAmounts(),
        loadOccupations(),
        loadPackages(),
        loadPaymentTypes()
      ]);
      setMasterDataLoaded(true);
      console.log('All master data loaded');
    };

    loadAllMasterData();
  }, [initialData?.id, loadRealTimeAmounts]);

  // Auto-calculate subscription end date when start date or plan type changes
  useEffect(() => {
    if (subscriptionStartDate && planType) {
      try {
        const calculatedEndDate = calculateSubscriptionEndDate(subscriptionStartDate, planType);
        setValue('subscriptionEndDate', new Date(calculatedEndDate));
      } catch (error) {
        console.error('Error calculating end date:', error);
      }
    }
  }, [subscriptionStartDate, planType, setValue]);

  // Auto-populate package fee when plan type changes (if packages are available)
  useEffect(() => {
    if (selectedPackageId && packages.length > 0) {
      console.log('Selected package ID:', selectedPackageId, 'Available packages:', packages);

      // Find the selected package by ID
      const selectedPackage = packages.find(pkg =>
        pkg.id?.toString() === selectedPackageId
      );

      console.log('Found selected package:', selectedPackage);

      if (selectedPackage) {
        // Map package fee from master settings
        if (selectedPackage.price && selectedPackage.price > 0) {
          setValue('packageFee', selectedPackage.price);
          console.log('Package fee mapped from master settings:', selectedPackage.price);
        }

        // Map registration fee if available
        if (selectedPackage.registration_fee && selectedPackage.registration_fee > 0) {
          setValue('registrationFee', selectedPackage.registration_fee);
          console.log('Registration fee mapped from master settings:', selectedPackage.registration_fee);
        }

        // Map discount if available
        if (selectedPackage.discount && selectedPackage.discount > 0) {
          setValue('discount', selectedPackage.discount);
          console.log('Discount mapped from master settings:', selectedPackage.discount);
        }

        // Show success message
        toast({
          title: "Plan Mapped",
          description: `Package fees have been automatically mapped from ${selectedPackage.name || 'selected'} plan.`,
        });
      } else {
        console.log('No matching package found for ID:', selectedPackageId);
      }
    }
  }, [selectedPackageId, packages, setValue, toast]);



  const handleMemberImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      toast({
        title: "Invalid Member Image",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploadingMemberImage(true);
      const compressedImage = await compressImage(file, 400, 0.8);
      setMemberImage(compressedImage);
      setValue('memberImage', compressedImage);
      toast({
        title: "Member Image Uploaded",
        description: "Member photo has been successfully uploaded.",
      });
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to process member image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingMemberImage(false);
    }
  };

  const handleIdProofUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      toast({
        title: "Invalid ID Proof Image",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploadingIdProof(true);
      const compressedImage = await compressImage(file, 400, 0.8);
      setIdProofImage(compressedImage);
      setValue('idProofImage', compressedImage);
      toast({
        title: "ID Proof Image Uploaded",
        description: "ID proof has been successfully uploaded.",
      });
    } catch (error) {
      console.error('Error processing ID proof image:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to process ID proof image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingIdProof(false);
    }
  };

  const removeMemberImage = () => {
    setMemberImage(null);
    setValue('memberImage', '');
    if (memberImageInputRef.current) {
      memberImageInputRef.current.value = '';
    }
  };

  const removeIdProof = () => {
    setIdProofImage(null);
    setValue('idProofImage', '');
    if (idProofInputRef.current) {
      idProofInputRef.current.value = '';
    }
  };

  const handleServiceChange = (serviceId: string, checked: boolean) => {
    let updatedServices;
    if (checked) {
      updatedServices = [...selectedServices, serviceId];
    } else {
      updatedServices = selectedServices.filter(id => id !== serviceId);
    }
    setSelectedServices(updatedServices);
    setValue('services', updatedServices);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Generate automatic member ID
  const generateMemberId = useCallback(async () => {
    try {
      setIsGeneratingMemberId(true);
      setMemberIdError(null);
      const newMemberId = await db.generateMemberNumber();
      setValue('customMemberId', newMemberId);
      toast({
        title: "Member ID Generated",
        description: `New member ID: ${newMemberId}`,
      });
    } catch (error) {
      console.error('Error generating member ID:', error);
      setMemberIdError('Failed to generate member ID');
      toast({
        title: "Error",
        description: "Failed to generate member ID",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingMemberId(false);
    }
  });

  // Validate member ID availability
  const validateMemberId = async (memberId: string) => {
    if (!memberId || memberId.trim() === '') {
      setMemberIdError(null);
      return;
    }

    try {
      const result = await db.checkMemberNumberAvailable(memberId, initialData?.id);
      if (!result.available) {
        setMemberIdError('This member ID is already taken');
      } else {
        setMemberIdError(null);
      }
    } catch (error) {
      console.error('Error validating member ID:', error);
      setMemberIdError('Error validating member ID');
    }
  };

  // Watch for member ID changes to validate
  const customMemberId = watch('customMemberId');
  useEffect(() => {
    if (customMemberId) {
      const timeoutId = setTimeout(() => {
        validateMemberId(customMemberId);
      }, 500); // Debounce validation
      return () => clearTimeout(timeoutId);
    } else {
      setMemberIdError(null);
    }
  }, [customMemberId, initialData?.id, validateMemberId]);

  // Auto-generate member ID for new members if not provided
  useEffect(() => {
    if (!initialData && !customMemberId) {
      generateMemberId();
    }
  }, [customMemberId, generateMemberId, initialData]);

  // Handle partial member save (basic information only)
  const handlePartialSave = async () => {
    console.log('🔄 MemberForm: handlePartialSave called');
    console.log('🔄 MemberForm: onPartialSave callback exists:', !!onPartialSave);

    if (!onPartialSave) {
      console.log('❌ MemberForm: No onPartialSave callback provided');
      toast({
        title: "Configuration Error",
        description: "Partial save functionality is not available. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    // Check if there are any member ID validation errors
    if (memberIdError) {
      console.log('❌ MemberForm: Member ID error exists:', memberIdError);
      toast({
        title: "Validation Error",
        description: `Please fix the member ID error: ${memberIdError}`,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSavingPartial(true);

      // Get current form data for basic fields only
      const formData = watch();
      console.log('🔄 MemberForm: Form data:', formData);

      // Ensure member ID is generated if not present
      if (!formData.customMemberId) {
        console.log('🔄 MemberForm: No member ID found, generating one...');
        try {
          const newMemberId = await db.generateMemberNumber();
          setValue('customMemberId', newMemberId);
          formData.customMemberId = newMemberId;
          console.log('🔄 MemberForm: Generated member ID:', newMemberId);
        } catch (error) {
          console.error('❌ MemberForm: Failed to generate member ID:', error);
          toast({
            title: "Error",
            description: "Failed to generate member ID. Please try again.",
            variant: "destructive",
          });
          return;
        }
      }

      // Validate partial member data
      const validationData = {
        customMemberId: formData.customMemberId,
        name: formData.name,
        address: formData.address,
        telephoneNo: formData.telephoneNo,
        mobileNo: formData.mobileNo,
        occupation: formData.occupation,
        maritalStatus: formData.maritalStatus,
        anniversaryDate: formData.anniversaryDate,
        bloodGroup: formData.bloodGroup,
        sex: formData.sex,
        dateOfBirth: formData.dateOfBirth,
        alternateNo: formData.alternateNo,
        email: formData.email,
        memberImage: memberImage,
        idProofImage: idProofImage,
        dateOfRegistration: formData.dateOfRegistration,
        medicalIssues: formData.medicalIssues,
        goals: formData.goals,
        status: 'partial'
      };

      console.log('🔄 MemberForm: Raw form data for validation:', {
        customMemberId: formData.customMemberId,
        name: formData.name,
        address: formData.address,
        mobileNo: formData.mobileNo,
        email: formData.email,
        occupation: formData.occupation,
        sex: formData.sex,
        dateOfBirth: formData.dateOfBirth,
        dateOfRegistration: formData.dateOfRegistration
      });

      console.log('🔄 MemberForm: Validation data:', validationData);
      const validation = validatePartialMember(validationData);
      console.log('🔄 MemberForm: Validation result:', validation);

      if (!validation.isValid) {
        // Show validation errors
        const errorMessages = validation.errors?.map(err => `${err.path?.join('.')}: ${err.message}`).join(', ') || 'Validation failed';
        console.log('❌ MemberForm: Validation failed:', errorMessages);
        console.log('❌ MemberForm: Validation errors:', validation.errors);
        toast({
          title: "Validation Error",
          description: errorMessages,
          variant: "destructive",
        });
        return;
      }

      // Prepare partial member data
      const partialData: PartialMemberData = {
        customMemberId: validation.data?.customMemberId,
        name: validation.data!.name,
        address: validation.data!.address,
        telephoneNo: validation.data?.telephoneNo,
        mobileNo: validation.data!.mobileNo,
        occupation: validation.data!.occupation,
        maritalStatus: validation.data!.maritalStatus,
        anniversaryDate: validation.data?.anniversaryDate ? formatDateForDatabase(validation.data.anniversaryDate) : undefined,
        bloodGroup: validation.data?.bloodGroup,
        sex: validation.data!.sex,
        dateOfBirth: formatDateForDatabase(validation.data!.dateOfBirth),
        alternateNo: validation.data?.alternateNo,
        email: validation.data!.email,
        memberImage: validation.data?.memberImage,
        idProofImage: validation.data?.idProofImage,
        dateOfRegistration: formatDateForDatabase(validation.data!.dateOfRegistration),
        medicalIssues: validation.data?.medicalIssues,
        goals: validation.data?.goals,
        status: 'partial'
      };

      console.log('🔄 MemberForm: Final partial data being sent to database:', partialData);
      console.log('🔄 MemberForm: Required fields check:', {
        name: !!partialData.name,
        mobileNo: !!partialData.mobileNo,
        email: !!partialData.email,
        occupation: !!partialData.occupation,
        sex: !!partialData.sex,
        dateOfBirth: !!partialData.dateOfBirth,
        address: !!partialData.address
      });

      // Call the partial save handler
      console.log('🔄 MemberForm: Calling onPartialSave with data:', partialData);
      await onPartialSave(partialData);
      console.log('🔄 MemberForm: onPartialSave completed');

      toast({
        title: "Member Details Saved",
        description: "Basic member information has been saved successfully. You can complete the membership details later.",
      });

      // Update component state to reflect partial member status
      setIsPartialMember(true);

    } catch (error) {
      console.error('Partial save error:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save member details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingPartial(false);
    }
  };

  const onFormSubmit = (data: MemberFormData) => {
    console.log('Form data being submitted:', data);

    // Check for member ID errors before submission
    if (memberIdError) {
      toast({
        title: "Validation Error",
        description: "Please fix the member ID error before submitting",
        variant: "destructive",
      });
      return;
    }

    // Calculate due amount for consistency
    const totalAmount = data.membershipFees || 0;
    const paidAmount = data.paidAmount || 0;
    const dueAmount = Math.max(0, totalAmount - paidAmount);



    console.log('Member form amounts:', {
      totalAmount,
      paidAmount,
      dueAmount,
      membershipFees: data.membershipFees,
      registrationFee: data.registrationFee,
      packageFee: data.packageFee,
      discount: data.discount
    });

    onSubmit({
      customMemberId: data.customMemberId,
      name: data.name,
      address: data.address,
      telephoneNo: data.telephoneNo,
      mobileNo: data.mobileNo,
      occupation: data.occupation,
      maritalStatus: data.maritalStatus,
      anniversaryDate: data.anniversaryDate ? formatDateForDatabase(data.anniversaryDate) : undefined,
      bloodGroup: data.bloodGroup,
      sex: data.sex,
      dateOfBirth: data.dateOfBirth instanceof Date ? formatDateForDatabase(data.dateOfBirth) : data.dateOfBirth,
      alternateNo: data.alternateNo || '',
      email: data.email,
      memberImage: memberImage || '',
      idProofImage: idProofImage || '',
      dateOfRegistration: data.dateOfRegistration instanceof Date ? formatDateForDatabase(data.dateOfRegistration) : data.dateOfRegistration,
      receiptNo: undefined, // Will be generated if payment is made
      paymentMode: data.paymentMode,
      planType: data.planType,
      services: selectedServices,
      membershipFees: data.membershipFees,
      registrationFee: data.registrationFee,
      packageFee: data.packageFee,
      discount: data.discount,
      paidAmount: data.paidAmount,
      paid_amount: data.paidAmount, // Add snake_case version for database compatibility

      // Add due amount for consistency
      dueAmount: dueAmount,
      due_amount: dueAmount, // Also add snake_case version for database compatibility
      subscriptionStartDate: data.subscriptionStartDate instanceof Date ? data.subscriptionStartDate.toISOString() : data.subscriptionStartDate,
      subscriptionEndDate: data.subscriptionEndDate ? (data.subscriptionEndDate instanceof Date ? data.subscriptionEndDate.toISOString() : data.subscriptionEndDate) : '',
      medicalIssues: data.medicalIssues || '',
      goals: data.goals,
      status: data.status,
      height: undefined,
      amount_paid: undefined,
      notes: undefined,
      phone: undefined,
      profileImage: undefined,
      weight: undefined,

    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Images Upload Section */}
      <div className="grid grid-cols-2 gap-8">
        {/* Member Image Upload */}
        <div className="flex flex-col items-center space-y-4">
          <h3 className="text-lg font-semibold">Member Photo</h3>
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={memberImage || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {watch('name') ? getInitials(watch('name')) : <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            {memberImage && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                onClick={removeMemberImage}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <div className="flex flex-col items-center space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => memberImageInputRef.current?.click()}
              disabled={isUploadingMemberImage}
              className="flex items-center space-x-2"
            >
              <Upload className="h-4 w-4" />
              <span>
                {isUploadingMemberImage ? 'Processing...' : memberImage ? 'Change Photo' : 'Upload Photo'}
              </span>
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Optional - Max size: 10MB<br />Formats: JPG, PNG, GIF, WebP
            </p>
            <input
              ref={memberImageInputRef}
              type="file"
              accept="image/*"
              onChange={handleMemberImageUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* ID Proof Upload */}
        <div className="flex flex-col items-center space-y-4">
          <h3 className="text-lg font-semibold">ID Proof</h3>
          <div className="relative">
            <div className="h-24 w-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
              {idProofImage ? (
                <img
                  src={idProofImage}
                  alt="ID Proof"
                  className="h-full w-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-center">
                  <User className="h-8 w-8 mx-auto text-gray-400" />
                  <p className="text-xs text-gray-500 mt-1">Optional</p>
                </div>
              )}
            </div>
            {idProofImage && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                onClick={removeIdProof}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <div className="flex flex-col items-center space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => idProofInputRef.current?.click()}
              disabled={isUploadingIdProof}
              className="flex items-center space-x-2"
            >
              <Upload className="h-4 w-4" />
              <span>
                {isUploadingIdProof ? 'Processing...' : idProofImage ? 'Change ID Proof' : 'Upload ID Proof'}
              </span>
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Optional - Max size: 10MB<br />Formats: JPG, PNG, GIF, WebP
            </p>
            <input
              ref={idProofInputRef}
              type="file"
              accept="image/*"
              onChange={handleIdProofUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customMemberId">Member ID</Label>
            <div className="flex gap-2">
              <Input
                id="customMemberId"
                {...register('customMemberId')}
                placeholder={initialData ? "Enter member ID" : "Auto-generated or enter custom ID"}
                className={memberIdError ? "border-destructive" : ""}
              />
              {!initialData && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateMemberId}
                  disabled={isGeneratingMemberId}
                  className="whitespace-nowrap"
                >
                  {isGeneratingMemberId ? "Generating..." : "Auto Generate"}
                </Button>
              )}
            </div>
            {memberIdError && (
              <p className="text-sm text-destructive">{memberIdError}</p>
            )}
            {errors.customMemberId && (
              <p className="text-sm text-destructive">{errors.customMemberId.message}</p>
            )}
            {!initialData && (
              <p className="text-xs text-muted-foreground">
                Member ID will be auto-generated if left empty. Must be unique.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter full name"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Textarea
              id="address"
              {...register('address')}
              placeholder="Enter full address"
              rows={3}
            />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telephoneNo">Telephone No.</Label>
            <Input
              id="telephoneNo"
              {...register('telephoneNo')}
              placeholder="Enter telephone number (optional)"
            />
            {errors.telephoneNo && (
              <p className="text-sm text-destructive">{errors.telephoneNo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobileNo">Mobile No. *</Label>
            <Input
              id="mobileNo"
              type="tel"
              maxLength={10}
              {...register('mobileNo')}
              placeholder="Enter 10-digit mobile number"
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                target.value = target.value.replace(/\D/g, '').slice(0, 10);
              }}
            />
            {errors.mobileNo && (
              <p className="text-sm text-destructive">{errors.mobileNo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="alternateNo">Alternate No.</Label>
            <Input
              id="alternateNo"
              {...register('alternateNo')}
              placeholder="Enter alternate number (optional)"
            />
            {errors.alternateNo && (
              <p className="text-sm text-destructive">{errors.alternateNo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email ID *</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="occupation">Occupation *</Label>
            <Select
              onValueChange={(value) => setValue('occupation', value)}
              value={watch('occupation') || undefined}
              disabled={!masterDataLoaded}
            >
              <SelectTrigger>
                <SelectValue placeholder={!masterDataLoaded ? "Loading occupations..." : "Select occupation"} />
              </SelectTrigger>
              <SelectContent>
                {!masterDataLoaded ? (
                  <SelectItem key="occupation-loading" value="loading" disabled>Loading occupations...</SelectItem>
                ) : occupations.length > 0 ? (
                  occupations
                    .filter(occupation => occupation && (occupation.id || occupation.name)) // Better filtering
                    .map((occupation, index) => {
                      // Generate a guaranteed unique key using index as fallback
                      const uniqueKey = occupation.id || occupation.name || `occupation-${index}`;
                      const uniqueValue = occupation.name || `occupation-${index}`;

                      return (
                        <SelectItem key={uniqueKey} value={uniqueValue}>
                          <div className="flex flex-col">
                            <span className="font-medium">{occupation.name || `Occupation ${index + 1}`}</span>
                            {occupation.description && (
                              <span className="text-xs text-muted-foreground">{occupation.description}</span>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })
                ) : (
                  // Fallback options if no master settings available
                  <>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            {errors.occupation && (
              <p className="text-sm text-destructive">{errors.occupation.message}</p>
            )}

            {/* Show master occupations info */}
            {occupations.length > 0 && (
              <div className="text-xs text-purple-600 bg-purple-50 p-2 rounded border border-purple-200">
                💡 Occupations loaded from Master Settings ({occupations.length} available).
              </div>
            )}

            {/* Show fallback info */}
            {occupations.length === 0 && (
              <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                ⚠️ Using default occupations. Configure occupations in Master Settings for more options.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Personal Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Personal Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Sex *</Label>
            <Select
              onValueChange={(value) => setValue('sex', value as 'male' | 'female')}
              value={watch('sex') || undefined}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select sex" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
            {errors.sex && (
              <p className="text-sm text-destructive">{errors.sex.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Date of Birth *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateOfBirth && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateOfBirth ? format(dateOfBirth, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateOfBirth}
                  onSelect={(date) => date && setValue('dateOfBirth', date)}
                  disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                  initialFocus
                  captionLayout="dropdown"
                  fromYear={1900}
                  toYear={new Date().getFullYear()}
                />
              </PopoverContent>
            </Popover>
            {errors.dateOfBirth && (
              <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Marital Status *</Label>
            <Select
              onValueChange={(value) => setValue('maritalStatus', value as 'married' | 'unmarried')}
              value={watch('maritalStatus') || undefined}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select marital status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unmarried">Unmarried</SelectItem>
                <SelectItem value="married">Married</SelectItem>
              </SelectContent>
            </Select>
            {errors.maritalStatus && (
              <p className="text-sm text-destructive">{errors.maritalStatus.message}</p>
            )}
          </div>

          {maritalStatus === 'married' && (
            <div className="space-y-2">
              <Label>Date of Anniversary</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !anniversaryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {anniversaryDate ? format(anniversaryDate, "PPP") : "Pick anniversary date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={anniversaryDate}
                    onSelect={(date) => setValue('anniversaryDate', date)}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="bloodGroup">Blood Group</Label>
            <Select
              onValueChange={(value) => setValue('bloodGroup', value)}
              value={watch('bloodGroup') || undefined}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select blood group (optional)" />
              </SelectTrigger>
              <SelectContent>
                {bloodGroups.filter(group => group).map((group) => (
                  <SelectItem key={group} value={group}>{group}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Save Member Details Button */}
      {!initialData && onPartialSave && (
        <div className="flex justify-center py-4 border-t border-b bg-muted/30">
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Save basic member information now and complete membership details later
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handlePartialSave}
              disabled={isSavingPartial}
              className="flex items-center gap-2"
            >
              {isSavingPartial ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Saving...
                </>
              ) : (
                <>
                  <User className="h-4 w-4" />
                  Save Member Details
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground max-w-md">
              This will save the member's personal information. You can return later to add membership plans and payment details.
            </p>
          </div>
        </div>
      )}

      {/* Partial Member Status Indicator */}
      {isPartialMember && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300">
              Partial Member
            </Badge>
            <span className="text-sm text-amber-700">
              This member's basic information is saved. Complete the membership details below to activate their membership.
            </span>
          </div>
        </div>
      )}

      {/* Membership Details */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Membership Details</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              setMasterDataLoaded(false);
              await Promise.all([
                loadOccupations(),
                loadPackages(),
                loadPaymentTypes()
              ]);
              setMasterDataLoaded(true);
              toast({
                title: "Master Settings Refreshed",
                description: "Reloaded all master settings data.",
              });
            }}
            className="flex items-center gap-2"
            disabled={!masterDataLoaded}
          >
            {!masterDataLoaded ? '⏳ Loading...' : '🔄 Refresh Master Settings'}
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Date of Registration *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateOfRegistration && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateOfRegistration ? format(dateOfRegistration, "PPP") : "Pick registration date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateOfRegistration}
                  onSelect={(date) => date && setValue('dateOfRegistration', date)}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.dateOfRegistration && (
              <p className="text-sm text-destructive">{errors.dateOfRegistration.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Subscription Start Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !subscriptionStartDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {subscriptionStartDate ? format(subscriptionStartDate, "PPP") : "Pick start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={subscriptionStartDate}
                  onSelect={(date) => date && setValue('subscriptionStartDate', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.subscriptionStartDate && (
              <p className="text-sm text-destructive">{errors.subscriptionStartDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Subscription End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !subscriptionEndDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {subscriptionEndDate ? format(subscriptionEndDate, "PPP") : "Auto-calculated"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={subscriptionEndDate}
                  onSelect={(date) => date && setValue('subscriptionEndDate', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.subscriptionEndDate && (
              <p className="text-sm text-destructive">{errors.subscriptionEndDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Payment Mode *</Label>
            <Select
              onValueChange={(value) => setValue('paymentMode', value as 'cash' | 'upi' | 'bank_transfer')}
              value={watch('paymentMode') || undefined}
              disabled={!masterDataLoaded}
            >
              <SelectTrigger>
                <SelectValue placeholder={!masterDataLoaded ? "Loading payment modes..." : "Select payment mode"} />
              </SelectTrigger>
              <SelectContent>
                {!masterDataLoaded ? (
                  <SelectItem value="loading" disabled>Loading payment modes...</SelectItem>
                ) : paymentTypes.length > 0 ? (
                  paymentTypes
                    .filter(paymentType => paymentType && (paymentType.id || paymentType.name)) // Better filtering
                    .map((paymentType, index) => {
                      // Generate a guaranteed unique key using index as fallback
                      const uniqueKey = paymentType.id || paymentType.name || `payment-${index}`;
                      const safeValue = paymentType.name ? paymentType.name.toLowerCase().replace(/\s+/g, '_') : `payment-${index}`;

                      return (
                        <SelectItem key={uniqueKey} value={safeValue}>
                          <div className="flex flex-col">
                            <span className="font-medium">{paymentType.name || `Payment Method ${index + 1}`}</span>
                            {paymentType.description && (
                              <span className="text-xs text-muted-foreground">{paymentType.description}</span>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })
                ) : (
                  // Fallback to hardcoded values if no master settings available
                  <>
                    <SelectItem value="cash">💵 Cash</SelectItem>
                    <SelectItem value="upi">📱 UPI</SelectItem>
                    <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            {errors.paymentMode && (
              <p className="text-sm text-destructive">{errors.paymentMode.message}</p>
            )}

            {/* Show master payment types info */}
            {paymentTypes.length > 0 && (
              <div className="text-xs text-green-600 bg-green-50 p-2 rounded border border-green-200">
                💡 Payment methods loaded from Master Settings ({paymentTypes.length} available).
              </div>
            )}

            {/* Show fallback info */}
            {paymentTypes.length === 0 && (
              <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                ⚠️ Using default payment methods. Configure payment types in Master Settings for more options.
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Plan Type *</Label>
            <Select
              onValueChange={(value) => {
                // If packages are loaded, find the selected package and use its duration_type
                if (packages.length > 0) {
                  const selectedPackage = packages.find(pkg => pkg.id?.toString() === value || pkg.name === value);
                  if (selectedPackage) {
                    setSelectedPackageId(value); // Store the package ID for display
                    if (selectedPackage.duration_type) {
                      setValue('planType', selectedPackage.duration_type as 'monthly' | 'quarterly' | 'half_yearly' | 'yearly' | 'custom');
                    } else {
                      // Package exists but duration_type is missing - show error
                      toast({
                        title: "Package Configuration Error",
                        description: `The package "${selectedPackage.name}" is missing duration_type. Please update it in Master Settings → Packages.`,
                        variant: "destructive",
                      });
                      console.error('Package missing duration_type:', selectedPackage);
                    }
                  }
                } else {
                  // Fallback for hardcoded values
                  setSelectedPackageId(null);
                  setValue('planType', value as 'monthly' | 'quarterly' | 'half_yearly' | 'yearly');
                }
              }}
              value={packages.length > 0 ? (selectedPackageId || undefined) : (watch('planType') || undefined)}
              disabled={!masterDataLoaded}
            >
              <SelectTrigger>
                <SelectValue placeholder={!masterDataLoaded ? "Loading plans..." : "Select plan type"} />
              </SelectTrigger>
              <SelectContent>
                {!masterDataLoaded ? (
                  <SelectItem value="loading" disabled>Loading plans...</SelectItem>
                ) : packages.length > 0 ? (
                  packages
                    .filter(pkg => pkg && (pkg.id || pkg.name)) // Filter packages that have ID or name
                    .map((pkg, index) => {
                      // Use ID as the primary unique identifier, fallback to name
                      const uniqueKey = pkg.id?.toString() || pkg.name || `package-${index}`;
                      // Use ID or name as value (NOT duration_type to avoid conflicts with custom packages)
                      const uniqueValue = pkg.id?.toString() || pkg.name || `plan-${index}`;

                      return (
                        <SelectItem key={uniqueKey} value={uniqueValue}>
                          <div className="flex flex-col">
                            <span className="font-medium">{pkg.name || `Plan ${index + 1}`}</span>
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
                  // Fallback to hardcoded values if no master settings available
                  <>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="half_yearly">Half Yearly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            {errors.planType && (
              <p className="text-sm text-destructive">{errors.planType.message}</p>
            )}

            {/* Show master packages info */}
            {packages.length > 0 && (
              <>
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                  💡 Plans loaded from Master Settings ({packages.length} available). Selecting a plan will automatically map fees.
                </div>
                {/* Warning for packages missing duration_type */}
                {packages.some(pkg => !pkg.duration_type) && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                    ⚠️ Some packages are missing duration_type. Please update them in Master Settings → Packages to use them here.
                  </div>
                )}
              </>
            )}

            {/* Show fallback info */}
            {packages.length === 0 && (
              <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                ⚠️ Using default plans. Configure plans in Master Settings for automatic fee mapping.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label htmlFor="registrationFee" className="text-sm">Registration Fee *</Label>
              <Input
                id="registrationFee"
                type="number"
                min="0"
                step="0.01"
                {...register('registrationFee', { valueAsNumber: true })}
                placeholder="Enter registration fee"
                className="h-9"
              />
              {errors.registrationFee && (
                <p className="text-xs text-destructive">{errors.registrationFee.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="packageFee" className="text-sm">Package Fee *</Label>
              <Input
                id="packageFee"
                type="number"
                min="0"
                step="0.01"
                {...register('packageFee', { valueAsNumber: true })}
                placeholder="Enter package fee"
                className="h-9"
              />
              {errors.packageFee && (
                <p className="text-xs text-destructive">{errors.packageFee.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="discount" className="text-sm">Discount Money</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                step="0.01"
                {...register('discount', { valueAsNumber: true })}
                placeholder="Enter discount"
                className="h-9"
              />
              {errors.discount && (
                <p className="text-xs text-destructive">{errors.discount.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="membershipFees" className="text-sm">
                Total Fees *
              </Label>
              <Input
                id="membershipFees"
                type="number"
                min="0"
                step="0.01"
                {...register('membershipFees', { valueAsNumber: true })}
                placeholder="Auto-calculated"
                className="bg-muted h-9"
                readOnly
              />
              {errors.membershipFees && (
                <p className="text-xs text-destructive">{errors.membershipFees.message}</p>
              )}
            </div>
          </div>



          {/* Master Settings Integration Info */}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 text-sm">ℹ️</span>
              <div className="text-xs text-blue-700">
                <p className="font-medium mb-1">Master Settings Integration Status:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-2 rounded ${occupations.length > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    <strong>Occupations:</strong> {occupations.length} loaded
                    {occupations.length === 0 && <div className="text-xs">Configure in Master Settings → Occupations</div>}
                  </div>
                  <div className={`p-2 rounded ${packages.length > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    <strong>Packages:</strong> {packages.length} loaded
                    {packages.length === 0 && <div className="text-xs">Configure in Master Settings → Packages</div>}
                  </div>
                  <div className={`p-2 rounded ${paymentTypes.length > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    <strong>Payment Types:</strong> {paymentTypes.length} loaded
                    {paymentTypes.length === 0 && <div className="text-xs">Configure in Master Settings → Payment Types</div>}
                  </div>
                </div>

                {/* Debug Information */}
                <details className="mt-3">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800">🔍 Debug Information</summary>
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
                    <div><strong>Occupations Sample:</strong> {occupations.slice(0, 2).map(o => o?.name || 'Unknown').join(', ') || 'None'}</div>
                    <div><strong>Packages Sample:</strong> {packages.slice(0, 2).map(p => p?.name || p?.duration_type || 'Unknown').join(', ') || 'None'}</div>
                    <div><strong>Payment Types Sample:</strong> {paymentTypes.slice(0, 2).map(pt => pt?.name || 'Unknown').join(', ') || 'None'}</div>
                    <div><strong>Selected Plan:</strong> {planType || 'None'}</div>
                  </div>
                </details>
              </div>
            </div>
          </div>

          {/* Fee Calculation Summary */}
          <div className="bg-muted/50 p-4 rounded-lg border">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Fee Calculation Summary:</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Registration Fee:</span>
                <span>₹{registrationFee || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Package Fee:</span>
                <span>₹{packageFee || 0}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-₹{discount || 0}</span>
              </div>

              {/* Show base amount before tax */}
              <div className="flex justify-between">
                <span>Base Amount:</span>
                <span>₹{Math.max(0, (registrationFee || 0) + (packageFee || 0) - (discount || 0))}</span>
              </div>

              <div className="flex justify-between font-semibold border-t pt-1">
                <span>Total Amount:</span>
                <span>₹{watch('membershipFees') || 0}</span>
              </div>
              <div className="flex justify-between text-blue-600">
                <span>Paid Amount:</span>
                <span>₹{paidAmount || 0}</span>
              </div>
              <div className={`flex justify-between font-semibold border-t pt-1 ${(watch('membershipFees') || 0) - (paidAmount || 0) > 0
                ? 'text-red-600'
                : 'text-green-600'
                }`}>
                <span>Due Amount:</span>
                <span>₹{Math.max(0, (watch('membershipFees') || 0) - (paidAmount || 0))}</span>
              </div>
            </div>
          </div>

          {/* Real-time Receipt Summary (for existing members) */}
          {initialData?.id && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-blue-800">Current Receipt Summary:</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-blue-600">
                    {realTimeAmounts.receiptCount} receipt(s)
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={loadRealTimeAmounts}
                    className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                    title="Refresh receipt data"
                  >
                    🔄
                  </Button>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Total Paid (from receipts):</span>
                  <span className="font-semibold text-blue-800">₹{realTimeAmounts.totalPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Outstanding Due:</span>
                  <span className={`font-semibold ${realTimeAmounts.totalDue > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                    ₹{realTimeAmounts.totalDue.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span className="text-blue-700">Total Amount (receipts):</span>
                  <span className="font-semibold text-blue-800">
                    ₹{(realTimeAmounts.totalPaid + realTimeAmounts.totalDue).toFixed(2)}
                  </span>
                </div>
              </div>
              {realTimeAmounts.totalDue > 0 && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  ⚠️ This member has outstanding dues from previous receipts
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="paidAmount">Paid Amount *</Label>
            <Input
              id="paidAmount"
              type="number"
              min="0"
              step="0.01"
              {...register('paidAmount', { valueAsNumber: true })}
              placeholder="Enter amount paid by member"
            />
            {errors.paidAmount && (
              <p className="text-sm text-destructive">{errors.paidAmount.message}</p>
            )}
            {initialData?.id && (
              <div className="text-xs space-y-1">
                <p className="text-blue-600">
                  💡 Current total from receipts: ₹{realTimeAmounts.totalPaid.toFixed(2)}
                  {Math.abs(realTimeAmounts.totalPaid - (paidAmount || 0)) > 0.01 && (
                    <span className="text-amber-600 ml-1">
                      (Form shows: ₹{(paidAmount || 0).toFixed(2)})
                    </span>
                  )}
                </p>
                {realTimeAmounts.totalDue > 0 && (
                  <p className="text-red-600">
                    ⚠️ Outstanding due from receipts: ₹{realTimeAmounts.totalDue.toFixed(2)}
                  </p>
                )}
                <p className="text-gray-600">
                  📋 Based on {realTimeAmounts.receiptCount} receipt(s)
                </p>
              </div>
            )}
          </div>



          <div className="space-y-2">
            <Label>Status *</Label>
            <Select
              onValueChange={(value) => setValue('status', value as 'active' | 'inactive' | 'frozen')}
              value={watch('status') || undefined}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="frozen">Frozen</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-destructive">{errors.status.message}</p>
            )}
          </div>
        </div>

        {/* Services Selection */}
        <div className="space-y-2">
          <Label>Services *</Label>
          <div className="grid grid-cols-3 gap-4">
            {serviceOptions.map((service) => (
              <div key={service.id} className="flex items-center space-x-2">
                <Checkbox
                  id={service.id}
                  checked={selectedServices.includes(service.id)}
                  onCheckedChange={(checked) => handleServiceChange(service.id, checked as boolean)}
                />
                <Label htmlFor={service.id} className="text-sm font-normal">
                  {service.label}
                </Label>
              </div>
            ))}
          </div>
          {errors.services && (
            <p className="text-sm text-destructive">{errors.services.message}</p>
          )}
        </div>
      </div>

      {/* Additional Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Additional Information</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="medicalIssues">Medical Issues</Label>
            <Textarea
              id="medicalIssues"
              {...register('medicalIssues')}
              placeholder="Enter any medical issues (optional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goals">Your Goals</Label>
            <Textarea
              id="goals"
              {...register('goals')}
              placeholder="Enter your fitness goals (optional)"
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit">
          {initialData ? 'Update Member' : 'Add Member'}
        </Button>
      </div>
    </form>
  );
};