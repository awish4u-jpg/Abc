const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export const api = {
  // Projects
  getProjects: () => request('/projects'),
  getProject: (id) => request(`/projects/${id}`),
  getPresentation: (id) => request(`/projects/${id}/presentation`),
  getProjectAreas: (id) => request(`/projects/${id}/areas`),
  getProjectSessions: (id) => request(`/projects/${id}/sessions`),

  // Areas
  getAreaTechnologies: (areaId) => request(`/areas/${areaId}/technologies`),
  assignTechnology: (areaId, body) =>
    request(`/areas/${areaId}/technologies`, { method: 'POST', body: JSON.stringify(body) }),
  toggleReviewed: (areaId) =>
    request(`/areas/${areaId}/reviewed`, { method: 'PATCH' }),

  // Area-Technologies
  patchAreaTechnology: (id, body) =>
    request(`/area-technologies/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteAreaTechnology: (id) =>
    request(`/area-technologies/${id}`, { method: 'DELETE' }),
  swapAreaTechnology: (id, newTechId) =>
    request(`/area-technologies/${id}/swap`, {
      method: 'POST',
      body: JSON.stringify({ new_technology_id: newTechId }),
    }),

  // Technologies
  searchTechnologies: (q) => request(`/technologies/search?q=${encodeURIComponent(q)}`),
  getTechnologies: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/technologies${qs ? `?${qs}` : ''}`);
  },

  // Sessions
  createSession: (body) =>
    request('/sessions', { method: 'POST', body: JSON.stringify(body) }),
  patchSession: (id, body) =>
    request(`/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  logDecision: (sessionId, body) =>
    request(`/sessions/${sessionId}/decisions`, { method: 'POST', body: JSON.stringify(body) }),
  getDecisions: (sessionId) => request(`/sessions/${sessionId}/decisions`),
  getReport: (sessionId) => request(`/sessions/${sessionId}/report`),
  deleteDecision: (id) => request(`/decisions/${id}`, { method: 'DELETE' }),

  // COEs
  getCoes: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/coes${qs ? `?${qs}` : ''}`);
  },
};
