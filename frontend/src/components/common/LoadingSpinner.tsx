import { motion } from 'framer-motion'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

export default function LoadingSpinner({ size = 'md', label }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-20 w-20',
  }[size]

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-4">
      <div className={`relative flex items-center justify-center ${sizeClasses}`}>
        {/* Outer glowing ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 border-r-blue-500 shadow-glow"
        />
        {/* Inner reverse ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          className="absolute inset-2 rounded-full border-2 border-transparent border-b-purple-400 border-l-pink-500"
        />
        {/* Core pulse */}
        <motion.div
          animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-glow"
        />
      </div>
      {label && (
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300/80 animate-pulse-slow">
          {label}
        </p>
      )}
    </div>
  )
}
