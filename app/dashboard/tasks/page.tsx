"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

type Staff = {
  id: string
  name: string
}

type Task = {
  id: string
  title: string
  status: string
  staff_id: string
  staff?: { name: string }
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [title, setTitle] = useState("")
  const [staffId, setStaffId] = useState("")
  const [showForm, setShowForm] = useState(false)

  const fetchStaff = async () => {
    const { data } = await supabase.from("staff").select("*")
    if (data) setStaff(data)
  }

  const fetchTasks = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*, staff(name)")
      .order('created_at', { ascending: false })
    if (data) setTasks(data)
  }

  useEffect(() => {
    fetchStaff()
    fetchTasks()
  }, [])

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !staffId) return
    const { error } = await supabase.from("tasks").insert([
      { title, staff_id: staffId, status: "Pending" }
    ])
    if (!error) {
      setTitle(""); setStaffId(""); setShowForm(false); fetchTasks()
    }
  }

  // --- 1. ฟังก์ชันเปลี่ยนสถานะ (Update Status) ---
  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "Completed" ? "Pending" : "Completed"
    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq('id', id)
    
    if (!error) {
      fetchTasks() // รีเฟรชข้อมูลให้เป็นปัจจุบัน
    }
  }

  // --- 2. ฟังก์ชันลบงาน (Delete Task) ---
  const deleteTask = async (id: string) => {
    if (confirm("ต้องการลบงานนี้ใช่หรือไม่?")) {
      const { error } = await supabase.from("tasks").delete().eq('id', id)
      if (!error) fetchTasks()
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-[#0f172a] min-h-screen text-white">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Tasks Management</h1>
          <p className="text-gray-400 text-sm mt-1">tracking and updating task status of the team</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-white text-black px-6 py-2.5 rounded-2xl font-bold hover:scale-105 transition-all text-sm shadow-xl"
        >
          {showForm ? "Close" : "+ New Task"}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="p-8 bg-gray-800/40 border-2 border-dashed border-gray-700 rounded-[2.5rem] animate-in fade-in slide-in-from-top-4">
          <form onSubmit={addTask} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input placeholder="Task Title" value={title} onChange={e => setTitle(e.target.value)} className="bg-gray-900 border border-gray-700 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-white" />
            <select value={staffId} onChange={e => setStaffId(e.target.value)} className="bg-gray-900 border border-gray-700 p-4 rounded-2xl outline-none text-white">
              <option value="">Select Staff</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button type="submit" className="bg-blue-600 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all">Add Task</button>
          </form>
        </div>
      )}

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map(task => {
          const isDone = task.status === 'Completed'
          return (
            <div key={task.id} className={`group border p-6 rounded-[2rem] transition-all duration-300 ${
              isDone ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-gray-800/50 border-gray-700'
            }`}>
              <div className="flex justify-between items-start mb-6">
                <button 
                  onClick={() => toggleStatus(task.id, task.status)}
                  className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest transition-all ${
                    isDone 
                    ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500 hover:text-white'
                  }`}
                >
                  {isDone ? '✓ Completed' : 'Pending'}
                </button>
                <button 
                  onClick={() => deleteTask(task.id)}
                  className="p-2 hover:bg-rose-500/20 rounded-xl text-gray-500 hover:text-rose-400 transition-colors"
                >
                  🗑️
                </button>
              </div>

              <h2 className={`text-lg font-black mb-1 transition-all ${isDone ? 'text-gray-400 line-through' : 'text-white'}`}>
                {task.title}
              </h2>
              <p className="text-xs text-gray-500 mb-6">
                Assigned to <span className="text-gray-200 font-bold">{task.staff?.name || 'Unknown'}</span>
              </p>

              {/* Progress Bar & Toggle Action */}
              <div className="space-y-4">
                <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-700 ${isDone ? 'w-full bg-emerald-500' : 'w-1/3 bg-blue-500'}`} />
                </div>
                
                {!isDone && (
                  <button 
                    onClick={() => toggleStatus(task.id, task.status)}
                    className="w-full py-2 bg-gray-700 hover:bg-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Mark as Done
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}