import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, User, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/utils/database';

interface Staff {
  id: string;
  name: string;
  role: string;
  profileImage?: string;
  shift?: string;
  status: string;
}

interface StaffAttendanceFormProps {
  onSuccess: () => void;
}

export function StaffAttendanceForm({ onSuccess }: StaffAttendanceFormProps) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadStaff();
  }, []);

  useEffect(() => {
    filterStaff();
  }, [staff, searchTerm]);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const staffData = await db.getAllStaff();
      // Only show active staff
      const activeStaff = staffData.filter(s => s.status === 'active');
      setStaff(activeStaff);
    } catch (error) {
      console.error('Error loading staff:', error);
      toast.error('Failed to load staff members');
    } finally {
      setLoading(false);
    }
  };

  const filterStaff = () => {
    let filtered = staff;

    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredStaff(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStaffId) {
      toast.error('Please select a staff member');
      return;
    }

    const selectedStaff = staff.find(s => s.id === selectedStaffId);
    if (!selectedStaff) {
      toast.error('Selected staff member not found');
      return;
    }

    try {
      setSubmitting(true);
      const checkInTime = new Date().toISOString();
      const today = new Date().toISOString().split('T')[0];

      await db.checkInStaff(
        selectedStaff.id,
        selectedStaff.name,
        selectedStaff.profileImage,
        selectedStaff.role,
        selectedStaff.shift
      );

      toast.success(`${selectedStaff.name} checked in successfully`);
      onSuccess();
    } catch (error) {
      console.error('Error checking in staff:', error);
      toast.error('Failed to check in staff member');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedStaff = staff.find(s => s.id === selectedStaffId);

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'trainer':
        return 'bg-blue-100 text-blue-800';
      case 'receptionist':
        return 'bg-green-100 text-green-800';
      case 'manager':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading staff...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Staff Search */}
      <div className="space-y-2">
        <Label htmlFor="search">Search Staff</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            id="search"
            placeholder="Search by name or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Staff Selection */}
      <div className="space-y-2">
        <Label htmlFor="staff">Select Staff Member *</Label>
        <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a staff member to check in" />
          </SelectTrigger>
          <SelectContent>
            {filteredStaff.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <User className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No active staff members found</p>
                {searchTerm && <p className="text-sm">Try adjusting your search</p>}
              </div>
            ) : (
              filteredStaff.map((staffMember) => (
                <SelectItem key={staffMember.id} value={staffMember.id}>
                  <div className="flex items-center space-x-3 py-1">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                      {staffMember.profileImage ? (
                        <img
                          src={staffMember.profileImage}
                          alt={staffMember.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-600">
                          {staffMember.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{staffMember.name}</p>
                      <div className="flex items-center space-x-2">
                        <Badge className={getRoleBadgeColor(staffMember.role)}>
                          {staffMember.role}
                        </Badge>
                        {staffMember.shift && (
                          <span className="text-xs text-gray-500">{staffMember.shift}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Selected Staff Preview */}
      {selectedStaff && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {selectedStaff.profileImage ? (
                  <img
                    src={selectedStaff.profileImage}
                    alt={selectedStaff.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-medium text-gray-600">
                    {selectedStaff.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{selectedStaff.name}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={getRoleBadgeColor(selectedStaff.role)}>
                    {selectedStaff.role}
                  </Badge>
                  {selectedStaff.shift && (
                    <span className="text-sm text-gray-600">{selectedStaff.shift}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  {new Date().toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-1">Check-in time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <div className="flex justify-end space-x-3">
        <Button
          type="submit"
          disabled={!selectedStaffId || submitting}
          className="min-w-[120px]"
        >
          {submitting ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Checking In...
            </div>
          ) : (
            'Check In Staff'
          )}
        </Button>
      </div>
    </form>
  );
}