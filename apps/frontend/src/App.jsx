import { Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { BlogPage } from './pages/BlogPage';
import { TrackPage } from './pages/TrackPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/track" element={<TrackPage />} />
    </Routes>
  );
}

export default App;
