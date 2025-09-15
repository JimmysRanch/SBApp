import clsx from 'clsx'

interface AvatarProps {
  src?: string
  alt?: string
  name: string
  className?: string
}

export default function Avatar({ src, alt, name, className }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className={clsx('inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-text text-sm', className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt ?? name} className="h-full w-full rounded-full object-cover" />
      ) : (
        initials
      )}
    </div>
  )
}
