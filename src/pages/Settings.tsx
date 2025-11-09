import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Settings as SettingsIcon, 
  Lock, 
  User, 
  Eye, 
  EyeOff,
  Shield,
  Save,
  Edit,
  Users as UsersIcon,
  RefreshCw
} from 'lucide-react';
import { db, User as DbUser } from '@/utils/database';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export const Settings: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Profile editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  
  // All users management
  const [allUsers, setAllUsers] = useState<DbUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editUserData, setEditUserData] = useState<{ name: string; email: string; phone: string }>({ name: '', email: '', phone: '' });
  const [editUserPassword, setEditUserPassword] = useState('');
  const [showEditUserPassword, setShowEditUserPassword] = useState(false);

  // Role permissions management
  const [rolePermissions, setRolePermissions] = useState<Record<string, Record<string, boolean>>>({
    trainer: {},
    receptionist: {}
  });
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  const { user, logout, refreshUser } = useAuth();
  const { toast } = useToast();
  const { state: sidebarState } = useSidebar();

  // Available permissions with descriptions
  const availablePermissions = [
    { key: 'VIEW_MEMBERS', label: 'View Members', description: 'View member list and details' },
    { key: 'ADD_MEMBER', label: 'Add Members', description: 'Create new member accounts' },
    { key: 'EDIT_MEMBER', label: 'Edit Members', description: 'Modify member information' },
    { key: 'DELETE_MEMBER', label: 'Delete Members', description: 'Remove member accounts' },
    { key: 'VIEW_ATTENDANCE', label: 'View Attendance', description: 'View attendance records' },
    { key: 'MARK_ATTENDANCE', label: 'Mark Attendance', description: 'Check-in/out members' },
    { key: 'VIEW_MEASUREMENTS', label: 'View Measurements', description: 'View body measurements' },
    { key: 'ADD_MEASUREMENTS', label: 'Add Measurements', description: 'Record body measurements' },
    { key: 'MANAGE_STAFF', label: 'Manage Staff', description: 'Manage staff members' },
    { key: 'VIEW_RECEIPTS', label: 'View Receipts', description: 'View payment receipts' },
    { key: 'CREATE_RECEIPTS', label: 'Create Receipts', description: 'Generate new receipts' },
    { key: 'MANAGE_RECEIPTS', label: 'Manage Receipts', description: 'Edit/delete receipts' },
    { key: 'VIEW_ENQUIRIES', label: 'View Enquiries', description: 'View enquiry list' },
    { key: 'MANAGE_ENQUIRIES', label: 'Manage Enquiries', description: 'Create/edit enquiries' },
    { key: 'VIEW_REPORTS', label: 'View Reports', description: 'Access reports and analytics' },
    { key: 'MANAGE_EXPENSES', label: 'Manage Expenses', description: 'Track and manage expenses' },
    { key: 'MANAGE_SALARIES', label: 'Manage Salaries', description: 'Process staff salaries' },
  ];

  useEffect(() => {
    if (user) {
      setEditedName(user.name);
      setEditedEmail(user.email || '');
      setEditedPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAllUsers();
      loadRolePermissions();
    }
  }, [user]);

  const loadAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const users = await db.getAllUsers();
      setAllUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadRolePermissions = async () => {
    setLoadingPermissions(true);
    try {
      const allPerms = await db.getAllRolePermissions();
      const permMap: Record<string, Record<string, boolean>> = {
        trainer: {},
        receptionist: {}
      };
      
      allPerms.forEach((perm: any) => {
        if (!permMap[perm.role]) {
          permMap[perm.role] = {};
        }
        permMap[perm.role][perm.permission] = perm.enabled === 1;
      });
      
      setRolePermissions(permMap);
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast({
        title: "Error",
        description: "Failed to load role permissions",
        variant: "destructive",
      });
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handlePermissionToggle = async (role: string, permission: string, enabled: boolean) => {
    try {
      const success = await db.setRolePermission(role, permission, enabled);
      
      if (success) {
        setRolePermissions(prev => ({
          ...prev,
          [role]: {
            ...prev[role],
            [permission]: enabled
          }
        }));
        
        toast({
          title: "Success",
          description: `Permission ${enabled ? 'enabled' : 'disabled'} for ${role}`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update permission",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating permission:', error);
      toast({
        title: "Error",
        description: "An error occurred while updating permission",
        variant: "destructive",
      });
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;

    if (!editedName.trim()) {
      toast({
        title: "Error",
        description: "Name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const success = await db.updateUser(user.id, {
        name: editedName.trim(),
        email: editedEmail.trim() || undefined,
        phone: editedPhone.trim() || undefined,
      });

      if (success) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
        setIsEditingProfile(false);
        // Refresh user data
        await refreshUser();
      } else {
        toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Error",
        description: "An error occurred while updating profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New password and confirm password do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "New password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    if (currentPassword === newPassword) {
      toast({
        title: "Error",
        description: "New password must be different from current password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Verify current password
      const isCurrentPasswordValid = await db.authenticateUser(user.username, currentPassword);
      
      if (!isCurrentPasswordValid) {
        toast({
          title: "Error",
          description: "Current password is incorrect",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Update password
      const success = await db.updateUserPassword(user.id, newPassword);
      
      if (success) {
        toast({
          title: "Success",
          description: "Password updated successfully. Please login again with your new password.",
        });
        
        // Clear form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Logout user to force re-login with new password
        setTimeout(() => {
          logout();
        }, 2000);
      } else {
        toast({
          title: "Error",
          description: "Failed to update password. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast({
        title: "Error",
        description: "An error occurred while updating password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (userId: string) => {
    const userToEdit = allUsers.find(u => u.id === userId);
    if (userToEdit) {
      setEditingUser(userId);
      setEditUserData({
        name: userToEdit.name,
        email: userToEdit.email || '',
        phone: userToEdit.phone || '',
      });
      setEditUserPassword('');
    }
  };

  const handleSaveUserEdit = async (userId: string) => {
    if (!editUserData.name.trim()) {
      toast({
        title: "Error",
        description: "Name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const updateData: any = {
        name: editUserData.name.trim(),
        email: editUserData.email.trim() || undefined,
        phone: editUserData.phone.trim() || undefined,
      };

      // If password is provided, include it
      if (editUserPassword.trim()) {
        if (editUserPassword.length < 6) {
          toast({
            title: "Error",
            description: "Password must be at least 6 characters long",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        updateData.password = editUserPassword.trim();
      }

      const success = await db.updateUser(userId, updateData);

      if (success) {
        toast({
          title: "Success",
          description: editUserPassword.trim() 
            ? "User updated successfully. They will need to login with the new password." 
            : "User updated successfully",
        });
        setEditingUser(null);
        setEditUserPassword('');
        await loadAllUsers();
        
        // If current user was edited, refresh their data
        if (userId === user?.id) {
          await refreshUser();
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to update user",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('User update error:', error);
      toast({
        title: "Error",
        description: "An error occurred while updating user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-300';
      case 'trainer': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'receptionist': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-muted-foreground">
                Only administrators can access the settings page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in w-full h-full flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 border-b bg-background px-6 py-4">
        <div className="flex items-center gap-3">
          {sidebarState === 'collapsed' && <SidebarTrigger />}
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gym-primary to-primary-glow bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-muted-foreground">
              Manage your account settings and user accounts
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">My Profile</TabsTrigger>
            <TabsTrigger value="password">Change Password</TabsTrigger>
            {user?.role === 'admin' && (
              <>
                <TabsTrigger value="users">Manage Users</TabsTrigger>
                <TabsTrigger value="permissions">Role Permissions</TabsTrigger>
                <TabsTrigger value="system">System</TabsTrigger>
              </>
            )}
          </TabsList>

          {/* My Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  My Profile
                </CardTitle>
                <CardDescription>
                  View and update your profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Username</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    <span className="text-sm">{user.username}</span>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="name">Name</Label>
                  {isEditingProfile ? (
                    <Input
                      id="name"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      placeholder="Enter your name"
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-muted rounded-md">
                      <span className="text-sm">{user.name}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  {isEditingProfile ? (
                    <Input
                      id="email"
                      type="email"
                      value={editedEmail}
                      onChange={(e) => setEditedEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-muted rounded-md">
                      <span className="text-sm">{user.email || 'Not set'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  {isEditingProfile ? (
                    <Input
                      id="phone"
                      type="tel"
                      value={editedPhone}
                      onChange={(e) => setEditedPhone(e.target.value)}
                      placeholder="Enter your phone number"
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-muted rounded-md">
                      <span className="text-sm">{user.phone || 'Not set'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium">Role</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    <span className="text-sm capitalize">{user.role}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {isEditingProfile ? (
                    <>
                      <Button onClick={handleProfileUpdate} disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsEditingProfile(false);
                          setEditedName(user.name);
                          setEditedEmail(user.email || '');
                          setEditedPhone(user.phone || '');
                        }}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditingProfile(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Change Password Tab */}
          <TabsContent value="password" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your password for enhanced security
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative mt-1">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative mt-1">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min 6 characters)"
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative mt-1">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Updating Password...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Update Password
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card className="border-warning/20 bg-warning/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-warning mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-warning mb-1">Security Notice</h4>
                    <p className="text-sm text-muted-foreground">
                      After changing your password, you will be automatically logged out and need to 
                      sign in again with your new password. Make sure to remember your new password 
                      as it cannot be recovered.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <UsersIcon className="h-5 w-5" />
                      Manage Users
                    </CardTitle>
                    <CardDescription>
                      View and manage all user accounts (Admin, Trainers, Receptionists)
                    </CardDescription>
                  </div>
                  <Button onClick={loadAllUsers} disabled={loadingUsers} variant="outline" size="sm">
                    <RefreshCw className={`h-4 w-4 mr-2 ${loadingUsers ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allUsers.map((u) => (
                      <Card key={u.id} className={u.id === user.id ? 'border-primary' : ''}>
                        <CardContent className="pt-6">
                          {editingUser === u.id ? (
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor={`edit-name-${u.id}`}>Name</Label>
                                <Input
                                  id={`edit-name-${u.id}`}
                                  value={editUserData.name}
                                  onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                                  placeholder="Enter name"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`edit-email-${u.id}`}>Email</Label>
                                <Input
                                  id={`edit-email-${u.id}`}
                                  type="email"
                                  value={editUserData.email}
                                  onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                                  placeholder="Enter email"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`edit-phone-${u.id}`}>Phone</Label>
                                <Input
                                  id={`edit-phone-${u.id}`}
                                  type="tel"
                                  value={editUserData.phone}
                                  onChange={(e) => setEditUserData({ ...editUserData, phone: e.target.value })}
                                  placeholder="Enter phone number"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`edit-password-${u.id}`}>New Password (Optional)</Label>
                                <div className="relative mt-1">
                                  <Input
                                    id={`edit-password-${u.id}`}
                                    type={showEditUserPassword ? "text" : "password"}
                                    value={editUserPassword}
                                    onChange={(e) => setEditUserPassword(e.target.value)}
                                    placeholder="Leave empty to keep current password"
                                    minLength={6}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowEditUserPassword(!showEditUserPassword)}
                                  >
                                    {showEditUserPassword ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                                {editUserPassword && editUserPassword.length < 6 && (
                                  <p className="text-xs text-destructive mt-1">Password must be at least 6 characters</p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={() => handleSaveUserEdit(u.id)} disabled={isLoading}>
                                  {isLoading ? (
                                    <>
                                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                      Saving...
                                    </>
                                  ) : (
                                    <>
                                      <Save className="h-4 w-4 mr-2" />
                                      Save Changes
                                    </>
                                  )}
                                </Button>
                                <Button 
                                  variant="outline" 
                                  onClick={() => {
                                    setEditingUser(null);
                                    setEditUserPassword('');
                                  }}
                                  disabled={isLoading}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-lg">{u.name}</h3>
                                  <Badge className={getRoleBadgeColor(u.role)}>
                                    {u.role}
                                  </Badge>
                                  {u.id === user.id && (
                                    <Badge variant="outline">You</Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground space-y-1">
                                  <p><span className="font-medium">Username:</span> {u.username}</p>
                                  <p><span className="font-medium">Email:</span> {u.email || 'Not set'}</p>
                                  <p><span className="font-medium">Phone:</span> {u.phone || 'Not set'}</p>
                                </div>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditUser(u.id)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Role Permissions Tab */}
          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Role Permissions
                    </CardTitle>
                    <CardDescription>
                      Configure what features trainers and receptionists can access
                    </CardDescription>
                  </div>
                  <Button onClick={loadRolePermissions} disabled={loadingPermissions} variant="outline" size="sm">
                    <RefreshCw className={`h-4 w-4 mr-2 ${loadingPermissions ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingPermissions ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Trainer Permissions */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Badge className="bg-blue-100 text-blue-800 border-blue-300">Trainer</Badge>
                        <span className="text-sm text-muted-foreground">
                          Configure permissions for trainer role
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availablePermissions.map((perm) => (
                          <Card key={`trainer-${perm.key}`} className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium">{perm.label}</h4>
                                </div>
                                <p className="text-sm text-muted-foreground">{perm.description}</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer ml-4">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={rolePermissions.trainer[perm.key] || false}
                                  onChange={(e) => handlePermissionToggle('trainer', perm.key, e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Receptionist Permissions */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Badge className="bg-green-100 text-green-800 border-green-300">Receptionist</Badge>
                        <span className="text-sm text-muted-foreground">
                          Configure permissions for receptionist role
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availablePermissions.map((perm) => (
                          <Card key={`receptionist-${perm.key}`} className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium">{perm.label}</h4>
                                </div>
                                <p className="text-sm text-muted-foreground">{perm.description}</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer ml-4">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={rolePermissions.receptionist[perm.key] || false}
                                  onChange={(e) => handlePermissionToggle('receptionist', perm.key, e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                              </label>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Permission Management</h4>
                    <p className="text-sm text-blue-800">
                      Toggle permissions to control what features each role can access. Changes take effect immediately.
                      Users will need to log out and log back in to see the updated permissions in their navigation menu.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          {user?.role === 'admin' && (
            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SettingsIcon className="h-5 w-5" />
                    System Information
                  </CardTitle>
                  <CardDescription>
                    View system information and database location
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <DatabaseLocation />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

// Database Location Component
const DatabaseLocation: React.FC = () => {
  const [dbPath, setDbPath] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDatabasePath();
  }, []);

  const loadDatabasePath = async () => {
    try {
      setLoading(true);
      const result = await window.electronAPI.getDatabasePath();
      if (result.success) {
        setDbPath(result.path);
      } else {
        toast({
          title: "Error",
          description: "Failed to get database path",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading database path:', error);
      toast({
        title: "Error",
        description: "Failed to load database information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFolder = async () => {
    try {
      const result = await window.electronAPI.openDatabaseFolder();
      if (result.success) {
        toast({
          title: "Success",
          description: "Database folder opened in file explorer",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to open database folder",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error opening database folder:', error);
      toast({
        title: "Error",
        description: "Failed to open database folder",
        variant: "destructive",
      });
    }
  };

  const handleCopyPath = () => {
    navigator.clipboard.writeText(dbPath);
    toast({
      title: "Copied",
      description: "Database path copied to clipboard",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">Database Location</Label>
        <p className="text-sm text-muted-foreground mt-1">
          The database file is stored at the following location on your system
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          value={dbPath}
          readOnly
          className="font-mono text-sm"
        />
        <Button
          variant="outline"
          onClick={handleCopyPath}
          title="Copy path to clipboard"
        >
          Copy
        </Button>
        <Button
          onClick={handleOpenFolder}
          title="Open database folder in file explorer"
        >
          Open Folder
        </Button>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Important Information</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
          <li>This is the location of your gym management database</li>
          <li>Regular backups of this file are recommended</li>
          <li>Do not modify or delete this file while the application is running</li>
          <li>Keep this file secure as it contains sensitive member information</li>
        </ul>
      </div>
    </div>
  );
};
