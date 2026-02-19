import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

const PROJECT_TYPES = ['Residential', 'Hospitality', 'Healthcare', 'Airport', 'Institutional', 'Corporate'];

function ShimmerRows({ count = 5 }) {
  return Array.from({ length: count }).map((_, i) => (
    <tr key={i} className="border-b border-[#E8E0D4]">
      <td className="px-5 py-4"><div className="h-4 w-32 rounded shimmer-row" /></td>
      <td className="px-5 py-4"><div className="h-4 w-20 rounded shimmer-row" /></td>
      <td className="px-5 py-4"><div className="h-4 w-16 rounded shimmer-row" /></td>
      <td className="px-5 py-4"><div className="h-3 w-20 rounded shimmer-row" /></td>
      <td className="px-5 py-4 text-right"><div className="h-4 w-24 rounded shimmer-row ml-auto" /></td>
    </tr>
  ));
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedAreas, setExpandedAreas] = useState([]);
  const [expandedSessions, setExpandedSessions] = useState([]);

  const [form, setForm] = useState({ name: '', description: '', client: '', type: '' });
  const [areaForm, setAreaForm] = useState({ name: '', description: '' });

  const load = () => {
    setLoading(true);
    setError(null);
    api.getProjects({ is_template: '0' })
      .then(setProjects)
      .catch((err) => setError(err.message || 'Failed to load projects'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const loadExpanded = async (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    const [areas, sessions] = await Promise.all([
      api.getProjectAreas(id),
      api.getProjectSessions(id),
    ]);
    setExpandedAreas(areas);
    setExpandedSessions(sessions);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', client: '', type: '' });
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description || '', client: p.client || '', type: p.type || '' });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editing) {
      const updated = await api.updateProject(editing.id, form);
      setProjects((prev) => prev.map((p) => (p.id === editing.id ? updated : p)));
    } else {
      const created = await api.createProject(form);
      setProjects((prev) => [created, ...prev]);
    }
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    await api.deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const handleClone = async (id) => {
    const cloned = await api.cloneProject(id);
    setProjects((prev) => [cloned, ...prev]);
  };

  const handleSaveAsTemplate = async (id) => {
    await api.cloneProject(id, { is_template: true });
  };

  const handleAddArea = async (e, projectId) => {
    e.preventDefault();
    const area = await api.createProjectArea(projectId, { ...areaForm, sort_order: expandedAreas.length });
    setExpandedAreas((prev) => [...prev, area]);
    setAreaForm({ name: '', description: '' });
  };

  const handleDeleteArea = async (areaId) => {
    await api.deleteArea(areaId);
    setExpandedAreas((prev) => prev.filter((a) => a.id !== areaId));
  };

  const handleMoveArea = async (idx, dir) => {
    const newAreas = [...expandedAreas];
    const target = idx + dir;
    if (target < 0 || target >= newAreas.length) return;
    [newAreas[idx], newAreas[target]] = [newAreas[target], newAreas[idx]];
    setExpandedAreas(newAreas);
    await Promise.all([
      api.updateArea(newAreas[idx].id, { ...newAreas[idx], sort_order: idx }),
      api.updateArea(newAreas[target].id, { ...newAreas[target], sort_order: target }),
    ]);
  };

  return (
    <div>
      {/* Top bar */}
      <div className="px-8 py-5 bg-white border-b border-[#E8E0D4] flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
          Projects
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/wizard')}
            className="px-5 py-2 rounded-lg border border-[#C5A572] text-[#C5A572] text-sm font-medium hover:bg-[#C5A572]/10 transition-colors"
          >
            New Project Wizard
          </button>
          <button onClick={openCreate} className="px-5 py-2 rounded-lg bg-[#C5A572] text-white text-sm font-medium hover:bg-[#B8975F] transition-colors">
            Create New Project
          </button>
        </div>
      </div>

      <div className="p-8">
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
          <div className="bg-white rounded-lg border border-[#E8E0D4] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8E0D4] bg-[#FAFAF7]">
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Client</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Type</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Created</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody><ShimmerRows /></tbody>
            </table>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 slide-in">
            <div className="w-16 h-16 rounded-full bg-[#C5A572]/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#C5A572]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 mb-1 font-medium">No projects yet</p>
            <p className="text-sm text-gray-400 mb-4">Create your first project to get started.</p>
            <button onClick={openCreate} className="px-5 py-2 rounded-lg bg-[#C5A572] text-white text-sm font-medium hover:bg-[#B8975F] transition-colors">
              Create Project
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-[#E8E0D4] overflow-hidden slide-in">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8E0D4] bg-[#FAFAF7]">
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Client</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Type</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Created</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td colSpan={5} className="p-0">
                      <div>
                        <div className="flex items-center border-b border-[#E8E0D4] hover:bg-[#FAFAF7] transition-colors duration-200">
                          <button onClick={() => loadExpanded(p.id)} className="flex-1 flex items-center text-left">
                            <td className="px-5 py-3 font-semibold text-gray-900">{p.name}</td>
                            <td className="px-5 py-3 text-gray-500">{p.client || '—'}</td>
                            <td className="px-5 py-3">
                              {p.type ? (
                                <span className="px-2 py-0.5 rounded-full bg-[#C5A572]/10 text-[#8B7355] text-xs">{p.type}</span>
                              ) : '—'}
                            </td>
                            <td className="px-5 py-3 text-gray-400 text-xs">{new Date(p.created_at).toLocaleDateString()}</td>
                          </button>
                          <div className="px-5 py-3 flex items-center gap-2 shrink-0">
                            <button onClick={() => openEdit(p)} className="text-xs text-gray-400 hover:text-[#C5A572] transition-colors">Edit</button>
                            <button onClick={() => handleClone(p.id)} className="text-xs text-gray-400 hover:text-[#C5A572] transition-colors">Clone</button>
                            <button onClick={() => handleSaveAsTemplate(p.id)} className="text-xs text-gray-400 hover:text-[#C5A572] transition-colors">Save as Template</button>
                            <button onClick={() => handleDelete(p.id)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Delete</button>
                            <a href={`/present/${p.id}`} className="text-xs text-[#C5A572] hover:text-[#B8975F] transition-colors font-medium">Present</a>
                          </div>
                        </div>

                        {expandedId === p.id && (
                          <div className="px-8 py-4 bg-[#FAFAF7] border-b border-[#E8E0D4] slide-in">
                            <div className="grid grid-cols-2 gap-8">
                              <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                                  Areas ({expandedAreas.length})
                                </h4>
                                <div className="space-y-1 mb-3">
                                  {expandedAreas.map((a, idx) => (
                                    <div key={a.id} className="flex items-center gap-2 bg-white rounded px-3 py-2 border border-[#E8E0D4]">
                                      <div className="flex flex-col gap-0.5">
                                        <button onClick={() => handleMoveArea(idx, -1)} disabled={idx === 0} className="text-gray-400 hover:text-[#C5A572] disabled:opacity-30 text-[10px] leading-none">&uarr;</button>
                                        <button onClick={() => handleMoveArea(idx, 1)} disabled={idx === expandedAreas.length - 1} className="text-gray-400 hover:text-[#C5A572] disabled:opacity-30 text-[10px] leading-none">&darr;</button>
                                      </div>
                                      <span className={`w-2 h-2 rounded-full shrink-0 ${a.reviewed ? 'bg-[#C5A572]' : 'bg-gray-300'}`} />
                                      <span className="text-sm flex-1">{a.name}</span>
                                      <button onClick={() => handleDeleteArea(a.id)} className="text-xs text-gray-400 hover:text-red-500">&times;</button>
                                    </div>
                                  ))}
                                </div>
                                <form onSubmit={(e) => handleAddArea(e, p.id)} className="flex gap-2">
                                  <input
                                    value={areaForm.name}
                                    onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                                    placeholder="New area name..."
                                    required
                                    className="flex-1 px-3 py-1.5 rounded border border-[#E8E0D4] text-sm bg-white focus:outline-none focus:border-[#C5A572]"
                                  />
                                  <button type="submit" className="px-3 py-1.5 rounded bg-[#C5A572] text-white text-xs font-medium hover:bg-[#B8975F]">Add</button>
                                </form>
                              </div>

                              <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                                  Sessions ({expandedSessions.length})
                                </h4>
                                {expandedSessions.length === 0 ? (
                                  <p className="text-xs text-gray-400">No sessions yet</p>
                                ) : (
                                  <div className="space-y-1">
                                    {expandedSessions.slice(0, 5).map((s) => (
                                      <div key={s.id} className="flex items-center gap-2 bg-white rounded px-3 py-2 border border-[#E8E0D4]">
                                        <span className={`w-2 h-2 rounded-full ${s.status === 'active' ? 'bg-green-400' : s.status === 'completed' ? 'bg-[#C5A572]' : 'bg-gray-300'}`} />
                                        <span className="text-sm flex-1 truncate">{s.name}</span>
                                        <span className="text-[10px] text-gray-400">{s.status}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm fade-in" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <form onSubmit={handleSave} className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4 scale-in">
            <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
              {editing ? 'Edit Project' : 'Create New Project'}
            </h3>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Client</label>
              <input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572] bg-white transition-colors">
                <option value="">Select type...</option>
                {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572] transition-colors" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
              <button type="submit" className="px-6 py-2 rounded-lg bg-[#C5A572] text-white text-sm font-medium hover:bg-[#B8975F] transition-colors">
                {editing ? 'Save Changes' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
