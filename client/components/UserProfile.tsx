import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { signOutUser, updateUserProfile } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Edit, Save, X, User, Mail, Building, Calendar } from 'lucide-react';

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
      <Card className="w-full max-w-2xl mx-auto bg-card border-border">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentUser || !userProfile) {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-card border-border shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            User Profile
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="text-destructive hover:text-destructive/90 border-border hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</label>
                <p className="text-sm font-medium text-foreground">{currentUser.email}</p>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="displayName" className="text-sm font-medium text-foreground mb-2 block">
                    Display Name
                  </label>
                  <Input
                    id="displayName"
                    value={editForm.displayName}
                    onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                    placeholder="Enter display name"
                    className="bg-input border-border text-foreground"
                  />
                </div>
                
                <div>
                  <label htmlFor="role" className="text-sm font-medium text-foreground mb-2 block">
                    Role
                  </label>
                  <Input
                    id="role"
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    placeholder="Enter your role"
                    className="bg-input border-border text-foreground"
                  />
                </div>
                
                <div>
                  <label htmlFor="company" className="text-sm font-medium text-foreground mb-2 block">
                    Company
                  </label>
                  <Input
                    id="company"
                    value={editForm.company}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                    placeholder="Enter company name"
                    className="bg-input border-border text-foreground"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <User className="h-5 w-5 text-primary" />
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Display Name</label>
                    <p className="text-sm font-medium text-foreground">{userProfile.displayName || 'Not set'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Building className="h-5 w-5 text-primary" />
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Role</label>
                    <p className="text-sm font-medium text-foreground">{userProfile.role || 'Not set'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Building className="h-5 w-5 text-primary" />
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Company</label>
                    <p className="text-sm font-medium text-foreground">{userProfile.company || 'Not set'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Member Since</label>
                <p className="text-sm font-medium text-foreground">
                  {userProfile.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <h4 className="font-semibold text-foreground mb-2">Account Status</h4>
              <div className="flex items-center gap-2">
                <Badge className="bg-success/20 text-success border-success/30">
                  Active
                </Badge>
                <Badge variant="outline" className="border-primary/30 text-primary">
                  Pro Plan
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center pt-6 border-t border-border">
          {isEditing ? (
            <div className="flex space-x-3">
              <Button
                onClick={handleSave}
                disabled={updating}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Save className="h-4 w-4 mr-2" />
                {updating ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                className="border-border hover:bg-accent"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              className="border-border hover:bg-accent"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};