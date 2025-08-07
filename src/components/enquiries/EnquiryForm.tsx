import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { LegacyEnquiry, db } from '@/utils/database';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const enquirySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  telephoneNo: z.string().optional(),
  mobileNo: z.string().min(10, 'Mobile number must be at least 10 digits').regex(/^\d+$/, 'Mobile number must contain only digits'),
  occupation: z.string().min(2, 'Occupation is required'),
  sex: z.enum(['male', 'female']),
  refPersonName: z.string().optional(),
  dateOfEnquiry: z.union([
    z.date(),
    z.string().transform(str => new Date(str))
  ], {
    required_error: 'Date of enquiry is required',
  }),
  interestedIn: z.array(z.string()).min(1, 'At least one interest must be selected'),
  membershipFees: z.number().min(0, 'Membership fees must be positive').optional(),
  paymentMode: z.enum(['cash', 'cheque']),
  paymentFrequency: z.enum(['monthly', 'quarterly', 'half_yearly', 'yearly']),
  status: z.enum(['new', 'contacted', 'follow_up', 'converted', 'closed']),
  notes: z.string().optional(),
  followUpDate: z.union([z.date(), z.string().transform(str => str ? new Date(str) : undefined)]).optional(),
});

type EnquiryFormData = z.infer<typeof enquirySchema>;

