interface FingerprintSVGProps {
  size?: number
  className?: string
}

export function FingerprintSVG({ size = 48, className = '' }: FingerprintSVGProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M24 8a10 10 0 0 0-10 10c0 2.5.8 4.8 2.2 6.7" />
      <path d="M24 8a10 10 0 0 1 10 10c0 2.5-.8 4.8-2.2 6.7" />
      <path d="M24 16a5 5 0 0 0-5 5c0 1.5.6 2.8 1.6 3.8" />
      <path d="M24 16a5 5 0 0 1 5 5c0 1.5-.6 2.8-1.6 3.8" />
      <path d="M24 22a2 2 0 0 0-2 2v6a2 2 0 0 0 4 0v-6a2 2 0 0 0-2-2z" />
      <path d="M16 18.5A8 8 0 0 0 12 24c0 3.2 2 6 4.8 7.2" />
      <path d="M32 18.5A8 8 0 0 1 36 24c0 3.2-2 6-4.8 7.2" />
      <path d="M18 27.5A5 5 0 0 0 16 30c0 1.7 1 3.2 2.5 3.9" />
      <path d="M30 27.5A5 5 0 0 1 32 30c0 1.7-1 3.2-2.5 3.9" />
      <path d="M20 33.5A3 3 0 0 0 18 36c0 1 .5 1.8 1.2 2.4" />
      <path d="M28 33.5A3 3 0 0 1 30 36c0 1-.5 1.8-1.2 2.4" />
      <path d="M22 38.5A1 1 0 0 0 21 40c0 .3.2.5.5.7" />
      <path d="M26 38.5A1 1 0 0 1 27 40c0 .3-.2.5-.5.7" />
      <path d="M24 35a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0v-4a3 3 0 0 0-3-3z" />
    </svg>
  )
}
