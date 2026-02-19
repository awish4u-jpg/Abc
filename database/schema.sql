-- Projects: top-level entity representing a Layer 1 assessment
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  client TEXT,
  type TEXT,
  is_template INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Areas: functional domains within a project (e.g. "Data Management", "Security")
CREATE TABLE IF NOT EXISTS areas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  reviewed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- COEs: Centers of Excellence that own technology decisions
CREATE TABLE IF NOT EXISTS coes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  code TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Technologies: individual tech items that can be assigned to areas
CREATE TABLE IF NOT EXISTS technologies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  coe_id INTEGER,
  name TEXT NOT NULL,
  description TEXT,
  vendor TEXT,
  vision TEXT,
  why_it_works TEXT,
  key_points TEXT,
  certifications TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (coe_id) REFERENCES coes(id) ON DELETE SET NULL
);

-- Area-Technologies: junction table linking technologies to areas with selection state
CREATE TABLE IF NOT EXISTS area_technologies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  area_id INTEGER NOT NULL,
  technology_id INTEGER NOT NULL,
  is_selected INTEGER DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(area_id, technology_id),
  FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE,
  FOREIGN KEY (technology_id) REFERENCES technologies(id) ON DELETE CASCADE
);

-- Sessions: a presentation session for walking through decisions
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'cancelled')),
  attendees TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Decisions: actions logged during a session
CREATE TABLE IF NOT EXISTS decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  area_technology_id INTEGER,
  action TEXT NOT NULL CHECK(action IN ('add', 'remove', 'swap')),
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (area_technology_id) REFERENCES area_technologies(id) ON DELETE SET NULL
);

-- Media: tracked uploads for admin management
CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mimetype TEXT NOT NULL,
  size INTEGER NOT NULL,
  url TEXT NOT NULL,
  coe_id INTEGER,
  area_id INTEGER,
  technology_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coe_id) REFERENCES coes(id) ON DELETE SET NULL,
  FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL,
  FOREIGN KEY (technology_id) REFERENCES technologies(id) ON DELETE SET NULL
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_areas_project ON areas(project_id);
CREATE INDEX IF NOT EXISTS idx_coes_project ON coes(project_id);
CREATE INDEX IF NOT EXISTS idx_technologies_project ON technologies(project_id);
CREATE INDEX IF NOT EXISTS idx_technologies_coe ON technologies(coe_id);
CREATE INDEX IF NOT EXISTS idx_area_technologies_area ON area_technologies(area_id);
CREATE INDEX IF NOT EXISTS idx_area_technologies_tech ON area_technologies(technology_id);
CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_decisions_session ON decisions(session_id);
CREATE INDEX IF NOT EXISTS idx_media_coe ON media(coe_id);

-- Library Technologies: master catalog of technologies (not tied to any project)
CREATE TABLE IF NOT EXISTS library_technologies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coe_code TEXT,
  name TEXT NOT NULL,
  description TEXT,
  vendor TEXT,
  vision TEXT,
  why_it_works TEXT,
  key_points TEXT,
  certifications TEXT,
  category TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Session Snapshots: full state of selections at a point in time
CREATE TABLE IF NOT EXISTS session_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  area_id INTEGER,
  area_name TEXT NOT NULL,
  technology_id INTEGER,
  technology_name TEXT NOT NULL,
  vendor TEXT,
  coe_name TEXT,
  is_selected INTEGER DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_session_snapshots_session ON session_snapshots(session_id);
CREATE INDEX IF NOT EXISTS idx_library_technologies_coe ON library_technologies(coe_code);
