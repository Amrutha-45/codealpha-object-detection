import { useEffect, useState } from 'react'

interface CountUpProps {
  end: number
  duration?: number
  decimals?: number
  suffix?: string
  prefix?: string
}

export default function CountUp({
  end,
  duration = 1000,
  decimals = 0,
  suffix = '',
  prefix = '',
}: CountUpProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number | null = null
    let animationFrame: number

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const current = progress * end
      setCount(current)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(step)
      }
    };

    animationFrame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationFrame)
  }, [end, duration])

  return (
    <span>
      {prefix}
      {count.toFixed(decimals)}
      {suffix}
    </span>
  )
}
