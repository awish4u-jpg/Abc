import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

export default function VersionHistoryPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snapshotting, setSnapshotting] = useState(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [snapshotData, setSnapshotData] = useState(null);

  // Diff state
  const [diffA, setDiffA] = useState('');
  const [diffB, setDiffB] = useState('');
  const [diffData, setDiffData] = useState(null);
  const [diffLoading, setDiffLoading] = useState(false);

  useEffect(() => {
    api.getProjects({ is_template: '0' }).then(setProjects).catch(() => {});
  }, []);

  const loadSessions = async (projId) => {
    if (!projId) { setSessions([]); return; }
    setLoading(true);
    try {
      const sess = await api.getProjectSessions(projId);
      setSessions(sess);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions(selectedProject);
    setSelectedSnapshot(null);
    setSnapshotData(null);
    setDiffData(null);
    setDiffA('');
    setDiffB('');
  }, [selectedProject]);

  const handleSnapshot = async (sessionId) => {
    setSnapshotting(sessionId);
    try {
      await api.createSnapshot(sessionId);
      await loadSessions(selectedProject);
    } catch (err) {
      console.error('Snapshot failed:', err);
    } finally {
      setSnapshotting(null);
    }
  };

  const viewSnapshot = async (sessionId) => {
    if (selectedSnapshot === sessionId) {
      setSelectedSnapshot(null);
      setSnapshotData(null);
      return;
    }
    setSelectedSnapshot(sessionId);
    try {
      const data = await api.getSnapshot(sessionId);
      setSnapshotData(data);
    } catch {
      setSnapshotData(null);
    }
  };

  const handleDiff = async () => {
    if (!diffA || !diffB || diffA === diffB) return;
    setDiffLoading(true);
    try {
      const data = await api.getDiff(diffA, diffB);
      setDiffData(data);
    } catch (err) {
      console.error('Diff failed:', err);
    } finally {
      setDiffLoading(false);
    }
  };

  const sessionsWithSnapshots = sessions.filter((s) => s.snapshot_count > 0);

  return (
    <div>
      <div className="px-8 py-5 bg-white border-b border-[#E8E0D4] flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
          Version History
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

      <div className="p-8">
        {!selectedProject ? (
          <p className="text-center text-gray-400 py-12">Select a project to view its version history</p>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-[#C5A572] border-t-transparent animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No sessions for this project</p>
        ) : (
          <div className="space-y-8">
            {/* Timeline */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Session Timeline</h3>
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#E8E0D4]" />

                <div className="space-y-4">
                  {sessions.map((s, idx) => {
                    const hasSnapshot = s.snapshot_count > 0;
                    const isViewing = selectedSnapshot === s.id;

                    return (
                      <div key={s.id} className="relative pl-12">
                        {/* Gold dot */}
                        <div className={`absolute left-2 top-3 w-5 h-5 rounded-full border-2 ${
                          hasSnapshot
                            ? 'border-[#C5A572] bg-[#C5A572]'
                            : 'border-[#E8E0D4] bg-white'
                        }`}>
                          {hasSnapshot && (
                            <svg className="w-3 h-3 text-white absolute top-0.5 left-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>

                        <div className={`bg-white rounded-lg border overflow-hidden transition-all ${
                          isViewing ? 'border-[#C5A572] ring-2 ring-[#C5A572]/10' : 'border-[#E8E0D4]'
                        }`}>
                          <div className="px-5 py-3 flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                              <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-xs text-gray-400">{new Date(s.created_at).toLocaleString()}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                  s.status === 'active' ? 'bg-green-100 text-green-700'
                                  : s.status === 'completed' ? 'bg-[#C5A572]/10 text-[#8B7355]'
                                  : 'bg-gray-100 text-gray-500'
                                }`}>{s.status}</span>
                                {hasSnapshot && (
                                  <span className="text-[10px] text-[#C5A572] font-medium">
                                    {s.snapshot_count} snapshots
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleSnapshot(s.id)}
                                disabled={snapshotting === s.id}
                                className="px-3 py-1.5 rounded text-xs font-medium bg-[#C5A572] text-white hover:bg-[#B8975F] disabled:opacity-50"
                              >
                                {snapshotting === s.id ? 'Saving...' : hasSnapshot ? 'Re-snapshot' : 'Snapshot'}
                              </button>
                              {hasSnapshot && (
                                <button
                                  onClick={() => viewSnapshot(s.id)}
                                  className={`px-3 py-1.5 rounded text-xs font-medium border ${
                                    isViewing ? 'border-[#C5A572] text-[#C5A572]' : 'border-[#E8E0D4] text-gray-500 hover:border-[#C5A572]'
                                  }`}
                                >
                                  {isViewing ? 'Hide' : 'View State'}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Snapshot detail */}
                          {isViewing && snapshotData && (
                            <div className="border-t border-[#E8E0D4] bg-[#FAFAF7] p-5">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                                State at {s.name}
                              </h4>
                              {snapshotData.areas?.length > 0 ? (
                                <div className="space-y-3">
                                  {snapshotData.areas.map((area) => (
                                    <div key={area.area_name} className="bg-white rounded border border-[#E8E0D4] p-3">
                                      <p className="font-semibold text-sm text-gray-900 mb-2">{area.area_name}</p>
                                      <div className="space-y-1">
                                        {area.technologies.map((t, i) => (
                                          <div key={i} className="flex items-center gap-2 text-xs">
                                            <span className={`w-2 h-2 rounded-full ${t.is_selected ? 'bg-[#C5A572]' : 'bg-gray-300'}`} />
                                            <span className={t.is_selected ? 'font-medium text-gray-900' : 'text-gray-500'}>{t.technology_name}</span>
                                            {t.vendor && <span className="text-gray-400">&middot; {t.vendor}</span>}
                                            {t.coe_name && <span className="px-1.5 py-0.5 rounded bg-[#C5A572]/10 text-[#8B7355] text-[10px]">{t.coe_name}</span>}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-400">No snapshot data</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Diff Comparison */}
            {sessions.length >= 2 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Compare Sessions</h3>
                <div className="bg-white rounded-lg border border-[#E8E0D4] p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <select
                      value={diffA}
                      onChange={(e) => setDiffA(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm bg-white focus:outline-none focus:border-[#C5A572]"
                    >
                      <option value="">Session A...</option>
                      {sessionsWithSnapshots.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <span className="text-xs text-gray-400 font-medium">vs</span>
                    <select
                      value={diffB}
                      onChange={(e) => setDiffB(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-[#E8E0D4] text-sm bg-white focus:outline-none focus:border-[#C5A572]"
                    >
                      <option value="">Session B...</option>
                      {sessionsWithSnapshots.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <button
                      onClick={handleDiff}
                      disabled={!diffA || !diffB || diffA === diffB || diffLoading}
                      className="px-5 py-2 rounded-lg bg-[#C5A572] text-white text-sm font-medium hover:bg-[#B8975F] disabled:opacity-50"
                    >
                      {diffLoading ? 'Loading...' : 'Compare'}
                    </button>
                  </div>

                  {sessionsWithSnapshots.length < 2 && (
                    <p className="text-xs text-gray-400 text-center py-4">
                      At least 2 sessions need snapshots to compare. Use the "Snapshot" button above.
                    </p>
                  )}

                  {/* Diff Results */}
                  {diffData && (
                    <div className="border-t border-[#E8E0D4] pt-4 mt-4">
                      {/* Summary */}
                      <div className="flex items-center gap-4 mb-4">
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-sm bg-green-500" />
                          <span className="text-xs text-gray-600">Added: {diffData.summary.added}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-sm bg-red-500" />
                          <span className="text-xs text-gray-600">Removed: {diffData.summary.removed}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-sm bg-[#C5A572]" />
                          <span className="text-xs text-gray-600">Changed: {diffData.summary.changed}</span>
                        </span>
                        <a
                          href={`/api/sessions/${diffA}/diff/${diffB}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto text-xs text-[#C5A572] hover:text-[#B8975F] font-medium"
                        >
                          Export Diff PDF
                        </a>
                      </div>

                      {diffData.changes.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-4">No differences between these sessions</p>
                      ) : (
                        <div className="space-y-2">
                          {diffData.changes.map((ch, idx) => {
                            const colors = {
                              added: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700' },
                              removed: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700' },
                              changed: { bg: 'bg-[#C5A572]/5', border: 'border-[#C5A572]/30', text: 'text-[#8B7355]', badge: 'bg-[#C5A572]/10 text-[#8B7355]' },
                            };
                            const c = colors[ch.type] || colors.changed;

                            return (
                              <div key={idx} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border ${c.bg} ${c.border}`}>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${c.badge}`}>
                                  {ch.type}
                                </span>
                                <span className="text-sm text-gray-900 font-medium">{ch.technology_name}</span>
                                <span className="text-xs text-gray-400">in {ch.area_name}</span>
                                {ch.coe_name && (
                                  <span className="ml-auto text-[10px] text-[#8B7355] uppercase tracking-wider">{ch.coe_name}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
