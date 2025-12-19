import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Navigate } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logoImage from "@/assets/logo.png";
import bgBlur from "@/assets/bg-blur.png";

const AuthPage = () => {
  const navigate = useNavigate();
  const { user, loading, signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    username: "",
    fullName: "",
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/map" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(form.email, form.password);
        if (error) {
          toast.error(error.message || "Failed to sign in");
        } else {
          toast.success("Welcome back!");
          navigate("/map");
        }
      } else {
        if (!form.username.trim()) {
          toast.error("Username is required");
          setIsSubmitting(false);
          return;
        }
        const { error } = await signUp(form.email, form.password, form.username, form.fullName);
        if (error) {
          toast.error(error.message || "Failed to sign up");
        } else {
          toast.success("Account created! Welcome to LocateMe!");
          navigate("/map");
        }
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden relative">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgBlur})` }}
      />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="w-64 h-64 mb-2 flex flex-col items-center justify-center"
        >
          <img src={logoImage} alt="LocateMe Logo" className="w-full h-full object-contain" />
          <p className="text-white/80 text-lg font-medium -mt-10 tracking-wider">Stay Connected, Stay Safe</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white">
              {isLogin ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-white/70 mt-2">
              {isLogin ? "Sign in to continue" : "Start sharing your location"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                  <Input
                    type="text"
                    placeholder="Username"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="pl-12 h-14 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:border-primary focus:ring-primary"
                    required
                  />
                </div>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                  <Input
                    type="text"
                    placeholder="Full Name (optional)"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="pl-12 h-14 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:border-primary focus:ring-primary"
                  />
                </div>
              </>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <Input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="pl-12 h-14 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:border-primary focus:ring-primary"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="pl-12 pr-12 h-14 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:border-primary focus:ring-primary"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                isLogin ? "Sign In" : "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-white/70 hover:text-white transition-colors"
            >
              {isLogin ? (
                <>Don't have an account? <span className="text-primary font-semibold">Sign up</span></>
              ) : (
                <>Already have an account? <span className="text-primary font-semibold">Sign in</span></>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
