import { motion } from "framer-motion";
import { Users, Shield, Zap, ArrowRight, MapPin, Download } from "lucide-react";
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
      navigate("/onboarding");
    }
  };

  return (
    <div className="min-h-screen overflow-hidden relative">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgBlur})` }}
      />

      {/* Install Button - Top Right */}
      <motion.button
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        onClick={() => navigate("/install")}
        className="absolute top-4 right-4 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm hover:bg-white/20 transition-colors"
      >
        <Download className="w-4 h-4" />
        Install App
      </motion.button>

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
            className="w-64 h-24 mx-auto"
          >
            <img src={logoImage} alt="LocateMe Logo" className="w-full h-full object-contain" />
          </motion.div>

          <div className="space-y-4">
            {/* Text removed as per request, relying on logo */}
            <p className="text-lg text-white/70">
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
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs font-medium text-white">{feature.label}</span>
                <span className="text-[10px] text-white/60">{feature.desc}</span>
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
              <p className="text-sm text-white/70">
                Welcome back! You're signed in.
              </p>
            )}
            {!user && (
              <p className="text-xs text-white/60">
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
