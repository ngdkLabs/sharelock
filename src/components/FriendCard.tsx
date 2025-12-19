import { motion } from "framer-motion";
import { MapPin, Navigation, MoreVertical, Trash2, MessageCircle } from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface FriendCardProps {
  name: string;
  imageUrl?: string;
  location?: string;
  distance?: string;
  lastSeen?: string;
  isOnline?: boolean;
  onLocate?: () => void;
  onRemove?: () => void;
  onMessage?: () => void;
  className?: string;
}

export const FriendCard = ({
  name,
  imageUrl,
  location,
  distance,
  lastSeen,
  isOnline = false,
  onLocate,
  onRemove,
  onMessage,
  className,
}: FriendCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "bg-card rounded-2xl p-4 flex items-center gap-4 cursor-pointer shadow-soft border border-border/50 transition-all hover:shadow-card",
        className
      )}
    >
      <UserAvatar
        name={name}
        imageUrl={imageUrl}
        size="lg"
        isOnline={isOnline}
        showRing={isOnline}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground truncate">{name}</h3>
          {isOnline && (
            <span className="text-xs text-primary font-medium px-2 py-0.5 bg-primary/10 rounded-full">
              Live
            </span>
          )}
        </div>
        
        {location && (
          <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span className="truncate">{location}</span>
          </div>
        )}

        <div className="flex items-center gap-3 mt-1">
          {distance && (
            <span className="text-xs text-primary font-medium">{distance}</span>
          )}
          {lastSeen && !isOnline && (
            <span className="text-xs text-muted-foreground">{lastSeen}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="outline"
          className="rounded-xl h-10 w-10"
          onClick={(e) => {
            e.stopPropagation();
            onMessage?.();
          }}
        >
          <MessageCircle className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-10 w-10 shadow-glow-green"
          onClick={(e) => {
            e.stopPropagation();
            onLocate?.();
          }}
        >
          <Navigation className="w-4 h-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border border-border shadow-elevated rounded-xl">
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.();
              }}
              className="text-destructive focus:text-destructive rounded-lg"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove Friend
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
};
