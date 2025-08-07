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
import { CalendarIcon, Upload, X, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { LegacyStaff } from '@/utils/database';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { compressImage, validateImageFile } from '@/utils/imageUtils';
import { useToast } from '@/hooks/use-toast';

const staffSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().length(10, 'Phone number must be exactly 10 digits').regex(/^\d{10}$/, 'Phone number must contain only digits'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  emergencyContact: z.string().min(2, 'Emergency contact name is required'),
  emergencyPhone: z.string().length(10, 'Emergency phone must be exactly 10 digits').regex(/^\d{10}$/, 'Emergency phone must contain only digits'),
  dateOfBirth: z.date({
    required_error: 'Date of birth is required',
  }),
  joiningDate: z.date({
    required_error: 'Joining date is required',
  }),
  role: z.enum(['trainer', 'receptionist', 'manager']),
  salary: z.number().min(0, 'Salary must be positive'),
  status: z.enum(['active', 'inactive']),
  profileImage: z.string().optional(),
  idCardImage: z.string().optional(),
  specialization: z.string().optional(),
  shift: z.string().optional(),
});

type StaffFormData = z.infer<typeof staffSchema>;

interface StaffFormProps {
  initialData?: LegacyStaff;
  onSubmit: (data: Omit<LegacyStaff, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const StaffForm: React.FC<StaffFormProps> = ({ initialData, onSubmit }) => {
  const [profileImage, setProfileImage] = useState<string | null>(initialData?.profileImage || null);
  const [idCardImage, setIdCardImage] = useState<string | null>(initialData?.idCardImage || null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingIdCard, setIsUploadingIdCard] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const idCardInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: initialData ? {
      ...initialData,
      dateOfBirth: new Date(initialData.dateOfBirth),
      joiningDate: new Date(initialData.joiningDate),
      profileImage: initialData.profileImage || '',
      idCardImage: initialData.idCardImage || '',
    } : {
      status: 'active',
      salary: 0,
      joiningDate: new Date(),
      profileImage: '',
      idCardImage: '',
    }
  });

  const dateOfBirth = watch('dateOfBirth');
  const joiningDate = watch('joiningDate');
  const role = watch('role');

