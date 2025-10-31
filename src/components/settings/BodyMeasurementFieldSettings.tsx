import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/utils/database';
import { 
  Plus, 
  Edit, 
  Eye, 
  EyeOff, 
  Activity,
  CheckCircle,
  XCircle
} from 'lucide-react';

// Types
interface MasterBodyMeasurementField {
  id: number;
  field_name: string;
  display_name: string;
  unit: string;
  data_type: 'number' | 'text' | 'decimal';
  is_required: boolean;
  is_active: boolean;
  description?: string;
  created_at: string;
}

// Form schema
const bodyMeasurementFieldSchema = z.object({
  field_name: z.string().min(1, 'Field name is required').regex(/^[a-z_]+$/, 'Field name must be lowercase with underscores only'),
  display_name: z.string().min(1, 'Display name is required'),
  unit: z.string().min(1, 'Unit is required'),
  data_type: z.enum(['number', 'text', 'decimal']),
  is_required: z.boolean(),
  description: z.string().optional(),
});

type BodyMeasurementFieldFormData = z.infer<typeof bodyMeasurementFieldSchema>;

// Data type mapping
const DATA_TYPE_MAP = {
  number: { label: 'Number (Integer)', description: 'Whole numbers only (e.g., 75, 180)' },
  decimal: { label: 'Decimal', description: 'Numbers with decimal places (e.g., 75.5, 180.2)' },
  text: { label: 'Text', description: 'Text values (e.g., measurements notes)' }
};

// Common measurement fields for suggestions
const COMMON_FIELDS = [
  { field_name: 'weight', display_name: 'Weight', unit: 'kg', data_type: 'decimal' },
  { field_name: 'height', display_name: 'Height', unit: 'cm', data_type: 'number' },
  { field_name: 'chest', display_name: 'Chest', unit: 'cm', data_type: 'decimal' },
  { field_name: 'waist', display_name: 'Waist', unit: 'cm', data_type: 'decimal' },
  { field_name: 'hips', display_name: 'Hips', unit: 'cm', data_type: 'decimal' },
  { field_name: 'biceps', display_name: 'Biceps', unit: 'cm', data_type: 'decimal' },
  { field_name: 'thighs', display_name: 'Thighs', unit: 'cm', data_type: 'decimal' },
  { field_name: 'body_fat', display_name: 'Body Fat %', unit: '%', data_type: 'decimal' },
  { field_name: 'muscle_mass', display_name: 'Muscle Mass', unit: 'kg', data_type: 'decimal' },
];

