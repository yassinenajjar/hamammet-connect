import { useState } from "react";
import Visiteur from "./Visiteur.jsx";
import Auth from "./Auth.jsx";
import EspaceUtilisateur from "./EspaceUtilisateur.jsx";
import EspaceMunicipalite from "./EspaceMunicipalite.jsx";

function App() {
  const [page, setPage] = useState("visiteur");
  const [utilisateur, setUtilisateur] = useState(null);
  const [comptes, setComptes] = useState([]);
  const [reclamations, setReclamations] = useState([]);
  const [idees, setIdees] = useState([]);
  const [message, setMessage] = useState("");

  function inscrire(donnees) {
    const existe = comptes.some(
      (compte) => compte.email === donnees.email
    );

    if (existe) {
      return "Cette adresse e-mail possède déjà un compte.";
    }

    setComptes((anciens) => [...anciens, donnees]);

    setUtilisateur({
      nom: donnees.nom,
      email: donnees.email,
      role: "citoyen",
    });

    setMessage("");
    setPage("utilisateur");
    return null;
  }

  function connecter(donnees) {
    // Identifiants temporaires de démonstration uniquement.
    // À remplacer par l'authentification du backend.
    if (
      donnees.email === "admin@hammamet.tn" &&
      donnees.motDePasse === "admin123"
    ) {
      setUtilisateur({
        nom: "Administration",
        email: donnees.email,
        role: "admin",
      });

      setMessage("");
      setPage("municipalite");
      return null;
    }

    const compte = comptes.find(
      (c) =>
        c.email === donnees.email &&
        c.motDePasse === donnees.motDePasse
    );

    if (!compte) {
      return "Identifiants incorrects. Vérifie ton e-mail et ton mot de passe.";
    }

    setUtilisateur({
      nom: compte.nom,
      email: compte.email,
      role: "citoyen",
    });

    setMessage("");
    setPage("utilisateur");
    return null;
  }

  function deconnexion() {
    setUtilisateur(null);
    setMessage("");
    setPage("visiteur");
  }

  function deposerReclamation(donnees) {
    const nouvelleReclamation = {
      ...donnees,
      id: crypto.randomUUID(),
      nomAuteur: utilisateur?.nom || "Visiteur",
      emailAuteur:
        utilisateur?.role === "citoyen"
          ? utilisateur.email
          : null,
      statut: "Reçue",
      motifRefus: "",
      noteMunicipalite: "",
      date: new Date().toLocaleDateString("fr-TN"),
    };

    setReclamations((anciennes) => [
      nouvelleReclamation,
      ...anciennes,
    ]);

    setMessage("Ta réclamation a bien été enregistrée.");
  }

  function supprimerReclamation(id) {
    if (utilisateur?.role !== "citoyen") return;

    setReclamations((anciennes) =>
      anciennes.filter(
        (r) =>
          !(
            r.id === id &&
            r.emailAuteur === utilisateur.email
          )
      )
    );
  }

  function ajouterIdee(donnees) {
    if (utilisateur?.role !== "citoyen") {
      return "Connecte-toi pour proposer une idée.";
    }

    setIdees((anciennes) => [
      {
        ...donnees,
        id: crypto.randomUUID(),
        nomAuteur: utilisateur.nom,
        emailAuteur: utilisateur.email,
        date: new Date().toLocaleDateString("fr-TN"),
      },
      ...anciennes,
    ]);

    return null;
  }

  return (
    <>
      <header className="hc-header">
        <button
          className="hc-brand"
          type="button"
          onClick={() => {
            setMessage("");
            setPage("visiteur");
          }}
        >
          <span className="hc-brand-icon">H</span>
          <span>
            Hammamet
            <span className="hc-brand-accent">Connect</span>
          </span>
        </button>

        <nav className="hc-nav">
          <button
            className={page === "visiteur" ? "active" : ""}
            onClick={() => {
              setMessage("");
              setPage("visiteur");
            }}
          >
            Accueil
          </button>

          {utilisateur?.role === "citoyen" && (
            <button
              className={page === "utilisateur" ? "active" : ""}
              onClick={() => setPage("utilisateur")}
            >
              Mon espace
            </button>
          )}

          {utilisateur?.role === "admin" && (
            <button
              className={page === "municipalite" ? "active" : ""}
              onClick={() => setPage("municipalite")}
            >
              Espace municipalité
            </button>
          )}
        </nav>

        <div className="hc-header-actions">
          {!utilisateur ? (
            <>
              <button
                className="hc-button hc-outline"
                onClick={() => {
                  setMessage("");
                  setPage("connexion");
                }}
              >
                Connexion
              </button>

              <button
                className="hc-button hc-primary"
                onClick={() => {
                  setMessage("");
                  setPage("inscription");
                }}
              >
                Créer un compte
              </button>
            </>
          ) : (
            <>
              <span className="hc-muted">
                Bonjour, {utilisateur.nom}
              </span>

              <button
                className="hc-button hc-outline"
                onClick={deconnexion}
              >
                Déconnexion
              </button>
            </>
          )}
        </div>
      </header>

      {page === "visiteur" && (
        <Visiteur
          onSubmit={deposerReclamation}
          allerConnexion={() => {
            setMessage("");
            setPage("connexion");
          }}
          allerInscription={() => {
            setMessage("");
            setPage("inscription");
          }}
          allerEspace={() => setPage("utilisateur")}
          message={message}
          utilisateur={utilisateur}
        />
      )}

      {(page === "connexion" || page === "inscription") && (
        <Auth
          mode={page}
          onConnexion={connecter}
          onInscription={inscrire}
          retour={() => {
            setMessage("");
            setPage("visiteur");
          }}
          changerMode={(nouveauMode) => {
            setMessage("");
            setPage(nouveauMode);
          }}
        />
      )}

      {page === "utilisateur" &&
        utilisateur?.role === "citoyen" && (
          <EspaceUtilisateur
            user={utilisateur}
            reclamations={reclamations.filter(
              (r) => r.emailAuteur === utilisateur.email
            )}
            supprimerReclamation={supprimerReclamation}
            idees={idees.filter(
              (i) => i.emailAuteur === utilisateur.email
            )}
            ajouterIdee={ajouterIdee}
            allerAccueil={() => setPage("visiteur")}
          />
        )}

      {page === "municipalite" &&
        utilisateur?.role === "admin" && (
          <EspaceMunicipalite
            reclamations={reclamations}
            setReclamations={setReclamations}
            retour={deconnexion}
          />
        )}

      <footer className="hc-footer">
        <strong>Hammamet Connect</strong>
        <p>Une ville plus propre, plus agréable, ensemble.</p>
        <small>Prototype Frontend · Projet hackathon</small>
      </footer>
    </>
  );
}

export default App;