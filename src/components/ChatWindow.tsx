import { useState, useRef, useEffect } from 'react';
import { X, Send, Image, MapPin, Loader2, Check, CheckCheck, Mic, Square, Play, Pause, Smile } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMessages } from '@/hooks/useMessages';
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

interface ChatWindowProps {
  friendId: string;
  friendName: string;
  friendAvatar?: string;
  onClose: () => void;
}

// Animated emoji data
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
  const { messages, loading, sendMessage, sendImageMessage, sendLocationMessage, sendVoiceMessage } = useMessages(friendId);
  const { getAddress } = useReverseGeocode();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendingLocation, setSendingLocation] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

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

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        if (audioBlob.size > 0) {
          setSending(true);
          await sendVoiceMessage(audioBlob, recordingTime);
          setSending(false);
        }
        setRecordingTime(0);
      };

      mediaRecorder.start();
      setIsRecording(true);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      toast.error('Tidak dapat mengakses mikrofon');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleAudioPlay = (audioUrl: string, messageId: string) => {
    if (!audioRefs.current[messageId]) {
      audioRefs.current[messageId] = new Audio(audioUrl);
      audioRefs.current[messageId].onended = () => setPlayingAudio(null);
    }

    const audio = audioRefs.current[messageId];

    if (playingAudio === messageId) {
      audio.pause();
      setPlayingAudio(null);
    } else {
      // Pause any currently playing audio
      Object.values(audioRefs.current).forEach(a => a.pause());
      audio.play();
      setPlayingAudio(messageId);
    }
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
              const hasAudio = msg.audio_url;

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

                    {/* Voice message */}
                    {hasAudio && (
                      <div className="px-4 py-3 flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-10 w-10 rounded-full ${isMine ? 'hover:bg-primary-foreground/20' : 'hover:bg-background'}`}
                          onClick={() => toggleAudioPlay(msg.audio_url!, msg.id)}
                        >
                          {playingAudio === msg.id ? (
                            <Pause className="h-5 w-5" />
                          ) : (
                            <Play className="h-5 w-5" />
                          )}
                        </Button>
                        <div className="flex-1">
                          <div className={`h-1 rounded-full ${isMine ? 'bg-primary-foreground/30' : 'bg-foreground/20'}`}>
                            <motion.div 
                              className={`h-full rounded-full ${isMine ? 'bg-primary-foreground' : 'bg-primary'}`}
                              initial={{ width: '0%' }}
                              animate={{ width: playingAudio === msg.id ? '100%' : '0%' }}
                              transition={{ duration: msg.audio_duration || 5 }}
                            />
                          </div>
                        </div>
                        <span className="text-xs opacity-70">
                          {formatDuration(msg.audio_duration || 0)}
                        </span>
                      </div>
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
                    {msg.content && !hasLocation && !hasAudio && (
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
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-card">
        {/* Recording indicator */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center justify-center gap-3 mb-3 p-3 bg-destructive/10 rounded-xl"
            >
              <motion.div
                className="w-3 h-3 bg-destructive rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
              <span className="text-sm font-medium">Merekam... {formatDuration(recordingTime)}</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={stopRecording}
              >
                <Square className="h-4 w-4 mr-1" />
                Kirim
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

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
            disabled={sending || isRecording}
          >
            <Image className="h-5 w-5" />
          </Button>

          {/* Share location */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleShareLocation}
            disabled={sendingLocation || sending || isRecording}
          >
            {sendingLocation ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <MapPin className="h-5 w-5" />
            )}
          </Button>

          {/* Voice message */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={sending}
            className={isRecording ? 'text-destructive' : ''}
          >
            <Mic className="h-5 w-5" />
          </Button>

          {/* Text input */}
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ketik pesan..."
            className="flex-1"
            disabled={sending || isRecording}
          />
          <Button onClick={handleSend} disabled={!newMessage.trim() || sending || isRecording}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
