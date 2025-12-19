import { useState, useRef, useEffect } from 'react';
import { X, Send, Image, MapPin, Loader2, Check, CheckCheck, Smile, Reply, XCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMessages, Message } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import { useReverseGeocode } from '@/hooks/useReverseGeocode';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ChatWindowProps {
  friendId: string;
  friendName: string;
  friendAvatar?: string;
  onClose: () => void;
}

// Reaction emojis
const reactionEmojis = ['❤️', '😂', '😮', '😢', '😡', '👍'];

// Animated emoji data for text input
const animatedEmojis = [
  { emoji: '❤️', animation: 'animate-bounce' },
  { emoji: '😂', animation: 'animate-bounce' },
  { emoji: '🔥', animation: 'animate-pulse' },
  { emoji: '👍', animation: 'animate-bounce' },
  { emoji: '😍', animation: 'animate-pulse' },
  { emoji: '🎉', animation: 'animate-bounce' },
  { emoji: '😢', animation: 'animate-pulse' },
  { emoji: '😮', animation: 'animate-bounce' },
  { emoji: '🙏', animation: 'animate-pulse' },
  { emoji: '💪', animation: 'animate-bounce' },
  { emoji: '✨', animation: 'animate-pulse' },
  { emoji: '🥳', animation: 'animate-bounce' },
  { emoji: '😎', animation: 'animate-pulse' },
  { emoji: '🤗', animation: 'animate-bounce' },
  { emoji: '💯', animation: 'animate-pulse' },
  { emoji: '🚀', animation: 'animate-bounce' },
];

