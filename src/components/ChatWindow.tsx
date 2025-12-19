import { useState, useRef, useEffect } from 'react';
import { X, Send, Image, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import { useReverseGeocode } from '@/hooks/useReverseGeocode';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

interface ChatWindowProps {
  friendId: string;
  friendName: string;
  friendAvatar?: string;
  onClose: () => void;
}

const ChatWindow = ({ friendId, friendName, friendAvatar, onClose }: ChatWindowProps) => {
  const { user } = useAuth();
  const { messages, loading, sendMessage, sendImageMessage, sendLocationMessage } = useMessages(friendId);
  const { getAddress } = useReverseGeocode();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendingLocation, setSendingLocation] = useState(false);
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
    await sendMessage(newMessage);
    setNewMessage('');
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
    await sendImageMessage(file);
    setSending(false);
    
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

  return (
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
          <span className="font-semibold">{friendName}</span>
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

              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl overflow-hidden ${
                      isMine
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted rounded-bl-sm'
                    }`}
                  >
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

                    {/* Timestamp */}
                    <p className={`text-[10px] px-4 pb-2 ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {format(new Date(msg.created_at), 'HH:mm', { locale: id })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-card">
        <div className="flex gap-2 items-center">
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
            onChange={(e) => setNewMessage(e.target.value)}
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
  );
};

export default ChatWindow;
