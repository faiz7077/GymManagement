import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  CreditCard,
  CheckCircle,
  XCircle
} from 'lucide-react';

// Types
interface MasterPaymentType {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

// Form schema
const paymentTypeSchema = z.object({
  name: z.string().min(1, 'Payment type name is required'),
  description: z.string().optional(),
});

type PaymentTypeFormData = z.infer<typeof paymentTypeSchema>;

export const PaymentTypeSettings: React.FC = () => {
  const [paymentTypes, setPaymentTypes] = useState<MasterPaymentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPaymentType, setEditingPaymentType] = useState<MasterPaymentType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PaymentTypeFormData>({
    resolver: zodResolver(paymentTypeSchema),
    defaultValues: {
      name: '',
      description: '',
    }
  });

  // Load payment types
  const loadPaymentTypes = async () => {
    try {
      setLoading(true);
      const result = await db.masterPaymentTypesGetAll();
      if (result.success) {
        setPaymentTypes(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to load payment types');
      }
    } catch (error) {
      console.error('Error loading payment types:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment types',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load payment types on component mount
  useEffect(() => {
    loadPaymentTypes();
  }, []);

  // Handle form submission
  const onSubmit = async (data: PaymentTypeFormData) => {
    try {
      setLoading(true);
      
      const paymentTypeData = {
        name: data.name,
        description: data.description || null,
        is_active: true
      };

      let result;
      if (editingPaymentType) {
        result = await db.masterPaymentTypesUpdate(editingPaymentType.id, paymentTypeData);
      } else {
        result = await db.masterPaymentTypesCreate(paymentTypeData);
      }

      if (result.success) {
        toast({
          title: 'Success',
          description: `Payment type ${editingPaymentType ? 'updated' : 'created'} successfully`,
        });
        reset();
        setEditingPaymentType(null);
        setIsDialogOpen(false);
        await loadPaymentTypes();
      } else {
        throw new Error(result.error || 'Failed to save payment type');
      }
    } catch (error) {
      console.error('Error saving payment type:', error);
      toast({
        title: 'Error',
        description: `Failed to ${editingPaymentType ? 'update' : 'create'} payment type`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (paymentType: MasterPaymentType) => {
    setEditingPaymentType(paymentType);
    setValue('name', paymentType.name);
    setValue('description', paymentType.description || '');
    setIsDialogOpen(true);
  };

  // Handle toggle active status
  const handleToggleActive = async (paymentType: MasterPaymentType) => {
    try {
      setLoading(true);
      const result = await db.masterPaymentTypesUpdate(paymentType.id, {
        ...paymentType,
        is_active: !paymentType.is_active
      });
      
      if (result.success) {
        toast({
          title: 'Success',
          description: `Payment type ${!paymentType.is_active ? 'activated' : 'deactivated'} successfully`,
        });
        await loadPaymentTypes();
      } else {
        throw new Error(result.error || 'Failed to update payment type status');
      }
    } catch (error) {
      console.error('Error toggling payment type status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update payment type status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle new payment type
  const handleNewPaymentType = () => {
    setEditingPaymentType(null);
    reset();
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Payment Types</h3>
          <p className="text-sm text-muted-foreground">
            Configure available payment methods for transactions
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewPaymentType} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Payment Type
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {editingPaymentType ? 'Edit Payment Type' : 'Add New Payment Type'}
              </DialogTitle>
              <DialogDescription>
                {editingPaymentType 
                  ? 'Update the payment type details below.' 
                  : 'Add a new payment method for transactions.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Payment Type Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="e.g., Cash, UPI, Credit Card, Bank Transfer"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Optional description for this payment type"
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
                  {loading ? 'Saving...' : (editingPaymentType ? 'Update' : 'Create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Payment Types Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Types ({paymentTypes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading payment types...</div>
          ) : paymentTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payment types configured yet.</p>
              <p className="text-sm">Add your first payment type to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment Type Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentTypes.map((paymentType) => (
                  <TableRow key={paymentType.id}>
                    <TableCell className="font-medium">{paymentType.name}</TableCell>
                    <TableCell>
                      {paymentType.description ? (
                        <span className="text-sm text-muted-foreground">{paymentType.description}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">No description</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={paymentType.is_active ? 'default' : 'secondary'}
                        className={paymentType.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                      >
                        {paymentType.is_active ? (
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
                          onClick={() => handleEdit(paymentType)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(paymentType)}
                          className={paymentType.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                        >
                          {paymentType.is_active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
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
        <CreditCard className="h-4 w-4" />
        <AlertDescription>
          <strong>Integration:</strong> These payment types will be available in receipts, 
          member registration, and all transaction forms as dropdown options. This helps 
          standardize payment method tracking across the system. Deactivated payment types 
          won't appear in new forms but existing records will retain their historical data.
        </AlertDescription>
      </Alert>
    </div>
  );
};
