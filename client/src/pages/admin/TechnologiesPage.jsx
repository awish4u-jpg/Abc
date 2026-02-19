import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

export default function TechnologiesPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [coes, setCoes] = useState([]);
  const [technologies, setTechnologies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getProjects().then(setProjects).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedProject) { setTechnologies([]); setCoes([]); return; }
    setLoading(true);
    Promise.all([
      api.getTechnologies({ project_id: selectedProject }),
      api.getCoes({ project_id: selectedProject }),
    ])
      .then(([techs, c]) => { setTechnologies(techs); setCoes(c); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedProject]);

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
          className="px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm bg-white focus:outline-none focus:border-[#C5A572]"
        >
          <option value="">Select project...</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {selectedProject && (
        <div className="px-8 pt-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search technologies..."
            className="w-full max-w-sm px-4 py-2 rounded-lg border border-[#E8E0D4] text-sm bg-white focus:outline-none focus:border-[#C5A572]"
          />
        </div>
      )}

      <div className="p-8">
        {!selectedProject ? (
          <p className="text-center text-gray-400 py-12">Select a project to view technologies</p>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-[#C5A572] border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-12">
            {search ? 'No technologies match your search' : 'No technologies yet. Add them via the COE Manager.'}
          </p>
        ) : (
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
                {filtered.map((t, idx) => (
                  <tr key={t.id} className={`border-b border-[#E8E0D4] ${idx % 2 === 0 ? 'bg-[#F9F6F2]' : 'bg-white'}`}>
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
