"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

type Staff = {
  id: string
  name: string
  role: string
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  const [showForm, setShowForm] = useState(false)
  
  // State สำหรับโหมดแก้ไข
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editRole, setEditRole] = useState("")

  const fetchStaff = async () => {
    const { data } = await supabase
      .from("staff")
      .select("*")
      .order('created_at', { ascending: false })
    if (data) setStaff(data)
  }

  useEffect(() => {
    fetchStaff()
  }, [])

  // --- 1. ฟังก์ชันเพิ่ม (Create) ---
  const addStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !role) return
    const { error } = await supabase.from("staff").insert([{ name, role }])
    if (!error) {
      setName(""); setRole(""); setShowForm(false); fetchStaff()
    }
  }

  // --- 2. ฟังก์ชันแก้ไข (Update) ---
  const startEdit = (item: Staff) => {
    setEditingId(item.id)
    setEditName(item.name)
    setEditRole(item.role)
  }

  const handleUpdate = async (id: string) => {
    const { error } = await supabase
      .from("staff")
      .update({ name: editName, role: editRole })
      .eq('id', id)

    if (!error) {
      setEditingId(null)
      fetchStaff()
    }
  }

  // --- 3. ฟังก์ชันลบ (Delete) ---
  const handleDelete = async (id: string) => {
    if (confirm("คุณแน่ใจหรือไม่ที่จะลบรายชื่อนี้?")) {
      const { error } = await supabase
        .from("staff")
        .delete()
        .eq('id', id)

      if (!error) {
        fetchStaff()
      } else {
        alert("ไม่สามารถลบได้: ข้อมูลนี้อาจถูกใช้งานอยู่ในตารางอื่น")
      }
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-[#0f172a] min-h-screen text-white">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Staff Management</h1>
          <p className="text-gray-400 text-sm mt-1">managing staff members and their roles</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-white text-black px-6 py-2.5 rounded-2xl font-bold hover:scale-105 transition-all text-sm shadow-xl"
        >
          {showForm ? "Close" : "+ Add Member"}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="p-8 bg-gray-800/40 border-2 border-dashed border-gray-700 rounded-[2.5rem] animate-in fade-in slide-in-from-top-4">
          <form onSubmit={addStaff} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="bg-gray-900 border border-gray-700 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-white" />
            <input placeholder="Role" value={role} onChange={e => setRole(e.target.value)} className="bg-gray-900 border border-gray-700 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-white" />
            <button type="submit" className="bg-blue-600 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all">Register</button>
          </form>
        </div>
      )}

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((s) => (
          <div key={s.id} className="group bg-gray-800/50 border border-gray-700 p-6 rounded-[2rem] transition-all duration-300 hover:border-gray-600">
            {editingId === s.id ? (
              /* --- โหมดแก้ไข --- */
              <div className="space-y-4 animate-in fade-in zoom-in-95">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Editing Member</p>
                <input 
                  value={editName} 
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-gray-900 border border-blue-500 p-3 rounded-xl text-sm outline-none"
                />
                <input 
                  value={editRole} 
                  onChange={e => setEditRole(e.target.value)}
                  className="w-full bg-gray-900 border border-blue-500 p-3 rounded-xl text-sm outline-none"
                />
                <div className="flex gap-2">
                  <button onClick={() => handleUpdate(s.id)} className="flex-1 bg-emerald-600 text-[10px] font-bold py-3 rounded-xl hover:bg-emerald-700">SAVE</button>
                  <button onClick={() => setEditingId(null)} className="flex-1 bg-gray-700 text-[10px] font-bold py-3 rounded-xl">CANCEL</button>
                </div>
              </div>
            ) : (
              /* --- โหมดแสดงผลปกติ --- */
              <>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl font-black shadow-lg">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="font-black text-lg group-hover:text-blue-400 transition-colors">{s.name}</h2>
                      <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md font-bold uppercase tracking-tighter">
                        {s.role}
                      </span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-1">
                    <button 
                      onClick={() => startEdit(s)}
                      className="p-2 bg-gray-700/50 hover:bg-blue-600 rounded-xl transition-all text-xs"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDelete(s.id)}
                      className="p-2 bg-gray-700/50 hover:bg-rose-600 rounded-xl transition-all text-xs"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-gray-700/30 flex justify-between items-center text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                  <span>ID: {s.id.slice(0, 8)}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                    ONLINE
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}