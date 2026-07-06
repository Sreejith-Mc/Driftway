import React from 'react'

interface IconProps {
  size?: number
  className?: string
}

function base(size: number | undefined, className: string | undefined, children: React.ReactNode) {
  return (
    <svg
      width={size ?? 18}
      height={size ?? 18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const CompassIcon = ({ size, className }: IconProps) =>
  base(size, className, (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" fill="currentColor" stroke="none" />
    </>
  ))

export const MapIcon = ({ size, className }: IconProps) =>
  base(size, className, (
    <>
      <path d="M9 4L4 6v14l5-2 6 2 5-2V4l-5 2z" />
      <path d="M9 4v14M15 6v14" strokeDasharray="2.5 3" />
    </>
  ))

export const RouteIcon = ({ size, className }: IconProps) =>
  base(size, className, (
    <>
      <circle cx="6" cy="19" r="2.2" />
      <circle cx="18" cy="5" r="2.2" />
      <path d="M8 18h7a4 4 0 0 0 0-8H9a4 4 0 0 1 0-8" strokeDasharray="3 3.5" transform="translate(0,2) scale(1,-1) translate(0,-22)" />
    </>
  ))

export const ChatIcon = ({ size, className }: IconProps) =>
  base(size, className, (
    <>
      <path d="M21 12a8 8 0 0 1-8 8H5l-2 2V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z" />
      <path d="M8 11h8M8 14.5h5" />
    </>
  ))

export const PollIcon = ({ size, className }: IconProps) =>
  base(size, className, (
    <>
      <path d="M5 20V10M12 20V4M19 20v-7" />
      <path d="M3 20h18" />
    </>
  ))

export const CoinIcon = ({ size, className }: IconProps) =>
  base(size, className, (
    <>
      <ellipse cx="12" cy="7" rx="7.5" ry="3.5" />
      <path d="M4.5 7v5c0 1.9 3.4 3.5 7.5 3.5s7.5-1.6 7.5-3.5V7" />
      <path d="M4.5 12v5c0 1.9 3.4 3.5 7.5 3.5s7.5-1.6 7.5-3.5v-5" />
    </>
  ))

export const PackIcon = ({ size, className }: IconProps) =>
  base(size, className, (
    <>
      <rect x="4" y="8" width="16" height="12" rx="2.5" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2M4 13h16" />
    </>
  ))

export const SunIcon = ({ size, className }: IconProps) =>
  base(size, className, (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19" />
    </>
  ))

export const MoonIcon = ({ size, className }: IconProps) =>
  base(size, className, <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z" />)

export const PlusIcon = ({ size, className }: IconProps) => base(size, className, <path d="M12 5v14M5 12h14" />)

export const XIcon = ({ size, className }: IconProps) => base(size, className, <path d="M6 6l12 12M18 6L6 18" />)

export const CheckIcon = ({ size, className }: IconProps) => base(size, className, <path d="M4.5 12.5l5 5L19.5 7" />)

export const SparkIcon = ({ size, className }: IconProps) =>
  base(size, className, (
    <>
      <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z" />
      <path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />
    </>
  ))

export const SendIcon = ({ size, className }: IconProps) =>
  base(size, className, <path d="M4 11.5L20 4l-4.5 16-4-6.5z M11.5 13.5L20 4" />)

export const HeartIcon = ({ size, className, filled }: IconProps & { filled?: boolean }) => (
  <svg
    width={size ?? 15}
    height={size ?? 15}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 20.5S3.5 15 3.5 9.2A4.7 4.7 0 0 1 12 6.4a4.7 4.7 0 0 1 8.5 2.8C20.5 15 12 20.5 12 20.5z" />
  </svg>
)

export const TrashIcon = ({ size, className }: IconProps) =>
  base(size, className, (
    <>
      <path d="M4.5 6.5h15M9.5 6V4.5h5V6M6.5 6.5l1 13h9l1-13" />
      <path d="M10 10.5v5.5M14 10.5v5.5" />
    </>
  ))

export const GripIcon = ({ size, className }: IconProps) => (
  <svg width={size ?? 14} height={size ?? 14} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <circle cx="9" cy="6" r="1.6" />
    <circle cx="15" cy="6" r="1.6" />
    <circle cx="9" cy="12" r="1.6" />
    <circle cx="15" cy="12" r="1.6" />
    <circle cx="9" cy="18" r="1.6" />
    <circle cx="15" cy="18" r="1.6" />
  </svg>
)

export const CommandIcon = ({ size, className }: IconProps) =>
  base(size, className, (
    <path d="M9 9V6.5A2.5 2.5 0 1 0 6.5 9H9zm0 0v6m0-6h6m-6 6v2.5A2.5 2.5 0 1 1 6.5 15H9zm6-6V6.5A2.5 2.5 0 1 1 17.5 9H15zm0 0v6m0 0v2.5a2.5 2.5 0 1 0 2.5-2.5H15z" />
  ))

export const DownloadIcon = ({ size, className }: IconProps) =>
  base(size, className, <path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M4.5 19.5h15" />)

export const PanelIcon = ({ size, className }: IconProps) =>
  base(size, className, (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <path d="M15 4.5v15" />
    </>
  ))

export const ClockIcon = ({ size, className }: IconProps) =>
  base(size, className, (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ))

export const MenuIcon = ({ size, className }: IconProps) =>
  base(size, className, <path d="M4 7h16M4 12h16M4 17h10" />)

export const PinIcon = ({ size, className }: IconProps) =>
  base(size, className, (
    <>
      <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ))
