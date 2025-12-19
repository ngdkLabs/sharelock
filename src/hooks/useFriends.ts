import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Profile {
  id: string;
  user_id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  is_sharing_location: boolean;
}

interface FriendWithProfile {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  profile: Profile;
  distance?: string;
  lastSeen?: string;
}

export const useFriends = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [myInviteCode, setMyInviteCode] = useState<string | null>(null);

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  // Fetch or create invite code
  const fetchOrCreateInviteCode = useCallback(async () => {
    if (!user) return;

    // Check for existing valid code
    const { data: existingCode } = await supabase
      .from("invite_codes")
      .select("code")
      .eq("user_id", user.id)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (existingCode) {
      setMyInviteCode(existingCode.code);
      return existingCode.code;
    }

    // Create new code
    const newCode = generateCode();
    const { error } = await supabase
      .from("invite_codes")
      .insert({
        code: newCode,
        user_id: user.id,
      });

    if (!error) {
      setMyInviteCode(newCode);
      return newCode;
    }
    return null;
  }, [user]);

  // Refresh invite code
  const refreshInviteCode = async () => {
    if (!user) return null;

    // Delete old codes
    await supabase
      .from("invite_codes")
      .delete()
      .eq("user_id", user.id);

    // Create new code
    const newCode = generateCode();
    const { error } = await supabase
      .from("invite_codes")
      .insert({
        code: newCode,
        user_id: user.id,
      });

    if (!error) {
      setMyInviteCode(newCode);
      return newCode;
    }
    return null;
  };

  // Add friend by code
  const addFriendByCode = async (code: string) => {
    if (!user) return { error: "Not logged in" };

    // Find the invite code
    const { data: inviteCode, error: codeError } = await supabase
      .from("invite_codes")
      .select("user_id")
      .eq("code", code.toUpperCase())
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (codeError || !inviteCode) {
      return { error: "Invalid or expired code" };
    }

    if (inviteCode.user_id === user.id) {
      return { error: "You cannot add yourself" };
    }

    // Check if already friends
    const { data: existing } = await supabase
      .from("friend_connections")
      .select("id")
      .or(`and(user_id.eq.${user.id},friend_id.eq.${inviteCode.user_id}),and(user_id.eq.${inviteCode.user_id},friend_id.eq.${user.id})`)
      .maybeSingle();

    if (existing) {
      return { error: "Already connected with this user" };
    }

    // Create friend connection (auto-accept when using code)
    const { error: insertError } = await supabase
      .from("friend_connections")
      .insert({
        user_id: user.id,
        friend_id: inviteCode.user_id,
        status: "accepted",
      });

    if (insertError) {
      return { error: "Failed to add friend" };
    }

    // Also create reverse connection
    await supabase
      .from("friend_connections")
      .insert({
        user_id: inviteCode.user_id,
        friend_id: user.id,
        status: "accepted",
      });

    await fetchFriends();
    return { error: null };
  };

  // Fetch friends
  const fetchFriends = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("friend_connections")
      .select(`
        id,
        user_id,
        friend_id,
        status,
        updated_at
      `)
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (error) {
      console.error("Error fetching friends:", error);
      setLoading(false);
      return;
    }

    // Get all friend user IDs
    const friendIds = data?.map((f) =>
      f.user_id === user.id ? f.friend_id : f.user_id
    ) || [];

    if (friendIds.length === 0) {
      setFriends([]);
      setPendingRequests([]);
      setLoading(false);
      return;
    }

    // Fetch profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("user_id", friendIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));

    const friendsWithProfiles = data?.map((f) => {
      const friendUserId = f.user_id === user.id ? f.friend_id : f.user_id;
      return {
        ...f,
        profile: profileMap.get(friendUserId) as Profile,
      };
    }).filter((f) => f.profile) || [];

    setFriends(friendsWithProfiles.filter((f) => f.status === "accepted"));
    setPendingRequests(friendsWithProfiles.filter((f) => f.status === "pending"));
    setLoading(false);
  }, [user]);

  // Remove friend
  const removeFriend = async (friendId: string) => {
    if (!user) return;

    await supabase
      .from("friend_connections")
      .delete()
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);

    await fetchFriends();
  };

  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchOrCreateInviteCode();
    }
  }, [user, fetchFriends, fetchOrCreateInviteCode]);

  return {
    friends,
    pendingRequests,
    loading,
    myInviteCode,
    addFriendByCode,
    refreshInviteCode,
    removeFriend,
    refetch: fetchFriends,
  };
};
