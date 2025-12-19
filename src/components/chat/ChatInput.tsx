import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image, MapPin, Smile, X, Loader2 } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Button } from '@/components/ui/button';
import { Message } from '@/hooks/useMessages';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (content: string, replyTo?: Message | null) => void;
  onSendImage: (file: File) => void;
  onSendLocation: () => void;
  onTyping: () => void;
  sending: boolean;
  replyTo: Message | null;
  onCancelReply: () => void;
}

export const ChatInput = ({
  onSendMessage,
  onSendImage,
  onSendLocation,
  onTyping,
  sending,
  replyTo,
  onCancelReply,
}: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [sendingLocation, setSendingLocation] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when replying
  useEffect(() => {
    if (replyTo) {
      inputRef.current?.focus();
    }
  }, [replyTo]);

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;
    
    onSendMessage(message, replyTo);
    setMessage('');
    onCancelReply();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    onTyping();
  };

  const handleEmojiSelect = (emoji: any) => {
    setMessage(prev => prev + emoji.native);
    inputRef.current?.focus();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB');
        return;
      }
      onSendImage(file);
    }
    e.target.value = '';
  };

  const handleLocationClick = async () => {
    setSendingLocation(true);
    await onSendLocation();
    setSendingLocation(false);
  };

  return (
    <div className="p-4 border-t border-white/10">
      {/* Reply preview */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 p-2 rounded-lg bg-white/5 flex items-center justify-between"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs text-primary font-medium">Replying to</p>
              <p className="text-sm text-white/70 truncate">{replyTo.content}</p>
            </div>
            <button
              onClick={onCancelReply}
              className="p-1 hover:bg-white/10 rounded-full ml-2"
            >
              <X className="w-4 h-4 text-white/50" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        {/* Action buttons */}
        <div className="flex gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-white/60 hover:text-white hover:bg-white/10"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
          >
            <Image className="w-5 h-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-white/60 hover:text-white hover:bg-white/10"
            onClick={handleLocationClick}
            disabled={sending || sendingLocation}
          >
            {sendingLocation ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <MapPin className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesan..."
            className="w-full px-4 py-2.5 pr-12 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/40 resize-none focus:outline-none focus:border-primary max-h-32"
            rows={1}
            style={{ minHeight: 44 }}
          />
          
          {/* Emoji button */}
          <div className="absolute right-2 bottom-1.5" ref={emojiPickerRef}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/60 hover:text-white hover:bg-transparent"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="w-5 h-5" />
            </Button>

            {/* Emoji picker */}
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute bottom-12 right-0 z-50"
                >
                  <Picker
                    data={data}
                    onEmojiSelect={handleEmojiSelect}
                    theme="dark"
                    previewPosition="none"
                    skinTonePosition="none"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Send button */}
        <Button
          type="submit"
          disabled={!message.trim() || sending}
          className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90"
        >
          {sending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </form>
    </div>
  );
};
