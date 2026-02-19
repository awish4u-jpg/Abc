import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

export default function COEsPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [coes, setCoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedCoe, setExpandedCoe] = useState(null);

  // COE form
  const [showCoeForm, setShowCoeForm] = useState(false);
  const [editingCoe, setEditingCoe] = useState(null);
  const [coeForm, setCoeForm] = useState({ name: '', description: '', code: '' });

  // Tech form
  const [showTechForm, setShowTechForm] = useState(false);
  const [editingTech, setEditingTech] = useState(null);
  const [techForm, setTechForm] = useState({
    name: '', description: '', vendor: '', vision: '', why_it_works: '',
    key_points: '', certifications: '',
  });

  useEffect(() => {
    api.getProjects().then(setProjects).catch(() => {});
  }, []);

  const loadCoes = (projectId) => {
    if (!projectId) { setCoes([]); setLoading(false); return; }
    setLoading(true);
    api.getCoes({ project_id: projectId })
      .then(setCoes)
      .catch(() => setCoes([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCoes(selectedProject); }, [selectedProject]);

  const expandCoe = async (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    const coe = await api.getCoe(id);
    setExpandedCoe(coe);
  };

  // COE CRUD
  const openCreateCoe = () => {
    setEditingCoe(null);
    setCoeForm({ name: '', description: '', code: '' });
    setShowCoeForm(true);
  };

  const openEditCoe = (c) => {
    setEditingCoe(c);
    setCoeForm({ name: c.name, description: c.description || '', code: c.code || '' });
    setShowCoeForm(true);
  };

  const handleSaveCoe = async (e) => {
    e.preventDefault();
    if (editingCoe) {
      await api.updateCoe(editingCoe.id, coeForm);
    } else {
      await api.createCoe({ ...coeForm, project_id: Number(selectedProject) });
    }
    loadCoes(selectedProject);
    setShowCoeForm(false);
  };

  const handleDeleteCoe = async (id) => {
    await api.deleteCoe(id);
    if (expandedId === id) setExpandedId(null);
    loadCoes(selectedProject);
  };

  // Tech CRUD
  const openCreateTech = () => {
    setEditingTech(null);
    setTechForm({ name: '', description: '', vendor: '', vision: '', why_it_works: '', key_points: '', certifications: '' });
    setShowTechForm(true);
  };

  const openEditTech = (t) => {
    setEditingTech(t);
    setTechForm({
      name: t.name, description: t.description || '', vendor: t.vendor || '',
      vision: t.vision || '', why_it_works: t.why_it_works || '',
      key_points: t.key_points || '', certifications: t.certifications || '',
    });
    setShowTechForm(true);
  };

  const handleSaveTech = async (e) => {
    e.preventDefault();
    if (editingTech) {
      await api.updateTechnology(editingTech.id, { ...techForm, coe_id: expandedId });
    } else {
      await api.createTechnology({ ...techForm, project_id: Number(selectedProject), coe_id: expandedId });
    }
    const coe = await api.getCoe(expandedId);
    setExpandedCoe(coe);
    loadCoes(selectedProject);
    setShowTechForm(false);
  };

  const handleDeleteTech = async (id) => {
    await api.deleteTechnology(id);
    const coe = await api.getCoe(expandedId);
    setExpandedCoe(coe);
    loadCoes(selectedProject);
  };

  return (
    <div>
      <div className="px-8 py-5 bg-white border-b border-[#E8E0D4] flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
          Centers of Excellence
        </h2>
        <div className="flex items-center gap-3">
          <select
            value={selectedProject}
            onChange={(e) => { setSelectedProject(e.target.value); setExpandedId(null); }}
            className="px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm bg-white focus:outline-none focus:border-[#C5A572]"
          >
            <option value="">Select project...</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {selectedProject && (
            <button onClick={openCreateCoe} className="px-5 py-2 rounded-lg bg-[#C5A572] text-white text-sm font-medium hover:bg-[#B8975F] transition-colors">
              Add COE
            </button>
          )}
        </div>
      </div>

      <div className="p-8">
        {!selectedProject ? (
          <p className="text-center text-gray-400 py-12">Select a project to manage its COEs</p>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-[#C5A572] border-t-transparent animate-spin" />
          </div>
        ) : coes.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No COEs yet. Add one to get started.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coes.map((c) => (
              <div key={c.id} className="bg-white rounded-lg border border-[#E8E0D4] overflow-hidden">
                <div className="h-1 bg-[#C5A572]" />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>{c.name}</h3>
                      {c.code && <span className="text-[10px] uppercase tracking-wider text-gray-400">{c.code}</span>}
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#C5A572]/10 text-[#8B7355] text-xs font-medium">
                      {c.tech_count || 0} tech
                    </span>
                  </div>
                  {c.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{c.description}</p>}
                  <div className="flex items-center gap-2">
                    <button onClick={() => expandCoe(c.id)} className="text-xs text-[#C5A572] hover:text-[#B8975F] font-medium">
                      {expandedId === c.id ? 'Collapse' : 'Expand'}
                    </button>
                    <button onClick={() => openEditCoe(c)} className="text-xs text-gray-400 hover:text-[#C5A572]">Edit</button>
                    <button onClick={() => handleDeleteCoe(c.id)} className="text-xs text-gray-400 hover:text-red-500">Delete</button>
                  </div>
                </div>

                {/* Expanded technologies */}
                {expandedId === c.id && expandedCoe && (
                  <div className="border-t border-[#E8E0D4] bg-[#FAFAF7] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Technologies</h4>
                      <button onClick={openCreateTech} className="text-xs text-[#C5A572] hover:text-[#B8975F] font-medium">+ Add</button>
                    </div>
                    {expandedCoe.technologies?.length > 0 ? (
                      <div className="space-y-2">
                        {expandedCoe.technologies.map((t) => (
                          <div key={t.id} className="bg-white rounded border border-[#E8E0D4] px-3 py-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900">{t.name}</span>
                              <div className="flex gap-2">
                                <button onClick={() => openEditTech(t)} className="text-[10px] text-gray-400 hover:text-[#C5A572]">Edit</button>
                                <button onClick={() => handleDeleteTech(t.id)} className="text-[10px] text-gray-400 hover:text-red-500">Del</button>
                              </div>
                            </div>
                            {t.vendor && <p className="text-[10px] text-gray-400">{t.vendor}</p>}
                            {t.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.description}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">No technologies in this COE</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* COE Form Modal */}
      {showCoeForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowCoeForm(false); }}>
          <form onSubmit={handleSaveCoe} className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
              {editingCoe ? 'Edit COE' : 'Add COE'}
            </h3>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Name *</label>
              <input value={coeForm.name} onChange={(e) => setCoeForm({ ...coeForm, name: e.target.value })} required className="w-full px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Code</label>
              <input value={coeForm.code} onChange={(e) => setCoeForm({ ...coeForm, code: e.target.value })} placeholder="e.g. NET, SEC, DATA" className="w-full px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description</label>
              <textarea value={coeForm.description} onChange={(e) => setCoeForm({ ...coeForm, description: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572]" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowCoeForm(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
              <button type="submit" className="px-6 py-2 rounded-lg bg-[#C5A572] text-white text-sm font-medium hover:bg-[#B8975F]">Save</button>
            </div>
          </form>
        </div>
      )}

      {/* Technology Form Modal */}
      {showTechForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowTechForm(false); }}>
          <form onSubmit={handleSaveTech} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
              {editingTech ? 'Edit Technology' : 'Add Technology'}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Name *</label>
                <input value={techForm.name} onChange={(e) => setTechForm({ ...techForm, name: e.target.value })} required className="w-full px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Vendor</label>
                <input value={techForm.vendor} onChange={(e) => setTechForm({ ...techForm, vendor: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572]" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description</label>
              <textarea value={techForm.description} onChange={(e) => setTechForm({ ...techForm, description: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Vision</label>
              <textarea value={techForm.vision} onChange={(e) => setTechForm({ ...techForm, vision: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Why It Works</label>
              <textarea value={techForm.why_it_works} onChange={(e) => setTechForm({ ...techForm, why_it_works: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Key Points (comma-separated)</label>
              <input value={techForm.key_points} onChange={(e) => setTechForm({ ...techForm, key_points: e.target.value })} placeholder="Point 1, Point 2, Point 3" className="w-full px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Certifications (comma-separated tags)</label>
              <input value={techForm.certifications} onChange={(e) => setTechForm({ ...techForm, certifications: e.target.value })} placeholder="ISO 27001, SOC 2, FedRAMP" className="w-full px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572]" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowTechForm(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
              <button type="submit" className="px-6 py-2 rounded-lg bg-[#C5A572] text-white text-sm font-medium hover:bg-[#B8975F]">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
