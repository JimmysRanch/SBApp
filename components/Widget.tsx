"use client";

import { ReactNode } from 'react'
import clsx from 'clsx'
import { motion, useReducedMotion } from 'framer-motion'

interface WidgetProps {
  title: string
  color?: 'blue' | 'pink' | 'purple' | 'green'
  children: ReactNode
  className?: string
  hideHeader?: boolean
  headerContent?: ReactNode
}

const backgroundMap: Record<Required<WidgetProps>['color'], string> = {
  blue: 'bg-gradient-to-br from-[#1D4DFF] via-[#2E8CFF] to-[#55C3FF]',
  pink: 'bg-gradient-to-br from-brand-bubble to-brand-bubbleDark',
  purple: 'bg-gradient-to-br from-brand-lavender via-[#5B7DFF] to-primary',
  green: 'bg-gradient-to-br from-brand-mint via-[#3CE0B7] to-[#43F0C5]'
}

export default function Widget({
  title,
  color = 'blue',
  children,
  className,
  hideHeader = false,
  headerContent
}: WidgetProps) {
  const gradient = backgroundMap[color]
  const shouldReduceMotion = useReducedMotion()

  const motionProps = shouldReduceMotion
    ? { initial: false }
    : {
        initial: { opacity: 0, y: 24, scale: 0.98 },
        whileInView: { opacity: 1, y: 0, scale: 1 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.5, ease: 'easeOut' as const }
      }

  return (
    <motion.div
      {...motionProps}
      className={clsx(
        'relative overflow-hidden rounded-[2rem] border border-white/25 text-white shadow-soft backdrop-blur-xl',
        gradient,
        className
      )}
    >
      <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/25 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-30%] left-[-20%] h-80 w-80 rounded-full bg-white/10 blur-[160px]" />
      {!hideHeader && (
        <div className="relative flex items-center justify-between px-6 pt-6">
          <h2 className="text-lg font-semibold tracking-tight drop-shadow-md">{title}</h2>
          {headerContent}
        </div>
      )}
      <div className={clsx('relative px-6 pb-6', hideHeader ? 'pt-6' : 'pt-4')}>
        {children}
      </div>
    </motion.div>
  )
}
