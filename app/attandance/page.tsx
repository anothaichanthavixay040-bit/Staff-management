"use client"
import { useEffect, useState, useRef } from "react"
import { Html5QrcodeScanner } from "html5-qrcode"
import { supabase } from "@/lib/supabaseClient"

export default function ScanPage() {
  const [msg, setMsg] = useState("Scan your QR Code")
  const [isProcessing, setIsProcessing] = useState(false) // ป้องกันการส่งข้อมูลซ้ำ
  const scannerRef = useRef<any>(null)

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader", 
      { fps: 10, qrbox: { width: 250, height: 250 } }, 
      false
    )
    scannerRef.current = scanner

    scanner.render(async (decodedText) => {
      // 1. ป้องกันการสแกนรัวๆ (ถ้ากำลังบันทึกอยู่ ให้หยุดก่อน)
      if (isProcessing) return;

      setIsProcessing(true)
      setMsg("⌛ Processing...")

      // 2. ส่งข้อมูลไป Supabase
      const { error } = await supabase
        .from("attendance")
        .insert([{ staff_id: parseInt(decodedText) }])

      if (!error) {
        setMsg("✅ Success! Welcome to work.")
        
        // 3. หลังจาก 3 วินาที ให้กลับมาพร้อมสแกนใหม่
        setTimeout(() => {
          setMsg("Scan your QR Code")
          setIsProcessing(false)
        }, 3000)
      } else {
        setMsg(`❌ Error: ${error.message}`)
        setTimeout(() => setIsProcessing(false), 3000) // ปลดล็อคให้ลองสแกนใหม่
      }
    }, (err) => {
      // error callback (ปล่อยว่างไว้ได้)
    })

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear()
      }
    }
  }, [isProcessing]) // ให้ useEffect ตรวจสอบสถานะการบันทึก

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 text-white">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black italic uppercase text-blue-500">Staff Scanner</h1>
        <p className="text-gray-400 text-sm">Please align QR code within the frame</p>
      </div>

      <div id="reader" className="w-full max-w-md overflow-hidden rounded-3xl border-4 border-blue-500 shadow-2xl"></div>

      <div className={`mt-10 px-8 py-4 rounded-2xl font-bold text-xl transition-all shadow-lg ${
        msg.includes('✅') ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500' : 
        msg.includes('❌') ? 'bg-red-500/20 text-red-400 border border-red-500' :
        'bg-blue-500/10 text-blue-400 border border-blue-500/30'
      }`}>
        {msg}
      </div>
      
      {/* เพิ่มปุ่ม Refresh เผื่อกล้องค้าง */}
      <button 
        onClick={() => window.location.reload()}
        className="mt-8 text-gray-500 text-xs underline"
      >
        Reset Camera
      </button>
    </div>
  )
}