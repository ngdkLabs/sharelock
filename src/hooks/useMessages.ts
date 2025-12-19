import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_address: string | null;
  is_read: boolean;
  created_at: string;
  reply_to_id: string | null;
  reply_to_content: string | null;
  reply_to_sender_name: string | null;
}

export const useMessages = (friendId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!user || !friendId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [user, friendId]);

  // Send text message
  const sendMessage = async (content: string, replyTo?: Message | null) => {
    if (!user || !friendId || !content.trim()) return;

    setSending(true);
    try {
      const messageData: any = {
        sender_id: user.id,
        receiver_id: friendId,
        content: content.trim(),
      };

      if (replyTo) {
        messageData.reply_to_id = replyTo.id;
        messageData.reply_to_content = replyTo.content.substring(0, 100);
      }

      const { error } = await supabase
        .from('messages')
        .insert(messageData);

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Gagal mengirim pesan');
    } finally {
      setSending(false);
    }
  };

  // Send image message
  const sendImageMessage = async (file: File) => {
    if (!user || !friendId) return;

    setSending(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(fileName);

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: friendId,
          content: '📷 Photo',
          image_url: publicUrl,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending image:', error);
      toast.error('Gagal mengirim gambar');
    } finally {
      setSending(false);
    }
  };

  // Send location message
  const sendLocationMessage = async () => {
    if (!user || !friendId) return;

    setSending(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;

      // Try to get address
      let address = 'Shared location';
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const data = await response.json();
        address = data.display_name || 'Shared location';
      } catch (e) {
        console.log('Could not get address');
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: friendId,
          content: '📍 Location',
          location_lat: latitude,
          location_lng: longitude,
          location_address: address,
        });

      if (error) throw error;
      toast.success('Lokasi terkirim');
    } catch (error) {
      console.error('Error sending location:', error);
      toast.error('Gagal mengirim lokasi');
    } finally {
      setSending(false);
    }
  };

  // Mark messages as read
  const markAsRead = async () => {
    if (!user || !friendId) return;

    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', friendId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user.id);

      if (error) throw error;
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success('Pesan dihapus');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Gagal menghapus pesan');
    }
  };

  // Get unread count
  const getUnreadCount = async (fromUserId: string): Promise<number> => {
    if (!user) return 0;

    try {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', fromUserId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      return count || 0;
    } catch (error) {
      return 0;
    }
  };

  // Realtime subscription
  useEffect(() => {
    if (!user || !friendId) return;

    fetchMessages();

    const channel = supabase
      .channel(`messages-${user.id}-${friendId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as Message;
            if (
              (newMsg.sender_id === user.id && newMsg.receiver_id === friendId) ||
              (newMsg.sender_id === friendId && newMsg.receiver_id === user.id)
            ) {
              setMessages(prev => [...prev, newMsg]);
            }
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(m => m.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            const updatedMsg = payload.new as Message;
            setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, friendId, fetchMessages]);

  return {
    messages,
    loading,
    sending,
    sendMessage,
    sendImageMessage,
    sendLocationMessage,
    markAsRead,
    deleteMessage,
    getUnreadCount,
  };
};
