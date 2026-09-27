import { Routes, Route } from 'react-router-dom';
import { DirectoryPage } from './pages/DirectoryPage';
import { TooltipLayer } from './components/TooltipLayer';
import { DebugStateBar } from './components/DebugStateBar';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<DirectoryPage />} />
      </Routes>
      <TooltipLayer />
      <DebugStateBar />
    </>
  );
}
