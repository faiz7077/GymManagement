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
  Receipt,
  Percent,
  CheckCircle,
  XCircle
} from 'lucide-react';

// Types
interface MasterTaxSetting {
  id: number;
  name: string;
  tax_type: 'cgst' | 'sgst' | 'igst' | 'gst' | 'vat' | 'service_tax' | 'other';
  rate: number;
  is_inclusive: boolean;
  is_active: boolean;
  description?: string;
  created_at: string;
}

// Form schema
const taxSchema = z.object({
  name: z.string().min(1, 'Tax name is required'),
  tax_type: z.enum(['cgst', 'sgst', 'igst', 'gst', 'vat', 'service_tax', 'other']),
  rate: z.number().min(0, 'Rate must be positive').max(100, 'Rate cannot exceed 100%'),
  is_inclusive: z.boolean(),
  description: z.string().optional(),
});

type TaxFormData = z.infer<typeof taxSchema>;

// Tax type mapping
const TAX_TYPE_MAP = {
  cgst: { label: 'CGST', description: 'Central Goods and Services Tax' },
  sgst: { label: 'SGST', description: 'State Goods and Services Tax' },
  igst: { label: 'IGST', description: 'Integrated Goods and Services Tax' },
  gst: { label: 'GST', description: 'Goods and Services Tax' },
  vat: { label: 'VAT', description: 'Value Added Tax' },
  service_tax: { label: 'Service Tax', description: 'Service Tax' },
  other: { label: 'Other', description: 'Other Tax Type' }
};

export const TaxSettings: React.FC = () => {
  const [taxSettings, setTaxSettings] = useState<MasterTaxSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTax, setEditingTax] = useState<MasterTaxSetting | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TaxFormData>({
    resolver: zodResolver(taxSchema),
    defaultValues: {
      name: '',
      tax_type: 'gst',
      rate: 0,
      is_inclusive: false,
      description: '',
    }
  });

  // Load tax settings
  const loadTaxSettings = async () => {
    try {
      setLoading(true);
      const result = await db.masterTaxSettingsGetAll();
      if (result.success) {
        setTaxSettings(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to load tax settings');
      }
    } catch (error) {
      console.error('Error loading tax settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tax settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load tax settings on component mount
  useEffect(() => {
    loadTaxSettings();
  }, []);

  // Handle form submission
  const onSubmit = async (data: TaxFormData) => {
    try {
      setLoading(true);
      
      const taxData = {
        name: data.name,
        tax_type: data.tax_type,
        rate: data.rate,
        is_inclusive: data.is_inclusive,
        description: data.description || null,
        is_active: true
      };

      let result;
      if (editingTax) {
        result = await db.masterTaxSettingsUpdate(editingTax.id, taxData);
      } else {
        result = await db.masterTaxSettingsCreate(taxData);
      }

      if (result.success) {
        toast({
          title: 'Success',
          description: `Tax setting ${editingTax ? 'updated' : 'created'} successfully`,
        });
        reset();
        setEditingTax(null);
        setIsDialogOpen(false);
        await loadTaxSettings();
      } else {
        throw new Error(result.error || 'Failed to save tax setting');
      }
    } catch (error) {
      console.error('Error saving tax setting:', error);
      toast({
        title: 'Error',
        description: `Failed to ${editingTax ? 'update' : 'create'} tax setting`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (tax: MasterTaxSetting) => {
    setEditingTax(tax);
    setValue('name', tax.name);
    setValue('tax_type', tax.tax_type);
    setValue('rate', tax.rate);
    setValue('is_inclusive', tax.is_inclusive);
    setValue('description', tax.description || '');
    setIsDialogOpen(true);
  };

  // Handle toggle active status
  const handleToggleActive = async (tax: MasterTaxSetting) => {
    try {
      setLoading(true);
      const result = await db.masterTaxSettingsUpdate(tax.id, {
        name: tax.name,
        tax_type: tax.tax_type,
        percentage: tax.rate,  // Map 'rate' to 'percentage' for database
        is_inclusive: tax.is_inclusive,
        description: tax.description || null,
        is_active: !tax.is_active
      });
      
      if (result.success) {
        toast({
          title: 'Success',
          description: `Tax setting ${!tax.is_active ? 'activated' : 'deactivated'} successfully`,
        });
        await loadTaxSettings();
      } else {
        throw new Error(result.error || 'Failed to update tax setting status');
      }
    } catch (error) {
      console.error('Error toggling tax setting status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update tax setting status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle new tax setting
  const handleNewTax = () => {
    setEditingTax(null);
    reset();
    setIsDialogOpen(true);
  };

  const formatRate = (rate: number) => {
    return `${rate}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Tax Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure tax rates and types for receipts and invoices
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewTax} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Tax Setting
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                {editingTax ? 'Edit Tax Setting' : 'Add New Tax Setting'}
              </DialogTitle>
              <DialogDescription>
                {editingTax 
                  ? 'Update the tax setting details below.' 
                  : 'Create a new tax setting with rate and configuration.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tax Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="e.g., GST 18%, CGST 9%"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_type">Tax Type *</Label>
                <Select onValueChange={(value) => setValue('tax_type', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tax type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TAX_TYPE_MAP).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{config.label}</span>
                          <span className="text-xs text-muted-foreground">{config.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.tax_type && (
                  <p className="text-sm text-destructive">{errors.tax_type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate">Tax Rate (%) *</Label>
                <div className="relative">
                  <Input
                    id="rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    {...register('rate', { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                  <Percent className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>
                {errors.rate && (
                  <p className="text-sm text-destructive">{errors.rate.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="is_inclusive"
                  type="checkbox"
                  {...register('is_inclusive')}
                  className="h-4 w-4"
                />
                <Label htmlFor="is_inclusive" className="text-sm">
                  Tax Inclusive (tax is included in the price)
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Optional description or notes about this tax setting"
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
                  {loading ? 'Saving...' : (editingTax ? 'Update' : 'Create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tax Settings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Tax Settings ({taxSettings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading tax settings...</div>
          ) : taxSettings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tax settings configured yet.</p>
              <p className="text-sm">Add your first tax setting to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tax Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Application</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taxSettings.map((tax) => (
                  <TableRow key={tax.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{tax.name}</span>
                        {tax.description && (
                          <span className="text-xs text-muted-foreground">{tax.description}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {TAX_TYPE_MAP[tax.tax_type]?.label || tax.tax_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatRate(tax.rate)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tax.is_inclusive ? "default" : "secondary"}>
                        {tax.is_inclusive ? 'Inclusive' : 'Exclusive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={tax.is_active ? 'default' : 'secondary'}
                        className={tax.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                      >
                        {tax.is_active ? (
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
                          onClick={() => handleEdit(tax)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(tax)}
                          className={tax.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                        >
                          {tax.is_active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
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
        <Receipt className="h-4 w-4" />
        <AlertDescription>
          <strong>Integration:</strong> These tax settings will be available in receipt and invoice 
          generation. Inclusive taxes are calculated within the total amount, while exclusive taxes 
          are added on top. Deactivated tax settings won't appear in new forms but existing 
          records will retain their historical data.
        </AlertDescription>
      </Alert>
    </div>
  );
};
