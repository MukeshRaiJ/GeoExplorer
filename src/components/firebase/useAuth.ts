import { useEffect, useState } from "react";
import { auth, db } from "@/components/firebase/firesbase";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { provider } from "@/components/firebase/firesbase";

import { UserData } from "@/components/types";

export const useAuth = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          const userData: UserData = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || "Anonymous",
            email: firebaseUser.email || "",
            photoURL: firebaseUser.photoURL || "",
            highScore: 0,
            gamesPlayed: 0,
            totalScore: 0,
            bestStreak: 0,
          };
          await setDoc(userRef, userData);
          setUser(userData);
        } else {
          setUser(userDoc.data() as UserData);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return { user, loading, signIn, signOutUser };
};
