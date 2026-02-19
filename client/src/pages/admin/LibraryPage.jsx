import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

const COE_CODES = ['NET', 'SEC', 'DATA', 'CLOUD', 'IOT', 'AV', 'ACOU', 'LIGHT', 'CONTROL'];
const CATEGORIES = ['Infrastructure', 'Software', 'Hardware', 'Platform', 'Service'];

export default function LibraryPage() {
  const [techs, setTechs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showImport, setShowImport] = useState(null);
  const [projects, setProjects] = useState([]);
  const [importProjectId, setImportProjectId] = useState('');
  const [importCoeId, setImportCoeId] = useState('');
  const [projectCoes, setProjectCoes] = useState([]);
  const [selectedForBulk, setSelectedForBulk] = useState(new Set());

  const [form, setForm] = useState({
    name: '', description: '', vendor: '', coe_code: '', category: '',
    vision: '', why_it_works: '', key_points: '', certifications: '',
  });

  const load = () => {
    setLoading(true);
    const params = {};
    if (filterCode) params.coe_code = filterCode;
    if (filterCat) params.category = filterCat;
    if (search) params.q = search;
    api.getLibrary(params)
      .then(setTechs)
      .catch(() => setTechs([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filterCode, filterCat, search]);
  useEffect(() => { api.getProjects({ is_template: '0' }).then(setProjects).catch(() => {}); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', vendor: '', coe_code: '', category: '', vision: '', why_it_works: '', key_points: '', certifications: '' });
    setShowForm(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({
      name: t.name, description: t.description || '', vendor: t.vendor || '',
      coe_code: t.coe_code || '', category: t.category || '',
      vision: t.vision || '', why_it_works: t.why_it_works || '',
      key_points: t.key_points || '', certifications: t.certifications || '',
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editing) {
      await api.updateLibraryTech(editing.id, form);
    } else {
      await api.createLibraryTech(form);
    }
    setShowForm(false);
    load();
  };

  const handleDelete = async (id) => {
    await api.deleteLibraryTech(id);
    setTechs((prev) => prev.filter((t) => t.id !== id));
  };

  const openImport = async (t) => {
    setShowImport(t);
    setImportProjectId('');
    setImportCoeId('');
    setProjectCoes([]);
  };

  const handleImportProjectChange = async (projId) => {
    setImportProjectId(projId);
    if (projId) {
      const coes = await api.getCoes({ project_id: projId });
      setProjectCoes(coes);
    } else {
      setProjectCoes([]);
    }
  };

  const handleImport = async () => {
    if (!importProjectId) return;
    await api.importLibraryTech(showImport.id, {
      project_id: Number(importProjectId),
      coe_id: importCoeId ? Number(importCoeId) : undefined,
    });
    setShowImport(null);
  };

  const handleBulkImport = async () => {
    if (!importProjectId || selectedForBulk.size === 0) return;
    await api.bulkImportLibrary({
      project_id: Number(importProjectId),
      coe_id: importCoeId ? Number(importCoeId) : undefined,
      library_ids: [...selectedForBulk],
    });
    setSelectedForBulk(new Set());
    setShowImport(null);
  };

  const toggleBulk = (id) => {
    setSelectedForBulk((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div>
      <div className="px-8 py-5 bg-white border-b border-[#E8E0D4] flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
          Master Technology Library
        </h2>
        <div className="flex items-center gap-3">
          {selectedForBulk.size > 0 && (
            <button
              onClick={() => { setShowImport({ bulk: true }); setImportProjectId(''); setImportCoeId(''); setProjectCoes([]); }}
              className="px-4 py-2 rounded-lg bg-[#8B7355] text-white text-sm font-medium hover:bg-[#7A6548]"
            >
              Import {selectedForBulk.size} to Project
            </button>
          )}
          <button onClick={openCreate} className="px-5 py-2 rounded-lg bg-[#C5A572] text-white text-sm font-medium hover:bg-[#B8975F] transition-colors">
            Add Technology
          </button>
        </div>
      </div>

      <div className="p-8">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search library..."
            className="flex-1 max-w-sm px-4 py-2 rounded-lg border border-[#E8E0D4] text-sm bg-white focus:outline-none focus:border-[#C5A572]"
          />
          <select
            value={filterCode}
            onChange={(e) => setFilterCode(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm bg-white focus:outline-none focus:border-[#C5A572]"
          >
            <option value="">All COEs</option>
            {COE_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm bg-white focus:outline-none focus:border-[#C5A572]"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Info banner */}
        <div className="mb-6 px-4 py-3 rounded-lg bg-[#C5A572]/10 border border-[#C5A572]/20">
          <p className="text-xs text-[#8B7355]">
            The Master Library stores centralized technology definitions. Importing into a project creates a snapshot copy &mdash; future library updates will not affect existing project assignments.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-[#C5A572] border-t-transparent animate-spin" />
          </div>
        ) : techs.length === 0 ? (
          <p className="text-center text-gray-400 py-12">
            {search || filterCode || filterCat ? 'No technologies match your filters' : 'No technologies in the library. Add one to get started.'}
          </p>
        ) : (
          <div className="bg-white rounded-lg border border-[#E8E0D4] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8E0D4] bg-[#FAFAF7]">
                  <th className="w-8 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedForBulk.size === techs.length && techs.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedForBulk(new Set(techs.map((t) => t.id)));
                        else setSelectedForBulk(new Set());
                      }}
                      className="accent-[#C5A572]"
                    />
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Vendor</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">COE</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Category</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Certifications</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {techs.map((t, idx) => (
                  <tr key={t.id} className={`border-b border-[#E8E0D4] ${idx % 2 === 0 ? 'bg-[#F9F6F2]' : 'bg-white'}`}>
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedForBulk.has(t.id)}
                        onChange={() => toggleBulk(t.id)}
                        className="accent-[#C5A572]"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-semibold text-gray-900">{t.name}</span>
                      {t.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{t.description}</p>}
                    </td>
                    <td className="px-5 py-3 text-gray-500">{t.vendor || '—'}</td>
                    <td className="px-5 py-3">
                      {t.coe_code ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#C5A572]/10 text-[#8B7355] text-xs uppercase tracking-wider font-medium">{t.coe_code}</span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{t.category || '—'}</td>
                    <td className="px-5 py-3">
                      {t.certifications ? (
                        <div className="flex flex-wrap gap-1">
                          {t.certifications.split(',').slice(0, 3).map((c, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px]">{c.trim()}</span>
                          ))}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openImport(t)} className="text-xs text-[#C5A572] hover:text-[#B8975F] font-medium">Import</button>
                        <button onClick={() => openEdit(t)} className="text-xs text-gray-400 hover:text-[#C5A572]">Edit</button>
                        <button onClick={() => handleDelete(t.id)} className="text-xs text-gray-400 hover:text-red-500">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <form onSubmit={handleSave} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
              {editing ? 'Edit Library Technology' : 'Add to Library'}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Vendor</label>
                <input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">COE Code</label>
                <select value={form.coe_code} onChange={(e) => setForm({ ...form, coe_code: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572] bg-white">
                  <option value="">Select...</option>
                  {COE_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572] bg-white">
                  <option value="">Select...</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Vision</label>
              <textarea value={form.vision} onChange={(e) => setForm({ ...form, vision: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Why It Works</label>
              <textarea value={form.why_it_works} onChange={(e) => setForm({ ...form, why_it_works: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Key Points (comma-separated)</label>
              <input value={form.key_points} onChange={(e) => setForm({ ...form, key_points: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Certifications (comma-separated)</label>
              <input value={form.certifications} onChange={(e) => setForm({ ...form, certifications: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572]" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
              <button type="submit" className="px-6 py-2 rounded-lg bg-[#C5A572] text-white text-sm font-medium hover:bg-[#B8975F]">Save</button>
            </div>
          </form>
        </div>
      )}

      {/* Import to Project Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowImport(null); }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
              {showImport.bulk ? `Import ${selectedForBulk.size} Technologies` : `Import: ${showImport.name}`}
            </h3>
            <p className="text-sm text-gray-500">
              A snapshot copy will be created in the target project. Future library changes won't affect this copy.
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Target Project *</label>
              <select
                value={importProjectId}
                onChange={(e) => handleImportProjectChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm bg-white focus:outline-none focus:border-[#C5A572]"
              >
                <option value="">Select project...</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {projectCoes.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Assign to COE (optional)</label>
                <select
                  value={importCoeId}
                  onChange={(e) => setImportCoeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm bg-white focus:outline-none focus:border-[#C5A572]"
                >
                  <option value="">No COE</option>
                  {projectCoes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowImport(null)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
              <button
                onClick={showImport.bulk ? handleBulkImport : handleImport}
                disabled={!importProjectId}
                className="px-6 py-2 rounded-lg bg-[#C5A572] text-white text-sm font-medium hover:bg-[#B8975F] disabled:opacity-50"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
