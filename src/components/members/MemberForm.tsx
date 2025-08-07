import React, { useState, useRef, useEffect } from 'react';
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
import { CalendarIcon, Upload, X, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { LegacyMember, LegacyEnquiry, db } from '@/utils/database';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { compressImage, validateImageFile } from '@/utils/imageUtils';
import { useToast } from '@/hooks/use-toast';
import { calculateSubscriptionEndDate, getPlanDurationInMonths, formatDateForDatabase } from '@/utils/dateUtils';

const memberSchema = z.object({
  customMemberId: z.string().nullable().optional().transform(val => val || undefined),
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
  planType: z.enum(['monthly', 'quarterly', 'half_yearly', 'yearly']),
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
  onSubmit: (data: Omit<LegacyMember, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const serviceOptions = [
  { id: 'gym', label: 'Gym' },
  { id: 'yoga', label: 'Yoga' },
  { id: 'aerobics', label: 'Aerobics' },
  { id: 'slimming', label: 'Slimming' },
  { id: 'combopack', label: 'Combo Pack' },
];

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const MemberForm: React.FC<MemberFormProps> = ({ initialData, enquiryData, onSubmit }) => {
  const [memberImage, setMemberImage] = useState<string | null>(initialData?.memberImage || null);
  const [idProofImage, setIdProofImage] = useState<string | null>(initialData?.idProofImage || null);
  const [isUploadingMemberImage, setIsUploadingMemberImage] = useState(false);
  const [isUploadingIdProof, setIsUploadingIdProof] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>(initialData?.services || []);
  const [realTimeAmounts, setRealTimeAmounts] = useState<{
    totalPaid: number;
    totalDue: number;
    receiptCount: number;
  }>({ totalPaid: 0, totalDue: 0, receiptCount: 0 });
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

  // Load real-time amounts from receipts
  const loadRealTimeAmounts = async () => {
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
  };

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

  // Load real-time amounts when component mounts or initialData changes
  useEffect(() => {
    loadRealTimeAmounts();
  }, [initialData?.id]);

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

  // Auto-calculate total fees from fee structure
  useEffect(() => {
    if (registrationFee !== undefined || packageFee !== undefined || discount !== undefined) {
      const totalFees = (registrationFee || 0) + (packageFee || 0) - (discount || 0);
      setValue('membershipFees', Math.max(0, totalFees));
    }
  }, [registrationFee, packageFee, discount, setValue]);

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

  const onFormSubmit = (data: MemberFormData) => {
    console.log('Form data being submitted:', data);

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
            <Label htmlFor="customMemberId">Custom Member ID</Label>
            <Input
              id="customMemberId"
              {...register('customMemberId')}
              placeholder="Enter custom member ID (optional)"
            />
            {errors.customMemberId && (
              <p className="text-sm text-destructive">{errors.customMemberId.message}</p>
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
            <Input
              id="occupation"
              {...register('occupation')}
              placeholder="Enter occupation"
            />
            {errors.occupation && (
              <p className="text-sm text-destructive">{errors.occupation.message}</p>
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
            <Select onValueChange={(value) => setValue('sex', value as 'male' | 'female')}>
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
            <Select onValueChange={(value) => setValue('maritalStatus', value as 'married' | 'unmarried')}>
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
            <Select onValueChange={(value) => setValue('bloodGroup', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select blood group (optional)" />
              </SelectTrigger>
              <SelectContent>
                {bloodGroups.map((group) => (
                  <SelectItem key={group} value={group}>{group}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Membership Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Membership Details</h3>
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
            <Select onValueChange={(value) => setValue('paymentMode', value as 'cash' | 'upi' | 'bank_transfer')}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
            {errors.paymentMode && (
              <p className="text-sm text-destructive">{errors.paymentMode.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Plan Type *</Label>
            <Select onValueChange={(value) => setValue('planType', value as 'monthly' | 'quarterly' | 'half_yearly' | 'yearly')}>
              <SelectTrigger>
                <SelectValue placeholder="Select plan type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="half_yearly">Half Yearly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            {errors.planType && (
              <p className="text-sm text-destructive">{errors.planType.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="registrationFee">Registration Fee *</Label>
              <Input
                id="registrationFee"
                type="number"
                min="0"
                step="0.01"
                {...register('registrationFee', { valueAsNumber: true })}
                placeholder="Enter registration fee"
              />
              {errors.registrationFee && (
                <p className="text-sm text-destructive">{errors.registrationFee.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="packageFee">Package Fee *</Label>
              <Input
                id="packageFee"
                type="number"
                min="0"
                step="0.01"
                {...register('packageFee', { valueAsNumber: true })}
                placeholder="Enter package fee"
              />
              {errors.packageFee && (
                <p className="text-sm text-destructive">{errors.packageFee.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount">Discount Money</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                step="0.01"
                {...register('discount', { valueAsNumber: true })}
                placeholder="Enter discount"
              />
              {errors.discount && (
                <p className="text-sm text-destructive">{errors.discount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="membershipFees">
                Total Fees *
                <span className="text-xs text-muted-foreground ml-2">
                  (Auto-calculated: Registration + Package - Discount)
                </span>
              </Label>
              <Input
                id="membershipFees"
                type="number"
                min="0"
                step="0.01"
                {...register('membershipFees', { valueAsNumber: true })}
                placeholder="Auto-calculated from above fees"
                className="bg-muted"
                readOnly
              />
              {errors.membershipFees && (
                <p className="text-sm text-destructive">{errors.membershipFees.message}</p>
              )}
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
              <div className="flex justify-between font-semibold border-t pt-1">
                <span>Total Amount:</span>
                <span>₹{Math.max(0, (registrationFee || 0) + (packageFee || 0) - (discount || 0))}</span>
              </div>
              <div className="flex justify-between text-blue-600">
                <span>Paid Amount:</span>
                <span>₹{paidAmount || 0}</span>
              </div>
              <div className={`flex justify-between font-semibold border-t pt-1 ${
                Math.max(0, (registrationFee || 0) + (packageFee || 0) - (discount || 0)) - (paidAmount || 0) > 0 
                  ? 'text-red-600' 
                  : 'text-green-600'
              }`}>
                <span>Due Amount:</span>
                <span>₹{Math.max(0, Math.max(0, (registrationFee || 0) + (packageFee || 0) - (discount || 0)) - (paidAmount || 0))}</span>
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
                  <span className={`font-semibold ${
                    realTimeAmounts.totalDue > 0 ? 'text-red-600' : 'text-green-600'
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
            <Select onValueChange={(value) => setValue('status', value as 'active' | 'inactive' | 'frozen')}>
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