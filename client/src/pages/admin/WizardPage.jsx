import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

const PROJECT_TYPES = ['Residential', 'Hospitality', 'Healthcare', 'Airport', 'Institutional', 'Corporate'];

const STEPS = [
  { num: 1, label: 'Project Details' },
  { num: 2, label: 'Client Type' },
  { num: 3, label: 'Select COEs' },
  { num: 4, label: 'Review' },
  { num: 5, label: 'Customize' },
  { num: 6, label: 'Visualizations' },
  { num: 7, label: 'Confirm' },
];

export default function WizardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const fileRef = useRef(null);

  // Step 1: Project details
  const [projectForm, setProjectForm] = useState({ name: '', description: '', client: '' });

  // Step 2: Type + template
  const [selectedType, setSelectedType] = useState('');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Step 3: COEs selection
  const [availableCoes, setAvailableCoes] = useState([]);
  const [selectedCoeIds, setSelectedCoeIds] = useState(new Set());

  // Step 4/5: Preview data
  const [previewAreas, setPreviewAreas] = useState([]);
  const [previewTechs, setPreviewTechs] = useState([]);

  // Step 5: Customization edits
  const [customAreas, setCustomAreas] = useState([]);
  const [newAreaName, setNewAreaName] = useState('');

  // Step 6: Uploads
  const [uploads, setUploads] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Step 7: Creating
  const [creating, setCreating] = useState(false);
  const [createdProject, setCreatedProject] = useState(null);

  // Load templates
  useEffect(() => {
    api.getProjects({ is_template: '1' }).then(setTemplates).catch(() => {});
  }, []);

  // When type changes, auto-suggest templates
  const suggestedTemplates = templates.filter((t) => !selectedType || t.type === selectedType);

  // Load template data when selected
  useEffect(() => {
    if (!selectedTemplate) {
      setAvailableCoes([]);
      setPreviewAreas([]);
      setPreviewTechs([]);
      return;
    }
    // Load COEs and areas from the template
    Promise.all([
      api.getCoes({ project_id: selectedTemplate.id }),
      api.getProjectAreas(selectedTemplate.id),
      api.getTechnologies({ project_id: selectedTemplate.id }),
    ]).then(([coes, areas, techs]) => {
      setAvailableCoes(coes);
      setSelectedCoeIds(new Set(coes.map((c) => c.id)));
      setPreviewAreas(areas);
      setPreviewTechs(techs);
      setCustomAreas(areas.map((a) => ({ ...a, included: true })));
    }).catch(() => {});
  }, [selectedTemplate?.id]);

  const handleNext = () => {
    if (step < 7) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleCoe = (id) => {
    setSelectedCoeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const results = [];
    for (const file of files) {
      try {
        const result = await api.uploadFile(file);
        results.push(result);
      } catch (err) {
        console.error('Upload failed:', err.message);
      }
    }
    setUploads((prev) => [...prev, ...results]);
    setUploading(false);
  };

  const removeUpload = (idx) => {
    setUploads((prev) => prev.filter((_, i) => i !== idx));
  };

  const addCustomArea = (e) => {
    e.preventDefault();
    if (!newAreaName.trim()) return;
    setCustomAreas((prev) => [...prev, { id: `new-${Date.now()}`, name: newAreaName.trim(), description: '', included: true, isNew: true }]);
    setNewAreaName('');
  };

  const toggleCustomArea = (idx) => {
    setCustomAreas((prev) => prev.map((a, i) => i === idx ? { ...a, included: !a.included } : a));
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      let project;
      if (selectedTemplate) {
        // Clone from template
        project = await api.cloneProject(selectedTemplate.id, {
          name: projectForm.name,
          client: projectForm.client,
          type: selectedType,
          is_template: false,
        });
      } else {
        // Create blank project
        project = await api.createProject({
          name: projectForm.name,
          description: projectForm.description,
          client: projectForm.client,
          type: selectedType,
        });
        // Create areas
        for (const area of customAreas.filter((a) => a.included)) {
          await api.createProjectArea(project.id, { name: area.name, description: area.description || '' });
        }
      }
      setCreatedProject(project);
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setCreating(false);
    }
  };

  // Filter techs by selected COEs
  const filteredTechs = previewTechs.filter((t) => selectedCoeIds.has(t.coe_id));
  const includedAreas = customAreas.filter((a) => a.included);

  return (
    <div>
      <div className="px-8 py-5 bg-white border-b border-[#E8E0D4]">
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
          New Project Wizard
        </h2>
      </div>

      {/* Gold Progress Bar */}
      <div className="px-8 py-6 bg-white border-b border-[#E8E0D4]">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {STEPS.map((s, idx) => {
            const isActive = s.num === step;
            const isDone = s.num < step;
            return (
              <div key={s.num} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isDone ? 'bg-[#C5A572] text-white'
                      : isActive ? 'bg-[#C5A572] text-white ring-4 ring-[#C5A572]/20'
                      : 'bg-[#E8E0D4] text-gray-400'
                    }`}
                  >
                    {isDone ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : s.num}
                  </div>
                  <span className={`text-[10px] mt-1.5 font-medium ${isActive ? 'text-[#C5A572]' : isDone ? 'text-[#8B7355]' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`w-12 h-0.5 mx-1 transition-colors duration-300 ${s.num < step ? 'bg-[#C5A572]' : 'bg-[#E8E0D4]'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="p-8 max-w-3xl mx-auto">
        {/* Step 1: Project Details */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Project Details</h3>
              <p className="text-sm text-gray-500">Enter the basic information for your new project.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Project Name *</label>
              <input
                value={projectForm.name}
                onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                placeholder="e.g. City Airport Terminal 3"
                className="w-full px-4 py-3 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Client</label>
              <input
                value={projectForm.client}
                onChange={(e) => setProjectForm({ ...projectForm, client: e.target.value })}
                placeholder="e.g. International Airport Authority"
                className="w-full px-4 py-3 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description</label>
              <textarea
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572]"
              />
            </div>
          </div>
        )}

        {/* Step 2: Client Type + Template */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Client Type & Template</h3>
              <p className="text-sm text-gray-500">Select a project type to auto-suggest matching templates.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Project Type</label>
              <div className="grid grid-cols-3 gap-3">
                {PROJECT_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => { setSelectedType(t); setSelectedTemplate(null); }}
                    className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all duration-200 ${
                      selectedType === t
                        ? 'border-[#C5A572] bg-[#C5A572]/10 text-[#8B7355]'
                        : 'border-[#E8E0D4] bg-white text-gray-600 hover:border-[#C5A572]/50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                {selectedType ? `${selectedType} Templates` : 'All Templates'} ({suggestedTemplates.length})
              </label>
              {suggestedTemplates.length === 0 ? (
                <p className="text-sm text-gray-400 py-4">No templates available. You can start from scratch.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {suggestedTemplates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(selectedTemplate?.id === t.id ? null : t)}
                      className={`text-left p-4 rounded-lg border transition-all duration-200 ${
                        selectedTemplate?.id === t.id
                          ? 'border-[#C5A572] bg-[#C5A572]/10 ring-2 ring-[#C5A572]/20'
                          : 'border-[#E8E0D4] bg-white hover:border-[#C5A572]/50'
                      }`}
                    >
                      <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                      {t.type && <span className="text-[10px] uppercase tracking-wider text-[#8B7355]">{t.type}</span>}
                      {t.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.description}</p>}
                    </button>
                  ))}
                </div>
              )}
              {!selectedTemplate && (
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="mt-3 text-xs text-[#C5A572] hover:text-[#B8975F] font-medium"
                >
                  Continue without template (blank project)
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Select COEs */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Select COEs</h3>
              <p className="text-sm text-gray-500">
                {selectedTemplate ? 'Choose which Centers of Excellence to include from the template.' : 'No template selected. COEs can be added after project creation.'}
              </p>
            </div>
            {availableCoes.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {availableCoes.map((coe) => {
                  const isSelected = selectedCoeIds.has(coe.id);
                  const techCount = previewTechs.filter((t) => t.coe_id === coe.id).length;
                  return (
                    <button
                      key={coe.id}
                      onClick={() => toggleCoe(coe.id)}
                      className={`text-left p-4 rounded-lg border transition-all duration-200 ${
                        isSelected
                          ? 'border-[#C5A572] bg-[#C5A572]/10'
                          : 'border-[#E8E0D4] bg-white opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          isSelected ? 'border-[#C5A572] bg-[#C5A572]' : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="font-semibold text-sm text-gray-900">{coe.name}</span>
                      </div>
                      {coe.code && <span className="text-[10px] uppercase tracking-wider text-gray-400 ml-6">{coe.code}</span>}
                      <p className="text-xs text-gray-500 mt-1 ml-6">{techCount} technologies</p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-400 text-sm">No COEs available. They can be added after project creation.</p>
              </div>
            )}
            <p className="text-xs text-gray-400">
              {selectedCoeIds.size} of {availableCoes.length} COEs selected &middot; {filteredTechs.length} technologies
            </p>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Review Configuration</h3>
              <p className="text-sm text-gray-500">Review the auto-populated structure before customizing.</p>
            </div>
            <div className="bg-white rounded-lg border border-[#E8E0D4] p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Project</p>
                  <p className="font-semibold text-gray-900">{projectForm.name || '(Unnamed)'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Client</p>
                  <p className="text-gray-700">{projectForm.client || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Type</p>
                  <p className="text-gray-700">{selectedType || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Template</p>
                  <p className="text-gray-700">{selectedTemplate?.name || 'None (blank)'}</p>
                </div>
              </div>
            </div>

            {previewAreas.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Areas ({previewAreas.length})</h4>
                <div className="space-y-1">
                  {previewAreas.map((a) => (
                    <div key={a.id} className="flex items-center gap-2 px-3 py-2 bg-white rounded border border-[#E8E0D4]">
                      <span className="w-2 h-2 rounded-full bg-[#C5A572]" />
                      <span className="text-sm text-gray-900">{a.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredTechs.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Technologies ({filteredTechs.length})</h4>
                <div className="grid grid-cols-2 gap-1">
                  {filteredTechs.slice(0, 20).map((t) => (
                    <div key={t.id} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded border border-[#E8E0D4]">
                      <span className="text-xs text-gray-900 truncate">{t.name}</span>
                      {t.coe_name && <span className="text-[10px] text-[#8B7355] shrink-0">{t.coe_name}</span>}
                    </div>
                  ))}
                  {filteredTechs.length > 20 && (
                    <p className="text-xs text-gray-400 col-span-2 text-center py-2">
                      + {filteredTechs.length - 20} more
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Customize */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Customize</h3>
              <p className="text-sm text-gray-500">Add, remove, or reorder areas. Everything is customizable after creation.</p>
            </div>

            <div className="space-y-2">
              {customAreas.map((area, idx) => (
                <div key={area.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
                  area.included ? 'border-[#E8E0D4] bg-white' : 'border-[#E8E0D4] bg-gray-50 opacity-50'
                }`}>
                  <button onClick={() => toggleCustomArea(idx)}>
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      area.included ? 'border-[#C5A572] bg-[#C5A572]' : 'border-gray-300'
                    }`}>
                      {area.included && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                  <span className="flex-1 text-sm text-gray-900">{area.name}</span>
                  {area.isNew && <span className="text-[10px] text-[#C5A572] font-medium">NEW</span>}
                </div>
              ))}
            </div>

            <form onSubmit={addCustomArea} className="flex gap-2">
              <input
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                placeholder="Add custom area..."
                className="flex-1 px-4 py-2 rounded-lg border border-[#E8E0D4] text-sm focus:outline-none focus:border-[#C5A572]"
              />
              <button type="submit" className="px-4 py-2 rounded-lg bg-[#C5A572] text-white text-sm font-medium hover:bg-[#B8975F]">
                Add
              </button>
            </form>

            <p className="text-xs text-gray-400">{includedAreas.length} areas will be created</p>
          </div>
        )}

        {/* Step 6: Upload Visualizations */}
        {step === 6 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Upload Visualizations</h3>
              <p className="text-sm text-gray-500">Optionally upload media files for this project. You can skip this step.</p>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files); }}
              className="border-2 border-dashed border-[#E8E0D4] rounded-xl p-8 text-center hover:border-[#C5A572] transition-colors cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-[#C5A572] border-t-transparent animate-spin" />
                  <span className="text-sm text-gray-500">Uploading...</span>
                </div>
              ) : (
                <div>
                  <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-gray-500">Drag & drop files or click to browse</p>
                </div>
              )}
              <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
            </div>

            {uploads.length > 0 && (
              <div className="space-y-2">
                {uploads.map((u, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg border border-[#E8E0D4]">
                    <svg className="w-4 h-4 text-[#C5A572] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-900 flex-1 truncate">{u.original_name || u.filename}</span>
                    <button onClick={() => removeUpload(idx)} className="text-xs text-gray-400 hover:text-red-500">&times;</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 7: Confirm */}
        {step === 7 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Confirm & Create</h3>
              <p className="text-sm text-gray-500">Review your configuration and create the project.</p>
            </div>

            {createdProject ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-[#C5A572]/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#C5A572]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Project Created
                </h3>
                <p className="text-sm text-gray-500 mb-6">"{createdProject.name}" is ready to use.</p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => navigate(`/present/${createdProject.id}`)}
                    className="px-6 py-2.5 rounded-lg bg-[#C5A572] text-white text-sm font-medium hover:bg-[#B8975F]"
                  >
                    Start Presenting
                  </button>
                  <button
                    onClick={() => navigate('/admin/projects')}
                    className="px-6 py-2.5 rounded-lg border border-[#E8E0D4] text-sm text-gray-600 hover:border-[#C5A572]"
                  >
                    Go to Projects
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg border border-[#E8E0D4] p-5">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">Project</p>
                      <p className="font-semibold text-gray-900">{projectForm.name || '(Unnamed)'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">Client</p>
                      <p className="text-gray-700">{projectForm.client || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">Type</p>
                      <p className="text-gray-700">{selectedType || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">Template</p>
                      <p className="text-gray-700">{selectedTemplate?.name || 'Blank'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">COEs</p>
                      <p className="text-gray-700">{selectedCoeIds.size}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">Areas</p>
                      <p className="text-gray-700">{includedAreas.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">Technologies</p>
                      <p className="text-gray-700">{filteredTechs.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">Uploads</p>
                      <p className="text-gray-700">{uploads.length}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCreate}
                  disabled={creating || !projectForm.name.trim()}
                  className="w-full py-3 rounded-lg bg-[#C5A572] text-white text-sm font-bold hover:bg-[#B8975F] disabled:opacity-50 transition-colors"
                >
                  {creating ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Creating...
                    </span>
                  ) : 'Create Project'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        {!createdProject && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#E8E0D4]">
            <button
              onClick={step === 1 ? () => navigate('/admin/projects') : handleBack}
              className="px-5 py-2 rounded-lg border border-[#E8E0D4] text-sm text-gray-600 hover:border-[#C5A572] transition-colors"
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </button>
            {step < 7 && (
              <button
                onClick={handleNext}
                disabled={step === 1 && !projectForm.name.trim()}
                className="px-6 py-2 rounded-lg bg-[#C5A572] text-white text-sm font-medium hover:bg-[#B8975F] disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
