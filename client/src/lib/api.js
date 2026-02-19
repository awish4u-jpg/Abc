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
  getProjects: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/projects${qs ? `?${qs}` : ''}`);
  },
  getProject: (id) => request(`/projects/${id}`),
  createProject: (body) =>
    request('/projects', { method: 'POST', body: JSON.stringify(body) }),
  updateProject: (id, body) =>
    request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProject: (id) =>
    request(`/projects/${id}`, { method: 'DELETE' }),
  cloneProject: (id, body = {}) =>
    request(`/projects/${id}/clone`, { method: 'POST', body: JSON.stringify(body) }),
  getPresentation: (id) => request(`/projects/${id}/presentation`),
  getProjectAreas: (id) => request(`/projects/${id}/areas`),
  createProjectArea: (projectId, body) =>
    request(`/projects/${projectId}/areas`, { method: 'POST', body: JSON.stringify(body) }),
  getProjectSessions: (id) => request(`/projects/${id}/sessions`),

  // Areas
  getAreaTechnologies: (areaId) => request(`/areas/${areaId}/technologies`),
  updateArea: (id, body) =>
    request(`/areas/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteArea: (id) =>
    request(`/areas/${id}`, { method: 'DELETE' }),
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
  getTechnology: (id) => request(`/technologies/${id}`),
  createTechnology: (body) =>
    request('/technologies', { method: 'POST', body: JSON.stringify(body) }),
  updateTechnology: (id, body) =>
    request(`/technologies/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteTechnology: (id) =>
    request(`/technologies/${id}`, { method: 'DELETE' }),

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
  getCoe: (id) => request(`/coes/${id}`),
  createCoe: (body) =>
    request('/coes', { method: 'POST', body: JSON.stringify(body) }),
  updateCoe: (id, body) =>
    request(`/coes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCoe: (id) =>
    request(`/coes/${id}`, { method: 'DELETE' }),

  // Media
  getMedia: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/media${qs ? `?${qs}` : ''}`);
  },
  deleteMedia: (id) =>
    request(`/media/${id}`, { method: 'DELETE' }),
  uploadFile: async (file, meta = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    if (meta.coe_id) formData.append('coe_id', meta.coe_id);
    if (meta.area_id) formData.append('area_id', meta.area_id);
    if (meta.technology_id) formData.append('technology_id', meta.technology_id);
    const res = await fetch(`${BASE}/upload`, { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Upload failed: ${res.status}`);
    return data;
  },
};
