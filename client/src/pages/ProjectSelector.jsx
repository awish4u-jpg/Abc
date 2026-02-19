import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function ProjectSelector() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    setError(null);
    api.getProjects()
      .then(setProjects)
      .catch((err) => setError(err.message || 'Failed to load projects'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <div className="min-h-screen bg-[#F5F0EB]">
      <div className="h-1 bg-[#C5A572]" />
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Logo */}
        <div className="text-center mb-12">
          <h1
            className="text-4xl font-bold text-gray-900 mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Layer 1<span className="text-[#C5A572]">.</span>
          </h1>
          <p className="text-xs uppercase tracking-[0.25em] text-gray-400 font-medium">
            Interactive Technology Presenter
          </p>
          <a
            href="/admin"
            className="inline-block mt-4 text-xs text-[#C5A572] hover:text-[#B8975F] transition-colors font-medium"
          >
            Admin Panel &rarr;
          </a>
        </div>

        {/* Projects grid */}
        {error ? (
          <div className="text-center py-12 slide-in">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 mb-3">{error}</p>
            <button onClick={load} className="px-4 py-2 rounded-lg bg-[#C5A572] text-white text-sm font-medium hover:bg-[#B8975F] transition-colors">
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-[#E8E0D4] overflow-hidden">
                <div className="h-1 shimmer-row" />
                <div className="p-5 space-y-3">
                  <div className="h-5 w-32 rounded shimmer-row" />
                  <div className="h-3 w-full rounded shimmer-row" />
                  <div className="h-2 w-16 rounded shimmer-row mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 slide-in">
            <div className="w-16 h-16 rounded-full bg-[#C5A572]/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#C5A572]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 mb-1 font-medium">No projects yet</p>
            <p className="text-sm text-gray-400 mb-4">Create a project in the Admin Panel to get started.</p>
            <a href="/admin" className="px-5 py-2 rounded-lg bg-[#C5A572] text-white text-sm font-medium hover:bg-[#B8975F] transition-colors inline-block">
              Open Admin Panel
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 slide-in">
            {projects.map((proj) => (
              <button
                key={proj.id}
                onClick={() => navigate(`/present/${proj.id}`)}
                className="text-left bg-white rounded-lg border border-[#E8E0D4] overflow-hidden card-hover group"
              >
                <div className="h-1 bg-[#C5A572]" />
                <div className="p-5">
                  <h3
                    className="font-semibold text-gray-900 mb-1 group-hover:text-[#C5A572] transition-colors"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {proj.name}
                  </h3>
                  {proj.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">{proj.description}</p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-3">
                    {new Date(proj.created_at).toLocaleDateString()}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 py-3 text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Layer 1</p>
      </div>
    </div>
  );
}
