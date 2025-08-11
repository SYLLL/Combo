import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { signOutUser, updateUserProfile } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Edit, Save, X } from 'lucide-react';

export const UserProfile = () => {
  const { currentUser, userProfile, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: userProfile?.displayName || '',
    role: userProfile?.role || '',
    company: userProfile?.company || ''
  });
  const [updating, setUpdating] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    
    setUpdating(true);
    try {
      const result = await updateUserProfile(currentUser.uid, editForm);
      if (result.success) {
        setIsEditing(false);
        // The useAuth hook will automatically update the userProfile
      } else {
        console.error('Failed to update profile:', result.error);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      displayName: userProfile?.displayName || '',
      role: userProfile?.role || '',
      company: userProfile?.company || ''
    });
    setIsEditing(false);
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (!currentUser || !userProfile) {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>User Profile</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="text-red-600 hover:text-red-700"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Email</label>
          <p className="text-sm">{currentUser.email}</p>
        </div>

        {isEditing ? (
          <>
            <div>
              <label htmlFor="displayName" className="text-sm font-medium text-foreground">
                Display Name
              </label>
              <Input
                id="displayName"
                value={editForm.displayName}
                onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                placeholder="Enter display name"
              />
            </div>
            
            <div>
              <label htmlFor="role" className="text-sm font-medium text-foreground">
                Role
              </label>
              <Input
                id="role"
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                placeholder="Enter your role"
              />
            </div>
            
            <div>
              <label htmlFor="company" className="text-sm font-medium text-foreground">
                Company
              </label>
              <Input
                id="company"
                value={editForm.company}
                onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                placeholder="Enter company name"
              />
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={handleSave}
                disabled={updating}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {updating ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Display Name</label>
              <p className="text-sm">{userProfile.displayName || 'Not set'}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Role</label>
              <p className="text-sm">{userProfile.role || 'Not set'}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Company</label>
              <p className="text-sm">{userProfile.company || 'Not set'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Member Since</label>
              <p className="text-sm">
                {userProfile.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Unknown'}
              </p>
            </div>

            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              className="w-full"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
