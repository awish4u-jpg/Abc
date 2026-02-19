import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

const PROJECT_TYPES = ['Residential', 'Hospitality', 'Healthcare', 'Airport', 'Institutional', 'Corporate'];

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedAreas, setExpandedAreas] = useState([]);
  const [expandedSessions, setExpandedSessions] = useState([]);

  // Form state
  const [form, setForm] = useState({ name: '', description: '', client: '', type: '' });
  // Area form
  const [areaForm, setAreaForm] = useState({ name: '', description: '' });

  const load = () => {
    setLoading(true);
    api.getProjects({ is_template: '0' })
      .then(setProjects)
      .catch(() => setProjects([]))
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
    // Update sort_order for both
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
        <button onClick={openCreate} className="px-5 py-2 rounded-lg bg-[#C5A572] text-white text-sm font-medium hover:bg-[#B8975F] transition-colors">
          Create New Project
        </button>
      </div>

      <div className="p-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-[#C5A572] border-t-transparent animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No projects yet. Create one to get started.</p>
        ) : (
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
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td colSpan={5} className="p-0">
                      <div>
                        <div className="flex items-center border-b border-[#E8E0D4] hover:bg-[#FAFAF7] transition-colors">
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
                            <button onClick={() => handleDelete(p.id)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Delete</button>
                            <a href={`/present/${p.id}`} className="text-xs text-[#C5A572] hover:text-[#B8975F] transition-colors font-medium">Present</a>
                          </div>
                        </div>

                        {/* Expanded detail */}
                        {expandedId === p.id && (
                          <div className="px-8 py-4 bg-[#FAFAF7] border-b border-[#E8E0D4]">
                            <div className="grid grid-cols-2 gap-8">
                              {/* Areas */}
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

                              {/* Sessions */}
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

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <form onSubmit={handleSave} className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
              {editing ? 'Edit Project' : 'Create New Project'}
            </h3>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Client</label>
              <input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572] bg-white">
                <option value="">Select type...</option>
                {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572]" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              <button type="submit" className="px-6 py-2 rounded-lg bg-[#C5A572] text-white text-sm font-medium hover:bg-[#B8975F]">
                {editing ? 'Save Changes' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
