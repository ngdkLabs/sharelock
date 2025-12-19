import { useState } from "react";
import { motion } from "framer-motion";
import { Share2 } from "lucide-react";
import { InviteCodeDisplay } from "@/components/InviteCodeDisplay";
import { InviteCodeInput } from "@/components/InviteCodeInput";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const generateCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const InvitePage = () => {
  const [myCode] = useState(generateCode());
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = (code: string) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success(`Friend request sent with code ${code}!`);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 py-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-secondary flex items-center justify-center shadow-glow-coral">
            <Share2 className="w-8 h-8 text-secondary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Add Friends</h1>
          <p className="text-muted-foreground">Share your code or enter theirs</p>
        </motion.div>

        <Tabs defaultValue="share" className="w-full">
          <TabsList className="w-full h-12 rounded-xl bg-muted p-1">
            <TabsTrigger value="share" className="flex-1 rounded-lg data-[state=active]:bg-card">Share Code</TabsTrigger>
            <TabsTrigger value="join" className="flex-1 rounded-lg data-[state=active]:bg-card">Enter Code</TabsTrigger>
          </TabsList>
          <TabsContent value="share" className="mt-6">
            <InviteCodeDisplay code={myCode} />
          </TabsContent>
          <TabsContent value="join" className="mt-6">
            <div className="glass rounded-3xl p-6">
              <InviteCodeInput onSubmit={handleJoin} isLoading={isLoading} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <BottomNavigation />
    </div>
  );
};

export default InvitePage;
