"use client"
import { useEffect, useState, useRef } from "react"
import { Html5QrcodeScanner } from "html5-qrcode"
import { supabase } from "@/lib/supabaseClient"

export default function ScanPage() {
  const [msg, setMsg] = useState("Scan your QR Code")
  // ใช้ useRef เพื่อคุมสถานะการบันทึก ไม่ให้ระบบทำงานซ้อนกันตอนสแกน
  const isProcessingRef = useRef(false) 
  const scannerRef = useRef<any>(null)

  useEffect(() => {
    // ป้องกันการสร้าง Scanner ซ้ำซ้อน
    if (!scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        "reader", 
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0 
        }, 
        false
      )

      scanner.render(async (decodedText) => {
        // 1. ถ้ากำลังประมวลผลอยู่ ให้ข้ามการสแกนนี้ไปก่อน
        if (isProcessingRef.current) return;

        // 2. ตรวจสอบและทำความสะอาดข้อมูลที่ได้จาก QR Code
        const cleanId = decodedText.trim(); // ตัดช่องว่าง
        const staffIdNumber = parseInt(cleanId); // แปลงเป็นตัวเลข

        // ตรวจสอบว่าข้อมูลที่สแกนได้เป็นตัวเลขจริงหรือไม่
        if (isNaN(staffIdNumber)) {
          setMsg("❌ Error: Invalid QR Code (Must be a number)");
          return;
        }

        // เริ่มขั้นตอนการบันทึก
        isProcessingRef.current = true
        setMsg("⌛ Processing Attendance...")

        try {
          // 3. ส่งข้อมูลไปที่ตาราง attendance ใน Supabase
          const { error } = await supabase
            .from("attendance")
            .insert([
              { 
                staff_id: staffIdNumber, 
                status: "On Time",
                check_in_time: new Date().toISOString()
              }
            ])

          if (!error) {
            setMsg("✅ Success! Welcome to work.")
            // หน่วงเวลา 3 วินาทีเพื่อให้เห็นข้อความสำเร็จ ก่อนจะรับสแกนคนต่อไป
            setTimeout(() => {
              setMsg("Scan your QR Code")
              isProcessingRef.current = false
            }, 3000)
          } else {
            throw error;
          }
        } catch (error: any) {
          console.error("Supabase Error:", error)
          setMsg(`❌ Error: ${error.message || 'Database connection failed'}`)
          
          // ปลดล็อคให้ลองสแกนใหม่หลังจาก 3 วินาที
          setTimeout(() => {
            isProcessingRef.current = false
            setMsg("Scan your QR Code")
          }, 3000)
        }
      }, (err) => {
        // ignore errors during scanning process
      })

      scannerRef.current = scanner
    }

    return () => {
      // ไม่ต้อง clear scanner ทันทีเพื่อให้ทำงานต่อเนื่องบน mobile
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 text-white text-center font-sans">
      {/* ส่วนหัวของหน้าสแกน */}
      <div className="mb-8">
        <h1 className="text-3xl font-black italic uppercase text-blue-500 tracking-tighter leading-none">
          Staff Scanner
        </h1>
        <div className="h-1 w-20 bg-blue-500 mx-auto mt-2 rounded-full"></div>
        <p className="text-gray-400 text-[10px] mt-4 uppercase tracking-[0.2em] font-bold">
          Digital Attendance System
        </p>
      </div>

      {/* ส่วนของกล้อง (Scanner) */}
      <div className="relative w-full max-w-md">
        <div 
          id="reader" 
          className="overflow-hidden rounded-[2.5rem] border-4 border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.15)] bg-black"
        ></div>
        
        {/* เลเซอร์สแกนจำลอง (ตกแต่ง) */}
        {!isProcessingRef.current && (
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-blue-400 shadow-[0_0_15px_#3b82f6] animate-bounce pointer-events-none"></div>
        )}
      </div>

      {/* ส่วนแสดงข้อความสถานะ */}
      <div className={`mt-10 px-10 py-5 rounded-[2rem] font-black text-xl transition-all border-2 flex items-center gap-3 shadow-2xl ${
        msg.includes('✅') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40 shadow-emerald-500/10' : 
        msg.includes('❌') ? 'bg-red-500/10 text-red-400 border-red-500/40 shadow-red-500/10' :
        'bg-blue-500/5 text-blue-400 border-blue-500/20'
      }`}>
        {msg}
      </div>

      {/* ปุ่มรีเซ็ตกรณีกล้องมีปัญหา */}
      <button 
        onClick={() => window.location.reload()} 
        className="mt-12 text-gray-600 text-[10px] uppercase font-bold tracking-widest hover:text-blue-400 transition-colors flex items-center gap-2"
      >
        <span>🔄 System Reset</span>
      </button>

      {/* Footer เล็กๆ */}
      <p className="absolute bottom-6 text-[8px] text-gray-700 uppercase tracking-widest">
        Powered by Supabase & Vercel
      </p>
    </div>
  )
}