interface EnquiryFormProps {
  initialData?: LegacyEnquiry;
  onSubmit: (data: Omit<LegacyEnquiry, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const interestOptions = [
  { id: 'aerobics', label: 'Aerobics' },
  { id: 'gym', label: 'GYM' },
  { id: 'slimming', label: 'Slimming' },
];

export const EnquiryForm: React.FC<EnquiryFormProps> = ({ initialData, onSubmit }) => {
  const [selectedInterests, setSelectedInterests] = useState<string[]>(initialData?.interestedIn || []);
  const [enquiryNumber, setEnquiryNumber] = useState<string>('');
  const { toast } = useToast();
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EnquiryFormData>({
    resolver: zodResolver(enquirySchema),
    defaultValues: initialData ? {
      name: initialData.name,
      address: initialData.address,
      telephoneNo: initialData.telephoneNo || '',
      mobileNo: initialData.mobileNo,
      occupation: initialData.occupation,
      sex: initialData.sex,
      refPersonName: initialData.refPersonName || '',
      dateOfEnquiry: new Date(initialData.dateOfEnquiry),
      interestedIn: initialData.interestedIn,
      membershipFees: initialData.membershipFees || 0,
      paymentMode: initialData.paymentMode,
      paymentFrequency: initialData.paymentFrequency,
      status: initialData.status,
      notes: initialData.notes || '',
      followUpDate: initialData.followUpDate ? new Date(initialData.followUpDate) : undefined,
    } : {
      name: '',
      address: '',
      telephoneNo: '',
      mobileNo: '',
      occupation: '',
      sex: 'male',
      refPersonName: '',
      dateOfEnquiry: new Date(),
      interestedIn: [],
      membershipFees: 0,
      paymentMode: 'cash',
      paymentFrequency: 'yearly',
      status: 'new',
      notes: '',
      followUpDate: undefined,
    }
  });

  const dateOfEnquiry = watch('dateOfEnquiry');
  const followUpDate = watch('followUpDate');
  const status = watch('status');

  useEffect(() => {
    const generateEnquiryNumber = async () => {
      if (!initialData) {
        try {
          const number = await db.generateEnquiryNumber();
          setEnquiryNumber(number);
        } catch (error) {
          console.error('Error generating enquiry number:', error);
        }
      } else {
        setEnquiryNumber(initialData.enquiryNumber || '');
      }
    };

    generateEnquiryNumber();
  }, [initialData]);

  useEffect(() => {
    if (initialData?.interestedIn) {
      setSelectedInterests(initialData.interestedIn);
      setValue('interestedIn', initialData.interestedIn);
    }
  }, [initialData, setValue]);

  const handleInterestChange = (interestId: string, checked: boolean) => {
    let updatedInterests;
    if (checked) {
      updatedInterests = [...selectedInterests, interestId];
    } else {
      updatedInterests = selectedInterests.filter(id => id !== interestId);
    }
    setSelectedInterests(updatedInterests);
    setValue('interestedIn', updatedInterests);
  };

  const onFormSubmit = (data: EnquiryFormData) => {
    console.log('Enquiry form data being submitted:', data);

    onSubmit({
      enquiryNumber: enquiryNumber,
      name: data.name,
      address: data.address,
      telephoneNo: data.telephoneNo,
      mobileNo: data.mobileNo,
      occupation: data.occupation,
      sex: data.sex,
      refPersonName: data.refPersonName,
      dateOfEnquiry: data.dateOfEnquiry instanceof Date ? data.dateOfEnquiry.toISOString() : data.dateOfEnquiry,
      interestedIn: selectedInterests,
      membershipFees: data.membershipFees,
      paymentMode: data.paymentMode,
      paymentFrequency: data.paymentFrequency,
      status: data.status,
      notes: data.notes,
      followUpDate: data.followUpDate ? (data.followUpDate instanceof Date ? data.followUpDate.toISOString() : data.followUpDate) : undefined,
      convertedToMemberId: initialData?.convertedToMemberId,
      createdBy: user?.name || 'System',
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Enquiry Number */}
      <div className="space-y-2">
        <Label htmlFor="enquiryNumber">Enquiry Number</Label>
        <Input
          id="enquiryNumber"
          value={enquiryNumber}
          disabled
          className="bg-muted"
        />
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter full name"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
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
            <Label htmlFor="refPersonName">Reference Person Name</Label>
            <Input
              id="refPersonName"
              {...register('refPersonName')}
              placeholder="Enter reference person name (optional)"
            />
          </div>
        </div>
      </div>

      {/* Enquiry Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Enquiry Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Date of Enquiry *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateOfEnquiry && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateOfEnquiry ? format(dateOfEnquiry, "PPP") : "Pick enquiry date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateOfEnquiry}
                  onSelect={(date) => date && setValue('dateOfEnquiry', date)}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.dateOfEnquiry && (
              <p className="text-sm text-destructive">{errors.dateOfEnquiry.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="membershipFees">Membership Fees (One Year Non Refundable)</Label>
            <Input
              id="membershipFees"
              type="number"
              min="0"
              step="0.01"
              {...register('membershipFees', { valueAsNumber: true })}
              placeholder="Enter membership fees"
            />
            {errors.membershipFees && (
              <p className="text-sm text-destructive">{errors.membershipFees.message}</p>
            )}
          </div>
        </div>

        {/* Interested In */}
        <div className="space-y-2">
          <Label>Interested In *</Label>
          <div className="flex flex-wrap gap-4">
            {interestOptions.map((interest) => (
              <div key={interest.id} className="flex items-center space-x-2">
                <Checkbox
                  id={interest.id}
                  checked={selectedInterests.includes(interest.id)}
                  onCheckedChange={(checked) => handleInterestChange(interest.id, checked as boolean)}
                />
                <Label htmlFor={interest.id} className="text-sm font-normal">
                  {interest.label}
                </Label>
              </div>
            ))}
          </div>
          {errors.interestedIn && (
            <p className="text-sm text-destructive">{errors.interestedIn.message}</p>
          )}
        </div>

        {/* Payment Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Mode of Payment *</Label>
            <Select onValueChange={(value) => setValue('paymentMode', value as 'cash' | 'cheque')}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
            {errors.paymentMode && (
              <p className="text-sm text-destructive">{errors.paymentMode.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Payment Frequency *</Label>
            <Select onValueChange={(value) => setValue('paymentFrequency', value as 'monthly' | 'quarterly' | 'half_yearly' | 'yearly')}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="half_yearly">Half Yearly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            {errors.paymentFrequency && (
              <p className="text-sm text-destructive">{errors.paymentFrequency.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Status and Follow-up */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Status & Follow-up</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Status *</Label>
            <Select onValueChange={(value) => setValue('status', value as 'new' | 'contacted' | 'follow_up' | 'converted' | 'closed')}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="follow_up">Follow-up</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-destructive">{errors.status.message}</p>
            )}
          </div>

          {(status === 'follow_up' || status === 'contacted') && (
            <div className="space-y-2">
              <Label>Follow-up Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !followUpDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {followUpDate ? format(followUpDate, "PPP") : "Pick follow-up date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={followUpDate}
                    onSelect={(date) => setValue('followUpDate', date)}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            {...register('notes')}
            placeholder="Enter any additional notes or comments"
            rows={4}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" className="px-8">
          {initialData ? 'Update Enquiry' : 'Create Enquiry'}
        </Button>
      </div>
    </form>
  );
};