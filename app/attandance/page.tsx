"use client"
import { useEffect, useState, useRef } from "react"
import { Html5QrcodeScanner } from "html5-qrcode"
import { supabase } from "@/lib/supabaseClient"

export default function ScanPage() {
  const [msg, setMsg] = useState("Scan your QR Code")
  // ใช้ useRef สำหรับ processing เพื่อให้ใน Callback มองเห็นค่าล่าสุดโดยไม่ต้องรัน useEffect ใหม่
  const isProcessingRef = useRef(false) 
  const scannerRef = useRef<any>(null)

  useEffect(() => {
    // ป้องกันการสร้าง Scanner ซ้ำถ้ามีอยู่แล้ว
    if (!scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        "reader", 
        { fps: 10, qrbox: { width: 250, height: 250 } }, 
        false
      )

      scanner.render(async (decodedText) => {
        // 1. เช็คว่ากำลังทำงานอยู่ไหมผ่าน Ref
        if (isProcessingRef.current) return;

        isProcessingRef.current = true
        setMsg("⌛ Processing...")

        console.log("Scanned ID:", decodedText); // เช็คใน Console ว่าเลขที่อ่านได้คืออะไร

        // 2. ส่งข้อมูลไป Supabase
        const { error } = await supabase
          .from("attendance")
          .insert([
            { 
              staff_id: parseInt(decodedText), // ตรวจสอบว่าใน DB ชื่อคอลัมน์นี้เป๊ะๆ
              status: "On Time",               // ใส่ค่าเริ่มต้นให้คอลัมน์ status (ถ้ามี)
              check_in_time: new Date().toISOString() // บันทึกเวลาปัจจุบัน
            }
          ])

        if (!error) {
          setMsg("✅ Success! Welcome to work.")
          // หลังจาก 3 วินาที ให้รีเซ็ตเพื่อให้สแกนคนต่อไปได้
          setTimeout(() => {
            setMsg("Scan your QR Code")
            isProcessingRef.current = false
          }, 3000)
        } else {
          console.error("Supabase Error:", error)
          setMsg(`❌ Error: ${error.message}`)
          setTimeout(() => {
            isProcessingRef.current = false
            setMsg("Scan your QR Code")
          }, 3000)
        }
      }, (err) => {
        // ปล่อยว่างไว้
      })

      scannerRef.current = scanner
    }

    return () => {
      // ไม่ต้องเคลียร์ทิ้งทันที เพื่อให้กล้องยังทำงานได้ต่อเนื่อง
    }
  }, []) // รันแค่ครั้งเดียวตอนโหลดหน้า

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 text-white text-center">
      <div className="mb-8">
        <h1 className="text-3xl font-black italic uppercase text-blue-500 tracking-tighter">Staff Scanner</h1>
        <p className="text-gray-400 text-xs mt-2 uppercase tracking-widest">Operation Entry System</p>
      </div>

      {/* กรอบสแกน */}
      <div className="relative group">
        <div id="reader" className="w-full max-w-md overflow-hidden rounded-[2.5rem] border-4 border-blue-500/50 shadow-[0_0_50px_rgba(59,130,246,0.2)] bg-black"></div>
        {/* เส้นเลเซอร์ตกแต่งเพื่อให้ดูเหมือนกำลังสแกน */}
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-blue-400 shadow-[0_0_15px_#3b82f6] animate-pulse pointer-events-none"></div>
      </div>

      {/* ข้อความสถานะ */}
      <div className={`mt-10 px-10 py-5 rounded-[2rem] font-black text-xl transition-all border-2 ${
        msg.includes('✅') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 
        msg.includes('❌') ? 'bg-red-500/10 text-red-400 border-red-500/50' :
        'bg-blue-500/5 text-blue-400 border-blue-500/20'
      }`}>
        {msg}
      </div>

      <button onClick={() => window.location.reload()} className="mt-12 text-gray-600 text-[10px] uppercase font-bold tracking-widest hover:text-blue-400 transition-colors">
        System Reset / Refresh Camera
      </button>
    </div>
  )
}