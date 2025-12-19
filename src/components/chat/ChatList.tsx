import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Search } from 'lucide-react';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { UserAvatar } from '@/components/UserAvatar';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isToday, isYesterday } from 'date-fns';

interface Friend {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface ChatListProps {
  onSelectFriend: (friend: Friend) => void;
  selectedFriendId?: string;
}

interface ChatPreview {
  friendId: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isFromMe: boolean;
}

export const ChatList = ({ onSelectFriend, selectedFriendId }: ChatListProps) => {
  const { user } = useAuth();
  const { friends, loading: friendsLoading } = useFriends();
  const [searchQuery, setSearchQuery] = useState('');
  const [chatPreviews, setChatPreviews] = useState<Record<string, ChatPreview>>({});

  // Fetch last messages and unread counts for each friend
  useEffect(() => {
    if (!user || !friends.length) return;

    const fetchChatPreviews = async () => {
      const previews: Record<string, ChatPreview> = {};

      for (const friend of friends) {
        const friendUserId = friend.profile.user_id;
        
        // Get last message
        const { data: lastMessages } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendUserId}),and(sender_id.eq.${friendUserId},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: false })
          .limit(1);

        // Get unread count
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', friendUserId)
          .eq('receiver_id', user.id)
          .eq('is_read', false);

        if (lastMessages && lastMessages.length > 0) {
          const lastMsg = lastMessages[0];
          previews[friendUserId] = {
            friendId: friendUserId,
            lastMessage: lastMsg.content,
            lastMessageTime: lastMsg.created_at,
            unreadCount: unreadCount || 0,
            isFromMe: lastMsg.sender_id === user.id,
          };
        }
      }

      setChatPreviews(previews);
    };

    fetchChatPreviews();

    // Subscribe to new messages
    const channel = supabase
      .channel('chat-list-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchChatPreviews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, friends]);

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Kemarin';
    }
    return format(date, 'dd/MM/yy');
  };

  const filteredFriends = friends.filter(friend =>
    friend.profile.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (friend.profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Sort by last message time
  const sortedFriends = [...filteredFriends].sort((a, b) => {
    const aTime = chatPreviews[a.profile.user_id]?.lastMessageTime;
    const bTime = chatPreviews[b.profile.user_id]?.lastMessageTime;
    if (!aTime && !bTime) return 0;
    if (!aTime) return 1;
    if (!bTime) return -1;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  if (friendsLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full bg-white/10" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24 bg-white/10 mb-2" />
              <Skeleton className="h-3 w-40 bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h1 className="text-xl font-bold text-white mb-4">Pesan</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari teman..."
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {sortedFriends.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <MessageCircle className="w-12 h-12 text-white/20 mb-3" />
            <p className="text-white/40 text-sm">
              {searchQuery ? 'Tidak ada hasil' : 'Belum ada percakapan'}
            </p>
            <p className="text-white/30 text-xs mt-1">
              Tambahkan teman untuk mulai chat
            </p>
          </div>
        ) : (
          sortedFriends.map((friend, index) => {
            const friendUserId = friend.profile.user_id;
            const preview = chatPreviews[friendUserId];
            const isSelected = selectedFriendId === friendUserId;

            return (
              <motion.button
                key={friend.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelectFriend({
                  id: friend.profile.user_id,
                  username: friend.profile.username,
                  full_name: friend.profile.full_name,
                  avatar_url: friend.profile.avatar_url,
                })}
                className={`w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left ${
                  isSelected ? 'bg-white/10' : ''
                }`}
              >
                <div className="relative">
                  <UserAvatar
                    name={friend.profile.username}
                    imageUrl={friend.profile.avatar_url || undefined}
                    size="md"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white truncate">
                      {friend.profile.full_name || friend.profile.username}
                    </span>
                    {preview && (
                      <span className="text-xs text-white/40">
                        {formatMessageTime(preview.lastMessageTime)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-sm text-white/50 truncate">
                      {preview ? (
                        <>
                          {preview.isFromMe && <span className="text-white/30">Anda: </span>}
                          {preview.lastMessage}
                        </>
                      ) : (
                        <span className="text-white/30">Belum ada pesan</span>
                      )}
                    </p>
                    {preview && preview.unreadCount > 0 && (
                      <span className="ml-2 flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                        {preview.unreadCount > 99 ? '99+' : preview.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
};
