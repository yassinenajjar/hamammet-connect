import { useEffect, useRef, useState } from "react";
import { Mic, Paperclip, Send, X } from "lucide-react";
import { prepareReportWithAssistant } from "../api.js";
import LocationPicker from "./LocationPicker.jsx";

const MAX_FICHIERS = 5;
const MAX_TAILLE = 20 * 1024 * 1024;
const LANGUES_VOCALES = [
  { code: "fr-FR", label: "Français" },
  { code: "ar-TN", label: "Arabe tunisien" },
  { code: "ar-SA", label: "Arabe standard" },
  { code: "en-US", label: "English" },
];

function FormReclamation({ onSubmit, message, utilisateur }) {
  const [lieu, setLieu] = useState("");
  const [point, setPoint] = useState(null);
  const [description, setDescription] = useState("");
  const [messages, setMessages] = useState([]);
  const [prepared, setPrepared] = useState(null);
  const [categories, setCategories] = useState([]);
  const [fichiers, setFichiers] = useState([]);
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [analyse, setAnalyse] = useState(false);
  const [modification, setModification] = useState(false);
  const [ecoute, setEcoute] = useState(false);
  const [langueVocale, setLangueVocale] = useState("fr-FR");
  const [aideVocale, setAideVocale] = useState("");
  const [adresseProposee, setAdresseProposee] = useState("");

  const fichiersRef = useRef([]);
  const fichierInputRef = useRef(null);
  const reconnaissanceRef = useRef(null);
  const transcriptionBaseRef = useRef("");
  const conversationRef = useRef(null);
  const saisieRef = useRef(null);
  const SpeechRecognition = typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

  fichiersRef.current = fichiers;

  useEffect(() => {
    return () => {
      reconnaissanceRef.current?.abort();
      fichiersRef.current.forEach((fichier) => URL.revokeObjectURL(fichier.url));
    };
  }, []);

  useEffect(() => {
    conversationRef.current?.scrollTo({ top: conversationRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, prepared]);

  function choisirFichiers(event) {
    const selection = Array.from(event.target.files || []);
    event.target.value = "";
    if (!selection.length) return;

    setErreur("");
    const valides = [];
    for (const fichier of selection) {
      if (!fichier.type.startsWith("image/") && !fichier.type.startsWith("video/")) {
        setErreur("Choisis uniquement des images ou des vidéos.");
        continue;
      }
      if (fichier.size > MAX_TAILLE) {
        setErreur(`${fichier.name} dépasse la limite de 20 Mo.`);
        continue;
      }
      valides.push(fichier);
    }

    const disponible = MAX_FICHIERS - fichiers.length;
    const ajoutes = valides.slice(0, Math.max(0, disponible));
    if (valides.length > disponible) setErreur("Tu peux joindre au maximum 5 fichiers.");

    if (ajoutes.length) {
      setFichiers((anciens) => [
        ...anciens,
        ...ajoutes.map((fichier) => ({
          id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
          fichier,
          nom: fichier.name,
          url: URL.createObjectURL(fichier),
        })),
      ]);
    }
  }

  function supprimerFichier(id) {
    setFichiers((anciens) => {
      const element = anciens.find((fichier) => fichier.id === id);
      if (element) URL.revokeObjectURL(element.url);
      return anciens.filter((fichier) => fichier.id !== id);
    });
  }

  function demarrerEcoute() {
    setErreur("");
    setAideVocale("");
    if (!SpeechRecognition) {
      setAideVocale("La dictée vocale n’est pas disponible dans ce navigateur. Tu peux continuer par écrit.");
      return;
    }

    try {
      const reconnaissance = new SpeechRecognition();
      reconnaissance.lang = langueVocale;
      reconnaissance.interimResults = true;
      reconnaissance.continuous = true;
      transcriptionBaseRef.current = description.trim();
      const speechResultState = { transcribed: false, failed: false };
      reconnaissanceRef.current = reconnaissance;
      reconnaissance.onresult = (event) => {
        const parties = [];
        for (let index = 0; index < event.results.length; index += 1) {
          const texte = event.results[index][0]?.transcript?.trim();
          if (texte) parties.push(texte);
        }
        if (parties.length) {
          speechResultState.transcribed = true;
          setDescription([transcriptionBaseRef.current, parties.join(" ")].filter(Boolean).join(" ").slice(0, 1500));
        }
      };
      reconnaissance.onerror = (event) => {
        speechResultState.failed = true;
        setEcoute(false);
        setAideVocale(event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "L’autorisation du microphone a été refusée. Tu peux continuer par écrit ou autoriser le microphone dans le navigateur."
          : "La dictée vocale a échoué ou n’est pas disponible pour cette langue. Tu peux continuer par écrit.");
      };
      reconnaissance.onend = () => {
        setEcoute(false);
        reconnaissanceRef.current = null;
        if (!speechResultState.transcribed && !speechResultState.failed) {
          setAideVocale("Aucune transcription n’a été reçue. Réessaie ou continue par écrit.");
        }
      };
      reconnaissance.start();
      setEcoute(true);
    } catch {
      reconnaissanceRef.current = null;
      setEcoute(false);
      setAideVocale("Impossible de démarrer la dictée vocale. Vérifie l’autorisation du microphone ou continue par écrit.");
    }
  }

  function arreterEcoute() {
    reconnaissanceRef.current?.stop();
    setEcoute(false);
  }

  async function envoyerMessage() {
    const texte = description.trim();
    if (!texte || analyse || envoi) return;
    if (texte.length > 1500) {
      setErreur("Le message ne peut pas dépasser 1 500 caractères.");
      return;
    }
    if (messages.length >= 29) {
      setErreur("Cette conversation a atteint sa limite. Tu peux confirmer le résumé ou recommencer un signalement.");
      return;
    }

    setErreur("");
    setAnalyse(true);
    const history = [...messages, { role: "user", content: texte }];
    try {
      const payload = await prepareReportWithAssistant(history);
      const result = payload?.data;
      if (!result || !["needs_clarification", "ready_for_review"].includes(result.status)) {
        throw new Error("La réponse de l’assistant est invalide. Réessaie.");
      }
      if (Array.isArray(result.categories)) setCategories(result.categories);

      if (result.status === "ready_for_review") {
        if (!result.title || !result.description || !result.category || !result.categories?.includes(result.category)) {
          throw new Error("Le résumé préparé est incomplet. Envoie une précision pour continuer.");
        }
        setPrepared({ title: result.title, category: result.category, description: result.description });
        setModification(false);
        setAdresseProposee(result.location_text || "");
        if (!lieu.trim() && result.location_text) setLieu(result.location_text);
      }

      const reply = result.status === "needs_clarification"
        ? result.question
        : "J’ai préparé un résumé. Vérifie les informations avant de confirmer le signalement.";
      setMessages([...history, { role: "assistant", content: reply }]);
      setDescription("");
    } catch (error) {
      setErreur(error.message || "L’assistant est indisponible. Ton message a été conservé, réessaie.");
    } finally {
      setAnalyse(false);
      saisieRef.current?.focus();
    }
  }

  async function confirmerSignalement() {
    setErreur("");
    if (!prepared?.title.trim() || !prepared?.category || !prepared?.description.trim()) {
      setErreur("Vérifie le titre, la catégorie et la description du résumé.");
      return;
    }
    if (!categories.includes(prepared.category)) {
      setErreur("La catégorie sélectionnée n’est plus disponible. Choisis une catégorie autorisée.");
      return;
    }
    if (!lieu.trim() && !point) {
      setErreur("Indique une adresse ou sélectionne un point sur la carte.");
      return;
    }

    setEnvoi(true);
    try {
      const result = await onSubmit({
        titre: prepared.title.trim(),
        categorie: prepared.category,
        lieu: lieu.trim(),
        latitude: point?.[0] ?? null,
        longitude: point?.[1] ?? null,
        description: prepared.description.trim(),
        fichiers: fichiers.map((fichier) => fichier.fichier),
      });
      if (result?.error) throw new Error(result.error);

      fichiersRef.current.forEach((fichier) => URL.revokeObjectURL(fichier.url));
      setLieu("");
      setPoint(null);
      setDescription("");
      setMessages([]);
      setPrepared(null);
      setFichiers([]);
      setModification(false);
      setAdresseProposee("");
      setErreur("");
      if (fichierInputRef.current) fichierInputRef.current.value = "";
    } catch (error) {
      setErreur(error.message || "Une erreur est survenue. Réessaie.");
    } finally {
      setEnvoi(false);
    }
  }

  const statutLabels = { new: "Nouveau", in_progress: "En cours", transferred: "Transmis", resolved: "Résolu", rejected: "Rejeté" };

  return (
    <section className="hc-panel" id="signaler">
      <div className="hc-section-heading">
        <div>
          <span className="hc-eyebrow">ON VOUS ÉCOUTE</span>
          <h2>Décris le problème</h2>
          <p className="hc-muted">L’assistant prépare un résumé que tu peux vérifier avant l’envoi.</p>
        </div>
        <span className="hc-heading-symbol">✦</span>
      </div>

      {message && (
        <div className="hc-message hc-notice hc-confirmation" role="status" aria-live="polite">
          <strong>Signalement envoyé</strong>
          <p>Référence : <b>{message.reference}</b> · Statut : <b>{statutLabels[message.status] || message.status}</b></p>
          {message.trackingSecret ? <><p>Conserve ce code secret pour consulter le suivi.</p><code>{message.trackingSecret}</code><a href="#suivi-anonyme">Accéder au suivi</a></> : <p>Tu retrouveras son suivi dans ton espace personnel.</p>}
        </div>
      )}

      <form className="hc-form hc-report-form" onSubmit={(event) => event.preventDefault()}>
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hc-honeypot" />

        <section className="hc-conversation" aria-label="Conversation de préparation du signalement">
          <div className="hc-conversation-heading">
            <div><strong>Assistant de signalement</strong><span>Décris le problème dans la langue de ton choix.</span></div>
            <span className="hc-ai-badge">IA</span>
          </div>

          {messages.length > 0 && (
            <div className="hc-chat-history" ref={conversationRef} aria-live="polite">
              {messages.map((item, index) => (
                <div className={`hc-chat-message ${item.role === "user" ? "hc-chat-user" : "hc-chat-assistant"}`} key={`${item.role}-${index}`}>
                  <span>{item.role === "user" ? "Toi" : "Assistant"}</span>
                  <p>{item.content}</p>
                </div>
              ))}
              {analyse && <div className="hc-chat-message hc-chat-assistant"><span>Assistant</span><p>Je comprends ton message…</p></div>}
            </div>
          )}

          {!prepared && (
            <div className="hc-composer">
              <label className="hc-sr-only" htmlFor="reclamation-description">Décris le problème</label>
              <textarea
                ref={saisieRef}
                id="reclamation-description"
                value={description}
                onChange={(event) => setDescription(event.target.value.slice(0, 1500))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                    event.preventDefault();
                    envoyerMessage();
                  }
                }}
                placeholder="Décris le problème que tu as constaté…"
                maxLength={1500}
                rows={4}
                disabled={analyse}
              />
              <div className="hc-composer-actions">
                <div className="hc-composer-tools">
                  <select aria-label="Langue de dictée" value={langueVocale} onChange={(event) => setLangueVocale(event.target.value)}>
                    {LANGUES_VOCALES.map((langue) => <option key={langue.code} value={langue.code}>{langue.label}</option>)}
                  </select>
                  <button type="button" className={`hc-icon-button ${ecoute ? "is-listening" : ""}`} onClick={ecoute ? arreterEcoute : demarrerEcoute} aria-label={ecoute ? "Arrêter la dictée" : "Dicter le message"} title={ecoute ? "Arrêter l’écoute" : "Dicter le message"}>
                    {ecoute ? <><span className="hc-recording-dot" /> Arrêter</> : <Mic size={17} aria-hidden="true" />}
                  </button>
                  <button type="button" className="hc-attach-button" onClick={() => fichierInputRef.current?.click()} disabled={fichiers.length >= MAX_FICHIERS}>
                    <Paperclip size={15} aria-hidden="true" /> Joindre un fichier
                  </button>
                  <input ref={fichierInputRef} type="file" accept="image/*,video/*" multiple className="hc-hidden-input" onChange={choisirFichiers} />
                </div>
                <span className="hc-counter">{description.length}/1500</span>
                <button type="button" className="hc-button hc-primary hc-send-message" onClick={envoyerMessage} disabled={!description.trim() || analyse}>
                  {analyse ? "Analyse…" : <>Envoyer <Send size={15} aria-hidden="true" /></>}
                </button>
              </div>
              <small className="hc-composer-hint">Ctrl + Entrée pour envoyer. La dictée dépend des langues proposées par ton navigateur.</small>
              {ecoute && <p className="hc-voice-status" role="status"><span className="hc-recording-dot" /> Écoute en cours… Parle, puis appuie sur « Arrêter ».</p>}
              {aideVocale && <p className="hc-voice-help" role="status">{aideVocale}</p>}
            </div>
          )}

          {fichiers.length > 0 && (
            <ul className="hc-attachment-list" aria-label="Fichiers joints">
              {fichiers.map((fichier) => (
                <li key={fichier.id}>
                  <span className="hc-file-type">{fichier.fichier.type.startsWith("video/") ? "VIDÉO" : "IMAGE"}</span>
                  <span className="hc-file-name" title={fichier.nom}>{fichier.nom}</span>
                  <button type="button" onClick={() => supprimerFichier(fichier.id)} aria-label={`Retirer ${fichier.nom}`}><X size={16} /><span>Retirer</span></button>
                </li>
              ))}
              <li className="hc-attachment-limit">Images ou vidéos · maximum 5 fichiers, 20 Mo chacun.</li>
            </ul>
          )}
        </section>

        <div className="hc-field">
          <label htmlFor="reclamation-lieu">Adresse (facultative si tu places le point)</label>
          <input id="reclamation-lieu" value={lieu} onChange={(event) => setLieu(event.target.value)} placeholder="Rue, quartier, repère…" maxLength={200} />
          {adresseProposee && lieu === adresseProposee && <small className="hc-muted">Adresse proposée d’après la conversation — vérifie-la avant l’envoi. Aucun point GPS n’a été déduit.</small>}
        </div>

        <div className="hc-field">
          <span className="hc-label">Point sur la carte</span>
          <p className="hc-muted">Clique sur la carte pour indiquer l’emplacement. L’adresse, le point ou les deux sont acceptés.</p>
          <LocationPicker value={point} onChange={setPoint} />
          {point && <small>{point[0].toFixed(5)}, {point[1].toFixed(5)} <button type="button" onClick={() => setPoint(null)}>Retirer le point</button></small>}
        </div>

        {prepared && (
          <section className="hc-report-summary" aria-labelledby="hc-summary-title">
            <div className="hc-summary-heading">
              <div><span className="hc-eyebrow">À VÉRIFIER AVANT ENVOI</span><h3 id="hc-summary-title">Résumé préparé par l’assistant</h3></div>
              <button type="button" className="hc-summary-edit" onClick={() => setModification((value) => !value)}>{modification ? "Terminer la modification" : "Modifier"}</button>
            </div>

            {modification ? (
              <div className="hc-summary-editor">
                <label className="hc-field">Titre proposé<input value={prepared.title} maxLength={100} onChange={(event) => setPrepared({ ...prepared, title: event.target.value })} /></label>
                <label className="hc-field">Catégorie proposée<select value={prepared.category} onChange={(event) => setPrepared({ ...prepared, category: event.target.value })}>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
                <label className="hc-field">Description<textarea value={prepared.description} maxLength={1500} rows={4} onChange={(event) => setPrepared({ ...prepared, description: event.target.value })} /></label>
                <p className="hc-muted">L’adresse et le point se modifient dans les champs de localisation ci-dessus.</p>
              </div>
            ) : (
              <dl className="hc-summary-details">
                <div><dt>Titre proposé</dt><dd>{prepared.title}</dd></div>
                <div><dt>Catégorie proposée</dt><dd>{prepared.category}</dd></div>
                <div><dt>Description</dt><dd>{prepared.description}</dd></div>
                <div><dt>Adresse connue</dt><dd>{lieu.trim() || "Aucune adresse indiquée"}{adresseProposee && lieu === adresseProposee ? <small>À vérifier</small> : null}</dd></div>
                <div><dt>Point sur la carte</dt><dd>{point ? `${point[0].toFixed(5)}, ${point[1].toFixed(5)}` : "Aucun point sélectionné"}</dd></div>
                <div><dt>Pièces jointes</dt><dd>{fichiers.length ? fichiers.map((fichier) => fichier.nom).join(", ") : "Aucune pièce jointe"}</dd></div>
              </dl>
            )}
            <p className="hc-summary-location-note">L’adresse est une proposition textuelle à vérifier. L’assistant ne détermine pas de coordonnées géographiques.</p>
          </section>
        )}

        {erreur && <p className="hc-message hc-error" role="alert">{erreur}</p>}

        <div className="hc-submit-row">
          <p>{utilisateur?.role === "citoyen" ? "Ton signalement sera associé à ton compte." : "Tu peux signaler un problème sans compte. Un code secret permettra le suivi."}</p>
          {prepared ? (
            <button type="button" className="hc-button hc-primary" onClick={confirmerSignalement} disabled={envoi || analyse}>
              {envoi ? "Enregistrement…" : "Confirmer le signalement →"}
            </button>
          ) : (
            <button type="button" className="hc-button hc-primary" onClick={() => saisieRef.current?.focus()} disabled={envoi || analyse}>
              Continue la conversation pour préparer le signalement
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

export default FormReclamation;
