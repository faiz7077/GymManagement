import React, { useState, useEffect, useCallback } from 'react';
import { Search, Calendar as CalendarIcon, Plus, Eye } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { LegacyAttendance as Attendance, db } from '@/utils/database';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AttendaceForm } from '@/components/attendance/AttendanceForm';
import { AttendanceDetails } from '@/components/attendance/AttendanceDetails';
export const AttendancePage: React.FC = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<Attendance[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCheckOutDialogOpen, setIsCheckOutDialogOpen] = useState(false);
  const [attendanceToCheckOut, setAttendanceToCheckOut] = useState<Attendance | null>(null);
  const [prefilledMember, setPrefilledMember] = useState<any>(null);
  const { toast } = useToast();
  const { state: sidebarState } = useSidebar();
  const location = useLocation();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const loadAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const attendanceData = await db.getAllAttendance();
      console.log('Loaded attendance data:', attendanceData); // Debug log
      setAttendanceRecords(attendanceData || []);
    } catch (error) {
      console.error('Error loading attendance:', error);
      toast({ title: "Error", description: "Failed to load attendance records.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const filterAttendance = useCallback(() => {
    let filtered = attendanceRecords;
    if (searchTerm) {
      filtered = filtered.filter(record => record.memberName.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (dateFilter) {
      const selectedDate = format(dateFilter, 'yyyy-MM-dd');
      filtered = filtered.filter(record => record.date === selectedDate);
    }
    setFilteredRecords(filtered);
  }, [attendanceRecords, searchTerm, dateFilter]);

  useEffect(() => { loadAttendance(); }, [loadAttendance]);
  useEffect(() => { filterAttendance(); }, [filterAttendance]);

  // Handle navigation state from MemberDetails
  useEffect(() => {
    if (location.state?.selectedMember && location.state?.openForm) {
      setPrefilledMember(location.state.selectedMember);
      setIsCheckInDialogOpen(true);
      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleCheckIn = async (memberId: string, memberName: string, profileImage?: string) => {
    try {
      console.log('Checking in member:', { memberId, memberName, profileImage }); // Debug log
      const success = await db.checkIn(memberId, memberName, profileImage);
      if (success) {
        await loadAttendance();
        setIsCheckInDialogOpen(false);
        setPrefilledMember(null);
        toast({ title: "Success", description: `${memberName} has been checked in.` });
      } else { throw new Error('Failed to check in member'); }
    } catch (error) {
      console.error('Check-in error:', error);
      toast({ title: "Error", description: "Failed to check in member.", variant: "destructive" });
    }
  };

  const handleCheckOut = async () => {
    if (!attendanceToCheckOut) return;

    try {
      const success = await db.checkOut(attendanceToCheckOut.id);
      if (success) {
        await loadAttendance();
        setIsCheckOutDialogOpen(false);
        setAttendanceToCheckOut(null);
        toast({ title: "Success", description: `${attendanceToCheckOut.memberName} has been checked out.` });
      } else { throw new Error('Failed to check out member'); }
    } catch (error) {
      console.error('Check-out error:', error);
      toast({ title: "Error", description: "Failed to check out member.", variant: "destructive" });
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {sidebarState === 'collapsed' && <SidebarTrigger />}
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gym-primary to-primary-glow bg-clip-text text-transparent">Attendance</h1>
            <p className="text-muted-foreground">Manage daily member check-ins and check-outs</p>
          </div>
        </div>
        <Dialog open={isCheckInDialogOpen} onOpenChange={setIsCheckInDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Check In Member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Check-in</DialogTitle>
            </DialogHeader>
            <AttendaceForm
              onSubmit={handleCheckIn}
              onCancel={() => {
                setIsCheckInDialogOpen(false);
                setPrefilledMember(null);
              }}
              prefilledMember={prefilledMember}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="p-6 space-y-6">
        <Card>
        <CardHeader>
          <CardTitle>Attendance Log</CardTitle>
          <div className="flex gap-4 items-center pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by member name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-[240px] pl-3 text-left font-normal", !dateFilter && "text-muted-foreground")}>
                  {dateFilter ? format(dateFilter, "PPP") : <span>Pick a date</span>}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFilter} onSelect={setDateFilter} disabled={(date) => date > new Date()} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Check-in Time</TableHead>
                  <TableHead>Check-out Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell></TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center">No attendance records found.</TableCell></TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={record.profileImage || undefined} className="object-cover" />
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {getInitials(record.memberName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{record.memberName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(record.checkIn).toLocaleTimeString()}</TableCell>
                      <TableCell>{record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '—'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${!record.checkOut ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {!record.checkOut ? 'Checked In' : 'Checked Out'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedAttendance(record);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!record.checkOut && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setAttendanceToCheckOut(record);
                                setIsCheckOutDialogOpen(true);
                              }}
                            >
                              Check Out
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Attendance Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Attendance Details</DialogTitle>
          </DialogHeader>
          {selectedAttendance && <AttendanceDetails attendance={selectedAttendance} />}
        </DialogContent>
      </Dialog>

      {/* Check Out Confirmation Dialog */}
      <Dialog open={isCheckOutDialogOpen} onOpenChange={setIsCheckOutDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Check Out Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to check out <strong>{attendanceToCheckOut?.memberName}</strong>?
            </p>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setIsCheckOutDialogOpen(false);
                  setAttendanceToCheckOut(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCheckOut}
              >
                Check Out
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};