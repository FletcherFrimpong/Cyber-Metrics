import * as React from "react"
import { cn } from "@/lib/utils"

// Bordered content panel with a one-line header: icon, title, muted subtitle, optional action.
export function Panel({
  icon: Icon,
  title,
  subtitle,
  action,
  className,
  bodyClassName,
  children,
}: {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
  bodyClassName?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn("rounded-lg border border-neutral-200 bg-white overflow-hidden", className)}>
      <header className="flex items-center gap-2 h-10 px-3 border-b border-neutral-200">
        {Icon && <Icon className="w-3.5 h-3.5 text-neutral-500 shrink-0" />}
        <h3 className="text-[13px] font-medium text-neutral-900 whitespace-nowrap">{title}</h3>
        {subtitle && <span className="text-[13px] text-neutral-400 truncate">· {subtitle}</span>}
        {action && <div className="ml-auto shrink-0">{action}</div>}
      </header>
      <div className={bodyClassName}>{children}</div>
    </section>
  )
}

// Small coloured label, used for status and category values.
const TAG_TONES = {
  neutral: "bg-neutral-100 text-neutral-700",
  green: "bg-green-50 text-green-700",
  yellow: "bg-yellow-50 text-yellow-700",
  orange: "bg-orange-50 text-orange-700",
  red: "bg-red-50 text-red-700",
  blue: "bg-blue-50 text-blue-700",
} as const

export function Tag({ tone = "neutral", children }: { tone?: keyof typeof TAG_TONES; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium", TAG_TONES[tone])}>
      {children}
    </span>
  )
}

// Table cell classes shared by every data table.
export const th = "h-8 px-3 text-left text-[12px] font-normal text-neutral-500 bg-neutral-50 border-b border-neutral-200 whitespace-nowrap"
export const td = "h-9 px-3 text-[13px] text-neutral-800 border-b border-neutral-100"

// One settings/form row: label on the left, control on the right.
export function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_minmax(0,1fr)] md:items-center gap-1 md:gap-4">
      <label className="text-[13px] text-neutral-600">{label}</label>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

// Strip of figures inside a panel: label, value, note.
export function StatStrip({
  stats,
  className,
}: {
  stats: { label: string; value: React.ReactNode; note?: string; lead?: boolean; negative?: boolean }[]
  className?: string
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-px bg-neutral-200", className)}>
      {stats.map((stat) => (
        <div key={stat.label} className="px-3 py-3 min-w-0 bg-white">
          <div className="text-[12px] text-neutral-500">{stat.label}</div>
          <div className={cn("mt-1 font-semibold tabular-nums truncate", stat.lead ? "text-2xl" : "text-lg", stat.negative ? "text-red-600" : "text-neutral-900")}>
            {stat.value}
          </div>
          {stat.note && <div className="mt-0.5 text-[12px] text-neutral-400 truncate">{stat.note}</div>}
        </div>
      ))}
    </div>
  )
}