export const BodyMeasurementFieldSettings: React.FC = () => {
  const [fields, setFields] = useState<MasterBodyMeasurementField[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingField, setEditingField] = useState<MasterBodyMeasurementField | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BodyMeasurementFieldFormData>({
    resolver: zodResolver(bodyMeasurementFieldSchema),
    defaultValues: {
      field_name: '',
      display_name: '',
      unit: '',
      data_type: 'decimal',
      is_required: false,
      description: '',
    }
  });

  const fieldName = watch('field_name');

  // Load body measurement fields
  const loadFields = async () => {
    try {
      setLoading(true);
      const result = await db.masterBodyMeasurementFieldsGetAll();
      if (result.success) {
        setFields(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to load body measurement fields');
      }
    } catch (error) {
      console.error('Error loading body measurement fields:', error);
      toast({
        title: 'Error',
        description: 'Failed to load body measurement fields',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load fields on component mount
  useEffect(() => {
    loadFields();
  }, []);

  // Auto-generate display name from field name
  useEffect(() => {
    if (fieldName && !editingField) {
      const displayName = fieldName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      setValue('display_name', displayName);
    }
  }, [fieldName, setValue, editingField]);

  // Handle form submission
  const onSubmit = async (data: BodyMeasurementFieldFormData) => {
    try {
      setLoading(true);
      
      const fieldData = {
        field_name: data.field_name,
        display_name: data.display_name,
        unit: data.unit,
        data_type: data.data_type,
        is_required: data.is_required,
        description: data.description || null,
        is_active: true
      };

      let result;
      if (editingField) {
        result = await db.masterBodyMeasurementFieldsUpdate(editingField.id, fieldData);
      } else {
        result = await db.masterBodyMeasurementFieldsCreate(fieldData);
      }

      if (result.success) {
        toast({
          title: 'Success',
          description: `Body measurement field ${editingField ? 'updated' : 'created'} successfully`,
        });
        reset();
        setEditingField(null);
        setIsDialogOpen(false);
        await loadFields();
      } else {
        throw new Error(result.error || 'Failed to save body measurement field');
      }
    } catch (error) {
      console.error('Error saving body measurement field:', error);
      toast({
        title: 'Error',
        description: `Failed to ${editingField ? 'update' : 'create'} body measurement field`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (field: MasterBodyMeasurementField) => {
    setEditingField(field);
    setValue('field_name', field.field_name);
    setValue('display_name', field.display_name);
    setValue('unit', field.unit);
    setValue('data_type', field.data_type);
    setValue('is_required', field.is_required);
    setValue('description', field.description || '');
    setIsDialogOpen(true);
  };

  // Handle toggle active status
  const handleToggleActive = async (field: MasterBodyMeasurementField) => {
    try {
      setLoading(true);
      const result = await db.masterBodyMeasurementFieldsUpdate(field.id, {
        ...field,
        is_active: !field.is_active
      });
      
      if (result.success) {
        toast({
          title: 'Success',
          description: `Field ${!field.is_active ? 'activated' : 'deactivated'} successfully`,
        });
        await loadFields();
      } else {
        throw new Error(result.error || 'Failed to update field status');
      }
    } catch (error) {
      console.error('Error toggling field status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update field status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle new field
  const handleNewField = () => {
    setEditingField(null);
    reset();
    setIsDialogOpen(true);
  };

  // Handle common field selection
  const handleCommonFieldSelect = (commonField: typeof COMMON_FIELDS[0]) => {
    setValue('field_name', commonField.field_name);
    setValue('display_name', commonField.display_name);
    setValue('unit', commonField.unit);
    setValue('data_type', commonField.data_type as any);
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Body Measurement Fields</h3>
          <p className="text-sm text-muted-foreground">
            Define custom fields for body measurements tracking
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewField} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Field
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                {editingField ? 'Edit Body Measurement Field' : 'Add New Body Measurement Field'}
              </DialogTitle>
              <DialogDescription>
                {editingField 
                  ? 'Update the field details below.' 
                  : 'Create a new custom field for body measurements tracking.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Common Fields Quick Select */}
              {!editingField && (
                <div className="space-y-2">
                  <Label>Quick Select Common Fields</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {COMMON_FIELDS.slice(0, 6).map((field) => (
                      <Button
                        key={field.field_name}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleCommonFieldSelect(field)}
                        className="text-xs"
                      >
                        {field.display_name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="field_name">Field Name (Database) *</Label>
                  <Input
                    id="field_name"
                    {...register('field_name')}
                    placeholder="e.g., body_weight, chest_size"
                    className="font-mono text-sm"
                  />
                  {errors.field_name && (
                    <p className="text-sm text-destructive">{errors.field_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name *</Label>
                  <Input
                    id="display_name"
                    {...register('display_name')}
                    placeholder="e.g., Body Weight, Chest Size"
                  />
                  {errors.display_name && (
                    <p className="text-sm text-destructive">{errors.display_name.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit *</Label>
                  <Input
                    id="unit"
                    {...register('unit')}
                    placeholder="e.g., kg, cm, %, inches"
                  />
                  {errors.unit && (
                    <p className="text-sm text-destructive">{errors.unit.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_type">Data Type *</Label>
                  <Select onValueChange={(value) => setValue('data_type', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select data type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DATA_TYPE_MAP).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{config.label}</span>
                            <span className="text-xs text-muted-foreground">{config.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.data_type && (
                    <p className="text-sm text-destructive">{errors.data_type.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="is_required"
                  type="checkbox"
                  {...register('is_required')}
                  className="h-4 w-4"
                />
                <Label htmlFor="is_required" className="text-sm">
                  Required field (must be filled in measurement forms)
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Optional description or instructions for this measurement field"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : (editingField ? 'Update' : 'Create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Fields Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Body Measurement Fields ({fields.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading body measurement fields...</div>
          ) : fields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No body measurement fields configured yet.</p>
              <p className="text-sm">Add your first measurement field to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field Name</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {field.field_name}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{field.display_name}</span>
                        {field.description && (
                          <span className="text-xs text-muted-foreground">{field.description}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{field.unit}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {DATA_TYPE_MAP[field.data_type]?.label || field.data_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {field.is_required ? (
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Optional</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={field.is_active ? 'default' : 'secondary'}
                        className={field.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                      >
                        {field.is_active ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(field)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(field)}
                          className={field.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                        >
                          {field.is_active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Usage Info */}
      <Alert>
        <Activity className="h-4 w-4" />
        <AlertDescription>
          <strong>Integration:</strong> These custom fields will be available in body measurement 
          forms for member tracking. Required fields must be filled, while optional fields can be 
          left blank. Field names should use lowercase letters and underscores only (database format). 
          Deactivated fields won't appear in new forms but existing measurements will retain their data.
        </AlertDescription>
      </Alert>
    </div>
  );
};
