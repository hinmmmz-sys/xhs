"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Upload,
  FileText,
  Settings,
  Flame,
  ChevronRight,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "概览 · OVERVIEW",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, desc: "仪表盘" },
      { href: "/analytics", label: "Analytics", icon: BarChart3, desc: "分析" },
    ],
  },
  {
    label: "运营 · OPS",
    items: [
      { href: "/upload", label: "Data Import", icon: Upload, desc: "上传" },
      { href: "/reports", label: "Reports", icon: FileText, desc: "报告" },
    ],
  },
  {
    label: "营销 · GROWTH",
    items: [{ href: "/xhs", label: "XHS Insights", icon: Flame, desc: "种草" }],
  },
  {
    label: "系统 · SYSTEM",
    items: [{ href: "/settings", label: "Settings", icon: Settings, desc: "设置" }],
  },
];

const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-line-soft bg-sidebar lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="w-[30px] h-[30px] bg-[#111318] border border-[#33363d] rounded-md flex items-center justify-center flex-shrink-0">
              <div className="w-[11px] h-[11px] bg-ink rounded-[2px]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[13px] font-bold text-ink tracking-tight font-display">
                SellerPulse
              </h1>
              <p className="text-[9px] text-fainter leading-tight font-mono uppercase tracking-[0.14em]">
                Ops Agent
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-md border border-line-soft bg-inset px-2 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-up flex-shrink-0" />
            <span className="text-[10px] font-medium text-fg">运行中</span>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-w-fit items-center gap-1.5 rounded-md border px-2.5 py-2 text-[11px] font-medium ${
                  isActive
                    ? "border-line bg-panel-2 text-ink"
                    : "border-transparent text-muted hover:bg-panel/60 hover:text-fg-strong"
                }`}
              >
                <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-60 flex-col border-r border-line-soft bg-sidebar lg:flex">
      {/* Logo */}
      <div className="px-5 py-[18px] border-b border-line-soft">
        <div className="flex items-center gap-2.5">
          <div className="w-[30px] h-[30px] bg-[#111318] border border-[#33363d] rounded-md flex items-center justify-center flex-shrink-0">
            <div className="w-[11px] h-[11px] bg-ink rounded-[2px]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[13px] font-bold text-ink tracking-tight font-display">
              SellerPulse
            </h1>
            <p className="text-[9px] text-fainter leading-tight font-mono uppercase tracking-[0.14em]">
              Ops Agent
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <div className="px-2 mb-1.5">
              <span className="text-[9px] font-mono text-fainter uppercase tracking-[0.18em]">
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
                    className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-md ${
                      isActive
                        ? "bg-panel-2 border border-line text-ink"
                        : "text-muted hover:bg-panel/60 hover:text-fg-strong"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 ${
                        isActive ? "text-ink" : ""
                      }`}
                    />
                    <span className="text-xs font-medium leading-tight whitespace-nowrap">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-fainter leading-tight ml-auto font-mono">
                      {item.desc}
                    </span>
                    {isActive && (
                      <ChevronRight className="w-3 h-3 text-ink flex-shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / Status */}
      <div className="px-3 py-3 border-t border-line-soft">
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-inset border border-line-soft">
          <div className="w-1.5 h-1.5 rounded-full bg-up flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium text-fg">系统运行中</p>
            <p className="text-[9px] text-fainter font-mono">v1.0.0 · AI READY</p>
          </div>
        </div>
      </div>
      </aside>
    </>
  );
}
