"use client"
import { useEffect, useState, useRef } from "react"
import { Html5QrcodeScanner } from "html5-qrcode"
import { supabase } from "@/lib/supabaseClient"

export default function ScanPage() {
    const [msg, setMsg] = useState("Scan your QR Code")
    const isProcessingRef = useRef(false)
    const scannerRef = useRef<any>(null)

    useEffect(() => {
        const startScanner = () => {
            if (!scannerRef.current) {
                const scanner = new Html5QrcodeScanner(
                    "reader",
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                        rememberLastUsedCamera: true
                    },
                    false
                );

                scanner.render(async (decodedText) => {
                    if (isProcessingRef.current) return;

                    const staffId = decodedText.trim();

                    // ✅ ปรับ Regex ให้ยืดหยุ่นขึ้น (เช็คแค่ว่าเป็นรูปแบบ UUID หรือไม่ โดยไม่สน Version)
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

                    if (!uuidRegex.test(staffId)) {
                        setMsg("❌ Invalid QR Format");
                        return;
                    }

                    isProcessingRef.current = true;
                    setMsg("⌛ Verifying...");

                    try {
                        // 1. ตรวจสอบพนักงาน
                        const { data: staff, error: findError } = await supabase
                            .from("staff")
                            .select("id, name")
                            .eq("id", staffId)
                            .maybeSingle(); // ใช้ maybeSingle เพื่อไม่ให้ throw error ถ้าไม่เจอ

                        if (findError) throw findError;
                        if (!staff) throw new Error("Staff not found in system");

                        // 2. กันเช็คอินซ้ำ (เช็คเฉพาะวันที่ปัจจุบัน)
                        const today = new Date().toISOString().split('T')[0];
                        
                        const { data: existing, error: checkError } = await supabase
                            .from("attendance")
                            .select("id")
                            .eq("staff_id", staff.id)
                            .gte("check_in_time", `${today}T00:00:00`)
                            .lte("check_in_time", `${today}T23:59:59`)
                            .maybeSingle();

                        if (checkError) throw checkError;
                        if (existing) throw new Error("Already checked in today");

                        // 3. บันทึกข้อมูล
                        const { error: insertError } = await supabase
                            .from("attendance")
                            .insert([
                                {
                                    staff_id: staff.id,
                                    status: "On Time",
                                    check_in_time: new Date().toISOString(),
                                },
                            ]);

                        if (insertError) throw insertError;

                        setMsg(`✅ Welcome, ${staff.name}`);
                        
                        // เสียงแจ้งเตือนสั้นๆ (ถ้าต้องการความว้าวตอนพรีเซนต์)
                        // new Audio('/success-beep.mp3').play().catch(() => {});

                    } catch (error: any) {
                        console.error("Scan Error:", error);
                        setMsg(`❌ ${error.message || "Database Error"}`);
                    } finally {
                        // ไม่ว่าจะสำเร็จหรือพลาด ให้รอ 3 วินาทีแล้วรับสแกนใหม่
                        setTimeout(() => {
                            setMsg("Scan your QR Code");
                            isProcessingRef.current = false;
                        }, 3000);
                    }

                }, (err) => { /* ignore */ });

                scannerRef.current = scanner;
            }
        };

        startScanner();

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(() => {});
                scannerRef.current = null;
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 text-white text-center font-sans">
            <div className="mb-8">
                <h1 className="text-3xl font-black italic uppercase text-blue-500 tracking-tighter leading-none">
                    Staff Scanner
                </h1>
                <div className="h-1 w-20 bg-blue-500 mx-auto mt-2 rounded-full shadow-[0_0_10px_#3b82f6]"></div>
                <p className="text-gray-400 text-[10px] mt-4 uppercase tracking-[0.2em] font-bold">
                    UUID Secure Access
                </p>
            </div>

            <div className="relative w-full max-w-md">
                <div id="reader" className="overflow-hidden rounded-[2.5rem] border-4 border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.15)] bg-black"></div>
                {!isProcessingRef.current && (
                    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-blue-400 shadow-[0_0_15px_#3b82f6] animate-pulse pointer-events-none"></div>
                )}
            </div>

            <div className={`mt-10 px-10 py-5 rounded-[2rem] font-black text-xl transition-all border-2 flex items-center justify-center min-w-[280px] ${
                msg.includes('✅') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40' :
                msg.includes('❌') ? 'bg-red-500/10 text-red-400 border-red-500/40' :
                'bg-blue-500/5 text-blue-400 border-blue-500/20'
            }`}>
                {msg}
            </div>

            <button onClick={() => window.location.reload()} className="mt-12 text-gray-600 text-[10px] uppercase font-bold tracking-widest hover:text-blue-400 transition-colors">
                🔄 Reset Camera
            </button>
        </div>
    )
}