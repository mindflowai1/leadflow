import { useEffect, useRef, useState } from "react"
import { useInView } from "framer-motion"
import { cn } from "../../lib/utils"

interface AnimatedCounterProps {
  value: number
  suffix?: string
  prefix?: string
  duration?: number
  className?: string
  delay?: number
}

export function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  duration = 2000,
  className,
  delay = 0,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [count, setCount] = useState(0)
  const isInView = useInView(ref, { once: true, margin: "0px" })

  useEffect(() => {
    if (!isInView) return

    const timeout = setTimeout(() => {
      let startTime: number | null = null
      const animateCount = (timestamp: number) => {
        if (!startTime) startTime = timestamp
        const progress = Math.min((timestamp - startTime) / duration, 1)
        
        // Easing function for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 3)
        setCount(Math.floor(easeOutCubic * value))
        
        if (progress < 1) {
          requestAnimationFrame(animateCount)
        } else {
          setCount(value)
        }
      }
      
      requestAnimationFrame(animateCount)
    }, delay)

    return () => clearTimeout(timeout)
  }, [isInView, value, duration, delay])

  return (
    <span
      ref={ref}
      className={cn(
        "tabular-nums font-bold tracking-tight",
        className
      )}
    >
      {prefix}{count.toLocaleString('pt-BR')}{suffix}
    </span>
  )
}