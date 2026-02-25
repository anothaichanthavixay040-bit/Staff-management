"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

type Staff = {
  id: number
  name: string
  role: string
  email: string
  age: number
  department: string
  created_at: string
}

// 1. กำหนดโครงสร้างแผนกและตำแหน่งให้สัมพันธ์กัน
const ROLES_BY_DEPT: Record<string, string[]> = {
  "IT": ["Frontend Developer", "Backend Engineer", "Full Stack Developer", "DevOps Engineer", "Mobile Developer", "Security Engineer", "System Analyst", "Technical Support"],
  "HR": ["HR Manager", "Recruiter"],
  "Sales": ["Sales Executive", "Account Manager"],
  "Marketing": ["Marketing Lead", "Content Creator", "Social Media Manager", "Copywriter"],
  "Design": ["Graphic Designer", "UI/UX Designer", "Product Designer"],
  "Data": ["Data Scientist", "Data Analyst"],
  "Management": ["Project Manager", "Product Owner", "Business Analyst"],
  "Finance": ["Accountant", "Financial Analyst"]
};

const DEPARTMENTS = Object.keys(ROLES_BY_DEPT);

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [showForm, setShowForm] = useState(false)
  
  // States สำหรับ Add Form
  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  const [email, setEmail] = useState("")
  const [age, setAge] = useState<number>(0)
  const [department, setDepartment] = useState("")

  // States สำหรับ Edit Form
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editRole, setEditRole] = useState("")
  const [editDept, setEditDept] = useState("") // เพิ่มเพื่อรองรับการเปลี่ยนแผนกตอน Edit

  const [search, setSearch] = useState("")
  const [filterDept, setFilterDept] = useState("")
  const [filterRole, setFilterRole] = useState("")

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

  // ฟังก์ชันเปลี่ยนแผนกในหน้า Add
  const handleDeptChange = (val: string) => {
    setDepartment(val);
    setRole(""); // ล้างค่าตำแหน่งเดิม
  }

  // ฟังก์ชันเปลี่ยนแผนกในหน้า Edit
  const handleEditDeptChange = (val: string) => {
    setEditDept(val);
    setEditRole(""); 
  }

  const addStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !role || !email || !department) return alert("Please fill all fields")
    
    const { error } = await supabase.from("staff").insert([
      { name, role, email, age, department }
    ])

    if (!error) {
      setName(""); setRole(""); setEmail(""); setAge(0); setDepartment("")
      setShowForm(false)
      fetchStaff()
    }
  }

  const handleUpdate = async (id: number) => {
    const { error } = await supabase
      .from("staff")
      .update({ name: editName, role: editRole, department: editDept })
      .eq('id', id)
    if (!error) { setEditingId(null); fetchStaff() }
  }

  const handleDelete = async (id: number) => {
    if (confirm("คุณแน่ใจหรือไม่ที่จะลบรายชื่อนี้?")) {
      const { error } = await supabase.from("staff").delete().eq('id', id)
      if (!error) fetchStaff()
    }
  }

  const filteredStaff = staff.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toString().includes(search)
    const matchesDept = filterDept === "" || s.department === filterDept
    const matchesRole = filterRole === "" || s.role === filterRole
    return matchesSearch && matchesDept && matchesRole
  })

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-[#0f172a] min-h-screen text-white">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight italic">STAFF DIRECTORY</h1>
          <p className="text-gray-400 text-sm mt-1">Managing team members with dynamic role filtering</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-white text-black px-6 py-2.5 rounded-2xl font-bold hover:scale-105 transition-all text-sm shadow-xl">
          {showForm ? "Close" : "+ Add Member"}
        </button>
      </div>

      {/* Search & Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input placeholder="Search name or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-gray-900 border border-gray-700 p-3 rounded-2xl outline-none text-white focus:border-blue-500 transition-colors" />
        
        <select value={filterDept} onChange={(e) => {setFilterDept(e.target.value); setFilterRole("");}} className="bg-gray-900 border border-gray-700 p-3 rounded-2xl text-white outline-none">
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="bg-gray-900 border border-gray-700 p-3 rounded-2xl text-white outline-none">
          <option value="">All Roles</option>
          {filterDept && ROLES_BY_DEPT[filterDept]?.map(r => <option key={r} value={r}>{r}</option>)}
          {!filterDept && Object.values(ROLES_BY_DEPT).flat().sort().map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="p-8 bg-gray-800/40 border-2 border-dashed border-gray-700 rounded-[2.5rem] animate-in fade-in slide-in-from-top-4">
          <form onSubmit={addStaff} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="bg-gray-900 border border-gray-700 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-white" />
            
            <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-gray-900 border border-gray-700 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-white" />
            
            <input placeholder="Age" type="number" value={age || ""} onChange={e => setAge(Number(e.target.value))} className="bg-gray-900 border border-gray-700 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-white" />

            {/* Department Select */}
            <select value={department} onChange={e => handleDeptChange(e.target.value)} className="bg-gray-900 border border-gray-700 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-white">
              <option value="">Select Dept</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            
            {/* Dynamic Role Selection */}
            <select value={role} onChange={e => setRole(e.target.value)} disabled={!department} className={`bg-gray-900 border border-gray-700 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-white ${!department && 'opacity-50'}`}>
              <option value="">{department ? "Select Role" : "Choose Dept First"}</option>
              {department && ROLES_BY_DEPT[department].map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            <button type="submit" className="bg-blue-600 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all">Add Staff</button>
          </form>
        </div>
      )}

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((s) => (
          <div key={s.id} className="group bg-gray-800/50 border border-gray-700 p-6 rounded-[2.5rem] transition-all duration-300 hover:border-blue-500/50 shadow-sm hover:shadow-blue-500/10">
            {editingId === s.id ? (
              <div className="space-y-4 animate-in fade-in zoom-in-95">
                <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-gray-900 border border-blue-500 p-3 rounded-xl text-sm outline-none" />
                
                <select value={editDept} onChange={e => handleEditDeptChange(e.target.value)} className="w-full bg-gray-900 border border-blue-500 p-3 rounded-xl text-sm outline-none">
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                <select value={editRole} onChange={e => setEditRole(e.target.value)} disabled={!editDept} className="w-full bg-gray-900 border border-blue-500 p-3 rounded-xl text-sm outline-none">
                  <option value="">Select Role</option>
                  {editDept && ROLES_BY_DEPT[editDept].map(r => <option key={r} value={r}>{r}</option>)}
                </select>

                <div className="flex gap-2">
                  <button onClick={() => handleUpdate(s.id)} className="flex-1 bg-emerald-600 text-[10px] font-bold py-3 rounded-xl hover:bg-emerald-700 uppercase">Save</button>
                  <button onClick={() => setEditingId(null)} className="flex-1 bg-gray-700 text-[10px] font-bold py-3 rounded-xl uppercase">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl font-black shadow-lg shadow-blue-500/20">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="font-black text-lg group-hover:text-blue-400 transition-colors uppercase tracking-tight">{s.name}</h2>
                      <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md font-bold uppercase tracking-tighter">
                        {s.role}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { 
                      setEditingId(s.id); 
                      setEditName(s.name); 
                      setEditDept(s.department); 
                      setEditRole(s.role); 
                    }} className="p-2 bg-gray-700/50 hover:bg-blue-600 rounded-xl text-xs transition-colors">✏️</button>
                    <button onClick={() => handleDelete(s.id)} className="p-2 bg-gray-700/50 hover:bg-rose-600 rounded-xl text-xs transition-colors">🗑️</button>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-gray-700/50">
                  <div className="space-y-3">
                    <p className="text-xs text-blue-400/80 italic lowercase truncate">📧 {s.email}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-[10px] font-bold text-gray-500 uppercase">Age: <span className="text-gray-200">{s.age}</span></div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase">Dept: <span className="text-gray-200">{s.department}</span></div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-700/30 flex justify-between items-center text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                    <span>Added: {new Date(s.created_at).toLocaleDateString()}</span>
                    <div className="flex items-center gap-1.5 text-emerald-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)] animate-pulse"></div>
                      ACTIVE
                    </div>
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