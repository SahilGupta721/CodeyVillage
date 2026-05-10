"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        const hasUsername = localStorage.getItem(`username:${user.uid}`);
        router.push(hasUsername ? "/lobby" : "/onboarding");
      } else {
        router.push("/auth");
      }
    });
    return () => unsub();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
      <div className="text-slate-400 text-sm">Loading...</div>
    </div>
  );
}
