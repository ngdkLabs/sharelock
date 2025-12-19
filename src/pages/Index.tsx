import { motion } from "framer-motion";
import { MapPin, Users, Shield, Zap, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate("/map");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero overflow-hidden">
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {/* Floating orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-teal/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-40 right-10 w-96 h-96 bg-coral/20 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple/10 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-md mx-auto space-y-8"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-32 h-32 mx-auto rounded-3xl bg-gradient-primary flex items-center justify-center shadow-glow-teal"
          >
            <MapPin className="w-16 h-16 text-primary-foreground" />
          </motion.div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              <span className="gradient-text">LocateMe</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Share your location with family & friends in real-time
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 py-6">
            {[
              { icon: MapPin, label: "Live Location", desc: "Real-time GPS" },
              { icon: Users, label: "Connect", desc: "With invite codes" },
              { icon: Shield, label: "Private", desc: "Your data is safe" },
            ].map((feature, i) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs font-medium text-foreground">{feature.label}</span>
                <span className="text-[10px] text-muted-foreground">{feature.desc}</span>
              </motion.div>
            ))}
          </div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-4"
          >
            <Button
              variant="gradient"
              size="xl"
              className="w-full group"
              onClick={handleGetStarted}
              disabled={loading}
            >
              <Zap className="w-5 h-5" />
              {user ? "Open Map" : "Get Started"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            {user && (
              <p className="text-sm text-muted-foreground">
                Welcome back! You're signed in.
              </p>
            )}
            {!user && (
              <p className="text-xs text-muted-foreground">
                Create a free account to start sharing
              </p>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
