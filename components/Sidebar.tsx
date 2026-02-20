"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Users", href: "/dashboard/users" },
    { name: "Tasks", href: "/dashboard/tasks" },
  ];

  return (
    <aside className="h-full flex flex-col bg-white dark:bg-[#0f172a]">
      {/* Brand Logo - ปรับให้ดูนิ่งและมั่นคง */}
      <div className="h-16 flex items-center px-8 text-lg font-black tracking-tighter dark:text-white border-b border-gray-100 dark:border-gray-800/50">
        STAFF<span className="text-blue-600">PANEL</span>
      </div>

      {/* Menu List */}
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                isActive
                  ? "bg-gray-900 dark:bg-white text-white dark:text-black shadow-lg shadow-black/5"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer Sidebar - ใส่เลข Version เล็กๆ ให้ดูเป็นแอปทางการ */}
      <div className="p-6 text-[10px] font-medium text-gray-400 dark:text-gray-600 uppercase tracking-widest">
        v1.0.4 Stable
      </div>
    </aside>
  );
}