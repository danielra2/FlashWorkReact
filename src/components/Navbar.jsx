import { useNavigate } from 'react-router-dom'

function Navbar() {
  const navigate = useNavigate()

  return (
    <nav className="flex items-center justify-between px-8 py-5">
      <span
        onClick={() => navigate('/')}
        className="text-xl font-bold tracking-tight cursor-pointer"
      >
        Flash<span className="text-blue-500">Work</span>
      </span>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/login')}
          className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          Log in
        </button>
        <button
          onClick={() => navigate('/register')}
          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          Sign up
        </button>
      </div>
    </nav>
  )
}

export default Navbar