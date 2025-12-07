import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#a855f7]',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[#a855f7] text-white',
        secondary: 'border-transparent bg-[#98fce5] text-slate-900',
        outline: 'border-slate-600 text-slate-100',
        success: 'border-transparent bg-green-500 text-white',
        warning: 'border-transparent bg-yellow-500 text-slate-900',
        danger: 'border-transparent bg-red-500 text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
