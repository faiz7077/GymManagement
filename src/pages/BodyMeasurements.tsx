import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, TrendingUp, Scale, Ruler, Activity, Edit, Trash2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/utils/database';
import { BodyMeasurementForm } from '@/components/measurements/BodyMeasurementForm';
import { calculateBMI, getBMICategory, getBMIBadgeColor, calculateBMR } from '@/utils/bmiUtils';
import { format } from 'date-fns';

interface BodyMeasurement {
  id: string;
  member_id: string;
  custom_member_id: string;
  member_name: string;
  serial_number: number;
  measurement_date: string;
  weight: number;
  height: number;
  age: number;
  neck?: number;
  chest?: number;
  arms?: number;
  fore_arms?: number;
  wrist?: number;
  tummy?: number;
  waist?: number;
  hips?: number;
  thighs?: number;
  calf?: number;
  fat_percentage?: number;
  bmi: number;
  bmr?: number;
  vf?: number;
  notes?: string;
  created_at: string;
  recorded_by: string;
}

interface MeasurementFormData {
  memberId: string;
  measurementDate: string;
  height: number;
  weight: number;
  age: number;
  neck?: number;
  chest?: number;
  arms?: number;
  foreArms?: number;
  wrist?: number;
  tummy?: number;
  waist?: number;
  hips?: number;
  thighs?: number;
  calf?: number;
  fatPercentage?: number;
  vf?: number;
  notes?: string;
}

