import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import CitizenPortal from './citizen/CitizenPortal.jsx'
import { Layout } from './municipal/components/Layout.jsx'
import {
  AnalyticsPage,
  DetailPage,
  MapPage,
  Overview,
  ReportsPage,
  ServicesPage,
  SettingsPage,
} from './municipal/pages/AppPages.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CitizenPortal />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Overview />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/reports/:id" element={<DetailPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
