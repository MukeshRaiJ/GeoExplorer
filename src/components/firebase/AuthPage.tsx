import { useAuth } from "@/components/firebase/useAuth";
import { Button } from "@/components/ui/button";
import { Globe2, LogIn } from "lucide-react";

export const AuthPage = () => {
  const { signIn } = useAuth();

  return (
    <div className="min-h-screen bg-[#001324] flex items-center justify-center">
      <div className="max-w-md w-full p-6 space-y-8 bg-black/40 backdrop-blur-md rounded-2xl border-2 border-white/20">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            <Globe2 className="w-12 h-12 text-white" />
            <h1 className="text-4xl font-bold text-white">GeoExplorer</h1>
          </div>
          <p className="text-white/80">
            Test your geography knowledge and compete with players worldwide!
          </p>
        </div>

        <Button
          onClick={signIn}
          className="w-full flex items-center justify-center gap-3 bg-white text-black hover:bg-white/90"
        >
          <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
          Continue with Google
        </Button>
      </div>
    </div>
  );
};
