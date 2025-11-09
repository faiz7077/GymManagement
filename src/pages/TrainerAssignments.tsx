import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/utils/database';
import { 
  Users, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  UserX,
  UserCheck,
  Dumbbell
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const TrainerAssignments: React.FC = () => {
  const { state: sidebarState } = useSidebar();
  const { toast } = useToast();
  
  const [trainers, setTrainers] = useState<any[]>([]);
  const [expandedTrainers, setExpandedTrainers] = useState<Set<string>>(new Set());
  const [trainerMembers, setTrainerMembers] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState<Set<string>>(new Set());
  
  // Reassignment dialog state
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [newTrainerId, setNewTrainerId] = useState<string>('');
  
  // Remove assignment dialog state
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<any>(null);

  useEffect(() => {
    loadTrainers();
  }, []);

  const loadTrainers = async () => {
    setLoading(true);
    try {
      const trainersData = await db.getTrainersWithCounts();
      setTrainers(trainersData);
    } catch (error) {
      console.error('Error loading trainers:', error);
      toast({
        title: "Error",
        description: "Failed to load trainers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTrainerMembers = async (trainerId: string) => {
    if (trainerMembers[trainerId]) {
      return; // Already loaded
    }

    setLoadingMembers(prev => new Set(prev).add(trainerId));
    try {
      const members = await db.getMembersByTrainer(trainerId);
      setTrainerMembers(prev => ({ ...prev, [trainerId]: members }));
    } catch (error) {
      console.error('Error loading trainer members:', error);
      toast({
        title: "Error",
        description: "Failed to load members",
        variant: "destructive",
      });
    } finally {
      setLoadingMembers(prev => {
        const newSet = new Set(prev);
        newSet.delete(trainerId);
        return newSet;
      });
    }
  };

  const toggleTrainerExpanded = (trainerId: string) => {
    const newExpanded = new Set(expandedTrainers);
    if (newExpanded.has(trainerId)) {
      newExpanded.delete(trainerId);
    } else {
      newExpanded.add(trainerId);
      loadTrainerMembers(trainerId);
    }
    setExpandedTrainers(newExpanded);
  };

  const handleReassign = (member: any) => {
    setSelectedMember(member);
    setNewTrainerId('');
    setReassignDialogOpen(true);
  };

  const confirmReassign = async () => {
    if (!selectedMember || !newTrainerId) return;

    try {
      const trainer = trainers.find(t => t.id === newTrainerId);
      const success = await db.assignTrainerToMember(
        selectedMember.id,
        newTrainerId,
        trainer?.name || ''
      );

      if (success) {
        toast({
          title: "Success",
          description: `Member reassigned to ${trainer?.name}`,
        });
        setReassignDialogOpen(false);
        setSelectedMember(null);
        // Reload data
        await loadTrainers();
        setTrainerMembers({});
        setExpandedTrainers(new Set());
      } else {
        toast({
          title: "Error",
          description: "Failed to reassign member",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error reassigning member:', error);
      toast({
        title: "Error",
        description: "An error occurred while reassigning",
        variant: "destructive",
      });
    }
  };

  const handleRemoveAssignment = (member: any) => {
    setMemberToRemove(member);
    setRemoveDialogOpen(true);
  };

  const confirmRemoveAssignment = async () => {
    if (!memberToRemove) return;

    try {
      const success = await db.removeTrainerFromMember(memberToRemove.id);

      if (success) {
        toast({
          title: "Success",
          description: "Trainer assignment removed",
        });
        setRemoveDialogOpen(false);
        setMemberToRemove(null);
        // Reload data
        await loadTrainers();
        setTrainerMembers({});
        setExpandedTrainers(new Set());
      } else {
        toast({
          title: "Error",
          description: "Failed to remove assignment",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast({
        title: "Error",
        description: "An error occurred while removing assignment",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'inactive': return 'bg-destructive text-destructive-foreground';
      case 'frozen': return 'bg-warning text-warning-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const totalMembers = trainers.reduce((sum, trainer) => sum + (trainer.member_count || 0), 0);
  const activeTrainers = trainers.filter(t => t.status === 'active').length;

  return (
    <div className="animate-fade-in w-full h-full flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {sidebarState === 'collapsed' && <SidebarTrigger />}
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gym-primary to-primary-glow bg-clip-text text-transparent">
                Trainer Assignments
              </h1>
              <p className="text-muted-foreground">
                Manage personal trainer assignments for members
              </p>
            </div>
          </div>
          <Button onClick={loadTrainers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Dumbbell className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Trainers</p>
                  <p className="text-lg font-bold">{trainers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <UserCheck className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Trainers</p>
                  <p className="text-lg font-bold">{activeTrainers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Assigned Members</p>
                  <p className="text-lg font-bold">{totalMembers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : trainers.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No trainers found
              </CardContent>
            </Card>
          ) : (
            trainers.map((trainer) => (
              <Card key={trainer.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={trainer.profile_image} />
                        <AvatarFallback>{getInitials(trainer.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {trainer.name}
                          <Badge variant={trainer.status === 'active' ? 'default' : 'secondary'}>
                            {trainer.status}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {trainer.specialization || 'Personal Trainer'} • {trainer.member_count || 0} members assigned
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleTrainerExpanded(trainer.id)}
                    >
                      {expandedTrainers.has(trainer.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                {expandedTrainers.has(trainer.id) && (
                  <CardContent>
                    {loadingMembers.has(trainer.id) ? (
                      <div className="flex justify-center py-4">
                        <RefreshCw className="h-5 w-5 animate-spin" />
                      </div>
                    ) : trainerMembers[trainer.id]?.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">
                        No members assigned to this trainer
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {trainerMembers[trainer.id]?.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={member.member_image} />
                                <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{member.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  ID: {member.custom_member_id || member.id}
                                </p>
                              </div>
                              <Badge className={getStatusColor(member.status)}>
                                {member.status}
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReassign(member)}
                              >
                                Reassign
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveAssignment(member)}
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Reassign Dialog */}
      <AlertDialog open={reassignDialogOpen} onOpenChange={setReassignDialogOpen}>
        <AlertDialogContent className="max-w-md overflow-visible">
          <AlertDialogHeader>
            <AlertDialogTitle>Reassign Member</AlertDialogTitle>
            <AlertDialogDescription>
              Select a new trainer for {selectedMember?.name}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-2">
            <label className="text-sm font-medium">New Trainer</label>
            <Select value={newTrainerId} onValueChange={setNewTrainerId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a trainer" />
              </SelectTrigger>
              <SelectContent 
                position="popper" 
                className="max-h-[200px] z-[100]"
                sideOffset={5}
              >
                {trainers
                  .filter(t => t.id !== selectedMember?.assigned_trainer_id)
                  .map((trainer) => (
                    <SelectItem key={trainer.id} value={trainer.id}>
                      {trainer.name} ({trainer.member_count || 0} members)
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReassign} disabled={!newTrainerId}>
              Reassign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Assignment Dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Trainer Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the trainer assignment for {memberToRemove?.name}?
              This member will no longer have a personal trainer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveAssignment}>
              Remove Assignment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
