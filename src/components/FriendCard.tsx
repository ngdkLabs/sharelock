import { motion } from "framer-motion";
import { MapPin, Navigation, MoreVertical, Trash2 } from "lucide-react";
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
  className,
}: FriendCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "glass rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-shadow hover:shadow-card",
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
            <span className="text-xs text-teal font-medium px-2 py-0.5 bg-teal/10 rounded-full">Live</span>
          )}
        </div>
        
        {location && (
          <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
            <MapPin className="w-3 h-3" />
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
          variant="gradient"
          size="icon"
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
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass">
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.();
              }}
              className="text-destructive focus:text-destructive"
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
