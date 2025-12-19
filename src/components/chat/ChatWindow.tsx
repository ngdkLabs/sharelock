import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMessages, Message } from '@/hooks/useMessages';
import { useTypingStatus } from '@/hooks/useTypingStatus';
import { useAuth } from '@/contexts/AuthContext';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { UserAvatar } from '@/components/UserAvatar';
import { Skeleton } from '@/components/ui/skeleton';

interface ChatWindowProps {
  friend: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    is_online?: boolean;
  };
  onBack: () => void;
  onLocationClick?: (lat: number, lng: number) => void;
}

export const ChatWindow = ({ friend, onBack, onLocationClick }: ChatWindowProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    messages,
    loading,
    sending,
    sendMessage,
    sendImageMessage,
    sendLocationMessage,
    markAsRead,
    deleteMessage,
  } = useMessages(friend.id);
  
  const { friendIsTyping, handleTyping, stopTyping } = useTypingStatus(friend.id);
  
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, friendIsTyping]);

  // Mark messages as read when viewing chat
  useEffect(() => {
    markAsRead();
  }, [messages]);

  const handleSendMessage = (content: string, reply?: Message | null) => {
    sendMessage(content, reply);
    stopTyping();
  };

  const handleReply = (message: Message) => {
    setReplyTo(message);
  };

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-card/50 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        
        <div className="relative">
          <UserAvatar
            name={friend.username}
            imageUrl={friend.avatar_url || undefined}
            size="md"
          />
          {friend.is_online && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-white truncate">
            {friend.full_name || friend.username}
          </h2>
          <p className="text-xs text-white/60">
            {friendIsTyping ? (
              <span className="text-primary">mengetik...</span>
            ) : friend.is_online ? (
              'Online'
            ) : (
              '@' + friend.username
            )}
          </p>
        </div>

        <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <MoreVertical className="w-5 h-5 text-white/60" />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <Skeleton className="h-12 w-48 rounded-2xl bg-white/10" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-white/40 text-sm">Belum ada pesan</p>
              <p className="text-white/30 text-xs mt-1">Mulai percakapan dengan mengirim pesan</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map(message => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender_id === user?.id}
                onDelete={deleteMessage}
                onReply={handleReply}
                onLocationClick={onLocationClick}
              />
            ))}
            
            {/* Typing indicator */}
            {friendIsTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start mb-3"
              >
                <div className="bg-white/10 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      className="w-2 h-2 bg-white/40 rounded-full"
                    />
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      className="w-2 h-2 bg-white/40 rounded-full"
                    />
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      className="w-2 h-2 bg-white/40 rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onSendImage={sendImageMessage}
        onSendLocation={sendLocationMessage}
        onTyping={handleTyping}
        sending={sending}
        replyTo={replyTo}
        onCancelReply={handleCancelReply}
      />
    </div>
  );
};
