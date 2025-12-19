import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronRight, Map, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import bgBlur from "@/assets/bg-blur.png";
import logoImage from "@/assets/logo.png";
import onboarding1 from "@/assets/onboarding_location_share.png";
import onboarding2 from "@/assets/onboarding_safety_alert.png";
import onboarding3 from "@/assets/onboarding_location_history.png";

const steps = [
    {
        image: onboarding1,
        title: "Real-time Location",
        description: "Share your live location with friends and family seamlessly.",
        icon: Map,
        color: "from-green-400 to-emerald-600"
    },
    {
        image: onboarding2,
        title: "Safety Alerts",
        description: "Get instant notifications when friends arrive or leave safe zones.",
        icon: Shield,
        color: "from-purple-400 to-indigo-600"
    },
    {
        image: onboarding3,
        title: "Location History",
        description: "View past routes and movement history with detailed timelines.",
        icon: Users,
        color: "from-blue-400 to-cyan-600"
    }
];

const OnboardingPage = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            navigate("/auth");
        }
    };

    const currentData = steps[currentStep];

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-between py-10 px-6">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
                style={{ backgroundImage: `url(${bgBlur})` }}
            />

            {/* Skip Button */}
            <div className="w-full flex justify-end z-10">
                <button
                    onClick={() => navigate("/auth")}
                    className="text-white/70 text-sm font-medium hover:text-white transition-colors"
                >
                    Skip
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md z-10 space-y-10">

                {/* Image Container with 3D Effect */}
                <div className="relative w-72 h-72">
                    {/* Glowing Background */}
                    <div className={`absolute inset-0 bg-gradient-to-tr ${currentData.color} rounded-full blur-[60px] opacity-40 animate-pulse`} />

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            className="relative w-full h-full"
                        >
                            {/* Fallback layout if images are not actually loaded yet, but in real app images would be there */}
                            {currentData.image ? (
                                <img
                                    src={currentData.image}
                                    alt={currentData.title}
                                    className="w-full h-full object-contain drop-shadow-2xl"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-white/10 rounded-3xl backdrop-blur-md border border-white/20">
                                    <currentData.icon className="w-24 h-24 text-white" />
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Text Content */}
                <div className="text-center space-y-4">
                    {/* Logo at Top of text for consistency? Maybe just Title */}
                    <motion.div
                        key={currentStep + "-text"}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.4 }}
                    >
                        <h2 className="text-3xl font-bold text-white mb-3">
                            {currentData.title}
                        </h2>
                        <p className="text-white/70 text-lg leading-relaxed">
                            {currentData.description}
                        </p>
                    </motion.div>
                </div>

            </div>

            {/* Bottom Controls */}
            <div className="w-full max-w-md z-10 space-y-8">
                {/* Progress Indicators */}
                <div className="flex justify-center gap-2">
                    {steps.map((_, index) => (
                        <motion.div
                            key={index}
                            animate={{
                                width: index === currentStep ? 32 : 8,
                                backgroundColor: index === currentStep ? "#ffffff" : "rgba(255,255,255,0.2)"
                            }}
                            className="h-2 rounded-full transition-all duration-300"
                        />
                    ))}
                </div>

                {/* Action Button */}
                <Button
                    onClick={handleNext}
                    className="w-full h-14 bg-gradient-to-r from-primary to-emerald-600 hover:opacity-90 text-white rounded-2xl text-lg font-bold shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all transform active:scale-95"
                >
                    {currentStep === steps.length - 1 ? "Get Started" : "Next"}
                    {currentStep !== steps.length - 1 && <ChevronRight className="ml-2 w-5 h-5" />}
                </Button>
            </div>
        </div>
    );
};

export default OnboardingPage;
