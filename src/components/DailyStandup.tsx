'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { can } from '@/lib/rbac'
import {
  Clock,
  Users,
  Play,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Calendar,
  Settings
} from 'lucide-react'
import dayjs from 'dayjs'

interface StandupConfig {
  enabled: boolean
  time: string
  timezone: string
  duration: number
  participants: { _id: string; name: string; email: string }[]
  lastConducted?: string
}

interface StandupEntry {
  userId: string
  user: { name: string; email: string }
  yesterday: string
  today: string
  blockers: string
  createdAt: string
}

interface DailyStandupProps {
  projectId: string
  config: StandupConfig
  onConfigUpdate?: (config: StandupConfig) => Promise<void>
}

export default function DailyStandup({ projectId, config, onConfigUpdate }: DailyStandupProps) {
  const { user } = useAuth()
  const [currentStandup, setCurrentStandup] = useState<StandupEntry[]>([])
  const [myEntry, setMyEntry] = useState<StandupEntry | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [isStandupTime, setIsStandupTime] = useState(false)

  useEffect(() => {
    checkStandupTime()
    loadTodayStandup()
  }, [config])

  const checkStandupTime = () => {
    if (!config.enabled || !config.time) return

    const now = dayjs()
    const standupTime = dayjs().hour(parseInt(config.time.split(':')[0])).minute(parseInt(config.time.split(':')[1]))
    const timeDiff = Math.abs(now.diff(standupTime, 'minute'))

    // Consider it "standup time" if within 30 minutes of scheduled time
    setIsStandupTime(timeDiff <= 30)
  }

  const loadTodayStandup = async () => {
    try {
      const today = dayjs().format('YYYY-MM-DD')
      const res = await fetch(`/api/projects/${projectId}/standup?date=${today}`)
      if (res.ok) {
        const data = await res.json()
        setCurrentStandup(data.entries || [])
        setMyEntry(data.entries?.find((e: StandupEntry) => e.userId === user?.id) || null)
      }
    } catch (error) {
      console.error('Failed to load standup:', error)
    }
  }

  const submitStandupEntry = async (entry: { yesterday: string; today: string; blockers: string }) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/standup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      })

      if (res.ok) {
        await loadTodayStandup()
      }
    } catch (error) {
      console.error('Failed to submit standup entry:', error)
    }
  }

  const canManageStandup = can(user?.role || '', ['admin'])
  // Add project owner check

  const getStandupStatus = () => {
    const totalParticipants = config.participants?.length || 0
    const submittedCount = currentStandup.length

    return {
      totalParticipants,
      submittedCount,
      completionRate: totalParticipants > 0 ? (submittedCount / totalParticipants) * 100 : 0,
      isComplete: submittedCount === totalParticipants
    }
  }

  const status = getStandupStatus()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="w-6 h-6" />
            Daily Standup
          </h2>
          <p className="text-zinc-400 mt-1">
            {config.enabled
              ? `Scheduled daily at ${config.time} (${config.duration} min)`
              : 'Daily standup is not configured'
            }
          </p>
        </div>

        {canManageStandup && (
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
          >
            <Settings size={16} />
            Configure
          </button>
        )}
      </div>

      {!config.enabled ? (
        <div className="text-center py-12 bg-zinc-900/50 rounded-lg">
          <Clock className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Daily Standup Not Configured</h3>
          <p className="text-zinc-400 mb-4">
            Set up daily standup meetings to keep your team synchronized and identify blockers early.
          </p>
          {canManageStandup && (
            <button
              onClick={() => setShowSettings(true)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Configure Standup
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Standup Status */}
          <div className={`rounded-lg p-6 ${isStandupTime
              ? 'bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20'
              : 'bg-zinc-900/50 border border-zinc-800'
            }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isStandupTime ? 'bg-green-400 animate-pulse' : 'bg-zinc-500'
                  }`} />
                <h3 className="text-xl font-semibold text-white">
                  Today's Standup - {dayjs().format('MMM D, YYYY')}
                </h3>
                {isStandupTime && (
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full uppercase font-medium animate-pulse">
                    Live
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-white text-lg font-bold">{status.submittedCount}/{status.totalParticipants}</p>
                  <p className="text-zinc-400 text-sm">Submitted</p>
                </div>
                {status.isComplete && (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                )}
              </div>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-zinc-400 mb-2">
                <span>Participation</span>
                <span>{Math.round(status.completionRate)}%</span>
              </div>
              <div className="w-full bg-zinc-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${status.isComplete ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                  style={{ width: `${status.completionRate}%` }}
                />
              </div>
            </div>

            {/* My Entry */}
            {!myEntry && isStandupTime && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 font-medium">Your standup entry is pending</span>
                </div>
                <p className="text-zinc-300 text-sm mb-3">
                  Share what you did yesterday, what you're planning today, and any blockers.
                </p>
                <StandupForm onSubmit={submitStandupEntry} />
              </div>
            )}

            {myEntry && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-medium">You've submitted your standup</span>
                </div>
                <p className="text-zinc-300 text-sm">
                  Submitted at {dayjs(myEntry.createdAt).format('h:mm A')}
                </p>
              </div>
            )}
          </div>

          {/* Standup Entries */}
          <div className="bg-zinc-900/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Team Updates</h3>

            {currentStandup.length === 0 ? (
              <p className="text-zinc-400 text-center py-8">
                No standup entries submitted yet today.
              </p>
            ) : (
              <div className="space-y-4">
                {currentStandup.map((entry, index) => (
                  <div key={entry.userId} className="bg-zinc-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {entry.user.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{entry.user.name}</h4>
                          <p className="text-zinc-400 text-xs">
                            Submitted at {dayjs(entry.createdAt).format('h:mm A')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <h5 className="text-zinc-400 font-medium mb-1">Yesterday</h5>
                        <p className="text-white">{entry.yesterday || 'No updates'}</p>
                      </div>
                      <div>
                        <h5 className="text-zinc-400 font-medium mb-1">Today</h5>
                        <p className="text-white">{entry.today || 'No plans'}</p>
                      </div>
                      <div>
                        <h5 className="text-zinc-400 font-medium mb-1">Blockers</h5>
                        <p className={`${entry.blockers ? 'text-red-400' : 'text-green-400'}`}>
                          {entry.blockers || 'No blockers'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Missing Participants */}
          {status.submittedCount < status.totalParticipants && (
            <div className="bg-zinc-900/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Pending Submissions</h3>
              <div className="flex flex-wrap gap-2">
                {config.participants
                  ?.filter(participant => !currentStandup.some(entry => entry.userId === participant._id))
                  .map(participant => (
                    <div key={participant._id} className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 rounded-lg">
                      <div className="w-6 h-6 bg-gradient-to-r from-zinc-500 to-zinc-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                        {participant.name.charAt(0)}
                      </div>
                      <span className="text-zinc-400 text-sm">{participant.name}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Standup Configuration</h3>

            <StandupSettings
              config={config}
              onSave={async (newConfig) => {
                if (onConfigUpdate) {
                  await onConfigUpdate(newConfig)
                }
                setShowSettings(false)
              }}
              onCancel={() => setShowSettings(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Standup Form Component
function StandupForm({ onSubmit }: { onSubmit: (entry: any) => void }) {
  const [formData, setFormData] = useState({
    yesterday: '',
    today: '',
    blockers: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({ yesterday: '', today: '', blockers: '' })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">
          What did you do yesterday?
        </label>
        <textarea
          value={formData.yesterday}
          onChange={(e) => setFormData(prev => ({ ...prev, yesterday: e.target.value }))}
          rows={2}
          className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm resize-none focus:border-yellow-500 focus:outline-none"
          placeholder="Summarize your work from yesterday..."
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">
          What will you do today?
        </label>
        <textarea
          value={formData.today}
          onChange={(e) => setFormData(prev => ({ ...prev, today: e.target.value }))}
          rows={2}
          className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm resize-none focus:border-yellow-500 focus:outline-none"
          placeholder="What are you planning to work on today..."
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">
          Any blockers or impediments?
        </label>
        <textarea
          value={formData.blockers}
          onChange={(e) => setFormData(prev => ({ ...prev, blockers: e.target.value }))}
          rows={2}
          className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm resize-none focus:border-yellow-500 focus:outline-none"
          placeholder="Anything blocking your progress? (optional)"
        />
      </div>

      <button
        type="submit"
        className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors text-sm font-medium"
      >
        Submit Standup
      </button>
    </form>
  )
}

// Standup Settings Component
function StandupSettings({
  config,
  onSave,
  onCancel
}: {
  config: StandupConfig
  onSave: (config: StandupConfig) => void
  onCancel: () => void
}) {
  const [settings, setSettings] = useState(config)

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      onSave(settings)
    }} className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="enabled"
          checked={settings.enabled}
          onChange={(e) => setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
          className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500"
        />
        <label htmlFor="enabled" className="text-white font-medium">
          Enable Daily Standup
        </label>
      </div>

      {settings.enabled && (
        <>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Standup Time
            </label>
            <input
              type="time"
              value={settings.time}
              onChange={(e) => setSettings(prev => ({ ...prev, time: e.target.value }))}
              className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              min="5"
              max="60"
              value={settings.duration}
              onChange={(e) => setSettings(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Timezone
            </label>
            <select
              value={settings.timezone}
              onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
              className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
            </select>
          </div>
        </>
      )}

      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Save Configuration
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
