import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, uploadEvidenceToCloudinary } from "../api";
import Visiteur from "./Visiteur.jsx";
import Auth from "./Auth.jsx";
import EspaceUtilisateur from "./EspaceUtilisateur.jsx";

function App() {
  const [page, setPage] = useState("visiteur");
  const [utilisateur, setUtilisateur] = useState(null);
  const [idees, setIdees] = useState([]);
  const [message, setMessage] = useState("");
  const uploadedEvidence = useRef(new WeakMap());
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionStorage.getItem("hc_api_token")) return;
    apiRequest("/user").then(({ data }) => {
      setUtilisateur({ nom: data.name, email: data.email, role: data.role === "citizen" ? "citoyen" : data.role });
    }).catch(() => sessionStorage.removeItem("hc_api_token"));
  }, []);

  async function inscrire(donnees) {
    const payload = await apiRequest("/register", { method: "POST", body: JSON.stringify({ name: donnees.nom, email: donnees.email, password: donnees.motDePasse }) });
    sessionStorage.setItem("hc_api_token", payload.token);
    setUtilisateur({ nom: payload.data.name, email: payload.data.email, role: "citoyen" });
    setMessage("");
    setPage("utilisateur");
  }

  async function connecter(donnees) {
    const payload = await apiRequest("/login", { method: "POST", body: JSON.stringify({ email: donnees.email, password: donnees.motDePasse }) });
    sessionStorage.setItem("hc_api_token", payload.token);
    if (["staff", "admin"].includes(payload.data.role)) {
      navigate("/dashboard");
      return;
    }
    setUtilisateur({ nom: payload.data.name, email: payload.data.email, role: "citoyen" });
    setMessage("");
    setPage("utilisateur");
  }

  async function deconnexion() {
    try { await apiRequest("/logout", { method: "POST" }); } catch { /* Clear the local session even when offline. */ }
    sessionStorage.removeItem("hc_api_token");
    setUtilisateur(null);
    setMessage("");
    setPage("visiteur");
  }

  async function deposerReclamation(donnees) {
    const evidence = await Promise.all(donnees.fichiers.map(async (file) => {
      let uploaded = uploadedEvidence.current.get(file);
      if (!uploaded) {
        uploaded = await uploadEvidenceToCloudinary(file);
        uploadedEvidence.current.set(file, uploaded);
      }
      return uploaded;
    }));

    const body = {
      title: donnees.titre,
      category: donnees.categorie,
      description: donnees.description || "",
      evidence,
    };
    if (donnees.lieu) body.location = donnees.lieu;
    if (donnees.latitude !== null) body.latitude = donnees.latitude;
    if (donnees.longitude !== null) body.longitude = donnees.longitude;

    try {
      const result = await apiRequest("/reports", { method: "POST", body: JSON.stringify(body) });
      donnees.fichiers.forEach((file) => uploadedEvidence.current.delete(file));
      setMessage({ reference: result.data.reference, status: result.data.status || "new", trackingSecret: result.data.tracking_secret || "" });
      return result;
    } catch (error) {
      donnees.fichiers.forEach((file) => uploadedEvidence.current.delete(file));
      throw error;
    }
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

          <button
            onClick={() => {
              if (["admin", "staff"].includes(utilisateur?.role)) navigate("/dashboard");
              else {
                setMessage("");
                setPage("connexion");
              }
            }}
          >
            Espace municipalité
          </button>
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
            idees={idees.filter(
              (i) => i.emailAuteur === utilisateur.email
            )}
            ajouterIdee={ajouterIdee}
            allerAccueil={() => setPage("visiteur")}
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
