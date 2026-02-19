import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function ProjectSelector() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getProjects()
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

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
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-[#C5A572] border-t-transparent animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No projects yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((proj) => (
              <button
                key={proj.id}
                onClick={() => navigate(`/present/${proj.id}`)}
                className="text-left bg-white rounded-lg border border-[#E8E0D4] overflow-hidden hover:shadow-lg hover:shadow-[#C5A572]/10 transition-all duration-200 group"
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
    </div>
  );
}
