import React from 'react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Clock, Calendar, User, LogIn, LogOut } from 'lucide-react';
import { LegacyAttendance } from '@/utils/database';

interface AttendanceDetailsProps {
  attendance: LegacyAttendance;
}

export const AttendanceDetails: React.FC<AttendanceDetailsProps> = ({ attendance }) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const calculateDuration = (checkIn: string, checkOut?: string) => {
    if (!checkOut) return 'Still checked in';
    
    const checkInTime = new Date(checkIn);
    const checkOutTime = new Date(checkOut);
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  };

  const getStatusBadge = (checkOut?: string) => {
    if (checkOut) {
      return (
        <Badge variant="secondary" className="bg-success text-success-foreground">
          <LogOut className="h-3 w-3 mr-1" />
          Checked Out
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-warning text-warning-foreground">
        <LogIn className="h-3 w-3 mr-1" />
        Checked In
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Avatar className="h-20 w-20">
            <AvatarImage src={attendance.profileImage || undefined} className="object-cover" />
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
              {getInitials(attendance.memberName)}
            </AvatarFallback>
          </Avatar>
          {attendance.profileImage && (
            <div className="absolute inset-0 rounded-full ring-2 ring-primary/20"></div>
          )}
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">{attendance.memberName}</h2>
          <div className="flex items-center space-x-2">
            {getStatusBadge(attendance.checkOut)}
            <span className="text-sm text-muted-foreground flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {format(new Date(attendance.date), 'MMMM dd, yyyy')}
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Attendance Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Attendance Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground flex items-center">
              <LogIn className="h-4 w-4 mr-1" />
              Check In Time
            </p>
            <p className="text-foreground font-semibold">
              {format(new Date(attendance.checkIn), 'hh:mm aa')}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(attendance.checkIn), 'MMMM dd, yyyy')}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground flex items-center">
              <LogOut className="h-4 w-4 mr-1" />
              Check Out Time
            </p>
            {attendance.checkOut ? (
              <>
                <p className="text-foreground font-semibold">
                  {format(new Date(attendance.checkOut), 'hh:mm aa')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(attendance.checkOut), 'MMMM dd, yyyy')}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground italic">Still checked in</p>
            )}
          </div>
          <div className="col-span-2">
            <p className="text-sm font-medium text-muted-foreground">Duration</p>
            <p className="text-foreground font-semibold text-lg">
              {calculateDuration(attendance.checkIn, attendance.checkOut)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Member Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Member Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Member ID</p>
            <p className="text-foreground font-mono text-sm">{attendance.memberId}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Full Name</p>
            <p className="text-foreground">{attendance.memberName}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Attendance ID</p>
            <p className="text-foreground font-mono text-sm">{attendance.id}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Date</p>
            <p className="text-foreground">{format(new Date(attendance.date), 'EEEE, MMMM dd, yyyy')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};