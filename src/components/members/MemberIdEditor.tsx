import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/utils/database';
import { Edit, Save, X } from 'lucide-react';

interface MemberIdEditorProps {
  memberId: string;
  currentMemberId: string;
  memberName: string;
  onUpdate: (newMemberId: string) => void;
}

export const MemberIdEditor: React.FC<MemberIdEditorProps> = ({
  memberId,
  currentMemberId,
  memberName,
  onUpdate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newMemberId, setNewMemberId] = useState(currentMemberId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const validateMemberId = async (memberIdValue: string) => {
    if (!memberIdValue || memberIdValue.trim() === '') {
      setError('Member ID is required');
      return false;
    }

    if (!/^\d+$/.test(memberIdValue)) {
      setError('Member ID must contain only numbers');
      return false;
    }

    if (memberIdValue === currentMemberId) {
      setError(null);
      return true;
    }

    try {
      const result = await db.checkMemberNumberAvailable(memberIdValue, memberId);
      if (!result.available) {
        setError('This member ID is already taken');
        return false;
      } else {
        setError(null);
        return true;
      }
    } catch (error) {
      console.error('Error validating member ID:', error);
      setError('Error validating member ID');
      return false;
    }
  };

  const handleSave = async () => {
    if (newMemberId === currentMemberId) {
      setIsOpen(false);
      return;
    }

    const isValid = await validateMemberId(newMemberId);
    if (!isValid) return;

    setIsLoading(true);
    try {
      const result = await db.updateMemberNumber(memberId, newMemberId);
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Member ID updated from ${currentMemberId} to ${newMemberId}`,
        });
        onUpdate(newMemberId);
        setIsOpen(false);
      } else {
        setError(result.error || 'Failed to update member ID');
        toast({
          title: "Error",
          description: result.error || 'Failed to update member ID',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating member ID:', error);
      setError('An error occurred while updating member ID');
      toast({
        title: "Error",
        description: "An error occurred while updating member ID",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setNewMemberId(currentMemberId);
    setError(null);
    setIsOpen(false);
  };

  const handleInputChange = (value: string) => {
    setNewMemberId(value);
    setError(null);
    
    // Debounced validation
    if (value && value !== currentMemberId) {
      setTimeout(() => validateMemberId(value), 500);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="h-8 w-8 p-0"
        title="Edit Member ID"
      >
        <Edit className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Member ID</DialogTitle>
            <DialogDescription>
              Update the member ID for {memberName}. This will update all related records.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentId">Current Member ID</Label>
              <Input
                id="currentId"
                value={currentMemberId}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newId">New Member ID</Label>
              <Input
                id="newId"
                value={newMemberId}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Enter new member ID"
                className={error ? "border-destructive" : ""}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Member ID must be unique and contain only numbers
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || !!error || newMemberId === currentMemberId}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};