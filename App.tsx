import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Search from './pages/Search';
import Landscape from './pages/Landscape';
import TechDetail from './pages/TechDetail';
import PatentDetail from './pages/PatentDetailRedesign';
import Saved from './pages/Saved';
import NotFound from './pages/NotFound';
import { GillowProvider } from './context/GillowContext';

const AppShell: React.FC = () => {
  const location = useLocation();

  return (
    <Layout>
      <React.Fragment key={`${location.pathname}${location.search}`}>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Search />} />
          <Route path="/search" element={<Search />} />
          <Route path="/landscape" element={<Landscape />} />
          <Route path="/technology/:techId" element={<TechDetail />} />
          <Route path="/patent/:patentId" element={<PatentDetail />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </React.Fragment>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <GillowProvider>
      <Router>
        <AppShell />
      </Router>
    </GillowProvider>
  );
};

export default App;
