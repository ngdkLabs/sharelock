import { useState } from "react";
import { motion } from "framer-motion";
import { Share2, Loader2 } from "lucide-react";
import { InviteCodeDisplay } from "@/components/InviteCodeDisplay";
import { InviteCodeInput } from "@/components/InviteCodeInput";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFriends } from "@/hooks/useFriends";
import { toast } from "sonner";

const InvitePage = () => {
  const { myInviteCode, addFriendByCode, refreshInviteCode, loading } = useFriends();
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async (code: string) => {
    setIsJoining(true);
    const { error } = await addFriendByCode(code);
    setIsJoining(false);
    
    if (error) {
      toast.error(error);
    } else {
      toast.success("Friend added successfully!");
    }
  };

  const handleRefresh = async () => {
    const newCode = await refreshInviteCode();
    if (newCode) {
      toast.success("New code generated!");
    }
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
            <TabsTrigger value="share" className="flex-1 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
              Share Code
            </TabsTrigger>
            <TabsTrigger value="join" className="flex-1 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
              Enter Code
            </TabsTrigger>
          </TabsList>
          <TabsContent value="share" className="mt-6">
            {loading || !myInviteCode ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <InviteCodeDisplay code={myInviteCode} onRefresh={handleRefresh} />
            )}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 glass rounded-2xl p-4"
            >
              <h3 className="font-semibold text-foreground mb-2">How it works</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <span>Share your unique code with friends</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <span>They enter your code to connect</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <span>Start sharing locations in real-time!</span>
                </li>
              </ul>
            </motion.div>
          </TabsContent>
          <TabsContent value="join" className="mt-6">
            <div className="glass rounded-3xl p-6">
              <InviteCodeInput onSubmit={handleJoin} isLoading={isJoining} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <BottomNavigation />
    </div>
  );
};

export default InvitePage;
