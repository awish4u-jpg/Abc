import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

export default function TechnologiesPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [coes, setCoes] = useState([]);
  const [technologies, setTechnologies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getProjects().then(setProjects).catch(() => {});
  }, []);

  const loadTechnologies = () => {
    if (!selectedProject) { setTechnologies([]); setCoes([]); return; }
    setLoading(true);
    setError(null);
    Promise.all([
      api.getTechnologies({ project_id: selectedProject }),
      api.getCoes({ project_id: selectedProject }),
    ])
      .then(([techs, c]) => { setTechnologies(techs); setCoes(c); })
      .catch((err) => setError(err.message || 'Failed to load technologies'))
      .finally(() => setLoading(false));
  };

  useEffect(loadTechnologies, [selectedProject]);

  const filtered = technologies.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.name.toLowerCase().includes(q) || (t.vendor || '').toLowerCase().includes(q) || (t.coe_name || '').toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="px-8 py-5 bg-white border-b border-[#E8E0D4] flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
          Technologies
        </h2>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm bg-white focus:outline-none focus:border-[#C5A572] transition-colors"
        >
          <option value="">Select project...</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {selectedProject && (
        <div className="px-8 pt-4 fade-in">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search technologies..."
            className="w-full max-w-sm px-4 py-2 rounded-lg border border-[#E8E0D4] text-sm bg-white focus:outline-none focus:border-[#C5A572] transition-colors"
          />
        </div>
      )}

      <div className="p-8">
        {!selectedProject ? (
          <div className="text-center py-16 slide-in">
            <div className="w-16 h-16 rounded-full bg-[#C5A572]/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#C5A572]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 mb-1 font-medium">No project selected</p>
            <p className="text-sm text-gray-400">Select a project to view technologies</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 slide-in">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 mb-3">{error}</p>
            <button onClick={loadTechnologies} className="px-4 py-2 rounded-lg bg-[#C5A572] text-white text-sm font-medium hover:bg-[#B8975F] transition-colors">
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="bg-white rounded-lg border border-[#E8E0D4] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8E0D4] bg-[#FAFAF7]">
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Vendor</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">COE</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Certifications</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody>
                {[1,2,3,4,5].map(i => (
                  <tr key={i} className="border-b border-[#E8E0D4]">
                    <td className="px-5 py-4"><div className="h-4 w-28 rounded shimmer-row" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-20 rounded shimmer-row" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-16 rounded shimmer-row" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-24 rounded shimmer-row" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-32 rounded shimmer-row" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 slide-in">
            <div className="w-16 h-16 rounded-full bg-[#C5A572]/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#C5A572]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 01-1.59.659H9.06a2.25 2.25 0 01-1.59-.659L5 14.5m14 0V17a2 2 0 01-2 2H7a2 2 0 01-2-2v-2.5" />
              </svg>
            </div>
            <p className="text-gray-500 mb-1 font-medium">
              {search ? 'No technologies match your search' : 'No technologies yet'}
            </p>
            <p className="text-sm text-gray-400">
              {search ? 'Try adjusting your search terms.' : 'Add them via the COE Manager.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-[#E8E0D4] overflow-hidden slide-in">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8E0D4] bg-[#FAFAF7]">
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Vendor</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">COE</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Certifications</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, idx) => (
                  <tr key={t.id} className={`border-b border-[#E8E0D4] hover:bg-[#FAFAF7] transition-colors duration-200 ${idx % 2 === 0 ? 'bg-[#F9F6F2]' : 'bg-white'}`}>
                    <td className="px-5 py-3 font-semibold text-gray-900">{t.name}</td>
                    <td className="px-5 py-3 text-gray-500">{t.vendor || '—'}</td>
                    <td className="px-5 py-3">
                      {t.coe_name ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#C5A572]/10 text-[#8B7355] text-xs">{t.coe_name}</span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3">
                      {t.certifications ? (
                        <div className="flex flex-wrap gap-1">
                          {t.certifications.split(',').map((c, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px]">{c.trim()}</span>
                          ))}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs truncate max-w-[200px]">{t.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
