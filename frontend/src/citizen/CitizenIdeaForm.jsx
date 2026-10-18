import { useState } from 'react'

export default function CitizenIdeaForm({ onSubmit, onBack }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSending(true)
    try {
      await onSubmit({ title: title.trim(), description: description.trim() })
    } catch (requestError) {
      setError(requestError.message || 'L’envoi de ton idée a échoué. Réessaie.')
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="hc-main">
      <section className="hc-page-heading">
        <div><span className="hc-eyebrow">PARTICIPATION CITOYENNE</span><h1>Une idée pour Hammamet</h1><p>Propose une amélioration pour ta ville. L’équipe municipale pourra l’examiner et te répondre dans Mon espace.</p></div>
        <button className="hc-button hc-outline" type="button" onClick={onBack}>Retour à l’accueil</button>
      </section>
      <section className="hc-panel hc-idea-form-panel">
        <form className="hc-idea-form" onSubmit={submit}>
          <label className="hc-field">Titre de l’idée<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required placeholder="Ex. Ajouter des bancs sur la promenade" /></label>
          <label className="hc-field">Décris ta proposition<textarea value={description} onChange={(event) => setDescription(event.target.value)} minLength={10} maxLength={5000} rows={7} required placeholder="Explique le besoin, les personnes concernées et le bénéfice attendu…" /></label>
          <p className="hc-muted">Ton nom et ton adresse e-mail seront associés à cette proposition pour que la municipalité puisse te répondre.</p>
          {error && <p className="hc-message hc-error" role="alert">{error}</p>}
          <div className="hc-idea-actions"><button className="hc-button hc-outline" type="button" onClick={onBack}>Annuler</button><button className="hc-button hc-primary" type="submit" disabled={sending}>{sending ? 'Envoi…' : 'Envoyer mon idée'}</button></div>
        </form>
      </section>
    </main>
  )
}
