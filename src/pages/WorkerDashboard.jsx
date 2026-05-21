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

function WorkerDashboard() {
  const navigate = useNavigate()
  const { token, userId: workerId, logout } = useAuth()

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

  useEffect(() => {
    fetchJobs()
    fetchProfile()
  }, [])

  useEffect(() => {
    if (view === 'applications' && profile) {
      fetchApplications(profile.id)
    }
  }, [view, profile])

  async function fetchProfile() {
    try {
      const res = await axios.get(
        `http://localhost:8081/api/worker-profiles/user/${workerId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setProfile(res.data)
    } catch {
      // profilul nu a putut fi preluat
    }
  }

  async function fetchJobs() {
    try {
      const res = await axios.get('http://localhost:8081/api/jobs', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const openJobs = res.data.jobList.filter((j) => j.status === 'OPEN')
      setJobs(openJobs)
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
      await axios.post(
        `http://localhost:8081/api/enrollments/apply/${jobId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMessage('Applied successfully!')
    } catch {
      setMessage('Already applied or job no longer available')
    } finally {
      setApplyingId(null)
    }
  }

  function handleLogout() {
    logout()
    navigate('/')
  }

  const displayName = profile?.firstName
    ? `${profile.firstName}${profile.lastName ? ' ' + profile.lastName : ''}`
    : null

  const cities = [...new Set(jobs.map((j) => j.location).filter(Boolean))].sort()
  const categoriesInUse = [...new Set(jobs.map((j) => j.category).filter(Boolean))].sort()

  const filteredJobs = jobs.filter((j) => {
    if (selectedCity && j.location !== selectedCity) return false
    if (selectedCategory && j.category !== selectedCategory) return false
    return true
  })

  const categoryLabel = (value) =>
    CATEGORIES.find((c) => c.value === value)?.label || value

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <span className="text-xl font-bold tracking-tight">
          Flash<span className="text-blue-500">Work</span>
        </span>
        <div className="flex items-center gap-4">
          {displayName && (
            <span className="text-sm text-gray-300">
              Hi, <span className="text-white font-medium">{displayName}</span>
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Log out
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-10">

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-gray-900 p-1 rounded-lg w-fit border border-gray-800">
          <button
            onClick={() => setView('jobs')}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'jobs' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Available Shifts
          </button>
          <button
            onClick={() => setView('applications')}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'applications' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            My Applications
          </button>
        </div>

        {/* Tab: Available Shifts */}
        {view === 'jobs' && (
          <>
            <h1 className="text-2xl font-bold mb-6">Available Shifts</h1>

            {/* Filtre */}
            <div className="flex gap-3 mb-6 flex-wrap">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">All cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">All categories</option>
                {categoriesInUse.map((cat) => (
                  <option key={cat} value={cat}>{categoryLabel(cat)}</option>
                ))}
              </select>

              {(selectedCity || selectedCategory) && (
                <button
                  onClick={() => { setSelectedCity(''); setSelectedCategory('') }}
                  className="text-xs text-gray-500 hover:text-white transition-colors px-2"
                >
                  Clear filters
                </button>
              )}
            </div>

            {message && (
              <div className="mb-6 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-blue-400">
                {message}
              </div>
            )}

            {loading && <p className="text-gray-400 text-sm">Loading shifts...</p>}

            {!loading && filteredJobs.length === 0 && (
              <p className="text-gray-400 text-sm">No shifts found for the selected filters.</p>
            )}

            <div className="flex flex-col gap-4">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex items-start justify-between gap-4"
                >
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
  {job.maxWorkers != null && (
    <span className={
      job.maxWorkers - job.acceptedCount <= 2
        ? 'text-orange-400'   // urgent: mai sunt 1-2 locuri
        : 'text-gray-500'
    }>
      👥 {job.maxWorkers - job.acceptedCount} spot{job.maxWorkers - job.acceptedCount !== 1 ? 's' : ''} left
    </span>
  )}
</div>
                  </div>

                  <button
                    onClick={() => handleApply(job.id)}
                    disabled={applyingId === job.id}
                    className="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
                  >
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
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex items-start justify-between gap-4"
                >
                  <div className="flex flex-col gap-2">
                    <h3 className="font-semibold text-lg">{app.jobTitle}</h3>
                    <span className="text-xs text-gray-500">
                      Applied {new Date(app.appliedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full border font-medium ${STATUS_STYLE[app.status] || 'border-gray-700 text-gray-400'}`}>
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  )
}

export default WorkerDashboard