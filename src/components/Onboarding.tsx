// components/OnboardingFlow.tsx
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Globe2, ChevronRight, Gamepad2, Shield } from "lucide-react";

interface OnboardingFlowProps {
  open: boolean;
  onComplete: () => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  open,
  onComplete,
}) => {
  const [step, setStep] = useState(1);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const howToPlaySteps = [
    {
      title: "Find Countries",
      description:
        "You'll be shown a country's flag and name. Your task is to locate it on the world map.",
    },
    {
      title: "Score Points",
      description:
        "Get points for correct answers. The faster you answer, the more points you earn! Maintain a streak for bonus points.",
    },
    {
      title: "Use Hints",
      description:
        "Need help? Use hints to learn more about the country. But remember, hints are limited based on difficulty level.",
    },
  ];

  const handleComplete = () => {
    if (step < 3) {
      setStep(step + 1);
    } else if (agreedToTerms) {
      onComplete();
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="bg-[#001324]/95 text-white border border-white/20 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl flex items-center gap-3">
            {step === 1 && (
              <>
                <Globe2 className="w-8 h-8 text-blue-400" />
                Welcome to GeoExplorer!
              </>
            )}
            {step === 2 && (
              <>
                <Gamepad2 className="w-8 h-8 text-green-400" />
                How to Play
              </>
            )}
            {step === 3 && (
              <>
                <Shield className="w-8 h-8 text-purple-400" />
                Terms & Conditions
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-lg text-white/90">
                Get ready to explore the world and test your geography
                knowledge!
              </p>
              <div className="h-48 bg-white/5 rounded-lg flex items-center justify-center">
                <Globe2 className="w-24 h-24 text-blue-400 animate-pulse" />
              </div>
              <Button className="w-full mt-4" onClick={handleComplete}>
                Let's Get Started
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="grid gap-4">
                {howToPlaySteps.map((step, index) => (
                  <div
                    key={index}
                    className="bg-white/5 p-4 rounded-lg space-y-2"
                  >
                    <h3 className="text-xl font-bold text-white/90">
                      {step.title}
                    </h3>
                    <p className="text-white/70">{step.description}</p>
                  </div>
                ))}
              </div>
              <Button className="w-full" onClick={handleComplete}>
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="h-48 overflow-y-auto bg-white/5 rounded-lg p-4 text-sm text-white/70">
                <h3 className="font-bold mb-2">Terms of Use</h3>
                <p className="mb-4">
                  By using GeoExplorer, you agree to play fairly and respect the
                  gaming experience of others. The game collects basic usage
                  statistics to improve the experience.
                </p>
                <h3 className="font-bold mb-2">Privacy Policy</h3>
                <p className="mb-4">
                  We collect minimal data necessary for gameplay, including
                  scores and progress. Your personal information is protected
                  and never shared with third parties.
                </p>
                <h3 className="font-bold mb-2">Fair Play</h3>
                <p>
                  Players must not use automated tools or external assistance.
                  Violation may result in account suspension.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked)}
                />
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the terms and conditions
                </label>
              </div>

              <Button
                className="w-full"
                disabled={!agreedToTerms}
                onClick={handleComplete}
              >
                Start Playing
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingFlow;
