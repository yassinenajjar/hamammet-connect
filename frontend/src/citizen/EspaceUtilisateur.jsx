import { useEffect, useState } from 'react'
import { apiRequest } from '../api'

const labels = { new: 'Reçue', in_progress: 'En cours', transferred: 'Transmise', resolved: 'Résolue', rejected: 'Refusée' }

export default function EspaceUtilisateur({ user, allerAccueil, allerIdee }) {
  const [reports, setReports] = useState([])
  const [ideas, setIdeas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([apiRequest('/my/reports'), apiRequest('/my/ideas')])
      .then(([reportPayload, ideaPayload]) => {
        setReports(reportPayload.data ?? [])
        setIdeas(ideaPayload.data ?? [])
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [])

  const ideaStatus = { pending: 'En attente d’examen', accepted: 'Acceptée', rejected: 'Refusée' }

  return <main className="hc-main"><section className="hc-page-heading"><div><span className="hc-eyebrow">MON ESPACE</span><h1>Bonjour, {user.nom}</h1><p>Retrouve tes signalements et les réponses de la municipalité à tes idées.</p></div><div className="hc-page-actions"><button className="hc-button hc-outline" onClick={allerAccueil}>Accueil</button><button className="hc-button hc-primary" onClick={allerIdee}>Proposer une idée</button></div></section>
    {error && <p className="hc-message hc-error" role="alert">{error}</p>}
    {loading ? <section className="hc-panel">Chargement de tes signalements…</section> : reports.length ? reports.map((report) => <article className="hc-panel hc-report" key={report.reference}><div className="hc-report-header"><div><h3>{report.title}</h3><p className="hc-muted">{report.category} · {report.location || 'Point indiqué sur la carte'} · {new Date(report.submitted_at).toLocaleDateString('fr-FR')}</p></div><span className="hc-status">{labels[report.status] ?? report.status}</span></div><p>{report.description}</p><small>Référence : {report.reference}</small></article>) : <section className="hc-panel hc-empty"><h2>Aucun signalement enregistré</h2><p>Les signalements associés à ton compte apparaîtront ici.</p><button className="hc-button hc-primary" onClick={allerAccueil}>Créer un signalement</button></section>}
    <section className="hc-panel hc-ideas-list"><div className="hc-ideas-heading"><div><h2>Mes idées pour Hammamet</h2><p className="hc-muted">Les propositions envoyées et leur suivi municipal.</p></div><button className="hc-button hc-outline" onClick={allerIdee}>Proposer une idée</button></div>
      {loading ? <p className="hc-muted">Chargement de tes idées…</p> : ideas.length ? ideas.map((idea) => <article className="hc-idea-item" key={idea.id}><div className="hc-idea-item-heading"><h3>{idea.title}</h3><span className={`hc-idea-status hc-idea-status-${idea.status}`}>{ideaStatus[idea.status] || idea.status}</span></div><p>{idea.description}</p><small>Envoyée le {new Date(idea.created_at).toLocaleDateString('fr-FR')}</small>{idea.admin_response && <div className="hc-idea-response"><b>Réponse de la municipalité</b><p>{idea.admin_response}</p></div>}</article>) : <p className="hc-muted">Tu n’as pas encore envoyé d’idée.</p>}
    </section>
  </main>
}
