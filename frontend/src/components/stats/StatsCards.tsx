import { motion } from 'framer-motion'
import { Activity, Car, Dog, Gauge, Timer, Users } from 'lucide-react'
import type { DetectionStats } from '../../types/detection'
import CountUp from '../common/CountUp'

interface StatsCardsProps {
  stats: DetectionStats | null
}

interface CardConfig {
  label: string
  value: number
  decimals?: number
  suffix?: string
  icon: React.ReactNode
  accentBorder: string
  accentBg: string
  accentText: string
  subText?: string
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const s = stats ?? {
    total_objects_detected: 0,
    person_count: 0,
    vehicle_count: 0,
    animal_count: 0,
    other_count: 0,
    average_fps: 0,
    average_inference_time_ms: 0,
    active_track_ids: 0,
    session_duration_sec: 0,
  }

  const cards: CardConfig[] = [
    {
      label: 'Total Objects',
      value: s.total_objects_detected,
      icon: <Activity size={20} />,
      accentBorder: 'border-cyan-500/30',
      accentBg: 'from-cyan-500/20 to-blue-600/20',
      accentText: 'text-cyan-400',
      subText: `${s.active_track_ids} Unique Tracks`,
    },
    {
      label: 'Person Count',
      value: s.person_count,
      icon: <Users size={20} />,
      accentBorder: 'border-blue-500/30',
      accentBg: 'from-blue-500/20 to-indigo-600/20',
      accentText: 'text-blue-400',
      subText: 'Humans Detected',
    },
    {
      label: 'Vehicle Count',
      value: s.vehicle_count,
      icon: <Car size={20} />,
      accentBorder: 'border-amber-500/30',
      accentBg: 'from-amber-500/20 to-orange-600/20',
      accentText: 'text-amber-400',
      subText: 'Cars, Bikes, Trucks',
    },
    {
      label: 'Animal Count',
      value: s.animal_count,
      icon: <Dog size={20} />,
      accentBorder: 'border-emerald-500/30',
      accentBg: 'from-emerald-500/20 to-teal-600/20',
      accentText: 'text-emerald-400',
      subText: 'Dogs & Cats',
    },
    {
      label: 'Average FPS',
      value: s.average_fps,
      decimals: 1,
      icon: <Gauge size={20} />,
      accentBorder: 'border-purple-500/30',
      accentBg: 'from-purple-500/20 to-pink-600/20',
      accentText: 'text-purple-400',
      subText: 'Processing Rate',
    },
    {
      label: 'Inference Time',
      value: s.average_inference_time_ms,
      decimals: 1,
      suffix: ' ms',
      icon: <Timer size={20} />,
      accentBorder: 'border-pink-500/30',
      accentBg: 'from-pink-500/20 to-rose-600/20',
      accentText: 'text-pink-400',
      subText: 'Model Latency',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card, idx) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: idx * 0.05 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className={`card-glass p-4 border ${card.accentBorder} flex flex-col justify-between`}
        >
          {/* Background Ambient Blur */}
          <div
            className={`absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br ${card.accentBg} blur-xl opacity-60 pointer-events-none`}
          />

          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-xl bg-gradient-to-br ${card.accentBg} ${card.accentText} border border-slate-700/50 shadow-md`}>
              {card.icon}
            </div>
            {card.subText && (
              <span className="text-[10px] font-semibold text-slate-500 tracking-tight">
                {card.subText}
              </span>
            )}
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {card.label}
            </p>
            <p className="mt-1 text-2xl font-extrabold tracking-tight text-white">
              <CountUp
                end={card.value}
                decimals={card.decimals ?? 0}
                suffix={card.suffix ?? ''}
              />
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
