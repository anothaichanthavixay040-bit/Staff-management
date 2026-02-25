"use client"
import { useEffect, useState, useRef } from "react"
import { Html5QrcodeScanner } from "html5-qrcode"
import { supabase } from "@/lib/supabaseClient"

export default function ScanPage() {
  const [msg, setMsg] = useState("Scan your QR Code")
  const isProcessingRef = useRef(false) 
  const scannerRef = useRef<any>(null)

  useEffect(() => {
    if (!scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        "reader", 
        { 
          fps: 15, // เพิ่มความเร็วในการสแกน
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        }, 
        false
      )

      scanner.render(async (decodedText) => {
        if (isProcessingRef.current) return;

        // --- ระบบสกัด UUID (ป้องกัน Error จากลิงก์เว็บ) ---
        const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
        const match = decodedText.match(uuidRegex);

        if (!match) {
          setMsg("❌ Invalid QR Format (UUID not found)");
          return;
        }

        const cleanUuid = match[0]; // ดึงรหัส UUID เพียวๆ ออกมา
        
        isProcessingRef.current = true
        setMsg("⌛ Verifying Secure ID...")

        // บันทึกลง Supabase
        const { error } = await supabase
          .from("attendance")
          .insert([
            { 
              staff_id: cleanUuid, // ส่ง UUID ตรงๆ ไปยังฐานข้อมูล
              status: "On Time",
              check_in_time: new Date().toISOString()
            }
          ])

        if (!error) {
          setMsg("✅ Success! Welcome to work.")
          // หน่วงเวลาเพื่อให้คนสแกนเห็นข้อความสำเร็จ
          setTimeout(() => {
            setMsg("Scan your QR Code")
            isProcessingRef.current = false
          }, 3000)
        } else {
          console.error("Supabase Error:", error)
          
          // ตรวจสอบ Error ยอดฮิต: ไม่เจอ UUID นี้ในตาราง Staff
          if (error.code === '23503') {
            setMsg("❌ Error: Staff ID not registered")
          } else {
            setMsg(`❌ DB Error: ${error.message}`)
          }
          
          setTimeout(() => {
            isProcessingRef.current = false
            setMsg("Scan your QR Code")
          }, 4000)
        }
      }, (err) => { /* Scan Errors ignore */ })

      scannerRef.current = scanner
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 text-white text-center font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-black italic uppercase text-blue-500 tracking-tighter leading-none">
          STAFF SCANNER
        </h1>
        <div className="h-1 w-20 bg-blue-500 mx-auto mt-2 rounded-full"></div>
        <p className="text-gray-400 text-[10px] mt-4 uppercase tracking-[0.3em] font-bold">
          UUID SECURE ACCESS SYSTEM
        </p>
      </div>

      {/* กรอบกล้อง */}
      <div className="relative w-full max-w-md">
        <div id="reader" className="overflow-hidden rounded-[2.5rem] border-4 border-blue-500/30 shadow-[0_0_60px_rgba(59,130,246,0.2)] bg-black"></div>
        {/* เลเซอร์ตกแต่ง */}
        {!isProcessingRef.current && (
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-blue-400 shadow-[0_0_15px_#3b82f6] animate-pulse pointer-events-none"></div>
        )}
      </div>

      {/* กล่องข้อความสถานะ */}
      <div className={`mt-10 px-10 py-5 rounded-[2rem] font-black text-xl transition-all border-2 shadow-2xl flex items-center justify-center min-w-[280px] ${
        msg.includes('✅') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40' : 
        msg.includes('❌') ? 'bg-red-500/10 text-red-400 border-red-500/40' :
        'bg-blue-500/5 text-blue-400 border-blue-500/20'
      }`}>
        {msg}
      </div>

      <button 
        onClick={() => window.location.reload()} 
        className="mt-12 text-gray-600 text-[10px] uppercase font-bold tracking-widest hover:text-blue-400 transition-colors flex items-center gap-2"
      >
        🔄 System Reset / Refresh Camera
      </button>
      
      <p className="absolute bottom-6 text-[8px] text-gray-700 uppercase tracking-[0.5em]">
        Secured by Supabase & Next.js
      </p>
    </div>
  )
}