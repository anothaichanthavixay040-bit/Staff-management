"use client";

import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="h-full w-full flex items-center justify-between px-8 bg-white dark:bg-[#0f172a]">
      {/* ฝั่งซ้าย: ชื่อหน้าปัจจุบัน */}
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
        <span className="text-gray-900 dark:text-white">Dashboard</span>
        </h1>
      </div>

      {/* ฝั่งขวา: ปุ่ม Logout แบบ Minimal */}
      <button
        onClick={logout}
        className="group flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
      >
        <span>Sign Out</span>
        <svg 
          className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" 
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7" />
        </svg>
      </button>
    </header>
  );
}