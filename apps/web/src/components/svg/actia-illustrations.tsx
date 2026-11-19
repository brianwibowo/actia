import { cn } from '@/lib/utils'

const FIELD_IMAGES = [
  '/images/agri-solar.jpg',
  '/images/field-station.jpg',
  '/images/weather-station.jpg',
] as const

export function getDeviceCoverImage(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return FIELD_IMAGES[hash % FIELD_IMAGES.length]
}

export function ActiaLogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 36 36'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className={cn('size-8', className)}
      aria-hidden='true'
    >
      <rect width='36' height='36' rx='9' fill='#218DAE' />
      <circle cx='26.5' cy='9.5' r='3.5' fill='#FFD758' />
      <path
        d='M9 22.5C11.8 16.2 15.2 13 18.5 13C21.8 13 24.4 15.6 27 22.5'
        stroke='#FCE59A'
        strokeWidth='2.2'
        strokeLinecap='round'
      />
      <path
        d='M7.5 25.5H13L15.6 19.5L19.4 27L22.2 21.5L24.5 25.5H28.5'
        stroke='#FFFFFF'
        strokeWidth='2.2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

interface RadialGaugeSvgProps {
  value: number | null | undefined
  label: string
  unit?: string
  color?: string
  size?: number
}

export function RadialGaugeSvg({
  value,
  label,
  unit = '%',
  color = '#218DAE',
  size = 56,
}: RadialGaugeSvgProps) {
  const pct =
    typeof value === 'number' && Number.isFinite(value)
      ? Math.max(0, Math.min(100, value))
      : 0
  const hasValue = typeof value === 'number' && Number.isFinite(value)
  const stroke = 5
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (pct / 100) * circumference

  return (
    <div className='flex flex-col items-center gap-1'>
      <div className='relative inline-flex items-center justify-center'>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className='-rotate-90'
          aria-hidden='true'
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill='none'
            stroke='currentColor'
            strokeWidth={stroke}
            className='text-muted-foreground/20'
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill='none'
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={hasValue ? dashOffset : circumference}
            strokeLinecap='round'
          />
        </svg>
        <span className='absolute text-xs font-bold tabular-nums'>
          {hasValue ? `${Math.round(pct)}${unit}` : '-'}
        </span>
      </div>
      <span className='text-[11px] font-medium text-muted-foreground'>
        {label}
      </span>
    </div>
  )
}

export function EmptyFieldIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 180 120'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className={cn('h-28 w-44', className)}
      aria-hidden='true'
    >
      <circle cx='138' cy='28' r='16' fill='#FCE59A' />
      <circle cx='138' cy='28' r='10' fill='#FFD758' />
      <path
        d='M18 96C48 78 96 76 162 96V110H18V96Z'
        fill='#218DAE'
        fillOpacity='0.14'
      />
      <rect x='84' y='44' width='6' height='46' rx='3' fill='#218DAE' />
      <path
        d='M66 36L106 28L112 44L72 52L66 36Z'
        fill='#218DAE'
        stroke='#2BBBD7'
        strokeWidth='2'
      />
      <line x1='80' y1='33' x2='86' y2='49' stroke='#FCE59A' strokeWidth='1.5' />
      <line x1='94' y1='30' x2='100' y2='46' stroke='#FCE59A' strokeWidth='1.5' />
      <path
        d='M68 19C75 13 85 13 92 19'
        stroke='#2BBBD7'
        strokeWidth='2.2'
        strokeLinecap='round'
      />
      <path
        d='M74 25C78 21.5 84 21.5 88 25'
        stroke='#218DAE'
        strokeWidth='2.2'
        strokeLinecap='round'
      />
      <circle cx='87' cy='89' r='5' fill='#2BBBD7' />
    </svg>
  )
}

export function AllClearIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 120 96'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className={cn('h-24 w-28', className)}
      aria-hidden='true'
    >
      <circle cx='60' cy='48' r='36' fill='#2BBBD7' fillOpacity='0.14' />
      <path
        d='M60 18L84 28V47C84 62 73.5 74.5 60 79C46.5 74.5 36 62 36 47V28L60 18Z'
        fill='#218DAE'
      />
      <path
        d='M50 48.5L57 55.5L71 41.5'
        stroke='#FFD758'
        strokeWidth='4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}
