import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  image_url?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  location_address?: string | null;
  reply_to_id?: string | null;
  reply_to_content?: string | null;
  reply_to_sender_name?: string | null;
  reactions?: Record<string, string[]> | null;
}

export const useMessages = (friendId: string | null) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [friendIsTyping, setFriendIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  // Show notification for new message
  const showNotification = useCallback((senderName: string, content: string) => {
    if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
      new Notification(`Pesan dari ${senderName}`, {
        body: content || '📷 Mengirim gambar',
        icon: '/favicon.ico',
        tag: 'new-message'
      });
    }
  }, []);

  // Fetch messages with a friend
  const fetchMessages = async () => {
    if (!user || !friendId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},sender_id.eq.${friendId}`)
        .or(`receiver_id.eq.${user.id},receiver_id.eq.${friendId}`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Filter messages for this conversation
      const conversationMessages = (data || []).filter(
        (msg: any) =>
          (msg.sender_id === user.id && msg.receiver_id === friendId) ||
          (msg.sender_id === friendId && msg.receiver_id === user.id)
      ) as Message[];
      
      setMessages(conversationMessages);
      
      // Mark unread messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', friendId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update typing status
  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!user || !friendId) return;

    try {
      await supabase
        .from('typing_status')
        .upsert({
          user_id: user.id,
          friend_id: friendId,
          is_typing: isTyping,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,friend_id'
        });
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  }, [user, friendId]);

  // Handle typing with debounce
  const handleTyping = useCallback(() => {
    setTyping(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 2000);
  }, [setTyping]);

  // Send a text message
  const sendMessage = async (content: string, replyTo?: Message) => {
    if (!user || !friendId || !content.trim()) return;

    setTyping(false);

    try {
      const insertData: any = {
        sender_id: user.id,
        receiver_id: friendId,
        content: content.trim()
      };

      if (replyTo) {
        insertData.reply_to_id = replyTo.id;
        insertData.reply_to_content = replyTo.content || (replyTo.image_url ? '📷 Gambar' : '📍 Lokasi');
        insertData.reply_to_sender_name = replyTo.sender_id === user.id ? 'Anda' : 'Teman';
      }

      const { data, error } = await supabase
        .from('messages')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      toast({
        title: 'Gagal mengirim pesan',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    }
  };

  // Send image message
  const sendImageMessage = async (file: File, replyTo?: Message) => {
    if (!user || !friendId) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('chat-images')
        .getPublicUrl(fileName);

      const insertData: any = {
        sender_id: user.id,
        receiver_id: friendId,
        content: '',
        image_url: urlData.publicUrl
      };

      if (replyTo) {
        insertData.reply_to_id = replyTo.id;
        insertData.reply_to_content = replyTo.content || '📷 Gambar';
        insertData.reply_to_sender_name = replyTo.sender_id === user.id ? 'Anda' : 'Teman';
      }

      const { data, error } = await supabase
        .from('messages')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      toast({
        title: 'Gagal mengirim gambar',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    }
  };

  // Send location message
  const sendLocationMessage = async (lat: number, lng: number, address?: string) => {
    if (!user || !friendId) return null;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: friendId,
          content: address || 'Lokasi saya',
          location_lat: lat,
          location_lng: lng,
          location_address: address
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      toast({
        title: 'Gagal mengirim lokasi',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user.id);

      if (error) throw error;

      // Remove from local state
      setMessages(prev => prev.filter(m => m.id !== messageId));
      
      toast({
        title: 'Pesan dihapus',
        description: 'Pesan telah dihapus untuk semua orang'
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: 'Gagal menghapus pesan',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }
  };

  // Add reaction to message
  const addReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const currentReactions = (message.reactions || {}) as Record<string, string[]>;
      const emojiReactions = currentReactions[emoji] || [];
      
      let newReactions: Record<string, string[]>;
      
      if (emojiReactions.includes(user.id)) {
        // Remove reaction
        newReactions = {
          ...currentReactions,
          [emoji]: emojiReactions.filter(id => id !== user.id)
        };
        // Clean up empty arrays
        if (newReactions[emoji].length === 0) {
          delete newReactions[emoji];
        }
      } else {
        // Add reaction
        newReactions = {
          ...currentReactions,
          [emoji]: [...emojiReactions, user.id]
        };
      }

      const { data, error } = await supabase
        .from('messages')
        .update({ reactions: newReactions } as any)
        .eq('id', messageId);

      if (error) throw error;

      // Update local state
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, reactions: newReactions } : m
      ));
    } catch (error: any) {
      toast({
        title: 'Gagal menambah reaksi',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // Get unread message count
  const getUnreadCount = async () => {
    if (!user) return 0;

    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false);

    if (error) return 0;
    return count || 0;
  };

  // Subscribe to realtime messages and typing status
  useEffect(() => {
    if (!user || !friendId) return;

    fetchMessages();
    requestNotificationPermission();

    // Messages channel
    const messagesChannel = supabase
      .channel(`messages-${friendId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage = payload.new as Message;
          
          if (
            (newMessage.sender_id === user.id && newMessage.receiver_id === friendId) ||
            (newMessage.sender_id === friendId && newMessage.receiver_id === user.id)
          ) {
            setMessages(prev => {
              if (prev.some(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
            
            if (newMessage.receiver_id === user.id) {
              showNotification('Teman', newMessage.content || '📍 Berbagi lokasi');
              supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', newMessage.id);
            }
          }
        }
      )
      .subscribe();

    // Typing status channel
    const typingChannel = supabase
      .channel(`typing-${friendId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_status',
          filter: `user_id=eq.${friendId}`
        },
        (payload) => {
          const status = payload.new as any;
          if (status.friend_id === user.id) {
            setFriendIsTyping(status.is_typing);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(typingChannel);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [user, friendId]);

  return {
    messages,
    loading,
    friendIsTyping,
    sendMessage,
    sendImageMessage,
    sendLocationMessage,
    addReaction,
    deleteMessage,
    handleTyping,
    getUnreadCount,
    refetch: fetchMessages
  };
};
