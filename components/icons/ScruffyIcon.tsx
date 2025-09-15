import { forwardRef } from 'react'
import type { SVGProps, ReactNode } from 'react'
import clsx from 'clsx'

const createFullPaw = () => (
  <>
    <path d="M8.5 15.5C8.5 13.43 10.24 11.75 12 11.75S15.5 13.43 15.5 15.5 13.3 19.25 12 19.95 8.5 17.57 8.5 15.5Z" />
    <circle cx="7.2" cy="10.3" r="1.75" />
    <circle cx="10.25" cy="7.65" r="1.6" />
    <circle cx="13.75" cy="7.65" r="1.6" />
    <circle cx="16.8" cy="10.3" r="1.75" />
  </>
)

const createCompactPaw = () => (
  <>
    <path d="M9 14.2C9 12.46 10.43 11 12 11s3 1.46 3 3.2c0 1.64-1.86 3.04-3 3.62-1.14-.58-3-1.98-3-3.62Z" />
    <circle cx="8.4" cy="11.3" r="1.45" />
    <circle cx="10.6" cy="9.45" r="1.35" />
    <circle cx="13.4" cy="9.45" r="1.35" />
    <circle cx="15.6" cy="11.3" r="1.45" />
  </>
)

const createDogFace = () => (
  <>
    <path d="M6.9 8.65 4.95 6.72a2.1 2.1 0 0 0-3.55 1.48v1.74c0 1 .5 1.95 1.32 2.52l1.72 1.15" />
    <path d="M17.1 8.65 19.05 6.72a2.1 2.1 0 0 1 3.55 1.48v1.74c0 1-.5 1.95-1.32 2.52l-1.72 1.15" />
    <path d="M12 6.25c-2.96 0-5.25 2.29-5.25 5.25v2.9c0 1.9 1.54 3.45 3.45 3.45h3.6c1.9 0 3.45-1.55 3.45-3.45V11.5c0-2.96-2.29-5.25-5.25-5.25Z" />
    <path d="M9.5 11.75v-.6c0-1.1.9-2 2-2h1c1.1 0 2 .9 2 2v.6" />
    <circle cx="10" cy="12.2" r=".75" fill="currentColor" stroke="none" />
    <circle cx="14" cy="12.2" r=".75" fill="currentColor" stroke="none" />
    <path
      d="M11.2 13.8h1.6a.8.8 0 0 1 .67 1.23l-.8 1.2a.8.8 0 0 1-1.34 0l-.8-1.2a.8.8 0 0 1 .67-1.23Z"
      fill="currentColor"
      stroke="none"
    />
    <path d="M10.75 16.3c.4.42.94.65 1.25.65s.85-.23 1.25-.65" />
  </>
)

const iconShapes = {
  paw: createFullPaw,
  dog: createDogFace,
  logomark: () => (
    <>
      <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.12" stroke="none" />
      <circle cx="12" cy="12" r="9" />
      {createCompactPaw()}
    </>
  )
} as const satisfies Record<string, () => ReactNode>

export type ScruffyIconName = keyof typeof iconShapes

export interface ScruffyIconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: ScruffyIconName
  size?: number | string
  title?: string
}

export const ScruffyIcon = forwardRef<SVGSVGElement, ScruffyIconProps>(
  ({ name, size = 24, className, strokeWidth = 1.6, title, role = 'img', ...rest }, ref) => {
    const render = iconShapes[name]
    const isLabelled = Boolean(title) || 'aria-label' in rest || 'aria-labelledby' in rest

    return (
      <svg
        ref={ref}
        role={role}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className={clsx('scruffy-icon inline-block align-middle text-current', className)}
        strokeWidth={strokeWidth}
        aria-hidden={isLabelled ? undefined : true}
        focusable="false"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...rest}
      >
        {title ? <title>{title}</title> : null}
        {render()}
      </svg>
    )
  }
)

ScruffyIcon.displayName = 'ScruffyIcon'

export const SCRUFFY_ICON_NAMES = Object.keys(iconShapes) as ScruffyIconName[]
