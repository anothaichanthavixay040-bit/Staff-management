"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import StatCard from "@/components/StatCard"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts"

export default function DashboardPage() {
  // 1. State ทั้งหมด (รวมของเดิมและส่วน Attendance ใหม่)
  const [tasks, setTasks] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [staffCount, setStaffCount] = useState(0)
  const [taskCount, setTaskCount] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [completedPercent, setCompletedPercent] = useState(0)
  const [presentToday, setPresentToday] = useState(0)

  // 2. ฟังก์ชันดึงข้อมูลทั้งหมดจาก Supabase
  const fetchData = async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0] // วันที่ปัจจุบัน YYYY-MM-DD

    // ดึงข้อมูลหลัก
    const { data: tasksData } = await supabase.from("tasks").select("*, staff(name)")
    const { data: staffData } = await supabase.from("staff").select("*")
    
    // ดึงข้อมูลการเข้างานของวันนี้
    const { data: attData, count: attCount } = await supabase
      .from("attendance")
      .select("*, staff(name)", { count: 'exact' })
      .gte("check_in_time", `${today}T00:00:00`)
      .lte("check_in_time", `${today}T23:59:59`)

    if (tasksData) setTasks(tasksData)
    if (staffData) setStaff(staffData)  
    if (attData) {
      setAttendance(attData)
      setPresentToday(attCount || 0)
    }
    
    // อัปเดต Stats สำหรับ Card
    const tCount = tasksData?.length || 0
    const sCount = staffData?.length || 0
    const cCount = tasksData?.filter(t => t.status === "Completed").length || 0
    
    setTaskCount(tCount)
    setStaffCount(sCount)
    setCompletedCount(cCount)
    setCompletedPercent(tCount > 0 ? Math.round((cCount / tCount) * 100) : 0)

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 3. จัดการข้อมูลสำหรับ Charts
  const completedTasks = tasks.filter(t => t.status === "Completed").length
  const pendingTasks = tasks.filter(t => t.status === "Pending").length
  
  const taskData = [
    { name: "Completed", value: completedTasks },
    { name: "Pending", value: pendingTasks },
    { name: "In Progress", value: tasks.length - completedTasks - pendingTasks },
  ]

  const userTaskData = staff.map(member => ({
    name: member.name,
    tasks: tasks.filter(t => t.staff_id === member.id).length,
  }))

  const COLORS = ["#10b981", "#f59e0b", "#3b82f6"]

  if (loading) return <div className="p-8 text-white animate-pulse">Loading Dashboard...</div>

  return (
    <div className="p-8 space-y-10 bg-white dark:bg-[#0f172a] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white uppercase italic">Control Center</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Live Operational & Attendance Data</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-gray-100 dark:bg-gray-800 rounded-xl hover:scale-95 transition-all text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
        >
          🔄 Refresh Data
        </button>
      </div>

      {/* Stats Cards - ปรับเป็น 4 Column เพื่อรองรับ Attendance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Attendance Today" 
          value={`${presentToday} / ${staffCount}`} 
          description="staff present now" 
          trend={`${staffCount > 0 ? Math.round((presentToday / staffCount) * 100) : 0}%`} 
        />
        <StatCard 
          title="Total Staff" 
          value={staffCount} 
          description="active employees" 
          trend={`+${staffCount}%`} 
        />
        <StatCard 
          title="Total Tasks" 
          value={taskCount} 
          description="assigned workload" 
          trend={`+${taskCount}%`} 
        />
        <StatCard
          title="Success Rate"
          value={completedCount}
          trend={`${completedPercent}%`}
          description="completed tasks"
        />
      </div>

      {/* Charts Section */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800/40 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-700/50 shadow-sm transition-all hover:border-blue-500/30">
          <h2 className="mb-6 font-black uppercase text-xs tracking-widest text-gray-400">Workload by Staff</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userTaskData}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', background: '#1e293b', color: '#fff' }} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
              <Bar dataKey="tasks" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={35} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800/40 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-700/50 shadow-sm transition-all hover:border-emerald-500/30">
          <h2 className="mb-6 font-black uppercase text-xs tracking-widest text-gray-400">Overall Task Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={taskData} dataKey="value" innerRadius={75} outerRadius={100} paddingAngle={8}>
                {taskData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Today's Check-in Log (ตารางสรุปคนมาทำงานวันนี้) */}
      <div className="bg-white dark:bg-gray-800/40 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700/50">
        <h2 className="mb-6 font-black uppercase text-xs tracking-widest text-gray-400">Live Attendance Log</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {attendance.length > 0 ? (
            attendance.map((att) => (
              <div key={att.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl">
                <div>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{att.staff?.name}</p>
                  <p className="text-[10px] text-emerald-500 font-black uppercase">
                    {new Date(att.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              </div>
            ))
          ) : (
            <div className="col-span-full py-10 text-center text-gray-500 text-sm italic">
              No staff members have checked in yet today.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}