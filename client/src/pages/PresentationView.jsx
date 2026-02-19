import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { undoStore } from '../lib/undoStore';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import TechCard from '../components/TechCard';
import SwapDropdown from '../components/SwapDropdown';
import AddTechModal from '../components/AddTechModal';
import NotesEditor from '../components/NotesEditor';
import HelpOverlay from '../components/HelpOverlay';

export default function PresentationView() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [areas, setAreas] = useState([]);
  const [activeAreaIdx, setActiveAreaIdx] = useState(0);
  const [areaTechs, setAreaTechs] = useState([]);
  const [session, setSession] = useState(null);
  const [changeCounts, setChangeCounts] = useState({});
  const [loading, setLoading] = useState(true);

  // UI state
  const [swapTarget, setSwapTarget] = useState(null);
  const [notesTarget, setNotesTarget] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [activeTechIdx, setActiveTechIdx] = useState(0);

  const undoSize = useSyncExternalStore(
    undoStore.subscribe,
    () => undoStore.size()
  );

  // Load project & create session
  useEffect(() => {
    async function init() {
      try {
        const [proj, areasData] = await Promise.all([
          api.getProject(projectId),
          api.getProjectAreas(projectId),
        ]);
        setProject(proj);
        setAreas(areasData);

        const sess = await api.createSession({
          project_id: Number(projectId),
          name: `Session ${new Date().toLocaleString()}`,
        });
        setSession(sess);
        undoStore.clear();
      } catch (err) {
        console.error('Failed to load project:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [projectId]);

  // Load technologies for active area
  const activeArea = areas[activeAreaIdx];
  useEffect(() => {
    if (!activeArea) return;
    api.getAreaTechnologies(activeArea.id)
      .then(setAreaTechs)
      .catch(() => setAreaTechs([]));
  }, [activeArea?.id, activeArea?.updated_at]);

  // Track change count per area
  function incrementChange(areaId) {
    setChangeCounts((prev) => ({ ...prev, [areaId]: (prev[areaId] || 0) + 1 }));
  }
  function decrementChange(areaId) {
    setChangeCounts((prev) => {
      const val = (prev[areaId] || 0) - 1;
      if (val <= 0) {
        const next = { ...prev };
        delete next[areaId];
        return next;
      }
      return { ...prev, [areaId]: val };
    });
  }

  // --- ACTION HANDLERS ---

  const handleToggle = useCallback(async (at) => {
    if (!session) return;
    const wasSelected = !!at.is_selected;
    const newVal = !wasSelected;

    try {
      const updated = await api.patchAreaTechnology(at.id, { is_selected: newVal });
      setAreaTechs((prev) => prev.map((t) => (t.id === at.id ? updated : t)));

      await api.logDecision(session.id, {
        area_technology_id: at.id,
        action: newVal ? 'add' : 'remove',
        details: `${newVal ? 'Selected' : 'Deselected'} ${at.technology_name}`,
      });
      incrementChange(at.area_id);

      undoStore.push({
        description: `${newVal ? 'Selected' : 'Deselected'} ${at.technology_name}`,
        undo: async () => {
          const reverted = await api.patchAreaTechnology(at.id, { is_selected: wasSelected });
          setAreaTechs((prev) => prev.map((t) => (t.id === at.id ? reverted : t)));
          decrementChange(at.area_id);
        },
      });
    } catch (err) {
      console.error('Toggle failed:', err);
    }
  }, [session]);

  const handleSwap = useCallback(async (at, newTech) => {
    if (!session) return;
    const oldTechName = at.technology_name;
    const oldTechId = at.technology_id;

    try {
      const updated = await api.swapAreaTechnology(at.id, newTech.id);
      setAreaTechs((prev) => prev.map((t) => (t.id === at.id ? updated : t)));
      setSwapTarget(null);

      await api.logDecision(session.id, {
        area_technology_id: at.id,
        action: 'swap',
        details: `Swapped ${oldTechName} → ${newTech.name}`,
      });
      incrementChange(at.area_id);

      undoStore.push({
        description: `Swapped ${oldTechName} → ${newTech.name}`,
        undo: async () => {
          const reverted = await api.swapAreaTechnology(at.id, oldTechId);
          setAreaTechs((prev) => prev.map((t) => (t.id === at.id ? reverted : t)));
          decrementChange(at.area_id);
        },
      });
    } catch (err) {
      console.error('Swap failed:', err);
    }
  }, [session]);

  const handleAdd = useCallback(async (tech) => {
    if (!session || !activeArea) return;

    try {
      const created = await api.assignTechnology(activeArea.id, {
        technology_id: tech.id,
        is_selected: true,
      });
      setAreaTechs((prev) => [...prev, created]);
      setShowAddModal(false);

      await api.logDecision(session.id, {
        area_technology_id: created.id,
        action: 'add',
        details: `Added ${tech.name} to ${activeArea.name}`,
      });
      incrementChange(activeArea.id);

      undoStore.push({
        description: `Added ${tech.name}`,
        undo: async () => {
          await api.deleteAreaTechnology(created.id);
          setAreaTechs((prev) => prev.filter((t) => t.id !== created.id));
          decrementChange(activeArea.id);
        },
      });
    } catch (err) {
      console.error('Add failed:', err);
    }
  }, [session, activeArea]);

  const handleNotesSave = useCallback(async (at, newNotes) => {
    if (!session) return;
    const oldNotes = at.notes || '';

    try {
      const updated = await api.patchAreaTechnology(at.id, { notes: newNotes });
      setAreaTechs((prev) => prev.map((t) => (t.id === at.id ? updated : t)));
      setNotesTarget(null);

      incrementChange(at.area_id);

      undoStore.push({
        description: `Updated notes on ${at.technology_name}`,
        undo: async () => {
          const reverted = await api.patchAreaTechnology(at.id, { notes: oldNotes });
          setAreaTechs((prev) => prev.map((t) => (t.id === at.id ? reverted : t)));
          decrementChange(at.area_id);
        },
      });
    } catch (err) {
      console.error('Notes save failed:', err);
    }
  }, [session]);

  const handleUndo = useCallback(async () => {
    try {
      const action = await undoStore.undo();
      if (action) {
        console.log('Undid:', action.description);
      }
    } catch (err) {
      console.error('Undo failed:', err);
    }
  }, []);

  const handleReport = useCallback(async () => {
    if (!session) return;
    window.open(`/api/sessions/${session.id}/report/pdf`, '_blank');
  }, [session]);

  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  const handleConfirmArea = useCallback(async () => {
    if (!activeArea) return;
    await api.toggleReviewed(activeArea.id);
    setAreas((prev) =>
      prev.map((a) =>
        a.id === activeArea.id ? { ...a, reviewed: a.reviewed ? 0 : 1 } : a
      )
    );
    // Advance to next area
    if (activeAreaIdx < areas.length - 1) {
      setActiveAreaIdx(activeAreaIdx + 1);
      setActiveTechIdx(0);
    }
  }, [activeArea, activeAreaIdx, areas.length]);

  // --- KEYBOARD SHORTCUTS ---
  useKeyboardShortcuts(
    {
      prev: () => { if (activeAreaIdx > 0) { setActiveAreaIdx(activeAreaIdx - 1); setActiveTechIdx(0); } },
      next: () => { if (activeAreaIdx < areas.length - 1) { setActiveAreaIdx(activeAreaIdx + 1); setActiveTechIdx(0); } },
      toggle: () => { if (areaTechs[activeTechIdx]) handleToggle(areaTechs[activeTechIdx]); },
      swap: () => { if (areaTechs[activeTechIdx]) setSwapTarget(areaTechs[activeTechIdx]); },
      add: () => setShowAddModal(true),
      Escape: () => {
        if (showHelp) setShowHelp(false);
        else if (showAddModal) setShowAddModal(false);
        else if (swapTarget) setSwapTarget(null);
        else if (notesTarget) setNotesTarget(null);
        else navigate('/');
      },
      report: handleReport,
      fullscreen: handleFullscreen,
      help: () => setShowHelp((v) => !v),
      'mod+z': handleUndo,
    },
    [activeAreaIdx, areas.length, areaTechs, activeTechIdx, showHelp, showAddModal, swapTarget, notesTarget, handleToggle, handleReport, handleFullscreen, handleUndo]
  );

  // --- RENDER ---

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F0EB] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#C5A572] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#F5F0EB] flex items-center justify-center">
        <p className="text-gray-500">Project not found</p>
      </div>
    );
  }

  const selectedCount = areaTechs.filter((t) => t.is_selected).length;
  const totalCount = areaTechs.length;
  const existingTechIds = new Set(areaTechs.map((t) => t.technology_id));

  return (
    <div className="min-h-screen bg-[#F5F0EB]">
      {/* Gold top bar */}
      <div className="h-1 bg-[#C5A572]" />

      <div className="flex h-[calc(100vh-4px)]">
        {/* ===== SIDEBAR (20%) ===== */}
        <aside className="w-[20%] min-w-[200px] bg-white border-r border-[#E8E0D4] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-[#E8E0D4]">
            <h1
              className="text-xl font-bold text-gray-900"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {project.name}
            </h1>
            {session && (
              <p className="text-[10px] uppercase tracking-wider text-gray-400 mt-1">
                Session active
              </p>
            )}
          </div>

          {/* Area list */}
          <nav className="flex-1 overflow-y-auto py-2">
            {areas.map((area, idx) => {
              const isActive = idx === activeAreaIdx;
              const count = changeCounts[area.id] || 0;

              return (
                <button
                  key={area.id}
                  onClick={() => { setActiveAreaIdx(idx); setActiveTechIdx(0); }}
                  className={`w-full text-left px-4 py-3 flex items-center gap-2 transition-all duration-200 ${
                    isActive
                      ? 'bg-[#F5F0EB] border-l-[3px] border-[#C5A572]'
                      : 'border-l-[3px] border-transparent hover:bg-[#FAFAF7]'
                  }`}
                >
                  {/* Status dot */}
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      area.reviewed ? 'bg-[#C5A572]' : 'bg-gray-300'
                    }`}
                  />

                  <span className={`text-sm flex-1 truncate ${isActive ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                    {area.name}
                  </span>

                  {/* Change badge */}
                  {count > 0 && (
                    <span className="flex items-center justify-center w-[18px] h-[18px] rounded-full bg-[#C5A572] text-white text-[10px] font-bold shrink-0">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer actions */}
          <div className="p-3 border-t border-[#E8E0D4] space-y-2">
            {undoSize > 0 && (
              <button
                onClick={handleUndo}
                className="w-full text-xs text-[#8B7355] hover:text-[#C5A572] transition-colors py-1"
              >
                Undo ({undoSize})
              </button>
            )}
            <button
              onClick={() => navigate('/')}
              className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
            >
              ← Back to projects
            </button>
          </div>
        </aside>

        {/* ===== MAIN PANEL (80%) ===== */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <header className="px-6 py-3 bg-white border-b border-[#E8E0D4] flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400">
                {project.name} &middot; {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHelp(true)}
                className="text-xs text-gray-400 hover:text-[#C5A572] transition-colors"
                title="Keyboard shortcuts (?)"
              >
                ?
              </button>
              <button
                onClick={handleReport}
                className="px-4 py-1.5 rounded-lg bg-[#C5A572] text-white text-sm font-medium hover:bg-[#B8975F] transition-colors"
              >
                Generate Report
              </button>
            </div>
          </header>

          {/* Content */}
          {activeArea ? (
            <div className="flex-1 overflow-y-auto p-6">
              {/* Area heading */}
              <div className="mb-6">
                <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#8B7355] mb-1">
                  Area {activeAreaIdx + 1} of {areas.length}
                </p>
                <h2
                  className="text-2xl font-bold text-gray-900 mb-2"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {activeArea.name}
                </h2>
                <div className="w-12 h-0.5 bg-[#C5A572]" />
                {activeArea.description && (
                  <div className="mt-3 pl-3 border-l-2 border-[#C5A572]">
                    <p className="text-sm text-gray-600">{activeArea.description}</p>
                  </div>
                )}
              </div>

              {/* Tech cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {areaTechs.map((at, idx) => (
                  <div key={at.id} className="relative">
                    <TechCard
                      areaTech={at}
                      isActive={idx === activeTechIdx}
                      onToggle={handleToggle}
                      onSwapOpen={(t) => setSwapTarget(swapTarget?.id === t.id ? null : t)}
                      onNotesOpen={(t) => setNotesTarget(notesTarget?.id === t.id ? null : t)}
                    />

                    {/* Swap dropdown */}
                    {swapTarget?.id === at.id && (
                      <SwapDropdown
                        areaTech={at}
                        onSwap={handleSwap}
                        onClose={() => setSwapTarget(null)}
                      />
                    )}

                    {/* Inline notes editor */}
                    {notesTarget?.id === at.id && (
                      <div className="mt-1">
                        <NotesEditor
                          areaTech={at}
                          onSave={handleNotesSave}
                          onClose={() => setNotesTarget(null)}
                        />
                      </div>
                    )}
                  </div>
                ))}

                {/* Add button */}
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-[#E8E0D4] hover:border-[#C5A572] text-gray-400 hover:text-[#C5A572] transition-all duration-200 min-h-[100px]"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm font-medium">Add Technology</span>
                </button>
              </div>

              {/* Area summary bar */}
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-[#E8E0D4]">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-[#C5A572]">{selectedCount}</span>
                  {' '}selected out of{' '}
                  <span className="font-semibold">{totalCount}</span>
                  {' '}available
                </p>
                <button
                  onClick={handleConfirmArea}
                  className="px-5 py-2 rounded-lg bg-[#C5A572] text-white text-sm font-medium hover:bg-[#B8975F] transition-colors"
                >
                  {activeArea.reviewed ? 'Unmark & Stay' : 'Confirm & Next Area'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              No areas in this project
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {showAddModal && activeArea && (
        <AddTechModal
          projectId={Number(projectId)}
          areaId={activeArea.id}
          existingTechIds={existingTechIds}
          onAdd={handleAdd}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showHelp && <HelpOverlay onClose={() => setShowHelp(false)} />}
    </div>
  );
}
