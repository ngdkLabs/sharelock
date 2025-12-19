import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  imageUrl?: string;
  size?: "sm" | "md" | "lg" | "xl";
  isOnline?: boolean;
  showRing?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-12 h-12 text-sm",
  lg: "w-16 h-16 text-lg",
  xl: "w-24 h-24 text-2xl",
};

const ringClasses = {
  sm: "p-0.5",
  md: "p-0.5",
  lg: "p-1",
  xl: "p-1",
};

const statusClasses = {
  sm: "w-2.5 h-2.5 border-2",
  md: "w-3 h-3 border-2",
  lg: "w-4 h-4 border-2",
  xl: "w-5 h-5 border-3",
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getAvatarColor = (name: string) => {
  const colors = [
    "from-teal to-ocean",
    "from-coral to-purple",
    "from-purple to-ocean",
    "from-ocean to-teal",
    "from-coral to-teal",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export const UserAvatar = ({
  name,
  imageUrl,
  size = "md",
  isOnline = false,
  showRing = false,
  className,
}: UserAvatarProps) => {
  const gradientColor = getAvatarColor(name);

  return (
    <div className={cn("relative", className)}>
      {showRing && (
        <div className={cn("rounded-full bg-gradient-primary", ringClasses[size])}>
          <div className="rounded-full bg-card p-0.5">
            <AvatarContent
              name={name}
              imageUrl={imageUrl}
              size={size}
              gradientColor={gradientColor}
            />
          </div>
        </div>
      )}
      {!showRing && (
        <AvatarContent
          name={name}
          imageUrl={imageUrl}
          size={size}
          gradientColor={gradientColor}
        />
      )}
      {isOnline && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            "absolute bottom-0 right-0 rounded-full bg-teal border-card",
            statusClasses[size]
          )}
        />
      )}
    </div>
  );
};

interface AvatarContentProps {
  name: string;
  imageUrl?: string;
  size: "sm" | "md" | "lg" | "xl";
  gradientColor: string;
}

const AvatarContent = ({ name, imageUrl, size, gradientColor }: AvatarContentProps) => {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={cn(
          "rounded-full object-cover",
          sizeClasses[size]
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-secondary-foreground",
        sizeClasses[size],
        gradientColor
      )}
    >
      {getInitials(name)}
    </div>
  );
};
