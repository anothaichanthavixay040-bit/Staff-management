"use client";

import React from 'react';

type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode; // เพิ่ม prop สำหรับ icon
  trend?: string; // เพิ่ม prop สำหรับแสดงแนวโน้ม เช่น +12%
};

export default function StatCard({
  title,
  value,
  description,
  icon,
  trend,
}: StatCardProps) {
  return (
    <div className="group relative overflow-hidden bg-white dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* เอฟเฟกต์แสงจางๆ ด้านหลังเวลา Hover (สำหรับ Dark Mode จะสวยมาก) */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />

      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            {title}
          </p>
          <h3 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {value}
          </h3>
        </div>

        {/* ส่วนแสดง Icon */}
        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl text-gray-600 dark:text-gray-300 group-hover:scale-110 transition-transform">
          {icon || (
            // Default Icon ถ้าไม่ได้ส่งมา
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 relative z-10">
        {trend && (
          <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg">
            {trend}
          </span>
        )}
        {description && (
          <p className="text-xs text-gray-400 font-medium tracking-wide">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}