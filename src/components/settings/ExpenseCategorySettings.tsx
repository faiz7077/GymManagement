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
  FileText,
  CheckCircle,
  XCircle
} from 'lucide-react';

// Types
interface MasterExpenseCategory {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

// Form schema
const expenseCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
});

type ExpenseCategoryFormData = z.infer<typeof expenseCategorySchema>;

export const ExpenseCategorySettings: React.FC = () => {
  const [categories, setCategories] = useState<MasterExpenseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MasterExpenseCategory | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ExpenseCategoryFormData>({
    resolver: zodResolver(expenseCategorySchema),
    defaultValues: {
      name: '',
      description: '',
    }
  });

  // Load expense categories
  const loadCategories = async () => {
    try {
      setLoading(true);
      const result = await db.masterExpenseCategoriesGetAll();
      if (result.success) {
        setCategories(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to load expense categories');
      }
    } catch (error) {
      console.error('Error loading expense categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load expense categories',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Handle form submission
  const onSubmit = async (data: ExpenseCategoryFormData) => {
    try {
      setLoading(true);
      
      const categoryData = {
        name: data.name,
        description: data.description || null,
        is_active: true
      };

      let result;
      if (editingCategory) {
        result = await db.masterExpenseCategoriesUpdate(editingCategory.id, categoryData);
      } else {
        result = await db.masterExpenseCategoriesCreate(categoryData);
      }

      if (result.success) {
        toast({
          title: 'Success',
          description: `Expense category ${editingCategory ? 'updated' : 'created'} successfully`,
        });
        reset();
        setEditingCategory(null);
        setIsDialogOpen(false);
        await loadCategories();
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('expenseCategoryUpdated'));
      } else {
        throw new Error(result.error || 'Failed to save expense category');
      }
    } catch (error) {
      console.error('Error saving expense category:', error);
      toast({
        title: 'Error',
        description: `Failed to ${editingCategory ? 'update' : 'create'} expense category`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (category: MasterExpenseCategory) => {
    setEditingCategory(category);
    setValue('name', category.name);
    setValue('description', category.description || '');
    setIsDialogOpen(true);
  };

  // Handle toggle active status
  const handleToggleActive = async (category: MasterExpenseCategory) => {
    try {
      setLoading(true);
      const result = await db.masterExpenseCategoriesUpdate(category.id, {
        ...category,
        is_active: !category.is_active
      });
      
      if (result.success) {
        toast({
          title: 'Success',
          description: `Category ${!category.is_active ? 'activated' : 'deactivated'} successfully`,
        });
        await loadCategories();
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('expenseCategoryUpdated'));
      } else {
        throw new Error(result.error || 'Failed to update category status');
      }
    } catch (error) {
      console.error('Error toggling category status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update category status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle new category
  const handleNewCategory = () => {
    setEditingCategory(null);
    reset();
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Expense Categories</h3>
          <p className="text-sm text-muted-foreground">
            Manage categories for expense tracking and reporting
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewCategory} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {editingCategory ? 'Edit Expense Category' : 'Add New Expense Category'}
              </DialogTitle>
              <DialogDescription>
                {editingCategory 
                  ? 'Update the expense category details below.' 
                  : 'Create a new expense category for better expense tracking.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="e.g., Equipment, Utilities, Marketing"
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
                  placeholder="Optional description for this expense category"
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
                  {loading ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Expense Categories ({categories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading expense categories...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No expense categories configured yet.</p>
              <p className="text-sm">Add your first expense category to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>
                      {category.description ? (
                        <span className="text-sm text-muted-foreground">{category.description}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">No description</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={category.is_active ? 'default' : 'secondary'}
                        className={category.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                      >
                        {category.is_active ? (
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
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(category)}
                          className={category.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                        >
                          {category.is_active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
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
        <FileText className="h-4 w-4" />
        <AlertDescription>
          <strong>Integration:</strong> These expense categories will be available when creating 
          new expense records. They help organize and categorize expenses for better reporting 
          and analysis. Deactivated categories won't appear in new expense forms but existing 
          records will retain their historical data.
        </AlertDescription>
      </Alert>
    </div>
  );
};
