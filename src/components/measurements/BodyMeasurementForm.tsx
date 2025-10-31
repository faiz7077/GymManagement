import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale, Ruler, Activity, Calendar } from 'lucide-react';
import { LegacyMember, db } from '@/utils/database';
import { calculateBMI, getBMICategory, getBMIBadgeColor, calculateBMR } from '@/utils/bmiUtils';

const bodyMeasurementSchema = z.object({
  memberId: z.string().min(1, 'Please select a member'),
  measurementDate: z.string().min(1, 'Please select measurement date'),
  weight: z.number().min(20, 'Weight must be at least 20 kg').max(300, 'Weight must be less than 300 kg'),
  height: z.number().min(100, 'Height must be at least 100 cm').max(250, 'Height must be less than 250 cm'),
  age: z.number().min(10, 'Age must be at least 10').max(100, 'Age must be less than 100'),
  neck: z.number().min(0).max(100).optional(),
  chest: z.number().min(0).max(200).optional(),
  arms: z.number().min(0).max(100).optional(),
  foreArms: z.number().min(0).max(100).optional(),
  wrist: z.number().min(0).max(50).optional(),
  tummy: z.number().min(0).max(200).optional(),
  waist: z.number().min(0).max(200).optional(),
  hips: z.number().min(0).max(200).optional(),
  thighs: z.number().min(0).max(100).optional(),
  calf: z.number().min(0).max(100).optional(),
  fatPercentage: z.number().min(0).max(100).optional(),
  vf: z.number().min(0).max(50).optional(),
  notes: z.string().optional(),
});

type BodyMeasurementFormData = z.infer<typeof bodyMeasurementSchema>;

interface BodyMeasurementFormProps {
  onSubmit: (data: BodyMeasurementFormData) => void;
  onCancel: () => void;
  initialData?: any;
  isEdit?: boolean;
  prefilledMember?: {
    id: string;
    name: string;
    height?: number;
    weight?: number;
  };
}

