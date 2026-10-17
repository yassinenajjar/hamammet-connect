import { useState } from "react";

function Auth({
  mode,
  onConnexion,
  onInscription,
  retour,
  changerMode,
}) {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState("");

  const inscription = mode === "inscription";

  function envoyer(e) {
    e.preventDefault();
    setErreur("");

    const emailNormalise = email.trim().toLowerCase();

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalise)
    ) {
      setErreur("Saisis une adresse e-mail valide.");
      return;
    }

    if (motDePasse.length < 8) {
      setErreur(
        "Le mot de passe doit contenir au moins 8 caractères."
      );
      return;
    }

    if (inscription) {
      if (!nom.trim()) {
        setErreur("Saisis ton nom complet.");
        return;
      }

      if (motDePasse !== confirmation) {
        setErreur(
          "Les deux mots de passe ne correspondent pas."
        );
        return;
      }

      if (
        !/[A-Za-zÀ-ÿ]/.test(motDePasse) ||
        !/[0-9]/.test(motDePasse)
      ) {
        setErreur(
          "Utilise au moins une lettre et un chiffre."
        );
        return;
      }
    }

    const donnees = {
      nom: nom.trim(),
      email: emailNormalise,
      motDePasse,
    };

    const resultat = inscription
      ? onInscription(donnees)
      : onConnexion(donnees);

    if (resultat) {
      setErreur(resultat);
    }
  }

  function connexionGoogle() {
    setErreur(
      "La connexion Google sera activée après la configuration du service d'authentification."
    );
  }

  return (
    <main className="hc-auth-wrap">
      <section className="hc-auth-card">
        <span className="hc-eyebrow">HAMMAMET CONNECT</span>

        <h1>
          {inscription ? "Créer un compte" : "Bon retour !"}
        </h1>

        <p className="hc-muted">
          {inscription
            ? "Rejoins les citoyens qui participent à l'amélioration de Hammamet."
            : "Connecte-toi pour retrouver ton espace personnel et tes réclamations."}
        </p>

        <button
          type="button"
          className="hc-button hc-outline hc-full"
          onClick={connexionGoogle}
        >
          <span>G</span>
          Continuer avec Google
        </button>

        <p
          className="hc-muted"
          style={{ textAlign: "center" }}
        >
          ou avec ton adresse e-mail
        </p>

        <form className="hc-auth-form" onSubmit={envoyer}>
          {inscription && (
            <>
              <label htmlFor="auth-nom">Nom complet *</label>
              <input
                id="auth-nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                autoComplete="name"
                maxLength={100}
                required
              />
            </>
          )}

          <label htmlFor="auth-email">
            Adresse e-mail *
          </label>
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            maxLength={254}
            required
          />

          <label htmlFor="auth-password">
            Mot de passe *
          </label>
          <input
            id="auth-password"
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            autoComplete={
              inscription ? "new-password" : "current-password"
            }
            minLength={8}
            required
          />

          {inscription && (
            <>
              <p className="hc-muted">
                Minimum 8 caractères, avec au moins une lettre
                et un chiffre.
              </p>

              <label htmlFor="auth-confirmation">
                Confirmer le mot de passe *
              </label>
              <input
                id="auth-confirmation"
                type="password"
                value={confirmation}
                onChange={(e) =>
                  setConfirmation(e.target.value)
                }
                autoComplete="new-password"
                minLength={8}
                required
              />
            </>
          )}

          {erreur && (
            <p className="hc-message hc-error" role="alert">
              {erreur}
            </p>
          )}

          <button
            className="hc-button hc-primary hc-full"
            type="submit"
          >
            {inscription ? "Créer mon compte" : "Se connecter"}
          </button>
        </form>

        <div className="hc-auth-switch">
          <span>
            {inscription
              ? "Tu as déjà un compte ?"
              : "Tu n'as pas encore de compte ?"}
          </span>

          <button
            type="button"
            className="hc-text-button"
            onClick={() =>
              changerMode(
                inscription ? "connexion" : "inscription"
              )
            }
          >
            {inscription ? "Se connecter" : "Créer un compte"}
          </button>
        </div>

        <button
          type="button"
          className="hc-button hc-light hc-full"
          style={{ marginTop: 15 }}
          onClick={retour}
        >
          Retour à l'accueil
        </button>
      </section>
    </main>
  );
}

export default Auth;