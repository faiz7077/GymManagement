import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LegacyStaff as Staff, db } from '@/utils/database';
import { cn } from '@/lib/utils';

interface StaffCheckInFormProps {
  onSubmit: (staffId: string, staffName: string, profileImage?: string) => void;
  onCancel: () => void;
}

export const StaffAttendanceForm: React.FC<StaffCheckInFormProps> = ({ onSubmit, onCancel }) => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Fetch only active staff to check in
    const fetchActiveStaff = async () => {
      const allStaff = await db.getAllStaff();
      const active = allStaff.filter(s => s.status === 'active');
      setStaff(active);
    };
    fetchActiveStaff();
  }, []);

  const handleCheckIn = () => {
    if (!selectedStaffId) return;
    const staffMember = staff.find(s => s.id === selectedStaffId);
    if (staffMember) {
      onSubmit(staffMember.id, staffMember.name, staffMember.profileImage);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  
  const selectedStaff = staff.find(s => s.id === selectedStaffId);

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Staff Member to Check In</label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              <div className="flex items-center space-x-2">
                {selectedStaff ? (
                  <>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={selectedStaff.profileImage || undefined} className="object-cover" />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getInitials(selectedStaff.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{selectedStaff.name} - {selectedStaff.role}</span>
                  </>
                ) : (
                  <span>Select staff member...</span>
                )}
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[450px] p-0">
            <Command>
              <CommandInput placeholder="Search staff member..." />
              <CommandList>
                <CommandEmpty>No staff member found.</CommandEmpty>
                <CommandGroup>
                  {staff.map((staffMember) => (
                    <CommandItem
                      key={staffMember.id}
                      value={staffMember.name}
                      onSelect={() => {
                        setSelectedStaffId(staffMember.id);
                        setOpen(false);
                      }}
                      className="flex items-center space-x-2"
                    >
                      <Check
                        className={cn(
                          "h-4 w-4",
                          selectedStaffId === staffMember.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={staffMember.profileImage || undefined} className="object-cover" />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {getInitials(staffMember.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span>{staffMember.name}</span>
                        <span className="text-xs text-muted-foreground">{staffMember.role}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex justify-end space-x-2">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleCheckIn} disabled={!selectedStaffId}>
          Check In Staff
        </Button>
      </div>
    </div>
  );
};