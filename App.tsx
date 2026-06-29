import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Search from './pages/Search';
import TechDetail from './pages/TechDetail';
import DomainDetail from './pages/DomainDetail';
import PatentDetail from './pages/PatentDetailRedesign';
import LandscapePreview from './pages/LandscapePreview';
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
  const routeKey = `${location.pathname}${location.search}`;

  return (
    <>
      <ScrollToTop />
      <Layout>
        <React.Fragment key={routeKey}>
          <Routes location={location}>
            <Route path="/" element={<Home key="home" />} />
            <Route path="/browse" element={<Search key={`${routeKey}:browse`} />} />
            <Route path="/search" element={<Search key={`${routeKey}:search`} />} />
            <Route path="/landscape-preview" element={<LandscapePreview key={`${routeKey}:landscape-preview`} />} />
            {/* <Route path="/landscape" element={<Landscape />} /> */}
            <Route path="/domains/:domainSlug" element={<DomainDetail key={`${routeKey}:domain`} />} />
            <Route path="/technology/:techId" element={<TechDetail key={`${routeKey}:technology`} />} />
            <Route path="/patent/:patentId" element={<PatentDetail key={`${routeKey}:patent`} />} />
            <Route path="/saved" element={<Saved key={`${routeKey}:saved`} />} />
            <Route path="/404" element={<NotFound key={`${routeKey}:404`} />} />
            <Route path="*" element={<Navigate key={`${routeKey}:wildcard`} to="/404" replace />} />
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
