import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AnalyticsPage, DetailPage, MapPage, Overview, ReportsPage, ServicesPage, SettingsPage } from './pages/AppPages'
import './App.css'

function AppRoutes() {
  return <Routes>
    <Route element={<Layout />}>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Overview />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/reports/:id" element={<DetailPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Route>
  </Routes>
}

export default function App() {
  return <BrowserRouter><AppRoutes /></BrowserRouter>
}

