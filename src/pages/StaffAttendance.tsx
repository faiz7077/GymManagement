import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, Eye, Clock, Users, UserCheck, UserX, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { toast } from 'sonner';
import { db } from '@/utils/database';
import { StaffAttendanceForm } from '@/components/staff-attendance/StaffAttendanceForm';
import { StaffAttendanceDetails } from '@/components/staff-attendance/StaffAttendanceDetails';

interface StaffAttendance {
  id: string;
  staffId: string;
  staffName: string;
  checkIn: string;
  checkOut?: string;
  date: string;
  profileImage?: string;
  role?: string;
  shift?: string;
}

export function StaffAttendancePage() {
  const [staffAttendance, setStaffAttendance] = useState<StaffAttendance[]>([]);
  const [filteredAttendance, setFilteredAttendance] = useState<StaffAttendance[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<StaffAttendance | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { state: sidebarState } = useSidebar();

  useEffect(() => {
    loadStaffAttendance();
  }, []);

  useEffect(() => {
    filterAttendance();
  }, [staffAttendance, searchTerm, selectedDate]);

  const loadStaffAttendance = async () => {
    try {
      setLoading(true);
      const records = await db.getAllStaffAttendance();
      setStaffAttendance(records);
    } catch (error) {
      console.error('Error loading staff attendance:', error);
      toast.error('Failed to load staff attendance records');
    } finally {
      setLoading(false);
    }
  };

  const filterAttendance = () => {
    let filtered = staffAttendance;

    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.role && record.role.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedDate) {
      filtered = filtered.filter(record => record.date === selectedDate);
    }

    setFilteredAttendance(filtered);
  };

  const handleCheckOut = async (attendanceId: string) => {
    try {
      const checkOutTime = new Date().toISOString();
      await db.checkOutStaff(attendanceId);
      await loadStaffAttendance();
      toast.success('Staff checked out successfully');
    } catch (error) {
      console.error('Error checking out staff:', error);
      toast.error('Failed to check out staff');
    }
  };

  const handleCheckInSuccess = () => {
    setIsCheckInDialogOpen(false);
    loadStaffAttendance();
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateDuration = (checkIn: string, checkOut?: string) => {
    const start = new Date(checkIn);
    const end = checkOut ? new Date(checkOut) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getStatsForToday = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = staffAttendance.filter(record => record.date === today);
    
    const totalToday = todayRecords.length;
    const currentlyIn = todayRecords.filter(record => !record.checkOut).length;
    const checkedOut = todayRecords.filter(record => record.checkOut).length;
    const attendanceRate = totalToday > 0 ? Math.round((totalToday / totalToday) * 100) : 0;

    return { totalToday, currentlyIn, checkedOut, attendanceRate };
  };

  const stats = getStatsForToday();

  const getRoleBadgeColor = (role?: string) => {
    switch (role?.toLowerCase()) {
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading staff attendance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {sidebarState === 'collapsed' && <SidebarTrigger />}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Staff Attendance</h1>
            <p className="text-gray-600">Track and manage staff attendance records</p>
          </div>
        </div>
        <Dialog open={isCheckInDialogOpen} onOpenChange={setIsCheckInDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Check In Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Check In Staff</DialogTitle>
            </DialogHeader>
            <StaffAttendanceForm onSuccess={handleCheckInSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalToday}</div>
            <p className="text-xs text-muted-foreground">Staff attendance today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently In</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.currentlyIn}</div>
            <p className="text-xs text-muted-foreground">Staff currently present</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checked Out</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.checkedOut}</div>
            <p className="text-xs text-muted-foreground">Staff finished for today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">Based on today's records</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by staff name or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAttendance.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No staff attendance records found</p>
              <p className="text-sm text-gray-400">Try adjusting your search or date filter</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Staff</th>
                    <th className="text-left py-3 px-4 font-medium">Role</th>
                    <th className="text-left py-3 px-4 font-medium">Check In</th>
                    <th className="text-left py-3 px-4 font-medium">Check Out</th>
                    <th className="text-left py-3 px-4 font-medium">Duration</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                            {record.profileImage ? (
                              <img
                                src={record.profileImage}
                                alt={record.staffName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-medium text-gray-600">
                                {record.staffName.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{record.staffName}</p>
                            {record.shift && (
                              <p className="text-sm text-gray-500">{record.shift}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {record.role && (
                          <Badge className={getRoleBadgeColor(record.role)}>
                            {record.role}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>{formatTime(record.checkIn)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {record.checkOut ? (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>{formatTime(record.checkOut)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">
                          {calculateDuration(record.checkIn, record.checkOut)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={record.checkOut ? "secondary" : "default"}
                          className={record.checkOut ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}
                        >
                          {record.checkOut ? "Checked Out" : "Checked In"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedAttendance(record);
                              setIsDetailsDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!record.checkOut && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCheckOut(record.id)}
                            >
                              Check Out
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Staff Attendance Details</DialogTitle>
          </DialogHeader>
          {selectedAttendance && (
            <StaffAttendanceDetails attendance={selectedAttendance} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}