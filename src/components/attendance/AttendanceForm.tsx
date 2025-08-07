import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LegacyMember as Member, db } from '@/utils/database';
import { cn } from '@/lib/utils';

interface CheckInFormProps {
  onSubmit: (memberId: string, memberName: string, profileImage?: string) => void;
  onCancel: () => void;
}

export const AttendaceForm: React.FC<CheckInFormProps> = ({ onSubmit, onCancel }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Fetch only active members to check in
    const fetchActiveMembers = async () => {
      const allMembers = await db.getAllMembers();
      const active = allMembers.filter(m => m.status === 'active');
      setMembers(active);
    };
    fetchActiveMembers();
  }, []);

  const handleCheckIn = () => {
    if (!selectedMemberId) return;
    const member = members.find(m => m.id === selectedMemberId);
    if (member) {
      onSubmit(member.id, member.name, member.profileImage);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  
  const selectedMember = members.find(m => m.id === selectedMemberId);

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Member to Check In</label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              <div className="flex items-center space-x-2">
                {selectedMember ? (
                  <>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={selectedMember.profileImage || undefined} className="object-cover" />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getInitials(selectedMember.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{selectedMember.name}</span>
                  </>
                ) : (
                  <span>Select member...</span>
                )}
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[450px] p-0">
            <Command>
              <CommandInput placeholder="Search member..." />
              <CommandList>
                <CommandEmpty>No member found.</CommandEmpty>
                <CommandGroup>
                  {members.map((member) => (
                    <CommandItem
                      key={member.id}
                      value={member.name}
                      onSelect={() => {
                        setSelectedMemberId(member.id);
                        setOpen(false);
                      }}
                      className="flex items-center space-x-2"
                    >
                      <Check
                        className={cn(
                          "h-4 w-4",
                          selectedMemberId === member.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={member.profileImage || undefined} className="object-cover" />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{member.name}</span>
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
        <Button onClick={handleCheckIn} disabled={!selectedMemberId}>
          Check In Member
        </Button>
      </div>
    </div>
  );
};