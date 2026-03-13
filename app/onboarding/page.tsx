'use client'

import { useState } from 'react'
import { useAuth } from '@/components/shared/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Zap, ArrowRight, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const TOPICS = [
  { id: 'technology', label: 'Technology', emoji: '💻' },
  { id: 'sports', label: 'Sports', emoji: '🏆' },
  { id: 'politics', label: 'Politics', emoji: '🏛️' },
  { id: 'business', label: 'Business', emoji: '📈' },
  { id: 'entertainment', label: 'Entertainment', emoji: '🎬' },
  { id: 'health', label: 'Health', emoji: '❤️' },
  { id: 'science', label: 'Science', emoji: '🔬' },
  { id: 'world', label: 'World', emoji: '🌍' },
  { id: 'cricket', label: 'Cricket', emoji: '🏏' },
  { id: 'bollywood', label: 'Bollywood', emoji: '🎭' },
  { id: 'startups', label: 'Startups', emoji: '🚀' },
  { id: 'climate', label: 'Climate', emoji: '🌱' },
]

const STEPS = ['welcome', 'topics', 'goals', 'done'] as const
type Step = typeof STEPS[number]

export default function OnboardingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState<Step>('welcome')
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [dailyGoal, setDailyGoal] = useState(5)
  const [saving, setSaving] = useState(false)

  const toggleTopic = (id: string) => {
    setSelectedTopics(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  const finish = async () => {
    if (!user) { router.push('/'); return }
    setSaving(true)
    try {
      await Promise.all([
        supabase.from('profiles').update({ followed_topics: selectedTopics }).eq('id', user.id),
        supabase.from('reading_goals').upsert({ user_id: user.id, daily_goal: dailyGoal, weekly_goal: dailyGoal * 5 }, { onConflict: 'user_id' }),
      ])
      toast.success('Welcome to NewsHive! 🎉')
      router.push('/')
    } catch {
      toast.error('Could not save preferences')
    } finally { setSaving(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${
              STEPS.indexOf(step) >= i ? 'bg-accent-purple w-8' : 'bg-white/10 w-4'
            }`} />
          ))}
        </div>

        {/* Step: Welcome */}
        {step === 'welcome' && (
          <div className="glass rounded-3xl border border-white/10 p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center shadow-glow-purple mx-auto mb-6">
              <Zap size={28} className="text-white" />
            </div>
            <h1 className="font-display text-4xl tracking-wider mb-3">
              WELCOME TO<br /><span className="text-accent-purple">NEWSHIVE</span>
            </h1>
            <p className="text-text-muted text-sm mb-8 leading-relaxed">
              AI-powered news platform. Let's personalize your experience in 2 quick steps.
            </p>
            <button onClick={() => setStep('topics')}
              className="w-full py-3.5 bg-accent-purple hover:bg-accent-purple/90 text-white font-semibold rounded-xl transition-all hover:shadow-glow-purple flex items-center justify-center gap-2">
              Get Started <ArrowRight size={16} />
            </button>
            <button onClick={() => router.push('/')}
              className="w-full mt-3 py-2.5 text-text-muted text-sm hover:text-text-primary transition-colors">
              Skip for now
            </button>
          </div>
        )}

        {/* Step: Topics */}
        {step === 'topics' && (
          <div className="glass rounded-3xl border border-white/10 p-6">
            <h2 className="font-display text-3xl tracking-wider mb-1">PICK <span className="text-accent-purple">TOPICS</span></h2>
            <p className="text-text-muted text-sm mb-5">Select topics you're interested in (pick at least 2)</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {TOPICS.map(topic => (
                <button key={topic.id} onClick={() => toggleTopic(topic.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                    selectedTopics.includes(topic.id)
                      ? 'bg-accent-purple/20 border-accent-purple/40 text-accent-purple'
                      : 'bg-white/3 border-white/10 text-text-muted hover:border-white/20'
                  }`}>
                  {topic.emoji} {topic.label}
                  {selectedTopics.includes(topic.id) && <Check size={10} />}
                </button>
              ))}
            </div>
            <button onClick={() => setStep('goals')} disabled={selectedTopics.length < 2}
              className="w-full py-3 bg-accent-purple hover:bg-accent-purple/90 disabled:opacity-40 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
              Continue ({selectedTopics.length} selected) <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* Step: Goals */}
        {step === 'goals' && (
          <div className="glass rounded-3xl border border-white/10 p-6">
            <h2 className="font-display text-3xl tracking-wider mb-1">SET <span className="text-accent-green">GOAL</span></h2>
            <p className="text-text-muted text-sm mb-6">How many articles do you want to read per day?</p>
            <div className="flex items-center justify-center gap-6 mb-8">
              <button onClick={() => setDailyGoal(p => Math.max(1, p - 1))}
                className="w-12 h-12 rounded-2xl border border-white/10 text-text-primary text-xl hover:bg-white/5 transition-all">−</button>
              <div className="text-center">
                <p className="text-6xl font-bold font-display text-accent-green">{dailyGoal}</p>
                <p className="text-text-muted text-sm">articles/day</p>
              </div>
              <button onClick={() => setDailyGoal(p => Math.min(50, p + 1))}
                className="w-12 h-12 rounded-2xl border border-white/10 text-text-primary text-xl hover:bg-white/5 transition-all">+</button>
            </div>
            <div className="flex gap-2 mb-4">
              {[3, 5, 10, 15].map(n => (
                <button key={n} onClick={() => setDailyGoal(n)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                    dailyGoal === n ? 'bg-accent-green/20 border-accent-green/40 text-accent-green' : 'border-white/10 text-text-muted hover:border-white/20'
                  }`}>{n}/day</button>
              ))}
            </div>
            <button onClick={() => setStep('done')}
              className="w-full py-3 bg-accent-green hover:bg-accent-green/90 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
              Continue <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="glass rounded-3xl border border-white/10 p-8 text-center">
            <p className="text-6xl mb-4">🎉</p>
            <h2 className="font-display text-3xl tracking-wider mb-3">
              YOU'RE <span className="text-accent-yellow">ALL SET!</span>
            </h2>
            <div className="space-y-2 mb-6 text-left">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Check size={14} className="text-accent-green flex-shrink-0" />
                {selectedTopics.length} topics selected
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Check size={14} className="text-accent-green flex-shrink-0" />
                Daily goal: {dailyGoal} articles/day
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Check size={14} className="text-accent-green flex-shrink-0" />
                Personalized For You feed ready
              </div>
            </div>
            <button onClick={finish} disabled={saving}
              className="w-full py-3.5 bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold rounded-xl transition-all hover:shadow-glow-purple flex items-center justify-center gap-2">
              {saving ? 'Setting up...' : 'Start Reading 🚀'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}