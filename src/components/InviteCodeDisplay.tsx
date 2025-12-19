import { motion } from "framer-motion";
import { Copy, Check, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface InviteCodeDisplayProps {
  code: string;
  onRefresh?: () => void;
}

export const InviteCodeDisplay = ({ code, onRefresh }: InviteCodeDisplayProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass rounded-3xl p-6 space-y-4"
    >
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">Your Invite Code</p>
        <div className="flex items-center justify-center gap-2">
          {code.split("").map((char, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="w-10 h-12 flex items-center justify-center rounded-xl bg-muted text-xl font-bold text-primary"
            >
              {char}
            </motion.span>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="gradient"
          className="flex-1"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy Code
            </>
          )}
        </Button>
        {onRefresh && (
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
};
