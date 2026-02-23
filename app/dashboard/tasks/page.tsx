"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

type Staff = {
  id: number
  name: string
}

type Task = {
  id: number
  title: string
  status: string
  staff_id: number
  staff?: { name: string }
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [title, setTitle] = useState("")
  const [staffId, setStaffId] = useState("")
  const [showForm, setShowForm] = useState(false)

  // --- 1. State สำหรับการกรอง (Filter) ---
  const [filterStatus, setFilterStatus] = useState("")
  const [filterStaff, setFilterStaff] = useState("")

  const fetchStaff = async () => {
    const { data } = await supabase.from("staff").select("id, name")
    if (data) setStaff(data)
  }

  const fetchTasks = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*, staff(name)")
      .order('id', { ascending: false })
    if (data) setTasks(data)
  }

  useEffect(() => {
    fetchStaff()
    fetchTasks()
  }, [])

  // --- 2. Logic การกรองข้อมูล ---
  const filteredTasks = tasks.filter((t) => {
    const matchesStatus = filterStatus === "" || t.status === filterStatus
    const matchesStaff = filterStaff === "" || t.staff_id.toString() === filterStaff
    return matchesStatus && matchesStaff
  })

  // --- 3. ฟังก์ชันจบงานทั้งหมดที่กรองอยู่ (Bulk Update) ---
  const markFilteredAsDone = async () => {
    const targetIds = filteredTasks
      .filter(t => t.status !== "Completed")
      .map(t => t.id)
    
    if (targetIds.length === 0) return alert("not have any pending tasks in the current filter")
    
    if (confirm(`do you want to mark ${targetIds.length} tasks as completed?`)) {
      const { error } = await supabase
        .from("tasks")
        .update({ status: "Completed" })
        .in('id', targetIds)

      if (!error) fetchTasks()
    }
  }

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !staffId) return
    const { error } = await supabase.from("tasks").insert([
      { title, staff_id: parseInt(staffId), status: "Pending" }
    ])
    if (!error) {
      setTitle(""); setStaffId(""); setShowForm(false); fetchTasks()
    }
  }

  const updateStatus = async (id: number, nextStatus: string) => {
    const { error } = await supabase.from("tasks").update({ status: nextStatus }).eq('id', id)
    if (!error) fetchTasks()
  }

  const deleteTask = async (id: number) => {
    if (confirm("Do you want to delete this task?")) {
      const { error } = await supabase.from("tasks").delete().eq('id', id)
      if (!error) fetchTasks()
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-[#0f172a] min-h-screen text-white">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase italic">Task Control Center</h1>
          <p className="text-gray-400 text-sm mt-1">Efficient management with smart filters</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-6 py-2.5 rounded-2xl font-bold hover:bg-blue-600 transition-all text-sm shadow-lg shadow-blue-500/20"
        >
          {showForm ? "Close" : "+ New Assignment"}
        </button>
      </div>

      {/* 4. Filter Bar & Bulk Action Button */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-800/30 p-4 rounded-[2rem] border border-gray-800">
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-gray-900 border border-gray-700 p-3 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>

        <select 
          value={filterStaff} 
          onChange={(e) => setFilterStaff(e.target.value)}
          className="bg-gray-900 border border-gray-700 p-3 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Staff</option>
          {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <button 
          onClick={markFilteredAsDone}
          className="md:col-span-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/10"
        >
          ✅ Mark {filteredTasks.filter(t => t.status !== "Completed").length} Tasks as Done
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="p-8 bg-gray-800/40 border-2 border-dashed border-gray-700 rounded-[2.5rem] animate-in fade-in slide-in-from-top-4">
          <form onSubmit={addTask} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input placeholder="Task Title" value={title} onChange={e => setTitle(e.target.value)} className="bg-gray-900 border border-gray-700 p-4 rounded-2xl outline-none text-white" />
            <select value={staffId} onChange={e => setStaffId(e.target.value)} className="bg-gray-900 border border-gray-700 p-4 rounded-2xl outline-none text-white">
              <option value="">Assign To...</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.name} (ID: {s.id})</option>)}
            </select>
            <button type="submit" className="bg-white text-black p-4 rounded-2xl font-black uppercase text-[10px]">Create Task</button>
          </form>
        </div>
      )}

      {/* Tasks Grid (แสดงผลเฉพาะที่ผ่านการ Filter) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map(task => {
          const status = task.status
          const statusConfig = {
            "Pending": { color: "amber", progress: "w-1/4", label: "● Pending" },
            "In Progress": { color: "blue", progress: "w-2/3", label: "⚡ In Progress" },
            "Completed": { color: "emerald", progress: "w-full", label: "✓ Completed" }
          }[status] || { color: "gray", progress: "w-0", label: status }

          return (
            <div key={task.id} className="group flex flex-col bg-gray-800/40 border border-gray-700 p-6 rounded-[2.5rem] min-h-[250px]">
              <div className="flex justify-between items-start mb-6">
                <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl uppercase bg-${statusConfig.color}-500/10 text-${statusConfig.color}-400 border border-${statusConfig.color}-500/20`}>
                  {statusConfig.label}
                </span>
                <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-2 text-gray-500">🗑️</button>
              </div>

              <h2 className={`text-lg font-black mb-1 ${status === 'Completed' ? 'text-gray-500 line-through' : 'text-white'}`}>
                {task.title}
              </h2>
              <p className="text-[10px] text-gray-500 font-bold mb-6 italic">
                Operator: <span className="text-blue-400">{task.staff?.name}</span>
              </p>

              <div className="mt-auto space-y-4">
                <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-700 bg-${statusConfig.color}-500 ${statusConfig.progress}`} />
                </div>
                
                <div className="flex gap-2">
                  {status === 'Pending' && (
                    <button onClick={() => updateStatus(task.id, 'In Progress')} className="w-full py-3 bg-blue-600 rounded-2xl text-[9px] font-black uppercase">🚀 Start</button>
                  )}
                  {status === 'In Progress' && (
                    <button onClick={() => updateStatus(task.id, 'Completed')} className="w-full py-3 bg-emerald-600 rounded-2xl text-[9px] font-black uppercase">✅ Finish</button>
                  )}
                  {status === 'Completed' && (
                    <button onClick={() => updateStatus(task.id, 'Pending')} className="w-full py-3 bg-gray-700 rounded-2xl text-[9px] font-black uppercase">🔄 Reset</button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}