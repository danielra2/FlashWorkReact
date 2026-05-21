import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axios.post('http://localhost:8081/api/users/login', {
        email,
        password
      })

      const { token, userType, userId } = response.data
      login({ token, userType, userId })

      if (userType === 'WORKER') {
        navigate('/worker')
      } else {
        navigate('/employer')
      }

    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

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

          <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
          <p className="text-gray-400 text-sm mb-8">
            Don't have an account?{' '}
            <span
              onClick={() => navigate('/register')}
              className="text-blue-500 hover:text-blue-400 cursor-pointer"
            >
              Sign up
            </span>
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">

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
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginPage