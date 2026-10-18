import FormReclamation from "./FormReclamation.jsx";
import { useEffect, useRef, useState } from "react";
import { apiRequest, getPublicStatistics } from "../api";
import { Check, ClipboardList, MapPin, Users, CircleCheck, Sprout } from "lucide-react";

function AnimatedStat({ value, label, description, icon: Icon, tone, start }) {
  const [displayValue, setDisplayValue] = useState(0);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  useEffect(() => {
    if (value === null) return;
    if (!start || reducedMotion || value === 0) return;
    let frame;
    const began = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - began) / 1500, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, start, reducedMotion]);

  return <article className={`hc-stat hc-stat-${tone}`}>
    <span className="hc-stat-icon"><Icon size={26} aria-hidden="true" /></span>
    <div><strong>{value === null ? "—" : new Intl.NumberFormat("fr-FR").format(!start || reducedMotion ? value : displayValue)}</strong><span>{label}</span><small>{description}</small></div>
  </article>;
}

function Visiteur({
  onSubmit,
  allerConnexion,
  allerInscription,
  allerEspace,
  allerIdee,
  message,
  utilisateur,
  authLoading,
}) {
  const [reference, setReference] = useState("");
  const [trackingResult, setTrackingResult] = useState("");
  const [trackingError, setTrackingError] = useState("");
  const [statistics, setStatistics] = useState(null);
  const [statisticsError, setStatisticsError] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    let active = true;
    getPublicStatistics().then((data) => {
      if (active) setStatistics(data);
    }).catch(() => { if (active) setStatisticsError(true); });
    return () => { active = false; };
  }, []);

  async function soumettreSignalement(donnees) {
    const result = await onSubmit(donnees);
    setReference(result.data.reference || "");
    return result;
  }

  useEffect(() => {
    if (!statsRef.current || !("IntersectionObserver" in window)) {
      setStatsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setStatsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.2 });
    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  async function suivre(e) {
    e.preventDefault();
    setTrackingError("");
    setTrackingResult("");
    try {
      const payload = await apiRequest(`/anonymous/reports/${encodeURIComponent(reference)}/access`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      const labels = { new: "Nouvelle", in_progress: "En cours", transferred: "Transmise au service compétent", resolved: "Résolue", rejected: "Rejetée" };
      setTrackingResult({
        reference: payload.data.reference,
        status: labels[payload.data.status] || payload.data.status,
        rejectionReason: payload.data.rejection_reason || "",
      });
    } catch {
      setTrackingError("Aucun signalement trouvé pour cette référence.");
    }
  }

  return (
    <main className="hc-main">
      <section className="hc-hero">
        <div className="hc-hero-copy">
          <span className="hc-eyebrow"><Sprout size={17} aria-hidden="true" /> HAMMAMET, NOTRE AVENIR</span>

          <h1>
            Signalez.
            <br />
            Partagez.
            <br />
            <em>Changez votre ville.</em>
          </h1>

          <p>
            Ensemble, améliorons Hammamet pour un cadre de vie
            <br className="hc-desktop-break" /> plus propre, plus sûr et plus agréable.
          </p>

          <div className="hc-hero-actions">
            <a className="hc-button hc-primary" href="#signaler">
              Signaler un problème <span aria-hidden="true">→</span>
            </a>

            {!utilisateur && !authLoading && (
              <button
                className="hc-button hc-outline"
                onClick={allerInscription}
              >
                Créer un compte
              </button>
            )}

            {utilisateur?.role === "citoyen" && (
              <button className="hc-button hc-outline" onClick={allerEspace}>Ouvrir Mon espace</button>
            )}
          </div>

          <div className="hc-trust-line">
            <span>✓ Simple</span>
            <span>✓ Citoyen</span>
            <span>✓ Impact concret</span>
          </div>
        </div>

        <figure className="hc-hammamet-photos" aria-label="Photos de la côte de Hammamet">
          <img className="hc-hammamet-photo-main" src="/images/hammamet-beach.jpg" alt="Plage de Hammamet, avec la ville en arrière-plan" />
          <div className="hc-hammamet-photo-detail">
            <img src="/images/hammamet-coast.jpg" alt="Littoral de Hammamet au coucher du soleil" />
          </div>
          <div className="hc-demo-note">Exemples illustratifs</div>
          <article className="hc-floating-report hc-floating-one"><MapPin className="hc-report-pin" size={20} /><img className="hc-report-thumb hc-thumb-light" src="/images/hammamet-coast.jpg" alt="" /><div><b>Éclairage défectueux</b><span>Rue de la Corniche</span><small>Nouveau · exemple</small></div></article>
          <article className="hc-floating-report hc-floating-two"><CircleCheck className="hc-report-pin" size={20} /><img className="hc-report-thumb hc-thumb-green" src="/images/hammamet-beach.jpg" alt="" /><div><b>Espace vert entretenu</b><span>Par la municipalité</span><small>Résolu · exemple</small></div></article>
          <article className="hc-floating-report hc-floating-three"><MapPin className="hc-report-pin" size={20} /><img className="hc-report-thumb hc-thumb-road" src="/images/hammamet-coast.jpg" alt="" /><div><b>Trottoir endommagé</b><span>Avenue Habib Bourguiba</span><small>En cours · exemple</small></div></article>
        </figure>
      </section>

      <section className="hc-stats" ref={statsRef} aria-label="Statistiques de la plateforme">
        <AnimatedStat value={statistics?.citizens ?? null} label="Citoyens engagés" description="Comptes citoyens inscrits" icon={Users} tone="blue" start={statsVisible} />
        <AnimatedStat value={statistics?.reports ?? null} label="Réclamations reçues" description="Signalements enregistrés" icon={ClipboardList} tone="violet" start={statsVisible} />
        <AnimatedStat value={statistics?.resolved ?? null} label="Problèmes résolus" description="Statut actuellement résolu" icon={Check} tone="green" start={statsVisible} />
        {statisticsError && <p className="hc-stats-error" role="status">Statistiques momentanément indisponibles.</p>}
      </section>

      {!utilisateur && !authLoading && <section className="hc-panel" id="suivi-anonyme"><h2>Suivre un signalement anonyme</h2><p className="hc-muted">Saisis la référence reçue après l’envoi de ton signalement.</p><form className="hc-form-grid" onSubmit={suivre}><label className="hc-field">Référence<input value={reference} onChange={(e) => setReference(e.target.value)} required /></label><button className="hc-button hc-primary" type="submit">Consulter</button></form>{trackingResult && <div role="status"><p>{trackingResult.reference} · {trackingResult.status}</p>{trackingResult.status === "Rejetée" && <p><b>Motif du rejet :</b> {trackingResult.rejectionReason || "Aucun motif n’a été communiqué."}</p>}</div>}{trackingError && <p className="hc-message hc-error" role="alert">{trackingError}</p>}</section>}

      <section className="hc-process" aria-labelledby="hc-process-title">
        <div><span className="hc-eyebrow">COMMENT ÇA MARCHE</span><h2 id="hc-process-title">Un signalement en trois étapes</h2></div>
        <ol><li><b>Décris le problème</b><span>Ajoute une adresse ou place un point sur la carte.</span></li><li><b>Envoie ton signalement</b><span>Une photo ou une description aide à comprendre la situation.</span></li><li><b>Garde ta référence</b><span>Consulte le suivi avec la référence reçue.</span></li></ol>
      </section>

      <div className="hc-content-grid">
        <FormReclamation
          onSubmit={soumettreSignalement}
          message={message}
          utilisateur={utilisateur}
        />

        <aside className="hc-sidebar">
          <article className="hc-side-card hc-side-highlight">
            <span className="hc-heading-symbol">✦</span>
            <h3>Votre voix compte</h3>
            <p>
              Chaque signalement aide à identifier les problèmes
              et à améliorer le quotidien des habitants.
            </p>

            {!authLoading && !utilisateur ? (
              <button
                className="hc-button hc-primary hc-full"
                onClick={allerInscription}
              >
                Créer mon compte
              </button>
            ) : utilisateur?.role === "citoyen" ? (
              <button
                className="hc-button hc-primary hc-full"
                onClick={allerEspace}
              >
                Ouvrir Mon espace
              </button>
            ) : null}
          </article>

          <article className="hc-side-card">
            <span className="hc-heading-symbol">♧</span>
            <h3>Une idée pour Hammamet ?</h3>
            <p>
              {utilisateur?.role === "citoyen"
                ? "Partage une proposition avec la municipalité et suis sa réponse dans ton espace."
                : utilisateur
                  ? "Ton compte est connecté."
                  : "Connecte-toi pour proposer des idées et retrouver tes propositions dans ton espace."}
            </p>

            {authLoading ? <button className="hc-button hc-outline hc-full" disabled>Vérification de la session…</button> : utilisateur?.role === "citoyen" ? (
              <button className="hc-button hc-outline hc-full" onClick={allerIdee}>Proposer une idée</button>
            ) : !utilisateur ? (
              <button className="hc-button hc-outline hc-full" onClick={allerConnexion}>Se connecter</button>
            ) : null}
          </article>
        </aside>
      </div>
    </main>
  );
}

export default Visiteur;
