import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useTypingStatus = (friendId: string | null) => {
  const { user } = useAuth();
  const [isTyping, setIsTyping] = useState(false);
  const [friendIsTyping, setFriendIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update typing status
  const updateTypingStatus = useCallback(async (typing: boolean) => {
    if (!user || !friendId) return;

    try {
      const { data: existing } = await supabase
        .from('typing_status')
        .select('id')
        .eq('user_id', user.id)
        .eq('friend_id', friendId)
        .single();

      if (existing) {
        await supabase
          .from('typing_status')
          .update({ is_typing: typing, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('typing_status')
          .insert({
            user_id: user.id,
            friend_id: friendId,
            is_typing: typing,
          });
      }

      setIsTyping(typing);
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  }, [user, friendId]);

  // Handle typing with debounce
  const handleTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (!isTyping) {
      updateTypingStatus(true);
    }

    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false);
    }, 2000);
  }, [isTyping, updateTypingStatus]);

  // Stop typing
  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    updateTypingStatus(false);
  }, [updateTypingStatus]);

  // Subscribe to friend's typing status
  useEffect(() => {
    if (!user || !friendId) return;

    // Check initial typing status
    const checkTypingStatus = async () => {
      const { data } = await supabase
        .from('typing_status')
        .select('is_typing, updated_at')
        .eq('user_id', friendId)
        .eq('friend_id', user.id)
        .single();

      if (data) {
        // Check if typing status is recent (within last 3 seconds)
        const updatedAt = new Date(data.updated_at).getTime();
        const now = Date.now();
        setFriendIsTyping(data.is_typing && now - updatedAt < 3000);
      }
    };

    checkTypingStatus();

    const channel = supabase
      .channel(`typing-${friendId}-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_status',
          filter: `user_id=eq.${friendId}`,
        },
        (payload) => {
          if (payload.new) {
            const newStatus = payload.new as { friend_id: string; is_typing: boolean };
            if (newStatus.friend_id === user.id) {
              setFriendIsTyping(newStatus.is_typing);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      stopTyping();
    };
  }, [user, friendId, stopTyping]);

  return {
    isTyping,
    friendIsTyping,
    handleTyping,
    stopTyping,
  };
};
