import type { CSSProperties } from 'react'

type SourceKey = 'SSI' | 'DST' | 'DMI' | 'DAWA'

export interface SourceChipProps {
  source: SourceKey
  table: string
  kommuneKode: string
  field: string
  value: string | number
  chipIndex?: number
}

const SOURCE_STYLE: Record<SourceKey, string> = {
  SSI:  'bg-green-50 text-green-800 border-green-200',
  DST:  'bg-blue-50 text-blue-700 border-blue-200',
  DMI:  'bg-slate-50 text-slate-600 border-slate-300',
  DAWA: 'bg-purple-50 text-purple-700 border-purple-200',
}

export function SourceChip({
  source,
  table,
  field,
  value,
  chipIndex = 0,
}: SourceChipProps) {
  const label = value !== '' && value !== null && value !== undefined
    ? `${source} ${table}: ${typeof value === 'number' ? value.toLocaleString('da-DK') : value}`
    : `${source} ${table}`

  return (
    <span
      className={`lock-pulse inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.01em] whitespace-nowrap ${SOURCE_STYLE[source]}`}
      style={{ '--chip-index': chipIndex } as CSSProperties}
      title={`${field ? field + ': ' : ''}${value}`}
    >
      🔒 {label}
    </span>
  )
}
