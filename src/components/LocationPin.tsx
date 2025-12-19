import { motion } from "framer-motion";
import { UserAvatar } from "./UserAvatar";
import { cn } from "@/lib/utils";

interface LocationPinProps {
  name: string;
  imageUrl?: string;
  isCurrentUser?: boolean;
  className?: string;
}

export const LocationPin = ({ name, imageUrl, isCurrentUser = false, className }: LocationPinProps) => {
  return (
    <motion.div
      initial={{ scale: 0, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn("relative flex flex-col items-center", className)}
    >
      {/* Pulse rings */}
      <div className="absolute -inset-4">
        <div className={cn(
          "absolute inset-0 rounded-full animate-ping opacity-30",
          isCurrentUser ? "bg-primary" : "bg-coral"
        )} style={{ animationDuration: "2s" }} />
        <div className={cn(
          "absolute inset-2 rounded-full animate-ping opacity-20",
          isCurrentUser ? "bg-primary" : "bg-coral"
        )} style={{ animationDuration: "2s", animationDelay: "0.5s" }} />
      </div>

      {/* Avatar */}
      <div className={cn(
        "relative rounded-full p-1",
        isCurrentUser ? "bg-gradient-primary shadow-glow-green" : "bg-gradient-warm shadow-glow-coral"
      )}>
        <UserAvatar
          name={name}
          imageUrl={imageUrl}
          size="md"
        />
      </div>

      {/* Pin tail */}
      <div className={cn(
        "w-0 h-0 -mt-1",
        "border-l-[8px] border-r-[8px] border-t-[12px]",
        "border-l-transparent border-r-transparent",
        isCurrentUser ? "border-t-primary" : "border-t-coral"
      )} />

      {/* Name label */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-2 px-3 py-1 rounded-full bg-card/90 backdrop-blur-sm border border-border/50 shadow-card"
      >
        <span className="text-xs font-medium text-foreground">
          {isCurrentUser ? "You" : name}
        </span>
      </motion.div>
    </motion.div>
  );
};
