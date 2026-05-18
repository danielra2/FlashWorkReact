import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function WorkerDashboard() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [applyingId, setApplyingId] = useState(null)
  const [message, setMessage] = useState('')

  const token = localStorage.getItem('token')
  const workerId = localStorage.getItem('userId')

  useEffect(() => {
    fetchJobs()
  }, [])

  async function fetchJobs() {
    try {
      const response = await axios.get('http://localhost:8081/api/jobs', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const openJobs = response.data.jobList.filter(job => job.status === 'OPEN')
      setJobs(openJobs)
    } catch (err) {
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  async function handleApply(jobId) {
    setApplyingId(jobId)
    setMessage('')
    try {
      await axios.post(
        `http://localhost:8081/api/enrollments/apply/${jobId}/${workerId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMessage('Applied successfully!')
    } catch (err) {
      setMessage('Already applied or job no longer available')
    } finally {
      setApplyingId(null)
    }
  }

  function handleLogout() {
    localStorage.clear()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <span className="text-xl font-bold tracking-tight">
          Flash<span className="text-blue-500">Work</span>
        </span>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Log out
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-10">

        <h1 className="text-2xl font-bold mb-2">Available Shifts</h1>
        <p className="text-gray-400 text-sm mb-8">
          Browse open positions and apply instantly
        </p>

        {message && (
          <div className="mb-6 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-blue-400">
            {message}
          </div>
        )}

        {loading && (
          <p className="text-gray-400 text-sm">Loading shifts...</p>
        )}

        {!loading && jobs.length === 0 && (
          <p className="text-gray-400 text-sm">No open shifts available right now.</p>
        )}

        <div className="flex flex-col gap-4">
          {jobs.map(job => (
            <div
              key={job.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex items-start justify-between gap-4"
            >
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-lg">{job.title}</h3>
                <p className="text-gray-400 text-sm">{job.description}</p>
                <div className="flex gap-4 text-sm text-gray-500 mt-1">
                  <span>📍 {job.location}</span>
                  <span>💰 ${job.hourlyRate}/hr</span>
                  <span>🕐 {new Date(job.startTime).toLocaleDateString()}</span>
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
      </div>
    </div>
  )
}

export default WorkerDashboard
