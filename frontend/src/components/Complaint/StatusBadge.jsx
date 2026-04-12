const STATUS_MAP = {
  'Pending':     { label: 'Pending',     cls: 'bg-warning/10 text-warning',  icon: '⏳' },
  'In Progress': { label: 'In Dispatch', cls: 'bg-accent/10 text-accent', icon: '🔧' },
  'Resolved':    { label: 'Resolved',    cls: 'bg-success/10 text-success', icon: '✅' },
}

const PRIORITY_MAP = {
  High:   { cls: 'bg-danger/10 text-danger border-danger/10',   icon: '🔴' },
  Medium: { cls: 'bg-warning/10 text-warning border-warning/10', icon: '🟡' },
  Low:    { cls: 'bg-success/10 text-success border-success/10',    icon: '🟢' },
}

export default function StatusBadge({ status }) {
  const cfg = STATUS_MAP[status] || STATUS_MAP['Pending']
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border border-transparent ${cfg.cls}`}>
      <span>{cfg.icon}</span> {cfg.label}
    </span>
  )
}

export function PriorityBadge({ priority }) {
  const cfg = PRIORITY_MAP[priority] || PRIORITY_MAP['Medium']
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${cfg.cls}`}>
      <span>{cfg.icon}</span> {priority}
    </span>
  )
}

export function CategoryBadge({ category }) {
  if (!category) return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-danger/5 text-danger border border-danger/10 italic">
      ⚠️ Needs Review
    </span>
  )
  if (category === 'Invalid') return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-500 border border-gray-200">
      🚫 Invalid
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary/5 text-primary border border-primary/10">
      🏷️ {category}
    </span>
  )
}
