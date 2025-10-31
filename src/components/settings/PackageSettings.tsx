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
  Trash2, 
  Eye, 
  EyeOff, 
  Package,
  IndianRupee,
  Calendar,
  CheckCircle,
  XCircle
} from 'lucide-react';

// Types
interface MasterPackage {
  id: number;
  name: string;
  duration_type: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly' | 'custom';
  duration_months: number;
  price: number;
  is_active: boolean;
  created_at: string;
}

// Form schema
const packageSchema = z.object({
  name: z.string().min(1, 'Package name is required'),
  duration_type: z.enum(['monthly', 'quarterly', 'half_yearly', 'yearly', 'custom']),
  duration_months: z.number().min(1, 'Duration must be at least 1 month'),
  price: z.number().min(0, 'Price must be positive'),
});

type PackageFormData = z.infer<typeof packageSchema>;

// Duration type mapping
const DURATION_TYPE_MAP = {
  monthly: { label: 'Monthly', months: 1 },
  quarterly: { label: 'Quarterly', months: 3 },
  half_yearly: { label: 'Half Yearly', months: 6 },
  yearly: { label: 'Yearly', months: 12 },
  custom: { label: 'Custom', months: 0 }
};

export const PackageSettings: React.FC = () => {
  const [packages, setPackages] = useState<MasterPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPackage, setEditingPackage] = useState<MasterPackage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PackageFormData>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      name: '',
      duration_type: 'monthly',
      duration_months: 1,
      price: 0,
    }
  });

  const durationType = watch('duration_type');

  // Load packages
  const loadPackages = async () => {
    try {
      setLoading(true);
      const result = await db.masterPackagesGetAll();
      if (result.success) {
        setPackages(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to load packages');
      }
    } catch (error) {
      console.error('Error loading packages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load packages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-set duration months when duration type changes
  useEffect(() => {
    if (durationType !== 'custom') {
      setValue('duration_months', DURATION_TYPE_MAP[durationType].months);
    }
  }, [durationType, setValue]);

  // Load packages on component mount
  useEffect(() => {
    loadPackages();
  }, []);

  // Handle form submission
  const onSubmit = async (data: PackageFormData) => {
    try {
      setLoading(true);
      
      const packageData = {
        name: data.name,
        duration_type: data.duration_type,
        duration_months: data.duration_months,
        price: data.price,
        is_active: true
      };

      let result;
      if (editingPackage) {
        result = await db.masterPackagesUpdate(editingPackage.id, packageData);
      } else {
        result = await db.masterPackagesCreate(packageData);
      }

      if (result.success) {
        toast({
          title: 'Success',
          description: `Package ${editingPackage ? 'updated' : 'created'} successfully`,
        });
        reset();
        setEditingPackage(null);
        setIsDialogOpen(false);
        await loadPackages();
      } else {
        throw new Error(result.error || 'Failed to save package');
      }
    } catch (error) {
      console.error('Error saving package:', error);
      toast({
        title: 'Error',
        description: `Failed to ${editingPackage ? 'update' : 'create'} package`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (pkg: MasterPackage) => {
    setEditingPackage(pkg);
    setValue('name', pkg.name);
    setValue('duration_type', pkg.duration_type);
    setValue('duration_months', pkg.duration_months);
    setValue('price', pkg.price);
    setIsDialogOpen(true);
  };

  // Handle delete (soft delete by setting is_active to false)
  const handleDelete = async (pkg: MasterPackage) => {
    if (window.confirm(`Are you sure you want to deactivate "${pkg.name}"?`)) {
      try {
        setLoading(true);
        const result = await db.masterPackagesDelete(pkg.id);
        if (result.success) {
          toast({
            title: 'Success',
            description: 'Package deactivated successfully',
          });
          await loadPackages();
        } else {
          throw new Error(result.error || 'Failed to deactivate package');
        }
      } catch (error) {
        console.error('Error deactivating package:', error);
        toast({
          title: 'Error',
          description: 'Failed to deactivate package',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle toggle active status
  const handleToggleActive = async (pkg: MasterPackage) => {
    try {
      setLoading(true);
      const result = await db.masterPackagesUpdate(pkg.id, {
        ...pkg,
        is_active: !pkg.is_active
      });
      
      if (result.success) {
        toast({
          title: 'Success',
          description: `Package ${!pkg.is_active ? 'activated' : 'deactivated'} successfully`,
        });
        await loadPackages();
      } else {
        throw new Error(result.error || 'Failed to update package status');
      }
    } catch (error) {
      console.error('Error toggling package status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update package status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle new package
  const handleNewPackage = () => {
    setEditingPackage(null);
    reset();
    setIsDialogOpen(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price);
  };

  const getDurationLabel = (pkg: MasterPackage) => {
    if (pkg.duration_type === 'custom') {
      return `${pkg.duration_months} month${pkg.duration_months > 1 ? 's' : ''}`;
    }
    return DURATION_TYPE_MAP[pkg.duration_type].label;
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Package Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage membership packages and their pricing
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewPackage} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Package
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {editingPackage ? 'Edit Package' : 'Add New Package'}
              </DialogTitle>
              <DialogDescription>
                {editingPackage 
                  ? 'Update the package details below.' 
                  : 'Create a new membership package with pricing and duration.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Package Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="e.g., Gold Membership, Basic Plan"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_type">Duration Type *</Label>
                <Select onValueChange={(value) => setValue('duration_type', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DURATION_TYPE_MAP).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {config.label} {config.months > 0 && `(${config.months} months)`}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.duration_type && (
                  <p className="text-sm text-destructive">{errors.duration_type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_months">
                  Duration (Months) *
                  {durationType !== 'custom' && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (Auto-set for selected type)
                    </span>
                  )}
                </Label>
                <Input
                  id="duration_months"
                  type="number"
                  min="1"
                  {...register('duration_months', { valueAsNumber: true })}
                  placeholder="Number of months"
                  disabled={durationType !== 'custom'}
                  className={durationType !== 'custom' ? 'bg-muted' : ''}
                />
                {errors.duration_months && (
                  <p className="text-sm text-destructive">{errors.duration_months.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Package Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('price', { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="text-sm text-destructive">{errors.price.message}</p>
                )}
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
                  {loading ? 'Saving...' : (editingPackage ? 'Update' : 'Create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Packages Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Available Packages ({packages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading packages...</div>
          ) : packages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No packages configured yet.</p>
              <p className="text-sm">Add your first membership package to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package Name</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Price per Month</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">{pkg.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{getDurationLabel(pkg)}</span>
                        <span className="text-xs text-muted-foreground">
                          {pkg.duration_months} month{pkg.duration_months > 1 ? 's' : ''}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatPrice(pkg.price)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatPrice(pkg.price / pkg.duration_months)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={pkg.is_active ? 'default' : 'secondary'}
                        className={pkg.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                      >
                        {pkg.is_active ? (
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
                          onClick={() => handleEdit(pkg)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(pkg)}
                          className={pkg.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                        >
                          {pkg.is_active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
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
        <Package className="h-4 w-4" />
        <AlertDescription>
          <strong>Integration:</strong> These packages will be available in member registration forms 
          and receipt creation. The pricing here serves as default values but can be overridden 
          in individual forms. Deactivated packages won't appear in new forms but existing 
          records will retain their historical data.
        </AlertDescription>
      </Alert>
    </div>
  );
};
