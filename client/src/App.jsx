import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProjectSelector from './pages/ProjectSelector';
import PresentationView from './pages/PresentationView';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProjectSelector />} />
        <Route path="/present/:projectId" element={<PresentationView />} />
      </Routes>
    </BrowserRouter>
  );
}
