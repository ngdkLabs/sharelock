import { motion } from "framer-motion";
import { Users, Shield, Zap, ArrowRight, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import logoImage from "@/assets/logo.png";
import bgBlur from "@/assets/bg-blur.png";

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
    <div className="min-h-screen overflow-hidden relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgBlur})` }}
      />
      
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-12">

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
            className="w-32 h-32 mx-auto"
          >
            <img src={logoImage} alt="LocateMe Logo" className="w-full h-full object-contain" />
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
