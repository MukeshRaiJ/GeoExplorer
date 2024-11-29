"use client";
import { useAuth } from "@/components/firebase/useAuth";
import { AuthPage } from "@/components/firebase/AuthPage";
import GeographyGame from "@/components/index";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#001324] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="relative">
      <GeographyGame />
      <div className="absolute right-4 top-20 z-10 w-80"></div>
    </div>
  );
}
