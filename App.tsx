import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Search from './pages/Search';
import Landscape from './pages/Landscape';
import TechDetail from './pages/TechDetail';
import DomainDetail from './pages/DomainDetail';
import PatentDetail from './pages/PatentDetailRedesign';
import Saved from './pages/Saved';
import NotFound from './pages/NotFound';
import { GillowProvider } from './context/GillowContext';

const scrollToPageTop = () => {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.body.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.getElementById('root')?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
};

const ScrollToTop: React.FC = () => {
  const location = useLocation();

  React.useLayoutEffect(() => {
    scrollToPageTop();
    const frame = window.requestAnimationFrame(scrollToPageTop);

    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname, location.search]);

  return null;
};

const AppShell: React.FC = () => {
  const location = useLocation();

  return (
    <>
      <ScrollToTop />
      <Layout>
        <React.Fragment key={`${location.pathname}${location.search}`}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<Search />} />
            <Route path="/search" element={<Search />} />
            <Route path="/landscape" element={<Landscape />} />
            <Route path="/domains/:domainSlug" element={<DomainDetail />} />
            <Route path="/technology/:techId" element={<TechDetail />} />
            <Route path="/patent/:patentId" element={<PatentDetail />} />
            <Route path="/saved" element={<Saved />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </React.Fragment>
      </Layout>
    </>
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
