import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const STATUS_STYLE = {
  PENDING:   'border-yellow-800 text-yellow-400 bg-yellow-950/50',
  ACCEPTED:  'border-green-800  text-green-400  bg-green-950/50',
  REJECTED:  'border-red-800    text-red-400    bg-red-950/50',
  COMPLETED: 'border-blue-800   text-blue-400   bg-blue-950/50',
}

const ALL_SKILLS = [
  { value: 'COOKING', label: 'Cooking' },
  { value: 'DRIVING', label: 'Driving' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'BARTENDING', label: 'Bartending' },
  { value: 'CASHIER', label: 'Cashier' },
  { value: 'WAREHOUSE', label: 'Warehouse' },
  { value: 'EVENTS', label: 'Events' },
  { value: 'CUSTOMER_SERVICE', label: 'Customer Service' },
  { value: 'CONSTRUCTION', label: 'Construction' },
  { value: 'IT', label: 'IT' },
  { value: 'HEALTHCARE', label: 'Healthcare' },
  { value: 'OTHER', label: 'Other' },
]

const CATEGORIES = [
  { value: 'RETAIL', label: 'Retail' },
  { value: 'HOSPITALITY', label: 'Hospitality / HoReCa' },
  { value: 'WAREHOUSE', label: 'Warehouse' },
  { value: 'CONSTRUCTION', label: 'Construction' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'DELIVERY', label: 'Delivery' },
  { value: 'EVENTS', label: 'Events' },
  { value: 'IT', label: 'IT' },
  { value: 'HEALTHCARE', label: 'Healthcare' },
  { value: 'OTHER', label: 'Other' },
]

