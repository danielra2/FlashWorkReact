import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [userType, setUserType] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleRoleSelect(role) {
    setUserType(role)
    setStep(2)
  }

  async function handleRegister(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await axios.post('http://localhost:8081/api/users/register', {
        email,
        password,
        userType
      })

      navigate('/login')

    } catch (err) {
      setError('This email is already in use')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Navbar */}
      <nav className="px-8 py-5">
        <span
          onClick={() => navigate('/')}
          className="text-xl font-bold tracking-tight cursor-pointer"
        >
          Flash<span className="text-blue-500">Work</span>
        </span>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">

          {/* Pasul 1 — alege rolul */}
          {step === 1 && (
            <div>
              <h1 className="text-2xl font-bold mb-2">Join FlashWork</h1>
              <p className="text-gray-400 text-sm mb-8">
                Already have an account?{' '}
                <span
                  onClick={() => navigate('/login')}
                  className="text-blue-500 hover:text-blue-400 cursor-pointer"
                >
                  Sign in
                </span>
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleRoleSelect('WORKER')}
                  className="w-full p-5 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-blue-500 rounded-xl text-left transition-all"
                >
                  <p className="font-semibold mb-1">Join as a Worker</p>
                  <p className="text-gray-400 text-sm">
                    Find flexible shifts and get hired fast
                  </p>
                </button>

                <button
                  onClick={() => handleRoleSelect('EMPLOYER')}
                  className="w-full p-5 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-blue-500 rounded-xl text-left transition-all"
                >
                  <p className="font-semibold mb-1">Join as an Employer</p>
                  <p className="text-gray-400 text-sm">
                    Post shifts and hire workers same day
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Pasul 2 — formular */}
          {step === 2 && (
            <div>
              <button
                onClick={() => setStep(1)}
                className="text-gray-400 hover:text-white text-sm mb-6 flex items-center gap-1 transition-colors"
              >
                ← Back
              </button>

              <h1 className="text-2xl font-bold mb-2">
                {userType === 'WORKER' ? 'Find work' : 'Hire workers'}
              </h1>
              <p className="text-gray-400 text-sm mb-8">
                Creating a{' '}
                <span className="text-blue-500">
                  {userType === 'WORKER' ? 'Worker' : 'Employer'}
                </span>{' '}
                account
              </p>

              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-400">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-400">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg font-medium text-sm transition-colors"
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default RegisterPage