"use client"
import { useEffect, useState, useRef } from "react"
import { Html5QrcodeScanner } from "html5-qrcode"
import { supabase } from "@/lib/supabaseClient"

export default function ScanPage() {
    const [msg, setMsg] = useState("Scan Staff Name QR")
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

                    // 1. รับชื่อจาก QR และลบช่องว่างส่วนเกิน
                    const scannedName = decodedText.trim();

                    if (!scannedName) return;

                    isProcessingRef.current = true;
                    setMsg(`⌛ Checking: ${scannedName}...`);

                    try {
                        // 2. ไปค้นหา ID จากชื่อในตาราง staff
                        const { data: staff, error: findError } = await supabase
                            .from("staff")
                            .select("id")
                            .eq("name", scannedName) // ชื่อใน DB ต้องตรงกับ QR เป๊ะๆ
                            .single();

                        if (findError || !staff) {
                            throw new Error(`Name "${scannedName}" not found in system`);
                        }

                        // 3. บันทึกลงตาราง attendance โดยใช้ ID ที่หาได้
                        const { error: insertError } = await supabase
                            .from("attendance")
                            .insert([{
                                staff_id: staff.id,
                                status: "On Time",
                                check_in_time: new Date().toISOString()
                            }]);

                        if (!insertError) {
                            setMsg(`✅ Success! Welcome ${scannedName}`);
                            setTimeout(() => {
                                setMsg("Scan Staff Name QR");
                                isProcessingRef.current = false;
                            }, 2500);
                        } else {
                            throw insertError;
                        }
                    } catch (error: any) {
                        console.error("Error:", error);
                        setMsg(`❌ ${error.message}`);
                        setTimeout(() => {
                            isProcessingRef.current = false;
                            setMsg("Scan Staff Name QR");
                        }, 3500);
                    }
                }, (err) => {});

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
                    Name Scanner
                </h1>
                <div className="h-1 w-20 bg-blue-500 mx-auto mt-2 rounded-full"></div>
                <p className="text-gray-400 text-[10px] mt-4 uppercase tracking-[0.2em] font-bold">
                    English Name Recognition
                </p>
            </div>

            <div className="relative w-full max-w-md">
                <div id="reader" className="overflow-hidden rounded-[2.5rem] border-4 border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.15)] bg-black"></div>
                {!isProcessingRef.current && (
                    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-blue-400 shadow-[0_0_15px_#3b82f6] animate-pulse pointer-events-none"></div>
                )}
            </div>

            <div className={`mt-10 px-10 py-5 rounded-[2rem] font-black text-xl transition-all border-2 flex items-center justify-center gap-3 shadow-2xl min-h-[80px] w-full max-w-xs ${
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