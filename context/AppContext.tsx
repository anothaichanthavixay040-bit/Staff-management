"use client"

import { createContext, useContext, useState, ReactNode } from "react"

type User = {
  id: number
  name: string
  role: string
}

type Task = {
  id: number
  title: string
  status: string
  userId: number
}

type AppContextType = {
  users: User[]
  tasks: Task[]
  addUser: (name: string, role: string) => void
  addTask: (title: string, userId: number) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([])
  const [tasks, setTasks] = useState<Task[]>([])

  const addUser = (name: string, role: string) => {
    setUsers(prev => [
      ...prev,
      { id: Date.now(), name, role }
    ])
  }

  const addTask = (title: string, userId: number) => {
    setTasks(prev => [
      ...prev,
      { id: Date.now(), title, status: "Pending", userId }
    ])
  }

  return (
    <AppContext.Provider value={{ users, tasks, addUser, addTask }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error("useApp must be used inside AppProvider")
  return context
}
