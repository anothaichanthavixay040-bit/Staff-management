"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import StatCard from "@/components/StatCard"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts"

export default function DashboardPage() {
  // 1. สร้าง State สำหรับเก็บข้อมูลที่ดึงมาจาก Database
  const [tasks, setTasks] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // 2. ฟังก์ชันดึงข้อมูลจาก Supabase
  const fetchData = async () => {
    setLoading(true)
    const { data: tasksData } = await supabase.from("tasks").select("*, staff(name)")
    const { data: staffData } = await supabase.from("staff").select("*")
    
    if (tasksData) setTasks(tasksData)
    if (staffData) setStaff(staffData)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 3. คำนวณค่าสถิติจากข้อมูลจริงใน State
  const totalUsers = staff.length
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === "Completed").length
  const pendingTasks = tasks.filter(t => t.status === "Pending").length

  const taskData = [
    { name: "Completed", value: completedTasks },
    { name: "Pending", value: pendingTasks },
    { name: "In Progress", value: totalTasks - completedTasks - pendingTasks },
  ]

  // จัดการข้อมูลสำหรับ Bar Chart (นับจำนวนงานต่อคน)
  const userTaskData = staff.map(member => ({
    name: member.name,
    tasks: tasks.filter(t => t.staff_id === member.id).length,
  }))

  const COLORS = ["#10b981", "#f59e0b", "#3b82f6"]

  if (loading) return <div className="p-8 text-white">Loading Dashboard...</div>

  return (
    <div className="p-8 space-y-10 bg-white dark:bg-[#0f172a] min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Real-time Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Live data from Supabase Database</p>
        </div>
        <button 
          onClick={fetchData}
          className="p-2 text-xs bg-gray-100 dark:bg-gray-800 rounded-lg hover:opacity-80 transition-all text-gray-500"
        >
          🔄 Refresh Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Staff" value={totalUsers} description="พนักงานทั้งหมดในระบบ" trend="+0%" />
        <StatCard title="All Tasks" value={totalTasks} description="งานที่ได้รับมอบหมายทั้งหมด" trend="+0%" />
        <StatCard title="Completed" value={completedTasks} description="งานที่ดำเนินการเสร็จสิ้น" trend="+0%" />
      </div>

      {/* Charts Section */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <h2 className="mb-6 font-bold text-gray-700 dark:text-gray-200">Workload by Staff</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userTaskData}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{fill: '#94a3b8'}} />
              <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{fill: '#94a3b8'}} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} cursor={{fill: 'transparent'}} />
              <Bar dataKey="tasks" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <h2 className="mb-6 font-bold text-gray-700 dark:text-gray-200">Overall Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={taskData} dataKey="value" innerRadius={70} outerRadius={100} paddingAngle={8}>
                {taskData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}