  // Sync state with form values on initialization
  useEffect(() => {
    if (initialData?.profileImage) {
      setProfileImage(initialData.profileImage);
      setValue('profileImage', initialData.profileImage);
    }
    if (initialData?.idCardImage) {
      setIdCardImage(initialData.idCardImage);
      setValue('idCardImage', initialData.idCardImage);
    }
  }, [initialData, setValue]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      toast({
        title: "Invalid Profile Image",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploadingImage(true);
      const compressedImage = await compressImage(file, 400, 0.8);
      setProfileImage(compressedImage);
      setValue('profileImage', compressedImage);
      toast({
        title: "Profile Image Uploaded",
        description: "Profile photo has been successfully uploaded.",
      });
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to process profile image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleIdCardUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      toast({
        title: "Invalid ID Card Image",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploadingIdCard(true);
      const compressedImage = await compressImage(file, 400, 0.8);
      setIdCardImage(compressedImage);
      setValue('idCardImage', compressedImage);
      toast({
        title: "ID Card Image Uploaded",
        description: "Official ID card has been successfully uploaded.",
      });
    } catch (error) {
      console.error('Error processing ID card image:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to process ID card image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingIdCard(false);
    }
  };

  const removeImage = () => {
    setProfileImage(null);
    setValue('profileImage', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeIdCard = () => {
    setIdCardImage(null);
    setValue('idCardImage', '');
    if (idCardInputRef.current) {
      idCardInputRef.current.value = '';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const onFormSubmit = (data: StaffFormData) => {
    const currentProfileImage = profileImage || data.profileImage;
    const currentIdCardImage = idCardImage || data.idCardImage;
    
    if (!currentProfileImage || currentProfileImage.trim() === '') {
      toast({
        title: "Profile Image Required",
        description: "Please upload a profile photo before submitting the form.",
        variant: "destructive",
      });
      return;
    }
    
    if (!currentIdCardImage || currentIdCardImage.trim() === '') {
      toast({
        title: "ID Card Image Required",
        description: "Please upload an official ID card before submitting the form.",
        variant: "destructive",
      });
      return;
    }
    
    onSubmit({
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      emergencyContact: data.emergencyContact,
      emergencyPhone: data.emergencyPhone,
      dateOfBirth: data.dateOfBirth.toISOString(),
      joiningDate: data.joiningDate.toISOString(),
      role: data.role,
      salary: data.salary,
      status: data.status,
      profileImage: currentProfileImage,
      idCardImage: currentIdCardImage,
      specialization: data.specialization,
      shift: data.shift,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Profile Image and ID Card Upload */}
      <div className="grid grid-cols-2 gap-8">
        {/* Profile Image Upload */}
        <div className="flex flex-col items-center space-y-4">
          <h3 className="text-lg font-semibold">Profile Photo <span className="text-red-500">*</span></h3>
          <div className="relative">
            <div className={`rounded-full ${!profileImage ? 'ring-2 ring-red-300' : ''}`}>
              <Avatar className="h-24 w-24">
                <AvatarImage src={profileImage || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {watch('name') ? getInitials(watch('name')) : <User className="h-8 w-8" />}
                </AvatarFallback>
              </Avatar>
            </div>
            {profileImage && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                onClick={removeImage}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div className="flex flex-col items-center space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
              className="flex items-center space-x-2"
            >
              <Upload className="h-4 w-4" />
              <span>
                {isUploadingImage ? 'Processing...' : profileImage ? 'Change Photo' : 'Upload Photo'}
              </span>
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Max size: 10MB<br />Formats: JPG, PNG, GIF, WebP
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* ID Card Upload */}
        <div className="flex flex-col items-center space-y-4">
          <h3 className="text-lg font-semibold">Official ID Card <span className="text-red-500">*</span></h3>
          <div className="relative">
            <div className={`h-24 w-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-gray-50 ${!idCardImage ? 'border-red-300' : 'border-gray-300'}`}>
              {idCardImage ? (
                <img 
                  src={idCardImage} 
                  alt="ID Card" 
                  className="h-full w-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-center">
                  <User className="h-8 w-8 mx-auto text-red-400" />
                  <p className="text-xs text-red-500 mt-1">Required</p>
                </div>
              )}
            </div>
            {idCardImage && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                onClick={removeIdCard}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div className="flex flex-col items-center space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => idCardInputRef.current?.click()}
              disabled={isUploadingIdCard}
              className="flex items-center space-x-2"
            >
              <Upload className="h-4 w-4" />
              <span>
                {isUploadingIdCard ? 'Processing...' : idCardImage ? 'Change ID Card' : 'Upload ID Card'}
              </span>
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Max size: 10MB<br />Formats: JPG, PNG, GIF, WebP
            </p>
            <input
              ref={idCardInputRef}
              type="file"
              accept="image/*"
              onChange={handleIdCardUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
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
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            maxLength={10}
            {...register('phone')}
            placeholder="Enter 10-digit phone number"
            onInput={(e) => {
              const target = e.target as HTMLInputElement;
              target.value = target.value.replace(/\D/g, '').slice(0, 10);
            }}
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select 
            onValueChange={(value) => setValue('status', value as 'active' | 'inactive')}
            defaultValue={initialData?.status || 'active'}
            value={watch('status')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && (
            <p className="text-sm text-destructive">{errors.status.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address *</Label>
        <Input
          id="address"
          {...register('address')}
          placeholder="Enter full address"
        />
        {errors.address && (
          <p className="text-sm text-destructive">{errors.address.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="emergencyContact">Emergency Contact Name *</Label>
          <Input
            id="emergencyContact"
            {...register('emergencyContact')}
            placeholder="Enter emergency contact name"
          />
          {errors.emergencyContact && (
            <p className="text-sm text-destructive">{errors.emergencyContact.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="emergencyPhone">Emergency Phone *</Label>
          <Input
            id="emergencyPhone"
            type="tel"
            maxLength={10}
            {...register('emergencyPhone')}
            placeholder="Enter 10-digit emergency phone"
            onInput={(e) => {
              const target = e.target as HTMLInputElement;
              target.value = target.value.replace(/\D/g, '').slice(0, 10);
            }}
          />
          {errors.emergencyPhone && (
            <p className="text-sm text-destructive">{errors.emergencyPhone.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
          <Label>Joining Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !joiningDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {joiningDate ? format(joiningDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={joiningDate}
                onSelect={(date) => date && setValue('joiningDate', date)}
                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                initialFocus
                captionLayout="dropdown"
                fromYear={1900}
                toYear={new Date().getFullYear()}
              />
            </PopoverContent>
          </Popover>
          {errors.joiningDate && (
            <p className="text-sm text-destructive">{errors.joiningDate.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="role">Role *</Label>
          <Select 
            onValueChange={(value) => setValue('role', value as 'trainer' | 'receptionist' | 'manager')}
            defaultValue={initialData?.role}
            value={watch('role')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trainer">Trainer</SelectItem>
              <SelectItem value="receptionist">Receptionist</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
            </SelectContent>
          </Select>
          {errors.role && (
            <p className="text-sm text-destructive">{errors.role.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="salary">Salary ($) *</Label>
          <Input
            id="salary"
            type="number"
            min="0"
            step="0.01"
            {...register('salary', { valueAsNumber: true })}
            placeholder="Monthly salary"
          />
          {errors.salary && (
            <p className="text-sm text-destructive">{errors.salary.message}</p>
          )}
        </div>
      </div>

      {/* Role-specific fields */}
      {role === 'trainer' && (
        <div className="space-y-2">
          <Label htmlFor="specialization">Specialization</Label>
          <Input
            id="specialization"
            {...register('specialization')}
            placeholder="e.g., Weight Training, Cardio, Yoga"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="shift">Shift</Label>
        <Select 
          onValueChange={(value) => setValue('shift', value)}
          defaultValue={initialData?.shift}
          value={watch('shift')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select shift" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="morning">Morning (6 AM - 2 PM)</SelectItem>
            <SelectItem value="evening">Evening (2 PM - 10 PM)</SelectItem>
            <SelectItem value="night">Night (10 PM - 6 AM)</SelectItem>
            <SelectItem value="full-time">Full Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit">
          {initialData ? 'Update Staff' : 'Add Staff'}
        </Button>
      </div>
    </form>
  );
};