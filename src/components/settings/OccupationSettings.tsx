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
  Briefcase,
  CheckCircle,
  XCircle
} from 'lucide-react';

// Types
interface MasterOccupation {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

// Form schema
const occupationSchema = z.object({
  name: z.string().min(1, 'Occupation name is required'),
  description: z.string().optional(),
});

type OccupationFormData = z.infer<typeof occupationSchema>;

export const OccupationSettings: React.FC = () => {
  const [occupations, setOccupations] = useState<MasterOccupation[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingOccupation, setEditingOccupation] = useState<MasterOccupation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<OccupationFormData>({
    resolver: zodResolver(occupationSchema),
    defaultValues: {
      name: '',
      description: '',
    }
  });

  // Load occupations
  const loadOccupations = async () => {
    try {
      setLoading(true);
      const result = await db.masterOccupationsGetAll();
      if (result.success) {
        setOccupations(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to load occupations');
      }
    } catch (error) {
      console.error('Error loading occupations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load occupations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load occupations on component mount
  useEffect(() => {
    loadOccupations();
  }, []);

  // Handle form submission
  const onSubmit = async (data: OccupationFormData) => {
    try {
      setLoading(true);
      
      const occupationData = {
        name: data.name,
        description: data.description || null,
        is_active: true
      };

      let result;
      if (editingOccupation) {
        result = await db.masterOccupationsUpdate(editingOccupation.id, occupationData);
      } else {
        result = await db.masterOccupationsCreate(occupationData);
      }

      if (result.success) {
        toast({
          title: 'Success',
          description: `Occupation ${editingOccupation ? 'updated' : 'created'} successfully`,
        });
        reset();
        setEditingOccupation(null);
        setIsDialogOpen(false);
        await loadOccupations();
      } else {
        throw new Error(result.error || 'Failed to save occupation');
      }
    } catch (error) {
      console.error('Error saving occupation:', error);
      toast({
        title: 'Error',
        description: `Failed to ${editingOccupation ? 'update' : 'create'} occupation`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (occupation: MasterOccupation) => {
    setEditingOccupation(occupation);
    setValue('name', occupation.name);
    setValue('description', occupation.description || '');
    setIsDialogOpen(true);
  };

  // Handle toggle active status
  const handleToggleActive = async (occupation: MasterOccupation) => {
    try {
      setLoading(true);
      const result = await db.masterOccupationsUpdate(occupation.id, {
        ...occupation,
        is_active: !occupation.is_active
      });
      
      if (result.success) {
        toast({
          title: 'Success',
          description: `Occupation ${!occupation.is_active ? 'activated' : 'deactivated'} successfully`,
        });
        await loadOccupations();
      } else {
        throw new Error(result.error || 'Failed to update occupation status');
      }
    } catch (error) {
      console.error('Error toggling occupation status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update occupation status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle new occupation
  const handleNewOccupation = () => {
    setEditingOccupation(null);
    reset();
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Occupations</h3>
          <p className="text-sm text-muted-foreground">
            Manage the list of occupations for member profiles
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewOccupation} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Occupation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                {editingOccupation ? 'Edit Occupation' : 'Add New Occupation'}
              </DialogTitle>
              <DialogDescription>
                {editingOccupation 
                  ? 'Update the occupation details below.' 
                  : 'Add a new occupation option for member profiles.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Occupation Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="e.g., Software Engineer, Doctor, Teacher"
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
                  placeholder="Optional description for this occupation"
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
                  {loading ? 'Saving...' : (editingOccupation ? 'Update' : 'Create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Occupations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Occupations ({occupations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading occupations...</div>
          ) : occupations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No occupations configured yet.</p>
              <p className="text-sm">Add your first occupation to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Occupation Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {occupations.map((occupation) => (
                  <TableRow key={occupation.id}>
                    <TableCell className="font-medium">{occupation.name}</TableCell>
                    <TableCell>
                      {occupation.description ? (
                        <span className="text-sm text-muted-foreground">{occupation.description}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">No description</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={occupation.is_active ? 'default' : 'secondary'}
                        className={occupation.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                      >
                        {occupation.is_active ? (
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
                          onClick={() => handleEdit(occupation)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(occupation)}
                          className={occupation.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                        >
                          {occupation.is_active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
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
        <Briefcase className="h-4 w-4" />
        <AlertDescription>
          <strong>Integration:</strong> These occupations will be available in member registration 
          and profile forms as dropdown options. This helps standardize occupation data across 
          member records. Deactivated occupations won't appear in new forms but existing 
          member records will retain their historical data.
        </AlertDescription>
      </Alert>
    </div>
  );
};
