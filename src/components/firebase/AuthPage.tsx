import React from "react";
import { useAuth } from "@/components/firebase/useAuth";
import { Button } from "@/components/ui/button";
import { Globe2, LogIn, Flag, MapPin, Compass } from "lucide-react";

export const AuthPage = () => {
  const { signIn } = useAuth();
  return (
    <div className="min-h-screen bg-[#001324] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="max-w-md w-full p-8 space-y-8 bg-black/60 backdrop-blur-md rounded-2xl border-2 border-white/20 relative">
        <div className="relative space-y-6">
          {/* Logo and title section */}
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <Globe2 className="w-16 h-16 text-white animate-pulse" />
              <MapPin className="absolute -right-2 -top-2 w-6 h-6 text-white/80 animate-bounce" />
            </div>
            <h1 className="text-5xl font-bold text-white">GeoExplorer</h1>
          </div>

          {/* Tagline and description */}
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-center gap-3">
              <Flag className="w-5 h-5 text-white/80" />
              <p className="text-2xl font-semibold text-white">
                Flag. Spot. Conquer.
              </p>
              <Flag className="w-5 h-5 text-white/80" />
            </div>
            <p className="text-white/80 text-lg leading-relaxed">
              Test your geography knowledge and compete with players worldwide!
            </p>
          </div>

          {/* Decorative compass */}
          <div className="flex justify-center py-4">
            <Compass className="w-12 h-12 text-white/40 rotate-12" />
          </div>

          {/* Sign in button */}
          <Button
            onClick={signIn}
            className="w-full group relative flex items-center justify-center gap-3 bg-white/10 backdrop-blur-md text-white py-6 text-lg font-medium rounded-xl hover:bg-white/20 transition-all duration-300"
          >
            <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            <span className="group-hover:translate-x-1 transition-transform duration-300">
              Begin Your Journey
            </span>
          </Button>

          <p className="text-center text-white/60 text-sm">
            Join thousands of geography enthusiasts worldwide
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
