import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CheckCheck, Trash2, MapPin, Reply, X } from 'lucide-react';
import { format } from 'date-fns';
import { Message } from '@/hooks/useMessages';
import { cn } from '@/lib/utils';
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

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onDelete: (id: string) => void;
  onReply: (message: Message) => void;
  onLocationClick?: (lat: number, lng: number) => void;
}

export const MessageBubble = ({
  message,
  isOwn,
  onDelete,
  onReply,
  onLocationClick,
}: MessageBubbleProps) => {
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const hasLocation = message.location_lat && message.location_lng;
  const hasImage = message.image_url;
  const hasReply = message.reply_to_content;
  const isImageOnly = hasImage && (!message.content || message.content === '📷 Photo') && !hasReply && !hasLocation;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex mb-3',
          isOwn ? 'justify-end' : 'justify-start'
        )}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className={cn(
          'relative max-w-[75%] group',
          isOwn ? 'order-1' : 'order-2'
        )}>
          {/* Action buttons */}
          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 flex gap-1 z-10',
                  isOwn ? '-left-16' : '-right-16'
                )}
              >
                <button
                  onClick={() => onReply(message)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                >
                  <Reply className="w-4 h-4" />
                </button>
                {isOwn && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-1.5 rounded-full bg-white/10 hover:bg-red-500/50 text-white/70 hover:text-white transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message bubble */}
          <div
            className={cn(
              'relative transition-all',
              isImageOnly ? 'p-0 bg-transparent' : 'rounded-2xl px-4 py-2',
              !isImageOnly && (isOwn
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-white/10 text-white rounded-bl-sm')
            )}
          >
            {/* Reply preview */}
            {hasReply && (
              <div className={cn(
                'mb-2 pb-2 border-b text-xs opacity-70',
                isOwn ? 'border-primary-foreground/30' : 'border-white/20'
              )}>
                <span className="font-medium">↩ Reply</span>
                <p className="truncate">{message.reply_to_content}</p>
              </div>
            )}

            {/* Image */}
            {hasImage && (
              <div className={cn("relative", !isImageOnly && "mb-2")}>
                {!imageLoaded && (
                  <div className={cn(
                    "bg-white/10 animate-pulse",
                    isImageOnly ? "w-64 h-64 rounded-2xl" : "w-48 h-48 rounded-lg"
                  )} />
                )}
                <img
                  src={message.image_url!}
                  alt="Shared image"
                  className={cn(
                    'max-w-full cursor-pointer transition-opacity object-cover',
                    isImageOnly ? 'rounded-2xl shadow-sm' : 'rounded-lg',
                    imageLoaded ? 'opacity-100' : 'opacity-0 absolute'
                  )}
                  style={{ maxHeight: 300 }}
                  onLoad={() => setImageLoaded(true)}
                  onClick={() => window.open(message.image_url!, '_blank')}
                />
              </div>
            )}

            {/* Location */}
            {hasLocation && (
              <button
                onClick={() => onLocationClick?.(message.location_lat!, message.location_lng!)}
                className={cn(
                  'mb-2 p-3 rounded-lg flex items-center gap-2 w-full text-left transition-colors',
                  isOwn ? 'bg-primary-foreground/10 hover:bg-primary-foreground/20' : 'bg-white/10 hover:bg-white/20'
                )}
              >
                <MapPin className="w-5 h-5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm">📍 Location Shared</p>
                  <p className="text-xs opacity-70 truncate">
                    {message.location_address || 'View on map'}
                  </p>
                </div>
              </button>
            )}

            {/* Text content */}
            {message.content && !hasLocation && !hasImage && (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            )}
            {(hasLocation || hasImage) && message.content !== '📍 Location' && message.content !== '📷 Photo' && (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            )}

            {/* Time and read status */}
            <div className={cn(
              'flex items-center gap-1 text-[10px]',
              isImageOnly
                ? 'absolute bottom-2 right-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full text-white shadow-sm'
                : cn('mt-1 opacity-60', isOwn ? 'justify-end' : 'justify-start')
            )}>
              <span>{format(new Date(message.created_at), 'HH:mm')}</span>
              {isOwn && (
                message.is_read ? (
                  <CheckCheck className={cn("w-3 h-3", isImageOnly ? "text-blue-400" : "text-blue-400")} />
                ) : (
                  <Check className="w-3 h-3" />
                )
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Message?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This message will be permanently deleted and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted text-foreground border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(message.id)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
