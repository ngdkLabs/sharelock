import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, MapPin, Share, Check, Smartphone, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPage = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for app installed event
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    { icon: MapPin, title: "Real-time Location", desc: "Share location with friends" },
    { icon: Smartphone, title: "Works Offline", desc: "Access app without internet" },
    { icon: Share, title: "Quick Access", desc: "Launch from home screen" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
        {/* App Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-elevated">
            <MapPin className="w-14 h-14 text-white" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">Install LocateMe</h1>
          <p className="text-muted-foreground">Add to your home screen for quick access</p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-sm space-y-3 mb-8"
        >
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-4 bg-card rounded-xl p-4 border border-border/50"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{feature.title}</p>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Install Button / Instructions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-sm"
        >
          {isInstalled ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-lg font-medium text-foreground mb-2">App Installed!</p>
              <p className="text-muted-foreground text-sm">
                LocateMe is now on your home screen
              </p>
              <Button
                className="w-full mt-6 h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
                onClick={() => navigate("/map")}
              >
                Open App
              </Button>
            </div>
          ) : isIOS ? (
            <div className="bg-card rounded-xl p-5 border border-border/50">
              <p className="font-medium text-foreground mb-4 text-center">
                Install on iPhone/iPad:
              </p>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                    1
                  </span>
                  <span>
                    Tap the <strong className="text-foreground">Share</strong> button{" "}
                    <Share className="w-4 h-4 inline" /> at the bottom of Safari
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                    2
                  </span>
                  <span>
                    Scroll down and tap{" "}
                    <strong className="text-foreground">"Add to Home Screen"</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                    3
                  </span>
                  <span>
                    Tap <strong className="text-foreground">"Add"</strong> in the top right corner
                  </span>
                </li>
              </ol>
            </div>
          ) : deferredPrompt ? (
            <Button
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-lg font-semibold"
              onClick={handleInstall}
            >
              <Download className="w-5 h-5 mr-2" />
              Install App
            </Button>
          ) : (
            <div className="text-center">
              <p className="text-muted-foreground text-sm mb-4">
                Open this page in Chrome or Edge browser to install the app
              </p>
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl"
                onClick={() => navigate("/map")}
              >
                Continue to App
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default InstallPage;
