import { useNavigate } from 'react-router-dom'
import { Plus, Radio, RefreshCw } from 'lucide-react'
import { swalToast } from '@/lib/swal'
import { Button } from '@/components/ui/button'
import type { AuthUser } from '@/types'

interface DashboardHeroProps {
  user: AuthUser
  onlineCount: number
  totalCount: number
  onRetry: () => void
}

export function DashboardHero({
  user,
  onlineCount,
  totalCount,
  onRetry,
}: DashboardHeroProps) {
  const navigate = useNavigate()

  return (
    <div className='relative overflow-hidden rounded-xl border bg-[#0d242c] text-white shadow-xs'>
      <img
        src='/images/field-station.jpg'
        alt='Stasiun telemetri lapangan Actia'
        className='absolute inset-0 h-full w-full object-cover object-center opacity-45'
      />
      <div
        aria-hidden='true'
        className='absolute inset-0 bg-gradient-to-r from-[#0d242c] via-[#0d242c]/85 to-[#218DAE]/45'
      />

      <div className='relative z-10 flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-6'>
        <div className='space-y-1.5'>
          <div className='inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium text-[#FCE59A] backdrop-blur-xs'>
            <Radio className='size-3.5 text-[#FFD758]' />
            <span>
              {onlineCount}/{totalCount} perangkat aktif real-time
            </span>
          </div>
          <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
          <p className='max-w-lg text-xs text-white/80 sm:text-sm'>
            Pemantauan sensor tanah, pH, EC, dan kesehatan sistem tenaga surya
            di seluruh lokasi lapangan.
          </p>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <Button
            variant='secondary'
            size='sm'
            className='border border-white/20 bg-white/15 text-white hover:bg-white/25'
            onClick={() => {
              onRetry()
              swalToast('info', 'Memperbarui data telemetri...')
            }}
          >
            <RefreshCw className='size-4' />
            Muat Ulang
          </Button>
          {user.role === 'admin' && (
            <Button
              size='sm'
              className='bg-[#FFD758] text-[#0d242c] hover:bg-[#FCE59A]'
              onClick={() => navigate('/devices?new=1')}
            >
              <Plus className='size-4' />
              Tambah Perangkat
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
