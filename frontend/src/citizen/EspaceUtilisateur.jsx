import { useEffect, useState } from 'react'
import { apiRequest } from '../api'

const labels = { new: 'Reçue', in_progress: 'En cours', transferred: 'Transmise', resolved: 'Résolue', rejected: 'Refusée' }

export default function EspaceUtilisateur({ user, allerAccueil }) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiRequest('/my/reports').then((payload) => setReports(payload.data ?? [])).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false))
  }, [])

  return <main className="hc-main"><section className="hc-page-heading"><div><span className="hc-eyebrow">MON ESPACE</span><h1>Bonjour, {user.nom}</h1><p>Retrouve ici les signalements liés à ton compte.</p></div><button className="hc-button hc-outline" onClick={allerAccueil}>Accueil</button></section>
    {error && <p className="hc-message hc-error" role="alert">{error}</p>}
    {loading ? <section className="hc-panel">Chargement de tes signalements…</section> : reports.length ? reports.map((report) => <article className="hc-panel hc-report" key={report.reference}><div className="hc-report-header"><div><h3>{report.title}</h3><p className="hc-muted">{report.category} · {report.location || 'Point indiqué sur la carte'} · {new Date(report.submitted_at).toLocaleDateString('fr-FR')}</p></div><span className="hc-status">{labels[report.status] ?? report.status}</span></div><p>{report.description}</p><small>Référence : {report.reference}</small></article>) : <section className="hc-panel hc-empty"><h2>Aucun signalement enregistré</h2><p>Les signalements associés à ton compte apparaîtront ici.</p><button className="hc-button hc-primary" onClick={allerAccueil}>Créer un signalement</button></section>}
  </main>
}
