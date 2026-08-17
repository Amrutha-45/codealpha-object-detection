import { motion, HTMLMotionProps } from 'framer-motion'
import type { ReactNode } from 'react'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  icon?: ReactNode
  children: ReactNode
}

const VARIANT_CLASS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
}

export default function Button({
  variant = 'primary',
  icon,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${VARIANT_CLASS[variant]} ${className}`}
      {...rest}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      <span>{children}</span>
    </motion.button>
  )
}
