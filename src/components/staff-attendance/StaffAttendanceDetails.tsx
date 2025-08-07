import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, Calendar, User, Briefcase, Timer, MapPin } from 'lucide-react';

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

interface StaffAttendanceDetailsProps {
  attendance: StaffAttendance;
}

export function StaffAttendanceDetails({ attendance }: StaffAttendanceDetailsProps) {
  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateDuration = (checkIn: string, checkOut?: string) => {
    const start = new Date(checkIn);
    const end = checkOut ? new Date(checkOut) : new Date();
    const diffMs = end.getTime() - start.getTime();
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

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

  const getStatusBadge = () => {
    if (attendance.checkOut) {
      return (
        <Badge className="bg-red-100 text-red-800">
          Checked Out
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-green-100 text-green-800">
          Currently In
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Staff Info Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              {attendance.profileImage ? (
                <img
                  src={attendance.profileImage}
                  alt={attendance.staffName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-medium text-gray-600">
                  {attendance.staffName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{attendance.staffName}</h2>
              <div className="flex items-center space-x-3 mt-2">
                {attendance.role && (
                  <Badge className={getRoleBadgeColor(attendance.role)}>
                    <Briefcase className="h-3 w-3 mr-1" />
                    {attendance.role}
                  </Badge>
                )}
                {getStatusBadge()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Date & Time Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Date & Time Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Date:</span>
              <span className="text-sm">{formatDate(attendance.date)}</span>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Check In:</span>
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-1 text-green-600" />
                {formatTime(attendance.checkIn)}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Check Out:</span>
              <div className="flex items-center text-sm">
                {attendance.checkOut ? (
                  <>
                    <Clock className="h-4 w-4 mr-1 text-red-600" />
                    {formatTime(attendance.checkOut)}
                  </>
                ) : (
                  <span className="text-gray-400">Still in</span>
                )}
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Duration:</span>
              <div className="flex items-center text-sm font-medium">
                <Timer className="h-4 w-4 mr-1 text-blue-600" />
                {calculateDuration(attendance.checkIn, attendance.checkOut)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staff Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Staff Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Staff ID:</span>
              <span className="text-sm font-mono">{attendance.staffId}</span>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Name:</span>
              <span className="text-sm font-medium">{attendance.staffName}</span>
            </div>
            
            {attendance.role && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Role:</span>
                  <Badge className={getRoleBadgeColor(attendance.role)}>
                    {attendance.role}
                  </Badge>
                </div>
              </>
            )}
            
            {attendance.shift && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Shift:</span>
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                    {attendance.shift}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {attendance.staffName}'s Attendance
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {formatDate(attendance.date)}
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-white rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">
                    {formatTime(attendance.checkIn)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Check In Time</div>
                </div>
                
                <div className="bg-white rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-600">
                    {calculateDuration(attendance.checkIn, attendance.checkOut)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {attendance.checkOut ? 'Total Duration' : 'Current Duration'}
                  </div>
                </div>
              </div>
              
              {attendance.checkOut && (
                <div className="mt-4 bg-white rounded-lg p-3">
                  <div className="text-2xl font-bold text-red-600">
                    {formatTime(attendance.checkOut)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Check Out Time</div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}