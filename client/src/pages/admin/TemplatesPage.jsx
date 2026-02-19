import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

const TEMPLATE_TYPES = ['Residential', 'Hospitality', 'Healthcare', 'Airport', 'Institutional', 'Corporate'];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showClone, setShowClone] = useState(null);
  const [cloneForm, setCloneForm] = useState({ name: '', client: '', type: '', asTemplate: false });

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.getProjects({ is_template: '1' }),
      api.getProjects({ is_template: '0' }),
    ])
      .then(([tmpl, proj]) => { setTemplates(tmpl); setProjects(proj); })
      .catch((err) => setError(err.message || 'Failed to load templates'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const [createFrom, setCreateFrom] = useState('');

  const handleCreateFromProject = async () => {
    if (!createFrom) return;
    await api.cloneProject(createFrom, { is_template: true, name: '' });
    setShowCreate(false);
    setCreateFrom('');
    load();
  };

  const handleClone = async (e) => {
    e.preventDefault();
    await api.cloneProject(showClone.id, {
      name: cloneForm.name || undefined,
      client: cloneForm.client || undefined,
      type: cloneForm.type || undefined,
      is_template: cloneForm.asTemplate,
    });
    setShowClone(null);
    load();
  };

  const handleDelete = async (id) => {
    await api.deleteProject(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div>
      <div className="px-8 py-5 bg-white border-b border-[#E8E0D4] flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
          Templates
        </h2>
        <button
          onClick={() => setShowCreate(true)}
          className="px-5 py-2 rounded-lg bg-[#C5A572] text-white text-sm font-medium hover:bg-[#B8975F] transition-colors"
        >
          Create Template from Project
        </button>
      </div>

      <div className="p-8">
        {/* Template type pills */}
        <div className="flex gap-2 mb-6">
          {TEMPLATE_TYPES.map((t) => {
            const count = templates.filter((tmpl) => tmpl.type === t).length;
            return (
              <span key={t} className="px-3 py-1.5 rounded-full border border-[#E8E0D4] bg-white text-xs text-gray-500">
                {t} <span className="text-[#C5A572] font-semibold">{count}</span>
              </span>
            );
          })}
        </div>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-lg border border-[#E8E0D4] overflow-hidden">
                <div className="h-1 shimmer-row" />
                <div className="p-5 space-y-3">
                  <div className="h-5 w-36 rounded shimmer-row" />
                  <div className="h-3 w-full rounded shimmer-row" />
                  <div className="h-3 w-20 rounded shimmer-row" />
                  <div className="h-8 w-28 rounded shimmer-row" />
                </div>
              </div>
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-16 slide-in">
            <div className="w-16 h-16 rounded-full bg-[#C5A572]/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#C5A572]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
            </div>
            <p className="text-gray-500 mb-1 font-medium">No templates yet</p>
            <p className="text-sm text-gray-400 mb-4">Create one from an existing project.</p>
            <button onClick={() => setShowCreate(true)} className="px-5 py-2 rounded-lg bg-[#C5A572] text-white text-sm font-medium hover:bg-[#B8975F] transition-colors">
              Create Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 slide-in">
            {templates.map((t) => (
              <div key={t.id} className="bg-white rounded-lg border border-[#E8E0D4] overflow-hidden hover:shadow-md transition-shadow card-hover">
                <div className="h-1 bg-[#C5A572]" />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3
                      className="font-semibold text-gray-900"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {t.name}
                    </h3>
                    {t.type && (
                      <span className="px-2 py-0.5 rounded-full bg-[#C5A572]/10 text-[#8B7355] text-xs shrink-0">
                        {t.type}
                      </span>
                    )}
                  </div>
                  {t.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{t.description}</p>
                  )}
                  <p className="text-[10px] text-gray-400 mb-3">
                    Created {new Date(t.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setShowClone(t); setCloneForm({ name: '', client: '', type: t.type || '', asTemplate: false }); }}
                      className="px-3 py-1.5 rounded bg-[#C5A572] text-white text-xs font-medium hover:bg-[#B8975F] transition-colors"
                    >
                      Clone Template
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create from project modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm fade-in" onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4 scale-in">
            <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
              Create Template from Project
            </h3>
            <p className="text-sm text-gray-500">Select a project to use as the base for a new template. All areas, COEs, and technologies will be copied.</p>
            <select
              value={createFrom}
              onChange={(e) => setCreateFrom(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm bg-white focus:outline-none focus:border-[#C5A572]"
            >
              <option value="">Select project...</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
              <button
                onClick={handleCreateFromProject}
                disabled={!createFrom}
                className="px-6 py-2 rounded-lg bg-[#C5A572] text-white text-sm font-medium hover:bg-[#B8975F] disabled:opacity-50"
              >
                Create Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clone template modal */}
      {showClone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm fade-in" onClick={(e) => { if (e.target === e.currentTarget) setShowClone(null); }}>
          <form onSubmit={handleClone} className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4 scale-in">
            <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
              Clone: {showClone.name}
            </h3>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">New Name</label>
              <input
                value={cloneForm.name}
                onChange={(e) => setCloneForm({ ...cloneForm, name: e.target.value })}
                placeholder={`${showClone.name} (Copy)`}
                className="w-full px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Client</label>
              <input value={cloneForm.client} onChange={(e) => setCloneForm({ ...cloneForm, client: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Type</label>
              <select value={cloneForm.type} onChange={(e) => setCloneForm({ ...cloneForm, type: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572] bg-white">
                <option value="">Select type...</option>
                {TEMPLATE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={cloneForm.asTemplate} onChange={(e) => setCloneForm({ ...cloneForm, asTemplate: e.target.checked })} className="accent-[#C5A572]" />
              <span className="text-sm text-gray-600">Clone as template (instead of project)</span>
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowClone(null)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
              <button type="submit" className="px-6 py-2 rounded-lg bg-[#C5A572] text-white text-sm font-medium hover:bg-[#B8975F]">Clone</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
