import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const STATUS_STYLE = {
  PENDING: 'text-yellow-400',
  ACCEPTED: 'text-green-400',
  REJECTED: 'text-red-400',
  COMPLETED: 'text-blue-400',
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

const EMPTY_FORM = {
  title: '',
  description: '',
  hourlyRate: '',
  startTime: '',
  endTime: '',
  location: '',
  category: '',
}

function EmployerDashboard() {
  const navigate = useNavigate()
  const { token, userId, logout } = useAuth()

  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  const [selectedJobId, setSelectedJobId] = useState(null)
  const [applicants, setApplicants] = useState([])
  const [loadingApplicants, setLoadingApplicants] = useState(false)

  const [showPostForm, setShowPostForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState('')

  const [editingJobId, setEditingJobId] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [updating, setUpdating] = useState(false)
  const [editError, setEditError] = useState('')

  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  useEffect(() => {
    fetchJobs()
  }, [])

  async function fetchJobs() {
    try {
      const res = await axios.get('http://localhost:8081/api/jobs', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const myJobs = res.data.jobList.filter(
        (j) => String(j.employerId) === String(userId)
      )
      setJobs(myJobs)
    } catch {
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  async function fetchApplicants(jobId) {
    setLoadingApplicants(true)
    try {
      const res = await axios.get(
        `http://localhost:8081/api/enrollments/job/${jobId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setApplicants(res.data)
    } catch {
      setApplicants([])
    } finally {
      setLoadingApplicants(false)
    }
  }

  function handleJobClick(jobId) {
    if (editingJobId === jobId || confirmDeleteId === jobId) return
    if (selectedJobId === jobId) {
      setSelectedJobId(null)
      setApplicants([])
    } else {
      setSelectedJobId(jobId)
      fetchApplicants(jobId)
    }
  }

  async function handleStatusUpdate(enrollmentId, status) {
    try {
      await axios.patch(
        `http://localhost:8081/api/enrollments/${enrollmentId}/status?status=${status}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchApplicants(selectedJobId)
    } catch {
      // ramane cum e
    }
  }

  async function handlePostJob(e) {
    e.preventDefault()
    setPosting(true)
    setPostError('')
    try {
      await axios.post(
        `http://localhost:8081/api/jobs/create`,
        {
          title: form.title,
          description: form.description,
          hourlyRate: parseFloat(form.hourlyRate),
          startTime: form.startTime.length === 16 ? form.startTime + ':00' : form.startTime,
          endTime: form.endTime.length === 16 ? form.endTime + ':00' : form.endTime,
          location: form.location,
          category: form.category || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setForm(EMPTY_FORM)
      setShowPostForm(false)
      fetchJobs()
    } catch {
      setPostError('Could not post job. Check all fields and try again.')
    } finally {
      setPosting(false)
    }
  }

  function handleEditClick(job) {
    setEditingJobId(job.id)
    setSelectedJobId(null)
    setApplicants([])
    setEditError('')
    setEditForm({
      title: job.title,
      description: job.description,
      hourlyRate: String(job.hourlyRate),
      startTime: job.startTime ? job.startTime.slice(0, 16) : '',
      endTime: job.endTime ? job.endTime.slice(0, 16) : '',
      location: job.location,
      category: job.category || '',
    })
  }

  async function handleUpdate(e) {
    e.preventDefault()
    setUpdating(true)
    setEditError('')
    try {
      await axios.put(
        `http://localhost:8081/api/jobs/put/${editingJobId}`,
        {
          title: editForm.title,
          description: editForm.description,
          hourlyRate: parseFloat(editForm.hourlyRate),
          startTime: editForm.startTime.length === 16 ? editForm.startTime + ':00' : editForm.startTime,
          endTime: editForm.endTime.length === 16 ? editForm.endTime + ':00' : editForm.endTime,
          location: editForm.location,
          category: editForm.category || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setEditingJobId(null)
      fetchJobs()
    } catch {
      setEditError('Could not update job.')
    } finally {
      setUpdating(false)
    }
  }

  async function handleDelete(jobId) {
    try {
      await axios.delete(`http://localhost:8081/api/jobs/delete/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setConfirmDeleteId(null)
      if (selectedJobId === jobId) {
        setSelectedJobId(null)
        setApplicants([])
      }
      fetchJobs()
    } catch {
      // error
    }
  }

  function handleLogout() {
    logout()
    navigate('/')
  }

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function setEditField(key, value) {
    setEditForm((prev) => ({ ...prev, [key]: value }))
  }

  const categoryLabel = (value) =>
    CATEGORIES.find((c) => c.value === value)?.label || value

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
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

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">My Jobs</h1>
            <p className="text-gray-400 text-sm">Manage your posted shifts</p>
          </div>
          <button
            onClick={() => { setShowPostForm(!showPostForm); setPostError('') }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
          >
            {showPostForm ? 'Cancel' : '+ Post a Job'}
          </button>
        </div>

        {/* Formular post job */}
        {showPostForm && (
          <form
            onSubmit={handlePostJob}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8 flex flex-col gap-4"
          >
            <h2 className="font-semibold text-lg">New Shift</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-400">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  placeholder="e.g. Warehouse Worker"
                  className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-400">Location</label>
                <input
                  value={form.location}
                  onChange={(e) => setField('location', e.target.value)}
                  placeholder="e.g. Bucharest"
                  className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-400">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="Describe the shift..."
                rows={3}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-400">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setField('category', e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">-- Select category --</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-400">Hourly Rate ($)</label>
                <input
                  type="number"
                  value={form.hourlyRate}
                  onChange={(e) => setField('hourlyRate', e.target.value)}
                  placeholder="15.00"
                  min="0"
                  step="0.01"
                  className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-400">Start Time</label>
                <input
                  type="datetime-local"
                  value={form.startTime}
                  onChange={(e) => setField('startTime', e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-400">End Time</label>
                <input
                  type="datetime-local"
                  value={form.endTime}
                  onChange={(e) => setField('endTime', e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            </div>

            {postError && <p className="text-red-400 text-sm">{postError}</p>}

            <button
              type="submit"
              disabled={posting}
              className="py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg font-medium text-sm transition-colors"
            >
              {posting ? 'Posting...' : 'Post Shift'}
            </button>
          </form>
        )}

        {/* Lista joburi */}
        {loading && <p className="text-gray-400 text-sm">Loading your jobs...</p>}

        {!loading && jobs.length === 0 && (
          <p className="text-gray-400 text-sm">No jobs posted yet.</p>
        )}

        <div className="flex flex-col gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">

              {/* Edit form inline */}
              {editingJobId === job.id ? (
                <form onSubmit={handleUpdate} className="p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Edit Shift</h3>
                    <button
                      type="button"
                      onClick={() => setEditingJobId(null)}
                      className="text-gray-500 hover:text-white text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-gray-400">Title</label>
                      <input
                        value={editForm.title}
                        onChange={(e) => setEditField('title', e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-gray-400">Location</label>
                      <input
                        value={editForm.location}
                        onChange={(e) => setEditField('location', e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-400">Description</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditField('description', e.target.value)}
                      rows={3}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors resize-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-gray-400">Category</label>
                      <select
                        value={editForm.category}
                        onChange={(e) => setEditField('category', e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
                      >
                        <option value="">-- Select category --</option>
                        {CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-gray-400">Hourly Rate ($)</label>
                      <input
                        type="number"
                        value={editForm.hourlyRate}
                        onChange={(e) => setEditField('hourlyRate', e.target.value)}
                        min="0"
                        step="0.01"
                        className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-gray-400">Start Time</label>
                      <input
                        type="datetime-local"
                        value={editForm.startTime}
                        onChange={(e) => setEditField('startTime', e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-gray-400">End Time</label>
                      <input
                        type="datetime-local"
                        value={editForm.endTime}
                        onChange={(e) => setEditField('endTime', e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  {editError && <p className="text-red-400 text-sm">{editError}</p>}

                  <button
                    type="submit"
                    disabled={updating}
                    className="py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg font-medium text-sm transition-colors"
                  >
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              ) : (
                <>
                  {/* Card job */}
                  <div
                    className="p-6 flex items-start justify-between gap-4 cursor-pointer hover:bg-gray-800/40 transition-colors"
                    onClick={() => handleJobClick(job.id)}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-lg">{job.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          job.status === 'OPEN'
                            ? 'border-green-800 text-green-400 bg-green-950/50'
                            : 'border-gray-700 text-gray-400'
                        }`}>
                          {job.status}
                        </span>
                        {job.category && (
                          <span className="text-xs px-2 py-0.5 rounded-full border border-blue-800 text-blue-300 bg-blue-950/50">
                            {categoryLabel(job.category)}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">{job.description}</p>
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>📍 {job.location}</span>
                        <span>💰 ${job.hourlyRate}/hr</span>
                        <span>🕐 {new Date(job.startTime).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 mt-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEditClick(job)}
                        className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      {confirmDeleteId === job.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-400">Delete?</span>
                          <button
                            onClick={() => handleDelete(job.id)}
                            className="px-3 py-1.5 text-xs bg-red-700 hover:bg-red-600 rounded-lg transition-colors"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(job.id)}
                          className="px-3 py-1.5 text-xs bg-red-900 hover:bg-red-800 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      )}
                      <span className="text-gray-500 text-xs ml-1">
                        {selectedJobId === job.id ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>

                  {/* Panel aplicanti */}
                  {selectedJobId === job.id && (
                    <div className="border-t border-gray-800 px-6 py-5">
                      <h4 className="text-sm font-medium text-gray-300 mb-4">Applicants</h4>

                      {loadingApplicants && <p className="text-gray-500 text-sm">Loading...</p>}

                      {!loadingApplicants && applicants.length === 0 && (
                        <p className="text-gray-500 text-sm">No applicants yet.</p>
                      )}

                      <div className="flex flex-col gap-3">
                        {applicants.map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center justify-between bg-gray-800/50 rounded-lg px-4 py-3"
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-medium">
                                {(a.workerFirstName || a.workerLastName)
                                  ? `${a.workerFirstName || ''} ${a.workerLastName || ''}`.trim()
                                  : 'Anonim'}
                              </span>
                              <span className="text-xs text-gray-500">
                                Applied {new Date(a.appliedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-medium ${STATUS_STYLE[a.status] || 'text-gray-400'}`}>
                                {a.status}
                              </span>
                              {a.status === 'PENDING' && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleStatusUpdate(a.id, 'ACCEPTED')}
                                    className="px-3 py-1.5 bg-green-700 hover:bg-green-600 rounded-lg text-xs font-medium transition-colors"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleStatusUpdate(a.id, 'REJECTED')}
                                    className="px-3 py-1.5 bg-red-900 hover:bg-red-800 rounded-lg text-xs font-medium transition-colors"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default EmployerDashboard