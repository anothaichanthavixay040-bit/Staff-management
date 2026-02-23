"use client"

import { useEffect, useState } from "react"
import { Html5QrcodeScanner } from "html5-qrcode"
import { supabase } from "@/lib/supabaseClient"

export default function ScanAttendance() {
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [status, setStatus] = useState<string>("")
  const [staffName, setStaffName] = useState<string>("")

  // ...existing code...
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 280, height: 280 } },
      false
    )

    scanner.render(onScanSuccess, (err) => { /* ignore error */ })

    async function onScanSuccess(decodedText: string) {
      setScanResult(decodedText)
      await scanner.clear()

      try {
        const staffId = parseInt(decodedText)
        // ...existing code...
      } catch (err) { /* ... */ }
    }

    // synchronous cleanup — do NOT return an async function
    return () => {
      // call clear() but don't return its Promise
      scanner.clear().catch(() => { /* ignore error */ })
    }
  }, [])
// ...existing code...

  return (
    <div className="p-8 max-w-xl mx-auto text-center space-y-8 bg-[#0f172a] min-h-screen text-white">
      <div className="space-y-2">
        <h1 className="text-3xl font-black italic uppercase tracking-tighter">Staff Check-In</h1>
        <p className="text-gray-400 text-sm font-medium">scan QR Code on staff card</p>
      </div>
      
      {/* จอสำหรับสแกน */}
      <div id="reader" className="overflow-hidden rounded-[2.5rem] border-4 border-blue-500/30 shadow-2xl shadow-blue-500/20"></div>

      {status && (
        <div className={`p-6 rounded-[2rem] border animate-in fade-in zoom-in duration-300 ${
          status.includes('✅') 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          <p className="text-lg font-bold mb-1">{status}</p>
          {staffName && <p className="text-sm opacity-80 font-medium">พนักงาน: {staffName}</p>}
          
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
          >
            next 🔄
          </button>
        </div>
      )}
    </div>
  )
}