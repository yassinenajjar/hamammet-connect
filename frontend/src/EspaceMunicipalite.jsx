
import { useState } from "react";

const STATUTS_ADMIN = [
  "Reçue",
  "En cours",
  "Traitée",
  "Refusée",
];

function EspaceMunicipalite({
  reclamations,
  setReclamations,
  retour,
}) {
  const [filtre, setFiltre] = useState("Tous");
  const [motifs, setMotifs] = useState({});
  const [notes, setNotes] = useState({});
  const [erreurs, setErreurs] = useState({});

  function modifierStatut(id, nouveauStatut) {
    const motif = (motifs[id] || "").trim();

    if (nouveauStatut === "Refusée" && !motif) {
      setErreurs((anciens) => ({
        ...anciens,
        [id]: "Le motif du refus est obligatoire.",
      }));
      return;
    }

    setErreurs((anciens) => ({
      ...anciens,
      [id]: "",
    }));

    setReclamations((anciennes) =>
      anciennes.map((r) =>
        r.id === id
          ? {
              ...r,
              statut: nouveauStatut,
              motifRefus: nouveauStatut === "Refusée" ? motif : "",
              noteMunicipalite: (notes[id] || "").trim(),
            }
          : r
      )
    );
  }

  const liste = reclamations.filter(
    (r) => filtre === "Tous" || r.statut === filtre
  );

  function classeStatut(statut) {
    if (statut === "En cours") return "hc-status hc-status-progress";
    if (statut === "Traitée") return "hc-status hc-status-done";
    if (statut === "Refusée") return "hc-status hc-status-rejected";
    return "hc-status";
  }

  return (
    <main className="hc-main">
      <section className="hc-page-heading">
        <div>
          <span className="hc-eyebrow">ADMINISTRATION</span>
          <h1>Espace municipalité</h1>
          <p>
            Consulte les signalements et mets à jour leur traitement.
          </p>
        </div>

        <button className="hc-button hc-outline" onClick={retour}>
          Déconnexion
        </button>
      </section>

      <section className="hc-dashboard-stats">
        <article>
          <span>▤</span>
          <small>Total des réclamations</small>
          <strong>{reclamations.length}</strong>
        </article>

        <article>
          <span>◷</span>
          <small>À traiter</small>
          <strong>
            {reclamations.filter((r) => r.statut === "Reçue").length}
          </strong>
        </article>

        <article>
          <span>✓</span>
          <small>Traitées</small>
          <strong>
            {reclamations.filter((r) => r.statut === "Traitée").length}
          </strong>
        </article>
      </section>

      <section className="hc-panel">
        <div className="hc-section-heading">
          <div>
            <span className="hc-eyebrow">GESTION</span>
            <h2>Liste des réclamations</h2>
            <p className="hc-muted">
              Les changements sont visibles dans le prototype.
            </p>
          </div>
        </div>

        <div className="hc-filter-row">
          {["Tous", ...STATUTS_ADMIN].map((statut) => (
            <button
              key={statut}
              className={filtre === statut ? "selected" : ""}
              onClick={() => setFiltre(statut)}
            >
              {statut}
            </button>
          ))}
        </div>

        {liste.length === 0 ? (
          <div className="hc-empty">
            <div className="hc-empty-icon">▤</div>
            <h3>Aucune réclamation</h3>
            <p>
              Les réclamations envoyées apparaîtront ici.
            </p>
          </div>
        ) : (
          liste.map((r) => (
            <article className="hc-report" key={r.id}>
              <div className="hc-report-header">
                <div>
                  <h3>{r.titre}</h3>
                  <p className="hc-muted">
                    {r.categorie} · {r.lieu} · {r.date}
                  </p>
                </div>

                <span className={classeStatut(r.statut)}>
                  {r.statut}
                </span>
              </div>

              <p>{r.description || "Aucune description écrite."}</p>

              <p className="hc-muted">
                Auteur : {r.nomAuteur || "Visiteur"}
                {r.emailAuteur ? ` · ${r.emailAuteur}` : " · Sans compte"}
              </p>

              {r.fichiers?.length > 0 && (
                <div className="hc-report-media">
                  {r.fichiers.map((fichier) =>
                    fichier.type.startsWith("video/") ? (
                      <video
                        key={fichier.id}
                        src={fichier.url}
                        controls
                      />
                    ) : (
                      <img
                        key={fichier.id}
                        src={fichier.url}
                        alt={fichier.nom}
                      />
                    )
                  )}
                </div>
              )}

              {r.audioUrl && (
                <div className="hc-field">
                  <span className="hc-label">Message vocal</span>
                  <audio
                    className="hc-audio-player"
                    src={r.audioUrl}
                    controls
                  />
                </div>
              )}

              {r.motifRefus && (
                <p className="hc-message hc-error">
                  <strong>Motif du refus :</strong> {r.motifRefus}
                </p>
              )}

              <div className="hc-field" style={{ marginTop: 18 }}>
                <label htmlFor={`motif-${r.id}`}>
                  Motif du refus (obligatoire si refusée)
                </label>
                <textarea
                  id={`motif-${r.id}`}
                  value={motifs[r.id] ?? r.motifRefus ?? ""}
                  onChange={(e) =>
                    setMotifs((anciens) => ({
                      ...anciens,
                      [r.id]: e.target.value,
                    }))
                  }
                  rows={2}
                  maxLength={1000}
                  placeholder="Explique pourquoi la réclamation est refusée..."
                />
              </div>

              <div className="hc-field">
                <label htmlFor={`note-${r.id}`}>
                  Note destinée au citoyen
                </label>
                <textarea
                  id={`note-${r.id}`}
                  value={notes[r.id] ?? r.noteMunicipalite ?? ""}
                  onChange={(e) =>
                    setNotes((anciens) => ({
                      ...anciens,
                      [r.id]: e.target.value,
                    }))
                  }
                  rows={2}
                  maxLength={1000}
                  placeholder="Informations complémentaires sur le traitement..."
                />
              </div>

              {erreurs[r.id] && (
                <p className="hc-message hc-error" role="alert">
                  {erreurs[r.id]}
                </p>
              )}

              <div className="hc-actions" style={{ marginTop: 14 }}>
                {STATUTS_ADMIN.map((statut) => (
                  <button
                    key={statut}
                    className={
                      statut === "Refusée"
                        ? "hc-button hc-danger"
                        : statut === "Traitée"
                          ? "hc-button hc-success"
                          : "hc-button hc-outline"
                    }
                    onClick={() => modifierStatut(r.id, statut)}
                  >
                    {statut === "Reçue"
                      ? "Marquer reçue"
                      : statut === "En cours"
                        ? "Mettre en cours"
                        : statut === "Traitée"
                          ? "Marquer traitée"
                          : "Refuser"}
                  </button>
                ))}
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

export default EspaceMunicipalite;
