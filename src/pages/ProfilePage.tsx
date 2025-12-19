import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Settings, Bell, Shield, LogOut, ChevronRight, MapPin, Camera, Loader2, Edit2, AlertTriangle } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useFriends } from "@/hooks/useFriends";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import bgBlur from "@/assets/bg-blur.png";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, loading, updateProfile, uploadAvatar } = useProfile();
  const { friends } = useFriends();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    full_name: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(file.type) || !allowedExtensions.includes(fileExtension)) {
      toast.error("Please select a JPG, PNG, or WebP image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);
    const { error } = await uploadAvatar(file);
    setIsUploading(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success("Avatar updated!");
    }
  };

  const handleEditOpen = () => {
    setEditForm({
      username: profile?.username || "",
      full_name: profile?.full_name || "",
    });
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    const { error } = await updateProfile({
      username: editForm.username,
      full_name: editForm.full_name,
    });

    if (error) {
      toast.error(error);
    } else {
      toast.success("Profile updated!");
      setIsEditing(false);
    }
  };

  const handleToggleSharing = async (checked: boolean) => {
    await updateProfile({ is_sharing_location: checked });
    toast.success(checked ? "Location sharing enabled" : "Location sharing disabled");
  };

  const handleToggleSOSAlarm = async (checked: boolean) => {
    await updateProfile({ sos_alarm_enabled: checked });
    toast.success(checked ? "SOS alarm enabled" : "SOS alarm disabled");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pb-24">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgBlur})` }}
      />
      
      {/* Header */}
      <div className="relative z-10 bg-card/80 backdrop-blur-sm border-b border-border px-4 py-6 sticky top-0 z-40">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
          <div className="relative inline-block">
            <button onClick={handleAvatarClick} className="relative group">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="w-20 h-20 rounded-full object-cover border-4 border-primary"
                />
              ) : (
                <UserAvatar name={profile?.username || "User"} size="xl" showRing />
              )}
              <div className="absolute inset-0 rounded-full bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {isUploading ? (
                  <Loader2 className="w-6 h-6 text-card animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-card" />
                )}
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-xl font-bold text-foreground">
                {profile?.full_name || profile?.username}
              </h1>
              <button onClick={handleEditOpen} className="text-muted-foreground hover:text-foreground">
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">@{profile?.username}</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm">
            {profile?.is_sharing_location ? (
              <>
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-primary font-medium">Location sharing active</span>
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Location sharing off</span>
              </>
            )}
          </div>
        </motion.div>
      </div>

      <div className="relative z-10 px-4 py-4 space-y-4">
        {/* Quick Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-2xl p-4 text-center shadow-soft border border-border/50">
            <p className="text-2xl font-bold text-primary">{friends.length}</p>
            <p className="text-xs text-muted-foreground">Friends</p>
          </div>
          <div className="bg-card rounded-2xl p-4 text-center shadow-soft border border-border/50">
            <p className="text-2xl font-bold text-primary">
              {profile?.is_sharing_location ? "On" : "Off"}
            </p>
            <p className="text-xs text-muted-foreground">Sharing</p>
          </div>
        </motion.div>

        {/* Settings */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Settings</h2>
          <div className="bg-card rounded-2xl divide-y divide-border shadow-soft border border-border/50">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">Share Location</span>
              </div>
              <Switch
                checked={profile?.is_sharing_location ?? true}
                onCheckedChange={handleToggleSharing}
              />
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <div>
                  <span className="font-medium text-foreground">SOS Alarm</span>
                  <p className="text-xs text-muted-foreground">Sound & vibration for SOS</p>
                </div>
              </div>
              <Switch
                checked={profile?.sos_alarm_enabled ?? true}
                onCheckedChange={handleToggleSOSAlarm}
              />
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-foreground">Notifications</span>
              </div>
              <Switch defaultChecked />
            </div>
            <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-foreground">Privacy</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-foreground">Preferences</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </motion.div>

        {/* Account info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card rounded-2xl p-4 shadow-soft border border-border/50">
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <p className="text-sm font-medium text-foreground">{user?.email}</p>
        </motion.div>

        <Button
          variant="outline"
          className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive/10 rounded-xl"
          onClick={handleSignOut}
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </Button>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="bg-card border border-border shadow-elevated rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Username</label>
              <Input
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                className="mt-1 rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <Input
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                className="mt-1 rounded-xl"
              />
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl" onClick={handleSaveProfile}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;
