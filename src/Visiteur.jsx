import FormReclamation from "./FormReclamation.jsx";

function Visiteur({
  onSubmit,
  allerConnexion,
  allerInscription,
  allerEspace,
  message,
  utilisateur,
}) {
  return (
    <main className="hc-main">
      <section className="hc-hero">
        <div className="hc-hero-copy">
          <span className="hc-eyebrow">
            LA VILLE, ENSEMBLE
          </span>

          <h1>
            Une meilleure ville
            <br />
            commence <em>avec vous.</em>
          </h1>

          <p>
            Signalez un problème dans votre quartier, partagez vos idées
            et participez à l'amélioration du quotidien à Hammamet.
          </p>

          <div className="hc-hero-actions">
            <a className="hc-button hc-primary" href="#signaler">
              Signaler un problème ↘
            </a>

            {utilisateur?.role !== "citoyen" && (
              <button
                className="hc-button hc-outline"
                onClick={allerInscription}
              >
                Créer un compte
              </button>
            )}

            {utilisateur?.role === "citoyen" && (
              <button
                className="hc-button hc-outline"
                onClick={allerEspace}
              >
                Ouvrir Mon espace
              </button>
            )}
          </div>

          <div className="hc-trust-line">
            <span>✓ Simple</span>
            <span>✓ Citoyen</span>
            <span>✓ Collaboratif</span>
          </div>
        </div>

        <div className="hc-city" aria-label="Illustration de Hammamet">
          <div className="hc-sun" />
          <div className="hc-building hc-building-one" />
          <div className="hc-building hc-building-two" />
          <div className="hc-building hc-building-three" />
          <div className="hc-ground" />

          <div className="hc-city-label">
            <span className="hc-feature-icon blue">⌖</span>
            <div>
              <strong>Hammamet Connect</strong>
              <small>Agir ensemble, localement</small>
            </div>
          </div>
        </div>
      </section>

      <section className="hc-features">
        <article className="hc-feature">
          <span className="hc-feature-icon blue">↗</span>
          <div>
            <h3>Signaler facilement</h3>
            <p>Photo, vidéo, texte ou message vocal.</p>
          </div>
        </article>

        <article className="hc-feature">
          <span className="hc-feature-icon">✦</span>
          <div>
            <h3>Suivre ses signalements</h3>
            <p>
              Retrouvez vos réclamations dans votre espace personnel
              après connexion.
            </p>
          </div>
        </article>

        <article className="hc-feature">
          <span className="hc-feature-icon blue">♧</span>
          <div>
            <h3>Imaginer la ville de demain</h3>
            <p>Partagez vos idées pour Hammamet.</p>
          </div>
        </article>
      </section>

      <div className="hc-content-grid">
        <FormReclamation
          onSubmit={onSubmit}
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

            {utilisateur?.role !== "citoyen" ? (
              <button
                className="hc-button hc-primary hc-full"
                onClick={allerInscription}
              >
                Créer mon compte
              </button>
            ) : (
              <button
                className="hc-button hc-primary hc-full"
                onClick={allerEspace}
              >
                Ouvrir Mon espace
              </button>
            )}
          </article>

          <article className="hc-side-card">
            <span className="hc-heading-symbol">♧</span>
            <h3>Une idée pour Hammamet ?</h3>
            <p>
              Connecte-toi pour proposer des idées d'innovation
              et retrouver tes propositions dans ton espace.
            </p>

            <button
              className="hc-button hc-outline hc-full"
              onClick={
                utilisateur?.role === "citoyen"
                  ? allerEspace
                  : allerConnexion
              }
            >
              {utilisateur?.role === "citoyen"
                ? "Ouvrir Mon espace"
                : "Se connecter"}
            </button>
          </article>
        </aside>
      </div>
    </main>
  );
}

export default Visiteur;