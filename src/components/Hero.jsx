import { useNavigate } from 'react-router-dom'

function Hero() {
  const navigate = useNavigate()

  return (
    <section className="flex flex-col items-center justify-center text-center px-4 py-28">
      <span className="text-blue-500 text-sm font-medium tracking-widest uppercase mb-4">
        Find work. Fast.
      </span>

      <h1 className="text-5xl font-bold max-w-2xl leading-tight mb-6">
        The fastest way to find flexible work
      </h1>

      <p className="text-gray-400 text-lg max-w-lg mb-10">
        Browse open shifts, apply instantly, and get hired the same day.
        No resume needed.
      </p>

      <div className="flex gap-4">
        <button
          onClick={() => navigate('/register')}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
        >
          Find work now
        </button>
        <button
          onClick={() => navigate('/register')}
          className="px-6 py-3 border border-gray-700 hover:border-gray-500 rounded-lg font-medium text-gray-300 hover:text-white transition-colors"
        >
          Post a shift
        </button>
      </div>
    </section>
  )
}

export default Hero