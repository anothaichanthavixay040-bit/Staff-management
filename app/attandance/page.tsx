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
          fps: 15, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        }, 
        false
      )

      scanner.render(async (decodedText) => {
        if (isProcessingRef.current) return;

        const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
        const match = decodedText.match(uuidRegex);

        if (!match) {
          setMsg("❌ Invalid QR Format");
          return;
        }

        const cleanUuid = match[0];
        isProcessingRef.current = true
        setMsg("⌛ Processing Attendance...")

        const today = new Date().toISOString().split('T')[0];

        // 1. ตรวจสอบบันทึกของวันนี้ในตาราง attendance
        const { data: attendanceRecord } = await supabase
          .from("attendance")
          .select("*")
          .eq("staff_id", cleanUuid)
          .gte("check_in_time", `${today}T00:00:00`)
          .lte("check_in_time", `${today}T23:59:59`)
          .maybeSingle();

        let successAction = "";

        if (!attendanceRecord) {
          // --- กรณีที่ 1: สแกนเข้า (CHECK-IN) ---
          const { error: inError } = await supabase
            .from("attendance")
            .insert([{ 
              staff_id: cleanUuid, 
              status: "On Time", 
              check_in_time: new Date().toISOString() 
            }]);

          if (!inError) {
            // เปลี่ยนสถานะพนักงานเป็น Active
            await supabase.from("staff").update({ is_active: true }).eq("id", cleanUuid);
            successAction = "✅ CHECK-IN SUCCESS! (ACTIVE)";
          } else {
            successAction = `❌ Error: ${inError.message}`;
          }
        } else if (!attendanceRecord.check_out_time) {
          // --- กรณีที่ 2: สแกนออก (CHECK-OUT) ---
          const { error: outError } = await supabase
            .from("attendance")
            .update({ check_out_time: new Date().toISOString() })
            .eq("id", attendanceRecord.id);

          if (!outError) {
            // เปลี่ยนสถานะพนักงานเป็น Inactive
            await supabase.from("staff").update({ is_active: false }).eq("id", cleanUuid);
            successAction = "✅ CHECK-OUT SUCCESS! (OFFLINE)";
          } else {
            successAction = `❌ Error: ${outError.message}`;
          }
        } else {
          // กรณีที่ 3: สแกนซ้ำหลังจากออกไปแล้ว
          successAction = "ℹ️ ALREADY CHECKED OUT TODAY";
        }

        setMsg(successAction);

        // หน่วงเวลา Reset สถานะหน้าจอ
        setTimeout(() => {
          setMsg("Scan your QR Code")
          isProcessingRef.current = false
        }, 3500)

      }, (err) => { /* ignore */ })

      scannerRef.current = scanner
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 text-white text-center font-sans">
      <div className="mb-8">
        <h1 className="text-4xl font-black italic uppercase text-blue-500 tracking-tighter">
          GATEWAY ACCESS
        </h1>
        <p className="text-gray-400 text-[10px] mt-2 uppercase tracking-[0.4em] font-bold">
          Real-time Presence System
        </p>
      </div>

      <div className="relative w-full max-w-md">
        <div id="reader" className="overflow-hidden rounded-[3rem] border-4 border-white/5 bg-black shadow-2xl"></div>
        {/* เส้นสแกน Animation */}
        {!isProcessingRef.current && (
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_20px_#3b82f6] animate-scan-line pointer-events-none"></div>
        )}
      </div>

      <div className={`mt-10 px-8 py-6 rounded-[2.5rem] font-black text-xl transition-all border-2 shadow-2xl min-w-[320px] ${
        msg.includes('✅') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 
        msg.includes('❌') ? 'bg-red-500/10 text-red-400 border-red-500/30' :
        msg.includes('ℹ️') ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
        'bg-blue-500/5 text-blue-400 border-blue-500/10'
      }`}>
        <span className="drop-shadow-sm">{msg}</span>
      </div>

      {/* สไตล์เพิ่มเติมสำหรับแอนิเมชันเส้นสแกน */}
      <style jsx global>{`
        @keyframes scan-line {
          0% { top: 0% }
          100% { top: 100% }
        }
        .animate-scan-line {
          animation: scan-line 3s linear infinite;
        }
        #reader__dashboard_section_csr button {
          background-color: #3b82f6 !important;
          color: white !important;
          border-radius: 12px !important;
          padding: 10px 20px !important;
          text-transform: uppercase !important;
          font-weight: bold !important;
          border: none !important;
          margin-top: 10px !important;
        }
      `}</style>
    </div>
  )
}