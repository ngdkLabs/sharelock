import { useState, useRef, KeyboardEvent, ClipboardEvent } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { UserPlus, Loader2 } from "lucide-react";

interface InviteCodeInputProps {
  onSubmit: (code: string) => void;
  isLoading?: boolean;
}

export const InviteCodeInput = ({ onSubmit, isLoading = false }: InviteCodeInputProps) => {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const chars = value.toUpperCase().split("").slice(0, 6 - index);
      const newCode = [...code];
      chars.forEach((char, i) => {
        if (index + i < 6) {
          newCode[index + i] = char;
        }
      });
      setCode(newCode);
      const nextIndex = Math.min(index + chars.length, 5);
      inputRefs.current[nextIndex]?.focus();
    } else {
      const newCode = [...code];
      newCode[index] = value.toUpperCase();
      setCode(newCode);
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const chars = pastedText.split("").slice(0, 6);
    const newCode = [...code];
    chars.forEach((char, i) => {
      newCode[i] = char;
    });
    setCode(newCode);
    inputRefs.current[Math.min(chars.length, 5)]?.focus();
  };

  const handleSubmit = () => {
    const fullCode = code.join("");
    if (fullCode.length === 6) {
      onSubmit(fullCode);
    }
  };

  const isComplete = code.every((c) => c !== "");

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-4">Enter your friend's invite code</p>
        <div className="flex items-center justify-center gap-2">
          {code.map((char, index) => (
            <motion.input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              maxLength={6}
              value={char}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-muted border-2 border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground uppercase"
            />
          ))}
        </div>
      </div>

      <Button
        variant="gradient"
        size="lg"
        className="w-full"
        onClick={handleSubmit}
        disabled={!isComplete || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <UserPlus className="w-5 h-5" />
            Add Friend
          </>
        )}
      </Button>
    </motion.div>
  );
};