const ChatWindow = ({ friendId, friendName, friendAvatar, onClose }: ChatWindowProps) => {
  const { user } = useAuth();
  const { messages, loading, friendIsTyping, sendMessage, sendImageMessage, sendLocationMessage, addReaction, deleteMessage, handleTyping } = useMessages(friendId);
  const { getAddress } = useReverseGeocode();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendingLocation, setSendingLocation] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [activeReactionMenu, setActiveReactionMenu] = useState<string | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    
    setSending(true);
    await sendMessage(newMessage, replyTo || undefined);
    setNewMessage('');
    setReplyTo(null);
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    handleTyping();
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    handleTyping();
  };

  const handleReply = (message: Message) => {
    setReplyTo(message);
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    await addReaction(messageId, emoji);
    setActiveReactionMenu(null);
  };

  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;
    
    setDeleting(true);
    await deleteMessage(messageToDelete);
    setDeleting(false);
    setMessageToDelete(null);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diperbolehkan');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 5MB');
      return;
    }

    setSending(true);
    await sendImageMessage(file, replyTo || undefined);
    setSending(false);
    setReplyTo(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleShareLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolokasi tidak didukung di browser ini');
      return;
    }

    setSendingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const result = await getAddress(latitude, longitude);
        const address = result?.display_name || undefined;
        await sendLocationMessage(latitude, longitude, address);
        setSendingLocation(false);
      },
      (error) => {
        toast.error('Gagal mendapatkan lokasi: ' + error.message);
        setSendingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const openLocationInMap = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  const getMessagePreview = (msg: Message) => {
    if (msg.image_url) return '📷 Gambar';
    if (msg.location_lat) return '📍 Lokasi';
    return msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content;
  };

  const getReactionCounts = (reactions: Record<string, string[]> | null | undefined) => {
    if (!reactions) return [];
    return Object.entries(reactions)
      .filter(([_, users]) => users.length > 0)
      .map(([emoji, users]) => ({ emoji, count: users.length, hasMyReaction: user ? users.includes(user.id) : false }));
  };

  return (
    <>
      {/* Delete confirmation dialog */}
      <AlertDialog open={!!messageToDelete} onOpenChange={(open) => !open && setMessageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pesan?</AlertDialogTitle>
            <AlertDialogDescription>
              Pesan ini akan dihapus untuk semua orang dalam percakapan ini. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMessage}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b bg-card">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
              {friendAvatar ? (
                <img src={friendAvatar} alt={friendName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary font-semibold">{friendName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <span className="font-semibold block">{friendName}</span>
              <AnimatePresence>
                {friendIsTyping && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-primary"
                  >
                    sedang mengetik...
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <p>Belum ada pesan</p>
              <p className="text-sm">Mulai percakapan dengan {friendName}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isMine = msg.sender_id === user?.id;
                const hasLocation = msg.location_lat && msg.location_lng;
                const hasImage = msg.image_url;
                const hasReply = msg.reply_to_id;
                const reactions = getReactionCounts(msg.reactions as Record<string, string[]> | null);

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'} group`}
                  >
                    {/* Reply button - left side for friend messages */}
                    {!isMine && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity mr-1"
                        onClick={() => handleReply(msg)}
                      >
                        <Reply className="h-4 w-4" />
                      </Button>
                    )}

                    <div className="relative">
                      <div
                        className={`max-w-[75%] rounded-2xl overflow-hidden ${
                          isMine
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-muted rounded-bl-sm'
                        }`}
                        onDoubleClick={() => setActiveReactionMenu(activeReactionMenu === msg.id ? null : msg.id)}
                      >
                        {/* Reply preview */}
                        {hasReply && (
                          <div className={`px-3 py-2 border-l-2 ${isMine ? 'border-primary-foreground/50 bg-primary-foreground/10' : 'border-primary bg-primary/10'}`}>
                            <p className={`text-[10px] font-medium ${isMine ? 'text-primary-foreground/70' : 'text-primary'}`}>
                              {msg.reply_to_sender_name}
                            </p>
                            <p className={`text-xs truncate ${isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                              {msg.reply_to_content}
                            </p>
                          </div>
                        )}

                        {/* Image message */}
                        {hasImage && (
                          <img 
                            src={msg.image_url!} 
                            alt="Shared image" 
                            className="max-w-full max-h-64 object-cover cursor-pointer"
                            onClick={() => window.open(msg.image_url!, '_blank')}
                          />
                        )}

                        {/* Location message */}
                        {hasLocation && (
                          <div 
                            className="px-4 py-3 cursor-pointer"
                            onClick={() => openLocationInMap(msg.location_lat!, msg.location_lng!)}
                          >
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <MapPin className="w-5 h-5" />
                              <span>📍 Lokasi Dibagikan</span>
                            </div>
                            {msg.location_address && (
                              <p className="text-xs opacity-80 mt-1 ml-7">{msg.location_address}</p>
                            )}
                            <p className="text-xs opacity-60 mt-1 ml-7 underline">Buka di Google Maps</p>
                          </div>
                        )}

                        {/* Text content */}
                        {msg.content && !hasLocation && (
                          <div className="px-4 py-2">
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          </div>
                        )}

                        {/* Timestamp and read receipt */}
                        <div className={`flex items-center gap-1 px-4 pb-2 ${isMine ? 'justify-end' : ''}`}>
                          <p className={`text-[10px] ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {format(new Date(msg.created_at), 'HH:mm', { locale: id })}
                          </p>
                          {isMine && (
                            msg.is_read ? (
                              <CheckCheck className={`w-3.5 h-3.5 ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`} />
                            ) : (
                              <Check className={`w-3.5 h-3.5 ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`} />
                            )
                          )}
                        </div>
                      </div>

                      {/* Reactions display */}
                      {reactions.length > 0 && (
                        <div className={`absolute -bottom-3 ${isMine ? 'right-2' : 'left-2'} flex gap-0.5`}>
                          {reactions.map(({ emoji, count, hasMyReaction }) => (
                            <motion.button
                              key={emoji}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs ${
                                hasMyReaction 
                                  ? 'bg-primary/20 border border-primary/50' 
                                  : 'bg-muted border border-border'
                              }`}
                              onClick={() => handleReaction(msg.id, emoji)}
                            >
                              <span>{emoji}</span>
                              {count > 1 && <span className="text-muted-foreground">{count}</span>}
                            </motion.button>
                          ))}
                        </div>
                      )}

                      {/* Reaction picker */}
                      <AnimatePresence>
                        {activeReactionMenu === msg.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 10 }}
                            className={`absolute -top-10 ${isMine ? 'right-0' : 'left-0'} flex gap-1 p-1.5 bg-card rounded-full shadow-lg border z-10`}
                          >
                            {reactionEmojis.map((emoji) => (
                              <motion.button
                                key={emoji}
                                whileHover={{ scale: 1.3 }}
                                whileTap={{ scale: 0.9 }}
                                className="text-lg p-1 hover:bg-muted rounded-full transition-colors"
                                onClick={() => handleReaction(msg.id, emoji)}
                              >
                                {emoji}
                              </motion.button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Action buttons - right side for my messages */}
                    {isMine && (
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleReply(msg)}
                        >
                          <Reply className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setMessageToDelete(msg.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing indicator */}
              <AnimatePresence>
                {friendIsTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex justify-start"
                  >
                    <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex gap-1">
                        <motion.div
                          className="w-2 h-2 bg-muted-foreground rounded-full"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-muted-foreground rounded-full"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-muted-foreground rounded-full"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={scrollRef} />
            </div>
          )}
        </ScrollArea>

        {/* Reply preview */}
        <AnimatePresence>
          {replyTo && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="px-4 py-2 bg-muted/50 border-t flex items-center gap-2"
            >
              <div className="w-1 h-10 bg-primary rounded-full" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-primary">
                  Membalas {replyTo.sender_id === user?.id ? 'Anda' : friendName}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {getMessagePreview(replyTo)}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setReplyTo(null)}>
                <XCircle className="h-5 w-5" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="p-4 border-t bg-card">
          <div className="flex gap-2 items-center">
            {/* Emoji picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Smile className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" side="top" align="start">
                <div className="grid grid-cols-4 gap-1">
                  {animatedEmojis.map(({ emoji, animation }) => (
                    <motion.button
                      key={emoji}
                      whileHover={{ scale: 1.3 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 text-2xl hover:bg-muted rounded-lg transition-colors"
                      onClick={() => handleEmojiSelect(emoji)}
                    >
                      <motion.span
                        className="inline-block"
                        whileHover={{ 
                          y: [0, -5, 0],
                          transition: { repeat: Infinity, duration: 0.5 }
                        }}
                      >
                        {emoji}
                      </motion.span>
                    </motion.button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Image upload */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
            >
              <Image className="h-5 w-5" />
            </Button>

            {/* Share location */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleShareLocation}
              disabled={sendingLocation || sending}
            >
              {sendingLocation ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <MapPin className="h-5 w-5" />
              )}
            </Button>

            {/* Text input */}
            <Input
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Ketik pesan..."
              className="flex-1"
              disabled={sending}
            />
            <Button onClick={handleSend} disabled={!newMessage.trim() || sending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatWindow;