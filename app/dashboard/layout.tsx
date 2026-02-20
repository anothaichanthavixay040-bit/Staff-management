import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-white dark:bg-[#0f172a]">
      {/* Sidebar Area */}
      <aside className="w-64 flex-shrink-0 border-r border-gray-100 dark:border-gray-800/50 hidden md:block">
        <Sidebar />
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Area */}
        <div className="h-16 flex-shrink-0 border-b border-gray-100 dark:border-gray-800/50">
          <Header />
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 bg-gray-50/50 dark:bg-[#0f172a]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}