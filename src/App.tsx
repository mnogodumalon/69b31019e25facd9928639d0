import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import AdminPage from '@/pages/AdminPage';
import KursleiterVerwaltungPage from '@/pages/KursleiterVerwaltungPage';
import KursVerwaltungPage from '@/pages/KursVerwaltungPage';
import TeilnehmerAnmeldungPage from '@/pages/TeilnehmerAnmeldungPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="kursleiter-verwaltung" element={<KursleiterVerwaltungPage />} />
          <Route path="kurs-verwaltung" element={<KursVerwaltungPage />} />
          <Route path="teilnehmer-anmeldung" element={<TeilnehmerAnmeldungPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}