export const BodyMeasurementForm: React.FC<BodyMeasurementFormProps> = ({ 
  onSubmit, 
  onCancel, 
  initialData,
  isEdit = false,
  prefilledMember
}) => {
  const [members, setMembers] = useState<LegacyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<LegacyMember | null>(null);
  const [calculatedBMI, setCalculatedBMI] = useState<number | null>(null);
  const [calculatedBMR, setCalculatedBMR] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BodyMeasurementFormData>({
    resolver: zodResolver(bodyMeasurementSchema),
    defaultValues: initialData ? {
      memberId: initialData.member_id,
      measurementDate: initialData.measurement_date?.split('T')[0],
      weight: initialData.weight,
      height: initialData.height,
      age: initialData.age,
      neck: initialData.neck,
      chest: initialData.chest,
      arms: initialData.arms,
      foreArms: initialData.fore_arms,
      wrist: initialData.wrist,
      tummy: initialData.tummy,
      waist: initialData.waist,
      hips: initialData.hips,
      thighs: initialData.thighs,
      calf: initialData.calf,
      fatPercentage: initialData.fat_percentage,
      vf: initialData.vf,
      notes: initialData.notes,
    } : prefilledMember ? {
      memberId: prefilledMember.id,
      measurementDate: new Date().toISOString().split('T')[0],
      weight: prefilledMember.weight || undefined,
      height: prefilledMember.height || undefined,
    } : {
      measurementDate: new Date().toISOString().split('T')[0]
    }
  });

  const watchedWeight = watch('weight');
  const watchedHeight = watch('height');
  const watchedAge = watch('age');
  const watchedMemberId = watch('memberId');

  useEffect(() => {
    const loadMembers = async () => {
      const allMembers = await db.getAllMembers();
      setMembers(allMembers.filter(m => m.status === 'active'));
    };
    loadMembers();
  }, []);

  useEffect(() => {
    if (watchedMemberId) {
      const member = members.find(m => m.id === watchedMemberId);
      setSelectedMember(member || null);
      
      // Pre-fill with existing data if available and not editing
      if (member && !isEdit) {
        if (member.height) setValue('height', member.height);
        if (member.weight) setValue('weight', member.weight);
        // Calculate age from date of birth if available
        if (member.dateOfBirth) {
          const birthDate = new Date(member.dateOfBirth);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          setValue('age', age);
        }
      }
    }
  }, [watchedMemberId, members, setValue, isEdit]);

  useEffect(() => {
    if (watchedWeight && watchedHeight) {
      const bmi = calculateBMI(watchedWeight, watchedHeight);
      setCalculatedBMI(bmi);
      
      // Calculate BMR if we have age and gender
      if (watchedAge && selectedMember) {
        const bmr = calculateBMR(watchedWeight, watchedHeight, watchedAge, selectedMember.sex);
        setCalculatedBMR(bmr);
      }
    } else {
      setCalculatedBMI(null);
      setCalculatedBMR(null);
    }
  }, [watchedWeight, watchedHeight, watchedAge, selectedMember]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleFormSubmit = (data: BodyMeasurementFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Member Selection */}
      <div className="space-y-2">
        <Label htmlFor="memberId">Select Member *</Label>
        <Select 
          onValueChange={(value) => setValue('memberId', value)}
          defaultValue={initialData?.member_id}
          disabled={isEdit}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a member..." />
          </SelectTrigger>
          <SelectContent>
            {members.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={member.profileImage || undefined} className="object-cover" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{member.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.memberId && (
          <p className="text-sm text-destructive">{errors.memberId.message}</p>
        )}
      </div>

      {/* Measurement Date */}
      <div className="space-y-2">
        <Label htmlFor="measurementDate">Measurement Date *</Label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="measurementDate"
            type="date"
            className="pl-10"
            {...register('measurementDate')}
          />
        </div>
        {errors.measurementDate && (
          <p className="text-sm text-destructive">{errors.measurementDate.message}</p>
        )}
      </div>

      {/* Selected Member Info */}
      {selectedMember && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Member Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={selectedMember.profileImage || undefined} className="object-cover" />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {getInitials(selectedMember.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{selectedMember.name}</h3>
                <p className="text-muted-foreground">{selectedMember.email}</p>
                <p className="text-sm text-muted-foreground">Gender: {selectedMember.sex}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Measurements */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Measurements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm) *</Label>
              <div className="relative">
                <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  placeholder="170"
                  className="pl-10"
                  {...register('height', { valueAsNumber: true })}
                />
              </div>
              {errors.height && (
                <p className="text-sm text-destructive">{errors.height.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg) *</Label>
              <div className="relative">
                <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="70"
                  className="pl-10"
                  {...register('weight', { valueAsNumber: true })}
                />
              </div>
              {errors.weight && (
                <p className="text-sm text-destructive">{errors.weight.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age *</Label>
              <Input
                id="age"
                type="number"
                placeholder="25"
                {...register('age', { valueAsNumber: true })}
              />
              {errors.age && (
                <p className="text-sm text-destructive">{errors.age.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fatPercentage">Fat % (Optional)</Label>
              <Input
                id="fatPercentage"
                type="number"
                step="0.1"
                placeholder="15.0"
                {...register('fatPercentage', { valueAsNumber: true })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BMI & BMR Display */}
      {(calculatedBMI || calculatedBMR) && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              {calculatedBMI && (
                <div className="flex items-center justify-center space-x-4">
                  <Activity className="h-8 w-8 text-purple-600" />
                  <div className="text-center">
                    <p className="text-2xl font-bold">{calculatedBMI}</p>
                    <p className="text-sm text-muted-foreground">BMI</p>
                    <div className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getBMIBadgeColor(calculatedBMI)}`}>
                      {getBMICategory(calculatedBMI)}
                    </div>
                  </div>
                </div>
              )}
              {calculatedBMR && (
                <div className="flex items-center justify-center space-x-4">
                  <Activity className="h-8 w-8 text-green-600" />
                  <div className="text-center">
                    <p className="text-2xl font-bold">{calculatedBMR}</p>
                    <p className="text-sm text-muted-foreground">BMR (kcal/day)</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Physical Measurements */}
      <Card>
        <CardHeader>
          <CardTitle>Physical Measurements (cm) - Optional</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="neck">Neck</Label>
              <Input
                id="neck"
                type="number"
                step="0.1"
                placeholder="35"
                {...register('neck', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chest">Chest</Label>
              <Input
                id="chest"
                type="number"
                step="0.1"
                placeholder="100"
                {...register('chest', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="arms">Arms</Label>
              <Input
                id="arms"
                type="number"
                step="0.1"
                placeholder="35"
                {...register('arms', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="foreArms">Fore Arms</Label>
              <Input
                id="foreArms"
                type="number"
                step="0.1"
                placeholder="28"
                {...register('foreArms', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wrist">Wrist</Label>
              <Input
                id="wrist"
                type="number"
                step="0.1"
                placeholder="17"
                {...register('wrist', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tummy">Tummy</Label>
              <Input
                id="tummy"
                type="number"
                step="0.1"
                placeholder="85"
                {...register('tummy', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="waist">Waist</Label>
              <Input
                id="waist"
                type="number"
                step="0.1"
                placeholder="80"
                {...register('waist', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hips">Hips</Label>
              <Input
                id="hips"
                type="number"
                step="0.1"
                placeholder="95"
                {...register('hips', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="thighs">Thighs</Label>
              <Input
                id="thighs"
                type="number"
                step="0.1"
                placeholder="55"
                {...register('thighs', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="calf">Calf</Label>
              <Input
                id="calf"
                type="number"
                step="0.1"
                placeholder="35"
                {...register('calf', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vf">VF (Visceral Fat)</Label>
              <Input
                id="vf"
                type="number"
                step="0.1"
                placeholder="5"
                {...register('vf', { valueAsNumber: true })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Additional notes about the measurement session..."
          rows={3}
          {...register('notes')}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Measurement' : 'Save Measurement'}
        </Button>
      </div>
    </form>
  );
};