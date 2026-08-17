import { motion } from 'framer-motion'
import { PieChart, Zap } from 'lucide-react'
import type { DetectionStats } from '../../types/detection'

interface StatsAnalyticsChartsProps {
  stats: DetectionStats | null
}

export default function StatsAnalyticsCharts({ stats }: StatsAnalyticsChartsProps) {
  const total = stats?.total_objects_detected || 1

  const categories = [
    { name: 'Person', count: stats?.person_count || 0, color: 'bg-cyan-500', barGradient: 'from-cyan-500 to-blue-500', textColor: 'text-cyan-400' },
    { name: 'Vehicle', count: stats?.vehicle_count || 0, color: 'bg-amber-500', barGradient: 'from-amber-500 to-orange-500', textColor: 'text-amber-400' },
    { name: 'Animal', count: stats?.animal_count || 0, color: 'bg-emerald-500', barGradient: 'from-emerald-500 to-teal-500', textColor: 'text-emerald-400' },
    { name: 'Other Objects', count: stats?.other_count || 0, color: 'bg-purple-500', barGradient: 'from-purple-500 to-pink-500', textColor: 'text-purple-400' },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Category Breakdown Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-glass p-6 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-6 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2">
            <PieChart size={18} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              Object Distribution Breakdown
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Total: {stats?.total_objects_detected || 0}
          </span>
        </div>

        <div className="space-y-4">
          {categories.map((cat) => {
            const percentage = Math.round((cat.count / total) * 100)
            return (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-2 text-slate-300">
                    <span className={`h-2.5 w-2.5 rounded-full ${cat.color}`} />
                    {cat.name}
                  </span>
                  <span className={cat.textColor}>
                    {cat.count} ({percentage}%)
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800/80 border border-slate-700/50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full bg-gradient-to-r ${cat.barGradient}`}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Model Performance Gauge Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="card-glass p-6 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-6 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-purple-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              AI Latency &amp; Frame Rate
            </h3>
          </div>
          <span className="text-xs text-purple-400 font-medium">
            Engine: YOLOv8 PyTorch
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 my-auto">
          <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-800 bg-slate-950/50 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Target FPS</p>
            <p className="text-3xl font-extrabold text-cyan-400 mt-2">
              {stats?.average_fps?.toFixed(1) || '0.0'}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Frames Per Second</p>
          </div>

          <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-800 bg-slate-950/50 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Inference Delay</p>
            <p className="text-3xl font-extrabold text-purple-400 mt-2">
              {stats?.average_inference_time_ms?.toFixed(1) || '0.0'}
              <span className="text-xs text-slate-400 font-normal"> ms</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Milliseconds / Frame</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Active Unique Tracks: <strong className="text-cyan-400">{stats?.active_track_ids || 0}</strong></span>
          <span>Session Time: <strong className="text-slate-200">{stats?.session_duration_sec?.toFixed(0) || 0}s</strong></span>
        </div>
      </motion.div>
    </div>
  )
}
