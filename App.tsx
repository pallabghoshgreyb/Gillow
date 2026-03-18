import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Search from './pages/Search';
import Landscape from './pages/Landscape';
import TechDetail from './pages/TechDetail';
import PatentDetail from './pages/PatentDetail';
import Saved from './pages/Saved';
import NotFound from './pages/NotFound';
import { GillowProvider } from './context/GillowContext';

const App: React.FC = () => {
  return (
    <GillowProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<Search />} />
            <Route path="/search" element={<Search />} />
            <Route path="/landscape" element={<Landscape />} />
            <Route path="/technology/:techId" element={<TechDetail />} />
            <Route path="/patent/:patentId" element={<PatentDetail />} />
            <Route path="/saved" element={<Saved />} />
            {/* Catch-all 404 */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Layout>
      </Router>
    </GillowProvider>
  );
};

export default App;