import { useEffect } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Aura } from '@/components/Aura';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/showcase';
import { LangProvider } from '@/lib/i18n';
import Home from '@/pages/Home';
import Lab from '@/pages/Lab';
import NotFound from '@/pages/NotFound';
import ProjectDetail from '@/pages/ProjectDetail';
import RunView from '@/pages/RunView';

/** Link "/#section" dari halaman lain: scroll ke section setelah Home dirender. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const id = hash.slice(1);
    const scroll = () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    const frame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash]);
  return null;
}

function Layout() {
  return (
    <>
      <ScrollManager />
      <Aura />
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <LangProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            {/* Slug lama sebelum HelpMyCV berganti nama jadi Tools from Eiklab. */}
            <Route path="projects/helpmycv" element={<Navigate to="/projects/tools" replace />} />
            <Route path="projects/:slug" element={<ProjectDetail />} />
            <Route path="lab" element={<Lab />} />
            <Route path="lab/runs/:runId" element={<RunView />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LangProvider>
  );
}
