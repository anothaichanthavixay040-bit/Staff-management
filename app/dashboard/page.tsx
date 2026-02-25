"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import StatCard from "@/components/StatCard"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts"

// 1. Data Mapping สำหรับแผนกและตำแหน่ง
const rolesByDept: Record<string, string[]> = {
  "IT": ["Frontend Developer", "Backend Engineer", "Full Stack Developer", "DevOps Engineer"],
  "Design": ["Graphic Designer", "UI/UX Designer", "Product Designer"],
  "Management": ["Project Manager", "Product Owner", "Business Analyst"],
  "Marketing": ["Marketing Lead", "Content Creator", "Social Media Manager"],
  "Accounting": ["Accountant", "Financial Analyst"],
  "HR": ["HR Manager", "Recruiter"]
};

export default function DashboardPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [staffCount, setStaffCount] = useState(0)
  const [taskCount, setTaskCount] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [completedPercent, setCompletedPercent] = useState(0)
  const [presentToday, setPresentToday] = useState(0)

  // State สำหรับ Dropdown กรองข้อมูล
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDept(e.target.value);
    setSelectedRole(""); // รีเซ็ตตำแหน่งทุกครั้งที่เปลี่ยนแผนก
  };

  const fetchData = async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]

    const { data: tasksData } = await supabase.from("tasks").select("*, staff(name)")
    const { data: staffData } = await supabase.from("staff").select("*")
    
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

  // --- Logic กรองข้อมูลสำหรับ Charts ---
  // กรองพนักงานตามแผนกและตำแหน่งที่เลือกจาก Dropdown
  const filteredStaff = staff.filter(member => {
    const matchDept = selectedDept ? member.department === selectedDept : true;
    const matchRole = selectedRole ? member.role === selectedRole : true;
    return matchDept && matchRole;
  });

  const userTaskData = filteredStaff.map(member => ({
    name: member.name,
    tasks: tasks.filter(t => t.staff_id === member.id).length,
  }));

  const taskData = [
    { name: "Completed", value: tasks.filter(t => t.status === "Completed").length },
    { name: "Pending", value: tasks.filter(t => t.status === "Pending").length },
    { name: "In Progress", value: tasks.length - tasks.filter(t => t.status === "Completed").length - tasks.filter(t => t.status === "Pending").length },
  ]

  const COLORS = ["#10b981", "#f59e0b", "#3b82f6"]

  if (loading) return <div className="p-8 text-white animate-pulse">Loading Dashboard...</div>

  return (
    <div className="p-8 space-y-10 bg-white dark:bg-[#0f172a] min-h-screen text-gray-900 dark:text-white">
      
      {/* Header & Filter Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase italic">Control Center</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Live Operational & Attendance Data</p>
        </div>

        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          {/* Department Select */}
          <select 
            value={selectedDept}
            onChange={handleDeptChange}
            className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 ring-blue-500"
          >
            <option value="">All Departments</option>
            {Object.keys(rolesByDept).map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          {/* Role Select - จะเปลี่ยนตามแผนก */}
          <select 
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            disabled={!selectedDept}
            className={`bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 ring-blue-500 ${!selectedDept && 'opacity-50'}`}
          >
            <option value="">{selectedDept ? "All Roles" : "Select Dept First"}</option>
            {selectedDept && rolesByDept[selectedDept].map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>

          <button
            onClick={fetchData}
            className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl hover:scale-95 transition-all shadow-lg shadow-blue-500/20"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Attendance Today" value={`${presentToday} / ${staffCount}`} description="staff present now" trend={`${staffCount > 0 ? Math.round((presentToday / staffCount) * 100) : 0}%`} />
        <StatCard title="Total Staff" value={staffCount} description="active employees" trend="Current" />
        <StatCard title="Total Tasks" value={taskCount} description="assigned workload" trend="Live" />
        <StatCard title="Success Rate" value={completedCount} trend={`${completedPercent}%`} description="completed tasks" />
      </div>

      {/* Charts Section */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800/40 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-700/50 shadow-sm transition-all">
          <h2 className="mb-6 font-black uppercase text-xs tracking-widest text-gray-400">
            Workload: {selectedDept || "All Departments"} {selectedRole && `- ${selectedRole}`}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userTaskData}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', background: '#1e293b', color: '#fff' }} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
              <Bar dataKey="tasks" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={35} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800/40 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-700/50 shadow-sm transition-all">
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

      {/* Live Attendance Log */}
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