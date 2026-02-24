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
        // ฟังก์ชันเริ่มสแกน
        const startScanner = () => {
            if (!scannerRef.current) {
                const scanner = new Html5QrcodeScanner(
                    "reader",
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                        rememberLastUsedCamera: true // จำกล้องล่าสุดที่ใช้
                    },
                    false
                );

                scanner.render(async (decodedText) => {
                    if (isProcessingRef.current) return;

                    const staffId = decodedText.trim();

                    // ✅ ตรวจสอบรูปแบบ UUID (v4)
                    const uuidRegex =
                        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

                    if (!uuidRegex.test(staffId)) {
                        setMsg("❌ Invalid QR Code");
                        return;
                    }

                    isProcessingRef.current = true;
                    setMsg("⌛ Verifying...");

                    try {
                        // ✅ 1. ตรวจสอบว่ามีพนักงานจริง
                        const { data: staff, error: findError } = await supabase
                            .from("staff")
                            .select("id, name")
                            .eq("id", staffId)
                            .single();

                        if (findError || !staff) {
                            throw new Error("Staff not found");
                        }

                        // ✅ 2. กันเช็คอินซ้ำในวันเดียวกัน
                        const todayStart = new Date();
                        todayStart.setHours(0, 0, 0, 0);

                        const { data: existing } = await supabase
                            .from("attendance")
                            .select("id")
                            .eq("staff_id", staff.id)
                            .gte("check_in_time", todayStart.toISOString());

                        if (existing && existing.length > 0) {
                            throw new Error("Already checked in today");
                        }

                        // ✅ 3. บันทึกข้อมูล
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

                        setMsg(`✅ Welcome ${staff.name}`);

                        setTimeout(() => {
                            setMsg("Scan your QR Code");
                            isProcessingRef.current = false;
                        }, 2500);

                    } catch (error: any) {
                        setMsg(`❌ ${error.message}`);

                        setTimeout(() => {
                            isProcessingRef.current = false;
                            setMsg("Scan your QR Code");
                        }, 3000);
                    }

                }, (err) => {
                    // ปล่อยว่างเพื่อไม่ให้ Console บวม
                });

                scannerRef.current = scanner;
            }
        };

        startScanner();

        // Cleanup: ล้าง Scanner เมื่อปิดหน้าเว็บ
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch((error: any) => console.error("Failed to clear scanner", error));
                scannerRef.current = null;
            }
        };
    }, []);

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
            <div className={`mt-10 px-10 py-5 rounded-[2rem] font-black text-xl transition-all border-2 flex items-center gap-3 shadow-2xl ${msg.includes('✅') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40 shadow-emerald-500/10' :
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