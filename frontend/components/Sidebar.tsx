"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Upload,
  FileText,
  Settings,
  Activity,
  Flame,
  ChevronRight,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "概览",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, desc: "运营仪表盘" },
      { href: "/analytics", label: "Analytics", icon: BarChart3, desc: "数据分析" },
    ],
  },
  {
    label: "运营",
    items: [
      { href: "/upload", label: "Data Import", icon: Upload, desc: "数据上传" },
      { href: "/reports", label: "Reports", icon: FileText, desc: "报告历史" },
    ],
  },
  {
    label: "营销",
    items: [
      { href: "/xhs", label: "XHS Insights", icon: Flame, desc: "小红书种草" },
    ],
  },
  {
    label: "系统",
    items: [
      { href: "/settings", label: "Settings", icon: Settings, desc: "系统设置" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-slate-900 flex flex-col z-50 border-r border-slate-800">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white tracking-tight">SellerPulse</h1>
            <p className="text-[10px] text-slate-500 leading-tight">运营晨报 Agent</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <div className="px-3 mb-1.5">
              <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
                {group.label}
              </span>
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg ${
                      isActive
                        ? "bg-blue-600/15 text-blue-400"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-blue-400" : ""}`} />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium block leading-tight">{item.label}</span>
                      <span className="text-[10px] text-slate-600 leading-tight block">{item.desc}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3 h-3 text-blue-400 flex-shrink-0" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / Status */}
      <div className="px-3 py-3 border-t border-slate-800">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/40">
          <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium text-slate-300">系统运行中</p>
            <p className="text-[9px] text-slate-600">v1.0.0 · AI Ready</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
