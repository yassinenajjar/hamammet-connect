import { useEffect, useRef, useState } from "react";

const MAX_FICHIERS = 5;
const MAX_TAILLE = 50 * 1024 * 1024;

function FormReclamation({ onSubmit, message, utilisateur }) {
  const [titre, setTitre] = useState("");
  const [categorie, setCategorie] = useState("Propreté");
  const [lieu, setLieu] = useState("");
  const [description, setDescription] = useState("");
  const [fichiers, setFichiers] = useState([]);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);

  const galerieRef = useRef(null);
  const cameraRef = useRef(null);
  const videoRef = useRef(null);
  const recorderRef = useRef(null);
  const fluxRef = useRef(null);
  const morceauxRef = useRef([]);

  useEffect(() => {
    return () => {
      fichiers.forEach((f) => URL.revokeObjectURL(f.url));

      if (audioUrl) URL.revokeObjectURL(audioUrl);

      fluxRef.current?.getTracks().forEach((track) => {
        track.stop();
      });
    };
    // Nettoyage à la fermeture du composant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function choisirFichiers(e) {
    const selection = Array.from(e.target.files || []);
    e.target.value = "";

    if (!selection.length) return;

    setErreur("");

    const valides = [];

    for (const fichier of selection) {
      if (
        !fichier.type.startsWith("image/") &&
        !fichier.type.startsWith("video/")
      ) {
        setErreur("Choisis uniquement des images ou des vidéos.");
        continue;
      }

      if (fichier.size > MAX_TAILLE) {
        setErreur(`${fichier.name} dépasse la limite de 50 Mo.`);
        continue;
      }

      valides.push(fichier);
    }

    const disponible = MAX_FICHIERS - fichiers.length;
    const ajoutes = valides.slice(0, Math.max(0, disponible));

    if (valides.length > disponible) {
      setErreur("Tu peux joindre au maximum 5 fichiers.");
    }

    if (ajoutes.length) {
      setFichiers((anciens) => [
        ...anciens,
        ...ajoutes.map((fichier) => ({
          id: crypto.randomUUID(),
          fichier,
          nom: fichier.name,
          type: fichier.type,
          url: URL.createObjectURL(fichier),
        })),
      ]);
    }
  }

  function supprimerFichier(id) {
    setFichiers((anciens) => {
      const element = anciens.find((f) => f.id === id);

      if (element) URL.revokeObjectURL(element.url);

      return anciens.filter((f) => f.id !== id);
    });
  }

  async function demarrerEnregistrement() {
    setErreur("");

    if (
      !navigator.mediaDevices?.getUserMedia ||
      !window.MediaRecorder
    ) {
      setErreur(
        "L'enregistrement vocal n'est pas disponible dans ce navigateur."
      );
      return;
    }

    let flux;

    try {
      flux = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      fluxRef.current = flux;
      morceauxRef.current = [];

      const recorder = new MediaRecorder(flux);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          morceauxRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(morceauxRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        flux.getTracks().forEach((track) => track.stop());
        fluxRef.current = null;

        if (blob.size > MAX_TAILLE) {
          setErreur("L'enregistrement dépasse 50 Mo.");
        } else if (blob.size > 0) {
          setAudioBlob(blob);
          setAudioUrl(URL.createObjectURL(blob));
        }

        setEnregistrement(false);
      };

      recorder.start();
      setEnregistrement(true);
    } catch {
      flux?.getTracks().forEach((track) => track.stop());
      fluxRef.current = null;

      setErreur(
        "Impossible d'accéder au microphone. Vérifie les autorisations."
      );
    }
  }

  function arreterEnregistrement() {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  }

  function supprimerAudio() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);

    setAudioUrl("");
    setAudioBlob(null);
  }

  function envoyer(e) {
    e.preventDefault();
    setErreur("");

    if (!titre.trim() || !lieu.trim()) {
      setErreur("Le titre et le lieu sont obligatoires.");
      return;
    }

    if (!description.trim() && !audioBlob) {
      setErreur(
        "Ajoute une description écrite ou enregistre un message vocal."
      );
      return;
    }

    if (!description.trim() && fichiers.length === 0 && !audioBlob) {
      setErreur("Ajoute au moins un élément pour décrire le problème.");
      return;
    }

    setEnvoi(true);

    try {
      onSubmit({
        titre: titre.trim(),
        categorie,
        lieu: lieu.trim(),
        description: description.trim(),
        fichiers: fichiers.map((f) => ({
          ...f,
        })),
        audioBlob,
        audioUrl,
      });

      setTitre("");
      setCategorie("Propreté");
      setLieu("");
      setDescription("");
      setFichiers([]);
      setAudioBlob(null);
      setAudioUrl("");
      setErreur("");

      if (galerieRef.current) galerieRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
      if (videoRef.current) videoRef.current.value = "";
    } catch {
      setErreur("Une erreur est survenue. Réessaie.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <section className="hc-panel" id="signaler">
      <div className="hc-section-heading">
        <div>
          <span className="hc-eyebrow">ON VOUS ÉCOUTE</span>
          <h2>Décris le problème</h2>
          <p className="hc-muted">
            Les champs marqués d'un * sont obligatoires.
          </p>
        </div>

        <span className="hc-heading-symbol">✦</span>
      </div>

      {message && (
        <p className="hc-message hc-notice" role="status">
          {message}
        </p>
      )}

      <form className="hc-form" onSubmit={envoyer}>
        <div className="hc-field">
          <label htmlFor="reclamation-titre">
            Titre du signalement *
          </label>

          <input
            id="reclamation-titre"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            placeholder="Ex. : Dépôt sauvage de déchets"
            maxLength={100}
            required
          />
        </div>

        <div className="hc-form-grid">
          <div className="hc-field">
            <label htmlFor="reclamation-categorie">
              Catégorie *
            </label>

            <select
              id="reclamation-categorie"
              value={categorie}
              onChange={(e) => setCategorie(e.target.value)}
              required
            >
              <option>Propreté</option>
              <option>Éclairage public</option>
              <option>Voirie et trottoirs</option>
              <option>Eau et assainissement</option>
              <option>Espaces verts</option>
              <option>Sécurité et mobilier urbain</option>
              <option>Autre</option>
            </select>
          </div>

          <div className="hc-field">
            <label htmlFor="reclamation-lieu">
              Lieu précis *
            </label>

            <input
              id="reclamation-lieu"
              value={lieu}
              onChange={(e) => setLieu(e.target.value)}
              placeholder="Rue, quartier, repère..."
              maxLength={200}
              required
            />
          </div>
        </div>

        <div className="hc-field">
          <label htmlFor="reclamation-description">
            Description écrite
          </label>

          <textarea
            id="reclamation-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explique ce qui se passe et où se trouve le problème..."
            maxLength={1500}
            rows={5}
          />

          <span className="hc-counter">
            {description.length}/1500 caractères
          </span>
        </div>

        <div className="hc-field">
          <span className="hc-label">Photo ou vidéo</span>

          <p className="hc-muted">
            Galerie, caméra ou vidéo. Maximum 5 fichiers, 50 Mo par fichier.
          </p>

          <div className="hc-media-picker">
            <button
              type="button"
              className="hc-media-option"
              onClick={() => galerieRef.current?.click()}
            >
              <span className="hc-media-icon">▧</span>
              <span className="hc-media-text">
                <strong>Galerie / fichiers</strong>
                <small>Image ou vidéo</small>
              </span>
            </button>

            <button
              type="button"
              className="hc-media-option"
              onClick={() => cameraRef.current?.click()}
            >
              <span className="hc-media-icon">◎</span>
              <span className="hc-media-text">
                <strong>Prendre une photo</strong>
                <small>Caméra</small>
              </span>
            </button>

            <button
              type="button"
              className="hc-media-option"
              onClick={() => videoRef.current?.click()}
            >
              <span className="hc-media-icon">▣</span>
              <span className="hc-media-text">
                <strong>Filmer</strong>
                <small>Vidéo</small>
              </span>
            </button>
          </div>

          <input
            ref={galerieRef}
            className="hc-hidden-input"
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={choisirFichiers}
          />

          <input
            ref={cameraRef}
            className="hc-hidden-input"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={choisirFichiers}
          />

          <input
            ref={videoRef}
            className="hc-hidden-input"
            type="file"
            accept="video/*"
            capture="environment"
            onChange={choisirFichiers}
          />
        </div>

        {fichiers.length > 0 && (
          <div className="hc-preview-grid">
            {fichiers.map((fichier) => (
              <div className="hc-preview" key={fichier.id}>
                {fichier.type.startsWith("video/") ? (
                  <video src={fichier.url} controls />
                ) : (
                  <img src={fichier.url} alt={fichier.nom} />
                )}

                <div className="hc-preview-footer">
                  <span title={fichier.nom}>{fichier.nom}</span>

                  <button
                    type="button"
                    onClick={() => supprimerFichier(fichier.id)}
                  >
                    Retirer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="hc-field">
          <span className="hc-label">Description vocale</span>

          <div className="hc-voice-box">
            <span className="hc-voice-icon">♫</span>

            <div className="hc-voice-content">
              <strong>Explique le problème avec ta voix</strong>

              <p>
                Autorise le microphone pour enregistrer ton message.
                La transcription automatique sera ajoutée plus tard.
              </p>

              {audioUrl && (
                <audio
                  className="hc-audio-player"
                  src={audioUrl}
                  controls
                />
              )}
            </div>

            {!enregistrement && !audioUrl && (
              <button
                type="button"
                className="hc-button hc-outline"
                onClick={demarrerEnregistrement}
              >
                ● Enregistrer
              </button>
            )}

            {enregistrement && (
              <button
                type="button"
                className="hc-button hc-danger"
                onClick={arreterEnregistrement}
              >
                ■ Arrêter
              </button>
            )}

            {audioUrl && !enregistrement && (
              <button
                type="button"
                className="hc-button hc-light"
                onClick={supprimerAudio}
              >
                Supprimer
              </button>
            )}
          </div>
        </div>

        {erreur && (
          <p className="hc-message hc-error" role="alert">
            {erreur}
          </p>
        )}

        <div className="hc-submit-row">
          <p>
            {utilisateur?.role === "citoyen"
              ? "Ton signalement sera associé à ton compte."
              : "Tu peux signaler un problème sans compte. Le suivi sera réservé aux citoyens connectés."}
          </p>

          <button
            type="submit"
            className="hc-button hc-primary"
            disabled={envoi || enregistrement}
          >
            {envoi
              ? "Envoi en cours..."
              : "Envoyer le signalement →"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default FormReclamation;