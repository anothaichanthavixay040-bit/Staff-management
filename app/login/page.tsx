"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (error) {
      alert(error.message);
      return;
    }
    router.push("/dashboard");
  };

  return (
    // เปลี่ยนพื้นหลังให้เป็นโทนเดียวกับ Dashboard แต่เพิ่ม Gradient ให้ดูมีมิติ
    <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden px-4">
      
      {/* 1. เพิ่มลูกเล่นแสง Glow ด้านหลัง (Ambient Light) */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-[120px]" />

      <div className="w-full max-w-md relative z-10">
        {/* 2. Login Card แบบ Glassmorphism */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl">
          
          <div className="text-center mb-10">
            {/* Logo หรือ Icon เท่ๆ */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white dark:bg-white text-black rounded-2xl mb-4 shadow-lg font-black text-2xl tracking-tighter">
              SP
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Staff<span className="text-blue-500">Panel</span>
            </h2>
            <p className="text-slate-400 text-sm mt-2 font-medium">
              Welcome back! Please enter your details.
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
              <input
                type="Email"
                placeholder="Enter your email"
                required
                className="w-full bg-slate-800/50 border border-slate-700 p-4 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <input
                type="password"
                placeholder="•••••••••"
                required
                className="w-full bg-slate-800/50 border border-slate-700 p-4 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 bg-white text-black py-4 rounded-2xl font-bold hover:bg-blue-50 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-white/5"
            >
              {loading ? "Verifying..." : "Sign In to Dashboard"}
            </button>
          </form>

          {/* ตกแต่ง Footer ของ Card */}
          <p className="text-center text-slate-500 text-xs mt-8 font-medium">
            Authorized Personnel Only
          </p>
        </div>
      </div>
    </div>
  );
}