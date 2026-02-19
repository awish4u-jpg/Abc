import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [status, setStatus] = useState(null)

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus('error'))
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Layer1 Presenter
        </h1>
        <p className="text-gray-600 mb-6">
          Full-stack React + Express + SQLite application
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 text-sm">
          <span
            className={`w-2 h-2 rounded-full ${
              status === 'ok' ? 'bg-green-500' : status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
            }`}
          />
          <span className="text-gray-700">
            API: {status ?? 'checking...'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default App