export const BodyMeasurements: React.FC = () => {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [filteredMeasurements, setFilteredMeasurements] = useState<BodyMeasurement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<BodyMeasurement | null>(null);
  const [prefilledMember, setPrefilledMember] = useState<any>(null);
  const { toast } = useToast();
  const { state: sidebarState } = useSidebar();
  const location = useLocation();

  const handleAddMeasurement = async (data: MeasurementFormData) => {
    try {
      const member = await db.getMemberById(data.memberId);
      if (!member) {
        throw new Error('Member not found');
      }

      // Get the next serial number
      const existingMeasurements = await db.getAllBodyMeasurements();
      const nextSerialNumber = existingMeasurements.length + 1;

      // Calculate BMI and BMR
      const bmi = calculateBMI(data.weight, data.height);
      const bmr = calculateBMR(data.weight, data.height, data.age, member.sex);

      const measurementData = {
        id: `measurement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        member_id: data.memberId,
        custom_member_id: member.customMemberId || member.id,
        member_name: member.name,
        serial_number: nextSerialNumber,
        measurement_date: data.measurementDate,
        weight: data.weight,
        height: data.height,
        age: data.age,
        neck: data.neck || null,
        chest: data.chest || null,
        arms: data.arms || null,
        fore_arms: data.foreArms || null,
        wrist: data.wrist || null,
        tummy: data.tummy || null,
        waist: data.waist || null,
        hips: data.hips || null,
        thighs: data.thighs || null,
        calf: data.calf || null,
        fat_percentage: data.fatPercentage || null,
        bmi: bmi,
        bmr: bmr,
        vf: data.vf || null,
        notes: data.notes || null,
        created_at: new Date().toISOString(),
        recorded_by: 'System'
      };

      const result = await db.createBodyMeasurement(measurementData);
      if (result.success) {
        await loadMeasurements();
        setIsAddDialogOpen(false);
        setPrefilledMember(null);
        toast({
          title: "Measurement Added",
          description: `Body measurements for ${member.name} have been recorded.`,
        });
      } else {
        throw new Error('Failed to create body measurement');
      }
    } catch (error) {
      console.error('Error adding measurement:', error);
      toast({
        title: "Error",
        description: "Failed to add body measurement. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditMeasurement = async (data: MeasurementFormData) => {
    try {
      if (!editingMeasurement) return;

      const member = await db.getMemberById(data.memberId);
      if (!member) {
        throw new Error('Member not found');
      }

      // Calculate BMI and BMR
      const bmi = calculateBMI(data.weight, data.height);
      const bmr = calculateBMR(data.weight, data.height, data.age, member.sex);

      const measurementData = {
        measurement_date: data.measurementDate,
        weight: data.weight,
        height: data.height,
        age: data.age,
        neck: data.neck || null,
        chest: data.chest || null,
        arms: data.arms || null,
        fore_arms: data.foreArms || null,
        wrist: data.wrist || null,
        tummy: data.tummy || null,
        waist: data.waist || null,
        hips: data.hips || null,
        thighs: data.thighs || null,
        calf: data.calf || null,
        fat_percentage: data.fatPercentage || null,
        bmi: bmi,
        bmr: bmr,
        vf: data.vf || null,
        notes: data.notes || null,
      };

      const result = await db.updateBodyMeasurement(editingMeasurement.id, measurementData);
      if (result.success) {
        await loadMeasurements();
        setIsEditDialogOpen(false);
        setEditingMeasurement(null);
        toast({
          title: "Measurement Updated",
          description: `Body measurements for ${member.name} have been updated.`,
        });
      } else {
        throw new Error('Failed to update body measurement');
      }
    } catch (error) {
      console.error('Error updating measurement:', error);
      toast({
        title: "Error",
        description: "Failed to update body measurement. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMeasurement = async (measurement: BodyMeasurement) => {
    try {
      const result = await db.deleteBodyMeasurement(measurement.id);
      if (result.success) {
        await loadMeasurements();
        toast({
          title: "Measurement Deleted",
          description: `Body measurement for ${measurement.member_name} has been deleted.`,
        });
      } else {
        throw new Error('Failed to delete body measurement');
      }
    } catch (error) {
      console.error('Error deleting measurement:', error);
      toast({
        title: "Error",
        description: "Failed to delete body measurement. Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadMeasurements = useCallback(async () => {
    try {
      setLoading(true);
      const measurementsData = await db.getAllBodyMeasurements();
      setMeasurements(measurementsData);
    } catch (error) {
      console.error('Error loading measurements:', error);
      toast({
        title: "Error",
        description: "Failed to load body measurements.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const filterMeasurements = useCallback(() => {
    let filtered = measurements;
    if (searchTerm) {
      filtered = filtered.filter(measurement =>
        measurement.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        measurement.custom_member_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredMeasurements(filtered);
  }, [measurements, searchTerm]);

  useEffect(() => {
    loadMeasurements();
  }, [loadMeasurements]);

  useEffect(() => {
    filterMeasurements();
  }, [filterMeasurements]);

  // Handle navigation state from MemberDetails
  useEffect(() => {
    if (location.state?.selectedMember && location.state?.openForm) {
      setPrefilledMember(location.state.selectedMember);
      setIsAddDialogOpen(true);
      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);



  const getBMIStats = () => {
    if (measurements.length === 0) return { average: 0, healthy: 0, total: 0 };
    
    const totalBMI = measurements.reduce((sum, m) => sum + m.bmi, 0);
    const averageBMI = totalBMI / measurements.length;
    const healthyCount = measurements.filter(m => m.bmi >= 18.5 && m.bmi < 25).length;
    
    return {
      average: Math.round(averageBMI * 10) / 10,
      healthy: healthyCount,
      total: measurements.length
    };
  };

  const stats = getBMIStats();

  return (
    <div className="animate-fade-in">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {sidebarState === 'collapsed' && <SidebarTrigger />}
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gym-primary to-primary-glow bg-clip-text text-transparent">
              Body Measurements
            </h1>
            <p className="text-muted-foreground">Track member fitness progress and BMI</p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* <Button 
            variant="outline" 
            onClick={async () => {
              console.log('Forcing migration...');
              const success = await db.forceMigration();
              console.log('Migration result:', success);
              const tableInfo = await db.debugTableInfo();
              console.log('Table structure:', tableInfo);
              toast({
                title: success ? "Migration completed" : "Migration failed",
                description: "Check console for details",
                variant: success ? "default" : "destructive"
              });
            }}
          >
            Debug Migration
          </Button> */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Measurement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Body Measurement</DialogTitle>
              </DialogHeader>
              <BodyMeasurementForm
                onSubmit={handleAddMeasurement}
                onCancel={() => {
                  setIsAddDialogOpen(false);
                  setPrefilledMember(null);
                }}
                prefilledMember={prefilledMember}
              />
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Body Measurement</DialogTitle>
              </DialogHeader>
              {editingMeasurement && (
                <BodyMeasurementForm
                  onSubmit={handleEditMeasurement}
                  onCancel={() => {
                    setIsEditDialogOpen(false);
                    setEditingMeasurement(null);
                  }}
                  initialData={editingMeasurement}
                  isEdit={true}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Scale className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Records</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.average}</p>
                <p className="text-xs text-muted-foreground">Average BMI</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.healthy}</p>
                <p className="text-xs text-muted-foreground">Healthy BMI</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Ruler className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{Math.round((stats.healthy / stats.total) * 100) || 0}%</p>
                <p className="text-xs text-muted-foreground">Healthy Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Measurements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Physical Measurements (In CM.)</CardTitle>
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or member ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading measurements...
            </div>
          ) : filteredMeasurements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No measurements found matching your criteria.' : 'No body measurements available. Add measurements to see them here.'}
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-red-600 hover:bg-red-600">
                    <TableHead className="text-white font-bold border-r border-red-500 text-center">S. No.</TableHead>
                    <TableHead className="text-white font-bold border-r border-red-500 text-center">Name</TableHead>
                    <TableHead className="text-white font-bold border-r border-red-500 text-center">Date</TableHead>
                    <TableHead className="text-white font-bold border-r border-red-500 text-center">Weight</TableHead>
                    <TableHead className="text-white font-bold border-r border-red-500 text-center">Height</TableHead>
                    <TableHead className="text-white font-bold border-r border-red-500 text-center">Neck</TableHead>
                    <TableHead className="text-white font-bold border-r border-red-500 text-center">Chest</TableHead>
                    <TableHead className="text-white font-bold border-r border-red-500 text-center">Arms</TableHead>
                    <TableHead className="text-white font-bold border-r border-red-500 text-center">Fore Arms</TableHead>
                    <TableHead className="text-white font-bold border-r border-red-500 text-center">Wrist</TableHead>
                    <TableHead className="text-white font-bold border-r border-red-500 text-center">Tummy</TableHead>
                    <TableHead className="text-white font-bold border-r border-red-500 text-center">Waist</TableHead>
                    <TableHead className="text-white font-bold border-r border-red-500 text-center">Hips</TableHead>
                    <TableHead className="text-white font-bold border-r border-red-500 text-center">Thighs</TableHead>
                    <TableHead className="text-white font-bold border-r border-red-500 text-center">Calf</TableHead>
                    <TableHead className="text-white font-bold border-r border-red-500 text-center">Age</TableHead>
                    <TableHead className="text-white font-bold border-r border-red-500 text-center">Fat %</TableHead>
                    <TableHead className="text-white font-bold border-r border-red-500 text-center">BMI</TableHead>
                    <TableHead className="text-white font-bold border-r border-red-500 text-center">BMR</TableHead>
                    <TableHead className="text-white font-bold border-r border-red-500 text-center">VF</TableHead>
                    <TableHead className="text-white font-bold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMeasurements.map((measurement, index) => (
                    <TableRow 
                      key={measurement.id} 
                      className={`hover:bg-blue-50 border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <TableCell className="border-r text-center py-3 font-medium">{measurement.serial_number}</TableCell>
                      <TableCell className="border-r text-center py-3">{measurement.member_name}</TableCell>
                      <TableCell className="border-r text-center py-3">
                        {format(new Date(measurement.measurement_date), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="border-r text-center py-3 font-semibold">{measurement.weight}</TableCell>
                      <TableCell className="border-r text-center py-3">{measurement.height}</TableCell>
                      <TableCell className="border-r text-center py-3">{measurement.neck || '-'}</TableCell>
                      <TableCell className="border-r text-center py-3">{measurement.chest || '-'}</TableCell>
                      <TableCell className="border-r text-center py-3">{measurement.arms || '-'}</TableCell>
                      <TableCell className="border-r text-center py-3">{measurement.fore_arms || '-'}</TableCell>
                      <TableCell className="border-r text-center py-3">{measurement.wrist || '-'}</TableCell>
                      <TableCell className="border-r text-center py-3">{measurement.tummy || '-'}</TableCell>
                      <TableCell className="border-r text-center py-3">{measurement.waist || '-'}</TableCell>
                      <TableCell className="border-r text-center py-3">{measurement.hips || '-'}</TableCell>
                      <TableCell className="border-r text-center py-3">{measurement.thighs || '-'}</TableCell>
                      <TableCell className="border-r text-center py-3">{measurement.calf || '-'}</TableCell>
                      <TableCell className="border-r text-center py-3">{measurement.age}</TableCell>
                      <TableCell className="border-r text-center py-3">{measurement.fat_percentage || '-'}</TableCell>
                      <TableCell className="border-r text-center py-3">
                        <Badge className={`${getBMIBadgeColor(measurement.bmi)}`}>
                          {measurement.bmi}
                        </Badge>
                      </TableCell>
                      <TableCell className="border-r text-center py-3">{measurement.bmr || '-'}</TableCell>
                      <TableCell className="border-r text-center py-3">{measurement.vf || '-'}</TableCell>
                      <TableCell className="text-center py-3">
                        <div className="flex justify-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingMeasurement(measurement);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMeasurement(measurement)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
};