import Swal, { type SweetAlertIcon } from 'sweetalert2'

function isDarkMode(): boolean {
  return (
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark')
  )
}

export function swalToast(
  icon: SweetAlertIcon,
  title: string,
  text?: string
): void {
  const dark = isDarkMode()
  void Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title,
    text,
    showConfirmButton: false,
    timer: 2400,
    timerProgressBar: true,
    background: dark ? '#0e2029' : '#ffffff',
    color: dark ? '#f1f7f9' : '#0d242c',
    iconColor:
      icon === 'success'
        ? '#2BBBD7'
        : icon === 'warning'
          ? '#FFD758'
          : icon === 'info'
            ? '#218DAE'
            : undefined,
  })
}

export async function swalConfirm(options: {
  title: string
  text: string
  confirmText?: string
  cancelText?: string
  destructive?: boolean
}): Promise<boolean> {
  const dark = isDarkMode()
  const res = await Swal.fire({
    title: options.title,
    text: options.text,
    icon: options.destructive ? 'warning' : 'question',
    showCancelButton: true,
    confirmButtonText: options.confirmText ?? 'Ya, Lanjutkan',
    cancelButtonText: options.cancelText ?? 'Batal',
    confirmButtonColor: options.destructive ? '#dc2626' : '#218DAE',
    cancelButtonColor: dark ? '#334155' : '#64748b',
    background: dark ? '#0e2029' : '#ffffff',
    color: dark ? '#f1f7f9' : '#0d242c',
    reverseButtons: true,
  })
  return Boolean(res.isConfirmed)
}
