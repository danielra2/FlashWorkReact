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
  { value:  'RETAIL', label: 'Retail' },
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
  title: '', description: '', hourlyRate: '', startTime: '', endTime: '',
  location: '', category: '', maxWorkers: '', isRecurring: false, recurrenceDays: '1',
}

function buildPayload(f) {
  return {
    title: f.title, description: f.description,
    hourlyRate: parseFloat(f.hourlyRate),
    startTime: f.startTime.length === 16 ? f.startTime + ':00' : f.startTime,
    endTime: f.endTime.length === 16 ? f.endTime + ':00' : f.endTime,
    location: f.location, category: f.category || null,
    maxWorkers: f.maxWorkers ? parseInt(f.maxWorkers) : null,
    isRecurring: f.isRecurring,
    recurrenceDays: f.isRecurring && f.recurrenceDays ? parseInt(f.recurrenceDays) : null,
  }
}

const inputCls = 'bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors'
const labelCls = 'text-sm text-gray-400'

// formats "2026-05-25T09:03:00" → "09:03"
function formatTime(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
}

// countdown to a future date, e.g. "2h 34m" — returns null when time has passed
function formatCountdown(targetISO) {
  const diff = new Date(targetISO) - Date.now()
  if (diff <= 0) return null
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// how long a worker has been clocked in, e.g. "1h 23m"
function formatDuration(fromISO) {
  const diff = Date.now() - new Date(fromISO)
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
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

  // tick causes re-render every second so countdowns stay live
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => { fetchJobs() }, [])

  async function fetchJobs() {
    try {
      const res = await axios.get('http://localhost:8081/api/jobs', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setJobs(res.data.jobList.filter(j => String(j.employerId) === String(userId)))
    } catch {
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  async function fetchApplicants(jobId) {
    setLoadingApplicants(true)
    try {
      const res = await axios.get(`http://localhost:8081/api/enrollments/job/${jobId}`,
        { headers: { Authorization: `Bearer ${token}` } })
      setApplicants(res.data)
    } catch {
      setApplicants([])
    } finally {
      setLoadingApplicants(false)
    }
  }

  function handleJobClick(jobId) {
    if (editingJobId === jobId || confirmDeleteId === jobId) return
    if (selectedJobId === jobId) { setSelectedJobId(null); setApplicants([]) }
    else { setSelectedJobId(jobId); fetchApplicants(jobId) }
  }

  async function handleStatusUpdate(enrollmentId, status) {
    try {
      await axios.patch(
        `http://localhost:8081/api/enrollments/${enrollmentId}/status?status=${status}`,
        {}, { headers: { Authorization: `Bearer ${token}` } })
      fetchApplicants(selectedJobId)
      fetchJobs()
    } catch {}
  }

  async function handlePostJob(e) {
    e.preventDefault(); setPosting(true); setPostError('')
    try {
      await axios.post('http://localhost:8081/api/jobs/create', buildPayload(form),
        { headers: { Authorization: `Bearer ${token}` } })
      setForm(EMPTY_FORM); setShowPostForm(false); fetchJobs()
    } catch { setPostError('Could not post job. Check all fields and try again.') }
    finally { setPosting(false) }
  }

  function handleEditClick(job) {
    setEditingJobId(job.id); setSelectedJobId(null); setApplicants([]); setEditError('')
    setEditForm({
      title: job.title, description: job.description, hourlyRate: String(job.hourlyRate),
      startTime: job.startTime ? job.startTime.slice(0, 16) : '',
      endTime: job.endTime ? job.endTime.slice(0, 16) : '',
      location: job.location, category: job.category || '',
      maxWorkers: job.maxWorkers != null ? String(job.maxWorkers) : '',
      isRecurring: job.isRecurring || false,
      recurrenceDays: job.recurrenceDays != null ? String(job.recurrenceDays) : '1',
    })
  }

  async function handleUpdate(e) {
    e.preventDefault(); setUpdating(true); setEditError('')
    try {
      await axios.put(`http://localhost:8081/api/jobs/put/${editingJobId}`, buildPayload(editForm),
        { headers: { Authorization: `Bearer ${token}` } })
      setEditingJobId(null); fetchJobs()
    } catch { setEditError('Could not update job.') }
    finally { setUpdating(false) }
  }

  async function handleDelete(jobId) {
    try {
      await axios.delete(`http://localhost:8081/api/jobs/delete/${jobId}`,
        { headers: { Authorization: `Bearer ${token}` } })
      setConfirmDeleteId(null)
      if (selectedJobId === jobId) { setSelectedJobId(null); setApplicants([]) }
      fetchJobs()
    } catch {}
  }

  function handleLogout() { logout(); navigate('/') }
  function setField(k, v) { setForm(p => ({ ...p, [k]: v })) }
  function setEditField(k, v) { setEditForm(p => ({ ...p, [k]: v })) }
  const categoryLabel = v => CATEGORIES.find(c => c.value === v)?.label || v

  // helper: skill tag colour
  function skillBadge(skill) {
    return (
      <span key={skill} className="text-xs px-2 py-0.5 rounded-full bg-purple-950/50 border border-purple-800 text-purple-300">
        {skill.replace('_', ' ')}
      </span>
    )
  }

  // what to show for a worker's clock status in the applicants list
  function clockStatus(a) {
    if (a.status !== 'ACCEPTED' && a.status !== 'COMPLETED') return null
    if (!a.clockInTime) return <span className="text-xs text-gray-500">Not yet arrived</span>
    if (a.clockInTime && !a.clockOutTime)
      return (
        <span className="text-xs text-green-400">
          Clocked in {formatTime(a.clockInTime)} · working {formatDuration(a.clockInTime)}
        </span>
      )
    return (
      <span className="text-xs text-blue-400">
        {formatTime(a.clockInTime)} – {formatTime(a.clockOutTime)}
      </span>
    )
  }

  // reusable recurring block used in both the post and edit form
  function RecurringBlock({ f, setF }) {
    return (
      <div className="flex flex-col gap-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={f.isRecurring}
            onChange={e => setF('isRecurring', e.target.checked)}
            className="w-4 h-4 accent-blue-500" />
          <span className="text-sm text-gray-300">Recurring job</span>
        </label>
        {f.isRecurring && (
          <div className="flex items-center gap-3">
            <span className={labelCls}>Repeat every</span>
            <input type="number" value={f.recurrenceDays}
              onChange={e => setF('recurrenceDays', e.target.value)}
              min="1" max="365"
              className="w-20 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
            <span className={labelCls}>day(s)</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <span className="text-xl font-bold tracking-tight">Flash<span className="text-blue-500">Work</span></span>
        <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition-colors">Log out</button>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">My Jobs</h1>
            <p className="text-gray-400 text-sm">Manage your posted shifts</p>
          </div>
          <button onClick={() => { setShowPostForm(!showPostForm); setPostError('') }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
            {showPostForm ? 'Cancel' : '+ Post a Job'}
          </button>
        </div>

        {/* POST FORM */}
        {showPostForm && (
          <form onSubmit={handlePostJob} className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8 flex flex-col gap-4">
            <h2 className="font-semibold text-lg">New Shift</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1"><label className={labelCls}>Title</label>
                <input value={form.title} onChange={e => setField('title', e.target.value)} placeholder="e.g. Warehouse Worker" className={inputCls} required /></div>
              <div className="flex flex-col gap-1"><label className={labelCls}>Location</label>
                <input value={form.location} onChange={e => setField('location', e.target.value)} placeholder="e.g. Bucharest" className={inputCls} required /></div>
            </div>
            <div className="flex flex-col gap-1"><label className={labelCls}>Description</label>
              <textarea value={form.description} onChange={e => setField('description', e.target.value)} rows={3} className={inputCls + ' resize-none'} required /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1"><label className={labelCls}>Category</label>
                <select value={form.category} onChange={e => setField('category', e.target.value)} className={inputCls}>
                  <option value="">-- Category --</option>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select></div>
              <div className="flex flex-col gap-1"><label className={labelCls}>Hourly Rate ($)</label>
                <input type="number" value={form.hourlyRate} onChange={e => setField('hourlyRate', e.target.value)} placeholder="15.00" min="0" step="0.01" className={inputCls} required /></div>
              <div className="flex flex-col gap-1"><label className={labelCls}>Max Workers</label>
                <input type="number" value={form.maxWorkers} onChange={e => setField('maxWorkers', e.target.value)} placeholder="Unlimited" min="1" className={inputCls} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1"><label className={labelCls}>Start Time</label>
                <input type="datetime-local" value={form.startTime} onChange={e => setField('startTime', e.target.value)} className={inputCls} required /></div>
              <div className="flex flex-col gap-1"><label className={labelCls}>End Time</label>
                <input type="datetime-local" value={form.endTime} onChange={e => setField('endTime', e.target.value)} className={inputCls} required /></div>
            </div>
            <RecurringBlock f={form} setF={setField} />
            {postError && <p className="text-red-400 text-sm">{postError}</p>}
            <button type="submit" disabled={posting} className="py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg font-medium text-sm transition-colors">
              {posting ? 'Posting...' : 'Post Shift'}
            </button>
          </form>
        )}

        {loading && <p className="text-gray-400 text-sm">Loading...</p>}
        {!loading && jobs.length === 0 && <p className="text-gray-400 text-sm">No jobs posted yet.</p>}

        <div className="flex flex-col gap-4">
          {jobs.map(job => (
            <div key={job.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">

              {/* EDIT FORM */}
              {editingJobId === job.id ? (
                <form onSubmit={handleUpdate} className="p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Edit Shift</h3>
                    <button type="button" onClick={() => setEditingJobId(null)} className="text-gray-500 hover:text-white text-sm">Cancel</button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1"><label className={labelCls}>Title</label>
                      <input value={editForm.title} onChange={e => setEditField('title', e.target.value)} className={inputCls} required /></div>
                    <div className="flex flex-col gap-1"><label className={labelCls}>Location</label>
                      <input value={editForm.location} onChange={e => setEditField('location', e.target.value)} className={inputCls} required /></div>
                  </div>
                  <div className="flex flex-col gap-1"><label className={labelCls}>Description</label>
                    <textarea value={editForm.description} onChange={e => setEditField('description', e.target.value)} rows={3} className={inputCls + ' resize-none'} required /></div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1"><label className={labelCls}>Category</label>
                      <select value={editForm.category} onChange={e => setEditField('category', e.target.value)} className={inputCls}>
                        <option value="">-- Category --</option>
                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select></div>
                    <div className="flex flex-col gap-1"><label className={labelCls}>Hourly Rate ($)</label>
                      <input type="number" value={editForm.hourlyRate} onChange={e => setEditField('hourlyRate', e.target.value)} min="0" step="0.01" className={inputCls} required /></div>
                    <div className="flex flex-col gap-1"><label className={labelCls}>Max Workers</label>
                      <input type="number" value={editForm.maxWorkers} onChange={e => setEditField('maxWorkers', e.target.value)} placeholder="Unlimited" min="1" className={inputCls} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1"><label className={labelCls}>Start Time</label>
                      <input type="datetime-local" value={editForm.startTime} onChange={e => setEditField('startTime', e.target.value)} className={inputCls} required /></div>
                    <div className="flex flex-col gap-1"><label className={labelCls}>End Time</label>
                      <input type="datetime-local" value={editForm.endTime} onChange={e => setEditField('endTime', e.target.value)} className={inputCls} required /></div>
                  </div>
                  <RecurringBlock f={editForm} setF={setEditField} />
                  {editError && <p className="text-red-400 text-sm">{editError}</p>}
                  <button type="submit" disabled={updating} className="py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg font-medium text-sm transition-colors">
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              ) : (
                <>
                  {/* JOB CARD HEADER */}
                  <div className="p-6 flex items-start justify-between gap-4 cursor-pointer hover:bg-gray-800/40 transition-colors"
                    onClick={() => handleJobClick(job.id)}>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{job.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          job.status === 'OPEN' ? 'border-green-800 text-green-400 bg-green-950/50' :
                          job.status === 'FILLED' ? 'border-orange-800 text-orange-400 bg-orange-950/50' :
                          'border-gray-700 text-gray-400'}`}>{job.status}</span>
                        {job.category && (
                          <span className="text-xs px-2 py-0.5 rounded-full border border-blue-800 text-blue-300 bg-blue-950/50">
                            {categoryLabel(job.category)}
                          </span>
                        )}
                        {job.isRecurring && (
                          <span className="text-xs px-2 py-0.5 rounded-full border border-purple-800 text-purple-300 bg-purple-950/50">
                            🔁 Every {job.recurrenceDays}d
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">{job.description}</p>
                      <div className="flex gap-4 text-sm text-gray-500 flex-wrap">
                        <span>📍 {job.location}</span>
                        <span>💰 ${job.hourlyRate}/hr</span>
                        <span>🕐 {new Date(job.startTime).toLocaleDateString()}</span>
                        {job.maxWorkers != null && (
                          <span className={job.acceptedCount >= job.maxWorkers ? 'text-orange-400' : 'text-gray-500'}>
                            👥 {job.acceptedCount}/{job.maxWorkers} filled
                          </span>
                        )}
                        {/* live countdown to shift start */}
                        {formatCountdown(job.startTime) && (
                          <span className="text-blue-400 font-medium">
                            ⏰ Starts in {formatCountdown(job.startTime)}
                          </span>
                        )}
                        {!formatCountdown(job.startTime) && new Date(job.endTime) > Date.now() && (
                          <span className="text-green-400 font-medium">🟢 Active now</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 mt-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleEditClick(job)} className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">Edit</button>
                      {confirmDeleteId === job.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-400">Delete?</span>
                          <button onClick={() => handleDelete(job.id)} className="px-3 py-1.5 text-xs bg-red-700 hover:bg-red-600 rounded-lg transition-colors">Yes</button>
                          <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">No</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(job.id)} className="px-3 py-1.5 text-xs bg-red-900 hover:bg-red-800 rounded-lg transition-colors">Delete</button>
                      )}
                      <span className="text-gray-500 text-xs ml-1">{selectedJobId === job.id ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* APPLICANTS PANEL */}
                  {selectedJobId === job.id && (
                    <div className="border-t border-gray-800 px-6 py-5">

                      {/* Clock-in code — employer shares this verbally with workers on arrival */}
                      {job.clockInCode && (
                        <div className="flex items-center gap-3 mb-5 p-3 bg-gray-800/60 rounded-lg border border-gray-700">
                          <span className="text-xs text-gray-400 shrink-0">Clock-in code:</span>
                          <span className="font-mono font-bold text-xl tracking-widest text-blue-400">{job.clockInCode}</span>
                          <span className="text-xs text-gray-500">Tell this to workers when they arrive</span>
                        </div>
                      )}

                      <h4 className="text-sm font-medium text-gray-300 mb-4">Applicants</h4>
                      {loadingApplicants && <p className="text-gray-500 text-sm">Loading...</p>}
                      {!loadingApplicants && applicants.length === 0 && <p className="text-gray-500 text-sm">No applicants yet.</p>}

                      <div className="flex flex-col gap-3">
                        {applicants.map(a => (
                          <div key={a.id} className="flex items-start justify-between bg-gray-800/50 rounded-lg px-4 py-3 gap-4">
                            <div className="flex flex-col gap-1.5 min-w-0">
                              <span className="text-sm font-medium">
                                {(a.workerFirstName || a.workerLastName)
                                  ? `${a.workerFirstName || ''} ${a.workerLastName || ''}`.trim()
                                  : 'Anonymous'}
                              </span>
                              {/* skill badges */}
                              {a.workerSkills && a.workerSkills.length > 0 && (
                                <div className="flex gap-1 flex-wrap">
                                  {a.workerSkills.map(s => skillBadge(s))}
                                </div>
                              )}
                              <span className="text-xs text-gray-500">Applied {new Date(a.appliedAt).toLocaleDateString()}</span>
                              {/* clock status */}
                              {clockStatus(a)}
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span className={`text-xs font-medium ${STATUS_STYLE[a.status] || 'text-gray-400'}`}>{a.status}</span>
                              {a.status === 'PENDING' && (
                                <div className="flex gap-2">
                                  <button onClick={() => handleStatusUpdate(a.id, 'ACCEPTED')}
                                    className="px-3 py-1.5 bg-green-700 hover:bg-green-600 rounded-lg text-xs font-medium transition-colors">Accept</button>
                                  <button onClick={() => handleStatusUpdate(a.id, 'REJECTED')}
                                    className="px-3 py-1.5 bg-red-900 hover:bg-red-800 rounded-lg text-xs font-medium transition-colors">Reject</button>
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