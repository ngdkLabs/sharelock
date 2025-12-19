import { useState, useEffect, useCallback } from 'react';
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
}

export const useMessages = (friendId: string | null) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

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

  // Send a text message
  const sendMessage = async (content: string) => {
    if (!user || !friendId || !content.trim()) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: friendId,
          content: content.trim()
        })
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
  const sendImageMessage = async (file: File) => {
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

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: friendId,
          content: '',
          image_url: urlData.publicUrl
        })
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

  // Subscribe to realtime messages
  useEffect(() => {
    if (!user || !friendId) return;

    fetchMessages();
    requestNotificationPermission();

    const channel = supabase
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
          
          // Only add if it's relevant to this conversation
          if (
            (newMessage.sender_id === user.id && newMessage.receiver_id === friendId) ||
            (newMessage.sender_id === friendId && newMessage.receiver_id === user.id)
          ) {
            setMessages(prev => {
              // Check if message already exists
              if (prev.some(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
            
            // Show notification if we received it and app is not visible
            if (newMessage.receiver_id === user.id) {
              showNotification('Teman', newMessage.content || '📍 Berbagi lokasi');
              
              // Mark as read
              supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', newMessage.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, friendId]);

  return {
    messages,
    loading,
    sendMessage,
    sendImageMessage,
    sendLocationMessage,
    getUnreadCount,
    refetch: fetchMessages
  };
};
