import { motion } from 'framer-motion'
import { Camera, Layers, Sparkles, ArrowRight, Zap, Shield } from 'lucide-react'
import Button from '../common/Button'

interface LandingHeroProps {
  onLaunchDashboard: () => void
}

export default function LandingHero({ onLaunchDashboard }: LandingHeroProps) {
  return (
    <div className="relative min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center overflow-hidden px-6 py-12">
      {/* Background Animated Floating Glow Orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -40, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ repeat: Infinity, duration: 12, ease: 'easeInOut' }}
          className="absolute -top-20 left-1/4 h-96 w-96 rounded-full bg-cyan-500/15 blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, -60, 0],
            y: [0, 50, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ repeat: Infinity, duration: 15, ease: 'easeInOut' }}
          className="absolute top-1/3 -right-20 h-96 w-96 rounded-full bg-purple-500/15 blur-[120px]"
        />
      </div>

      {/* Hero Header Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-pill mb-6 flex items-center gap-2 border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-glow"
      >
        <Sparkles size={14} className="text-cyan-400 animate-pulse" />
        <span>VisionTrack AI Engine v1.0</span>
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
        <span className="text-[10px] uppercase font-bold text-cyan-200">YOLOv8 + ByteTrack</span>
      </motion.div>

      {/* Main Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="max-w-4xl text-center text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl"
      >
        Next-Gen Real-Time <br />
        <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent neon-text-cyan">
          AI Object Detection & Tracking
        </span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-6 max-w-2xl text-center text-base text-slate-400 sm:text-lg"
      >
        Experience high-precision object classification and persistent multi-object tracking across video streams, live webcams, and images with ultra-low latency.
      </motion.p>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-8 flex flex-wrap items-center justify-center gap-4"
      >
        <Button variant="primary" icon={<ArrowRight size={18} />} onClick={onLaunchDashboard} className="px-8 py-3.5 text-base shadow-glow">
          Launch AI Dashboard
        </Button>
      </motion.div>

      {/* Floating Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="mt-16 grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <FeatureCard
          icon={<Camera className="text-cyan-400" size={24} />}
          title="Live Webcam Feed"
          description="Real-time web camera detection with instant center-point trajectory tracking."
        />
        <FeatureCard
          icon={<Layers className="text-purple-400" size={24} />}
          title="Multi-Object Tracking"
          description="Persistent tracking IDs using ByteTrack to keep unique object identities across frames."
        />
        <FeatureCard
          icon={<Zap className="text-emerald-400" size={24} />}
          title="High FPS Performance"
          description="Optimized inference pipeline delivering smooth high-speed video processing."
        />
        <FeatureCard
          icon={<Shield className="text-blue-400" size={24} />}
          title="Analytics & Export"
          description="Comprehensive session statistics, object breakdown charts, and CSV/JSON export."
        />
      </motion.div>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className="card-glass flex flex-col p-6"
    >
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 shadow-md">
        {icon}
      </div>
      <h3 className="text-base font-bold text-slate-100">{title}</h3>
      <p className="mt-2 text-xs text-slate-400 leading-relaxed">{description}</p>
    </motion.div>
  )
}