function formatCountdown(targetISO) {
  const diff = new Date(targetISO) - Date.now()
  if (diff <= 0) return null
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function formatDuration(fromISO) {
  const diff = Date.now() - new Date(fromISO)
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`
}

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
}

const inputCls = 'bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500 transition-colors'

function WorkerDashboard() {
  const navigate = useNavigate()
  const { token, userId, logout } = useAuth()

  const [view, setView] = useState('jobs')
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [applyingId, setApplyingId] = useState(null)
  const [message, setMessage] = useState('')
  const [profile, setProfile] = useState(null)
  const [applications, setApplications] = useState([])
  const [loadingApps, setLoadingApps] = useState(false)
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  // profile editing state
  const [editFirstName, setEditFirstName] = useState('')
  const [editLastName, setEditLastName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editSkills, setEditSkills] = useState([])
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaveMsg, setProfileSaveMsg] = useState('')

  const [tick, setTick] = useState(0)
  const [clockCodes, setClockCodes] = useState({})
  const [clockErrors, setClockErrors] = useState({})
  const [clockingIn, setClockingIn] = useState({})

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  // re-fetch jobs from server whenever filters change
  useEffect(() => {
    fetchJobs(selectedCity, selectedCategory)
  }, [selectedCity, selectedCategory])

  useEffect(() => {
    fetchProfile()
  }, [])

  useEffect(() => {
    if (view === 'applications' && profile) {
      fetchApplications(profile.id)
    }
  }, [view, profile])

  // populate edit form when profile loads
  useEffect(() => {
    if (profile) {
      setEditFirstName(profile.firstName || '')
      setEditLastName(profile.lastName || '')
      setEditPhone(profile.phone || '')
      setEditSkills(profile.skills || [])
    }
  }, [profile])

  async function fetchProfile() {
    try {
      const res = await axios.get(
        `http://localhost:8081/api/worker-profiles/user/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setProfile(res.data)
    } catch {}
  }

  async function fetchJobs(city = '', category = '') {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category) params.append('category', category)
      if (city) params.append('location', city)
      const query = params.toString() ? '?' + params.toString() : ''
      const res = await axios.get(`http://localhost:8081/api/jobs${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setJobs(res.data.jobList.filter(j => j.status === 'OPEN'))
    } catch {
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  async function fetchApplications(profileId) {
    setLoadingApps(true)
    try {
      const res = await axios.get(
        `http://localhost:8081/api/enrollments/worker/${profileId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setApplications(res.data)
    } catch {
      setApplications([])
    } finally {
      setLoadingApps(false)
    }
  }

  async function handleApply(jobId) {
    setApplyingId(jobId)
    setMessage('')
    try {
      await axios.post(`http://localhost:8081/api/enrollments/apply/${jobId}`, {},
        { headers: { Authorization: `Bearer ${token}` } })
      setMessage('Applied successfully!')
    } catch {
      setMessage('Already applied or job no longer available')
    } finally {
      setApplyingId(null)
    }
  }

  async function handleClockIn(enrollmentId) {
    const code = (clockCodes[enrollmentId] || '').trim()
    if (!code) return
    setClockingIn(p => ({ ...p, [enrollmentId]: true }))
    setClockErrors(p => ({ ...p, [enrollmentId]: '' }))
    try {
      const res = await axios.post(
        `http://localhost:8081/api/enrollments/${enrollmentId}/clock-in?code=${encodeURIComponent(code)}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setApplications(prev => prev.map(a => a.id === enrollmentId ? res.data : a))
      setClockCodes(p => ({ ...p, [enrollmentId]: '' }))
    } catch {
      setClockErrors(p => ({ ...p, [enrollmentId]: 'Invalid code. Ask the employer and try again.' }))
    } finally {
      setClockingIn(p => ({ ...p, [enrollmentId]: false }))
    }
  }

  async function handleClockOut(enrollmentId) {
    try {
      const res = await axios.post(
        `http://localhost:8081/api/enrollments/${enrollmentId}/clock-out`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setApplications(prev => prev.map(a => a.id === enrollmentId ? res.data : a))
    } catch {}
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    setSavingProfile(true)
    setProfileSaveMsg('')
    try {
      const res = await axios.put(
        `http://localhost:8081/api/worker-profiles/update/${userId}`,
        { firstName: editFirstName, lastName: editLastName, phone: editPhone, skills: editSkills },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setProfile(res.data)
      setProfileSaveMsg('Profile updated successfully.')
    } catch {
      setProfileSaveMsg('Could not save. Please try again.')
    } finally {
      setSavingProfile(false)
    }
  }

  function toggleEditSkill(skill) {
    setEditSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  function handleLogout() { logout(); navigate('/') }

  const displayName = profile?.firstName
    ? `${profile.firstName}${profile.lastName ? ' ' + profile.lastName : ''}`
    : null

  const categoryLabel = v => CATEGORIES.find(c => c.value === v)?.label || v

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <span className="text-xl font-bold tracking-tight">Flash<span className="text-blue-500">Work</span></span>
        <div className="flex items-center gap-4">
          {displayName && (
            <span className="text-sm text-gray-300">Hi, <span className="text-white font-medium">{displayName}</span></span>
          )}
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition-colors">Log out</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-10">

        <div className="flex gap-1 mb-8 bg-gray-900 p-1 rounded-lg w-fit border border-gray-800">
          <button onClick={() => setView('jobs')}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${view === 'jobs' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            Available Shifts
          </button>
          <button onClick={() => setView('applications')}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${view === 'applications' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            My Applications
          </button>
          <button onClick={() => setView('profile')}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${view === 'profile' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            My Profile
          </button>
        </div>

        {/* Tab: Available Shifts */}
        {view === 'jobs' && (
          <>
            <h1 className="text-2xl font-bold mb-6">Available Shifts</h1>

            <div className="flex gap-3 mb-6 flex-wrap">
              <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-blue-500">
                <option value="">All cities</option>
                {[...new Set(jobs.map(j => j.location).filter(Boolean))].sort()
                  .map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-blue-500">
                <option value="">All categories</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              {(selectedCity || selectedCategory) && (
                <button onClick={() => { setSelectedCity(''); setSelectedCategory('') }}
                  className="text-xs text-gray-500 hover:text-white transition-colors px-2">
                  Clear filters
                </button>
              )}
            </div>

            {message && (
              <div className="mb-6 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-blue-400">{message}</div>
            )}
            {loading && <p className="text-gray-400 text-sm">Loading shifts...</p>}
            {!loading && jobs.length === 0 && <p className="text-gray-400 text-sm">No shifts found.</p>}

            <div className="flex flex-col gap-4">
              {jobs.map(job => (
                <div key={job.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-lg">{job.title}</h3>
                      {job.category && (
                        <span className="text-xs px-2 py-0.5 rounded-full border border-blue-800 text-blue-300 bg-blue-950/50">
                          {categoryLabel(job.category)}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">{job.description}</p>
                    <div className="flex gap-4 text-sm text-gray-500 mt-1 flex-wrap">
                      <span>📍 {job.location}</span>
                      <span>💰 ${job.hourlyRate}/hr</span>
                      <span>🕐 {new Date(job.startTime).toLocaleDateString()}</span>
                      {job.companyName && <span>🏢 {job.companyName}</span>}
                      {job.maxWorkers != null && (
                        <span className={job.maxWorkers - job.acceptedCount <= 2 ? 'text-orange-400' : 'text-gray-500'}>
                          👥 {job.maxWorkers - job.acceptedCount} spot{job.maxWorkers - job.acceptedCount !== 1 ? 's' : ''} left
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => handleApply(job.id)} disabled={applyingId === job.id}
                    className="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors">
                    {applyingId === job.id ? 'Applying...' : 'Apply'}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Tab: My Applications */}
        {view === 'applications' && (
          <>
            <h1 className="text-2xl font-bold mb-6">My Applications</h1>
            {loadingApps && <p className="text-gray-400 text-sm">Loading...</p>}
            {!loadingApps && applications.length === 0 && (
              <p className="text-gray-400 text-sm">You haven't applied to any shifts yet.</p>
            )}
            <div className="flex flex-col gap-4">
              {applications.map(app => {
                const now = Date.now()
                const start = new Date(app.jobStartTime).getTime()
                const end = new Date(app.jobEndTime).getTime()
                const countdown = formatCountdown(app.jobStartTime)
                const isShiftActive = now >= start && now <= end
                const isBeforeShift = now < start
                const isClockedIn = !!app.clockInTime && !app.clockOutTime
                const isDone = !!app.clockOutTime || app.status === 'COMPLETED'

                return (
                  <div key={app.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <div className="p-6 flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-1.5">
                        <h3 className="font-semibold text-lg">{app.jobTitle}</h3>
                        <span className="text-xs text-gray-500">Applied {new Date(app.appliedAt).toLocaleDateString()}</span>
                        {app.jobStartTime && (
                          <span className="text-xs text-gray-500">
                            {new Date(app.jobStartTime).toLocaleDateString()} · {formatTime(app.jobStartTime)} – {formatTime(app.jobEndTime)}
                          </span>
                        )}
                      </div>
                      <span className={`shrink-0 text-xs px-3 py-1 rounded-full border font-medium ${STATUS_STYLE[app.status] || 'border-gray-700 text-gray-400'}`}>
                        {app.status}
                      </span>
                    </div>

                    {app.status === 'ACCEPTED' && (
                      <div className="border-t border-gray-800 px-6 py-4 flex flex-col gap-3">
                        {isBeforeShift && countdown && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">Shift starts in</span>
                            <span className="text-sm font-semibold text-blue-400 font-mono">{countdown}</span>
                          </div>
                        )}
                        {(isShiftActive || isBeforeShift) && !app.clockInTime && (
                          <div className="flex flex-col gap-2">
                            <p className="text-xs text-gray-400">Ask the employer for the clock-in code and enter it below:</p>
                            <div className="flex gap-2">
                              <input
                                value={clockCodes[app.id] || ''}
                                onChange={e => setClockCodes(p => ({ ...p, [app.id]: e.target.value.toUpperCase() }))}
                                placeholder="e.g. AB3X7K"
                                maxLength={8}
                                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm font-mono tracking-widest outline-none focus:border-blue-500 w-40 transition-colors"
                              />
                              <button
                                onClick={() => handleClockIn(app.id)}
                                disabled={clockingIn[app.id] || !(clockCodes[app.id] || '').trim()}
                                className="px-4 py-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors">
                                {clockingIn[app.id] ? 'Clocking in...' : 'Clock In'}
                              </button>
                            </div>
                            {clockErrors[app.id] && <p className="text-red-400 text-xs">{clockErrors[app.id]}</p>}
                          </div>
                        )}
                        {isClockedIn && (
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs text-gray-400">Clocked in at {formatTime(app.clockInTime)}</span>
                              <span className="text-sm font-semibold text-green-400 font-mono">
                                Working: {formatDuration(app.clockInTime)}
                              </span>
                            </div>
                            <button onClick={() => handleClockOut(app.id)}
                              className="px-4 py-2 bg-red-800 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors">
                              Clock Out
                            </button>
                          </div>
                        )}
                        {isDone && app.clockInTime && app.clockOutTime && (
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>Clocked in: <span className="text-white font-mono">{formatTime(app.clockInTime)}</span></span>
                            <span>Clocked out: <span className="text-white font-mono">{formatTime(app.clockOutTime)}</span></span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Tab: My Profile */}
        {view === 'profile' && (
          <>
            <h1 className="text-2xl font-bold mb-6">My Profile</h1>
            {!profile && <p className="text-gray-400 text-sm">Loading...</p>}
            {profile && (
              <form onSubmit={handleSaveProfile} className="flex flex-col gap-5 max-w-md">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-400">First Name</label>
                  <input value={editFirstName} onChange={e => setEditFirstName(e.target.value)}
                    className={inputCls} required />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-400">Last Name</label>
                  <input value={editLastName} onChange={e => setEditLastName(e.target.value)}
                    className={inputCls} required />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-400">Phone <span className="text-gray-600">(optional)</span></label>
                  <input value={editPhone} onChange={e => setEditPhone(e.target.value)}
                    placeholder="07xx xxx xxx" className={inputCls} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-400">Skills</label>
                  <div className="grid grid-cols-3 gap-2">
                    {ALL_SKILLS.map(s => {
                      const active = editSkills.includes(s.value)
                      return (
                        <button key={s.value} type="button" onClick={() => toggleEditSkill(s.value)}
                          className={`px-3 py-2.5 rounded-lg text-xs font-medium border transition-all ${
                            active
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                          }`}>
                          {s.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                {profileSaveMsg && (
                  <p className={`text-sm ${profileSaveMsg.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
                    {profileSaveMsg}
                  </p>
                )}
                <button type="submit" disabled={savingProfile}
                  className="py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg font-medium text-sm transition-colors">
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            )}
          </>
        )}

      </div>
    </div>
  )
}

export default WorkerDashboard