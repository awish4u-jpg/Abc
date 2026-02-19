import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProjectSelector from './pages/ProjectSelector';
import PresentationView from './pages/PresentationView';
import AdminLayout from './pages/admin/AdminLayout';
import ProjectsPage from './pages/admin/ProjectsPage';
import COEsPage from './pages/admin/COEsPage';
import TechnologiesPage from './pages/admin/TechnologiesPage';
import MediaPage from './pages/admin/MediaPage';
import TemplatesPage from './pages/admin/TemplatesPage';
import SessionsPage from './pages/admin/SessionsPage';
import LibraryPage from './pages/admin/LibraryPage';
import WizardPage from './pages/admin/WizardPage';
import VersionHistoryPage from './pages/admin/VersionHistoryPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProjectSelector />} />
        <Route path="/present/:projectId" element={<PresentationView />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/projects" replace />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="coes" element={<COEsPage />} />
          <Route path="technologies" element={<TechnologiesPage />} />
          <Route path="media" element={<MediaPage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="sessions" element={<SessionsPage />} />
          <Route path="wizard" element={<WizardPage />} />
          <Route path="versions" element={<VersionHistoryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
