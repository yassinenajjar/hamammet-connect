import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import { LocateFixed, MapPin, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react'
import { statusLabels, urgencyColors, urgencyLabels } from '../data/reportOptions'
import { useReports } from '../hooks/useReports'
import 'leaflet/dist/leaflet.css'

const HAMMAMET = [36.400, 10.616]
const pinIcon = (report) => {
  const color = report.status === 'resolved' ? '#16A34A' : urgencyColors[report.urgency] || '#64748B'
  return L.divIcon({ className: 'pin-wrap', html: `<span class="map-pin" style="--pin:${color}"><i></i></span>`, iconSize: [30, 38], iconAnchor: [15, 36], popupAnchor: [0, -34] })
}
function MapController({ selected, reports, focusReport, compact }) {
  const map = useMap()
  useEffect(() => {
    if (selected?.coordinates) map.flyTo(selected.coordinates, Math.max(map.getZoom(), 16), { duration: 0.5 })
    else if (focusReport?.coordinates) map.setView(focusReport.coordinates, 16)
    else if (reports.some((report) => report.coordinates)) map.fitBounds(L.latLngBounds(reports.filter((report) => report.coordinates).map((report) => report.coordinates)), { padding: compact ? [18, 18] : [48, 48], maxZoom: 14 })
  }, [selected, reports, focusReport, compact, map])
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }))
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map])
  useEffect(() => {
    const recenter = () => map.flyTo(HAMMAMET, 14, { duration: 0.5 })
    window.addEventListener('map-recenter', recenter)
    return () => window.removeEventListener('map-recenter', recenter)
  }, [map])
  return null
}

export default function IssueMap({ compact = false, focusReport = null }) {
  const { reports, loading: reportsLoading } = useReports()
  const [category, setCategory] = useState('')
  const [urgency, setUrgency] = useState('')
  const [status, setStatus] = useState('')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [panelOpen, setPanelOpen] = useState(() => !window.matchMedia('(max-width: 700px)').matches)
  const [tilesReady, setTilesReady] = useState(false)
  const [tileError, setTileError] = useState(false)
  const filtered = useMemo(() => reports.filter((r) => (!focusReport || r.id === focusReport.id) &&
    r.coordinates && (!category || r.category === category) && (!urgency || r.urgency === urgency) && (!status || r.status === status) &&
    `${r.title} ${r.id} ${r.category} ${r.location}`.toLowerCase().includes(query.toLowerCase())), [reports, category, urgency, status, query, focusReport])
  const selected = filtered.find((r) => r.id === selectedId) ?? null
  const cats = [...new Set(reports.map((r) => r.category))]

  return <section className={`map-panel ${compact ? 'map-compact' : `map-gis ${panelOpen ? '' : 'map-gis-collapsed'}`}`}>
    {!compact && <aside className={`gis-sidebar ${panelOpen ? '' : 'gis-sidebar-closed'}`}>
      <div className="gis-panel-heading"><div><div className="eyebrow"><span className="live-dot"/> DONNÉES SYNCHRONISÉES</div><h2>Signalements <span>{filtered.length}</span></h2></div><button className="map-panel-toggle" aria-label={panelOpen ? 'Réduire le panneau' : 'Ouvrir le panneau'} onClick={() => setPanelOpen(!panelOpen)}>{panelOpen ? <PanelLeftClose size={17}/> : <PanelLeftOpen size={17}/>}</button></div>
      {panelOpen && <>
        <label className="gis-search"><Search size={15}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un lieu ou signalement" aria-label="Rechercher sur la carte"/></label>
    <div className="gis-filters"><select value={category} onChange={(e)=>setCategory(e.target.value)} aria-label="Filtrer par catégorie"><option value="">Toutes catégories</option>{cats.map(c=><option key={c} value={c}>{c}</option>)}</select><select value={urgency} onChange={(e)=>setUrgency(e.target.value)} aria-label="Filtrer par urgence"><option value="">Toutes urgences</option><option value="critical">Critique</option><option value="high">Élevée</option><option value="normal">Normale</option></select><select value={status} onChange={(e)=>setStatus(e.target.value)} aria-label="Filtrer par statut"><option value="">Tous statuts</option>{Object.entries(statusLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></div>
        <div className="gis-results" aria-label="Réclamations visibles sur la carte">{reportsLoading ? <div className="gis-empty">Chargement des signalements…</div> : filtered.length ? filtered.map((r)=><button key={r.id} onClick={()=>setSelectedId(r.id)} className={`gis-report ${selectedId===r.id?'is-selected':''}`}><span className="gis-pin" style={{'--pin':r.status==='resolved'?'#16A34A':urgencyColors[r.urgency]}}><MapPin size={16}/></span><span><b>{r.title}</b><small>{r.id} · {r.location}</small><span className="gis-badges"><i className={`badge urgency-${r.urgency}`}>{urgencyLabels[r.urgency]}</i><i className={`badge status-${r.status}`}>{statusLabels[r.status]}</i></span></span></button>) : <div className="gis-empty">Aucun résultat. Essayez d’alléger les filtres.</div>}</div>
        <div className="gis-legend"><b>LÉGENDE</b><span><i style={{background:'#DC2626'}}/>Critique</span><span><i style={{background:'#EA580C'}}/>Élevée</span><span><i style={{background:'#CA8A04'}}/>Normale</span><span><i style={{background:'#16A34A'}}/>Résolue</span><small>Le nombre d’un groupe représente les réclamations, pas leur gravité.</small></div>
        {selected && <div className="gis-selected"><small>RÉCLAMATION SÉLECTIONNÉE</small><b>{selected.title}</b><span>{selected.reference ?? selected.id} · {selected.location}</span><div><i className={`badge urgency-${selected.urgency}`}>{urgencyLabels[selected.urgency]}</i><i className={`badge status-${selected.status}`}>{statusLabels[selected.status]}</i></div><Link to={`/reports/${selected.id}`}>Ouvrir le dossier <span>→</span></Link></div>}
      </>}
    </aside>}
    {!compact && <button className="gis-mobile-toggle" aria-label={panelOpen ? 'Masquer la liste' : 'Afficher la liste'} onClick={()=>setPanelOpen(!panelOpen)}>{panelOpen?<PanelLeftClose size={17}/>:<PanelLeftOpen size={17}/>}</button>}
    <div className="map-canvas"><MapContainer center={HAMMAMET} zoom={14} scrollWheelZoom={!compact} zoomControl={!compact} className="leaflet-map"><MapController selected={compact ? null : selected} reports={filtered} focusReport={focusReport} compact={compact}/><TileLayer eventHandlers={{load:()=>setTilesReady(true),tileerror:()=>setTileError(true)}} attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><MarkerClusterGroup chunkedLoading showCoverageOnHover={false}>{filtered.map(report=><Marker key={report.id} position={report.coordinates} icon={pinIcon(report)} eventHandlers={{click:()=>setSelectedId(report.id)}}><Popup><div className="map-popup"><span className={`badge urgency-${report.urgency}`}>{urgencyLabels[report.urgency]}</span><b>{report.title}</b><span className="popup-ref">{report.reference ?? report.id} · {report.location}</span><span>Statut : {statusLabels[report.status]}</span><span>{report.reports} signalement{report.reports>1?'s':''} à l’appui</span><Link to={`/reports/${report.id}`}>Ouvrir le dossier →</Link></div></Popup></Marker>)}</MarkerClusterGroup></MapContainer>{!tilesReady && !tileError && <div className="map-loading"><span className="spinner"/>Chargement de la carte…</div>}{tileError && !tilesReady && <div className="map-loading"><b>Le fond de carte est indisponible</b><span>Vérifiez votre connexion. Les signalements restent disponibles.</span></div>}{!reportsLoading && filtered.length === 0 && <div className="map-empty"><b>Aucun signalement trouvé</b><span>Modifiez les filtres pour afficher des résultats.</span></div>}{!compact && <div className="map-label">HAMMAMET <small>GOUVERNORAT DE NABEUL</small></div>}<button className="locate-button" title="Recentrer sur Hammamet" aria-label="Recentrer sur Hammamet" onClick={()=>window.dispatchEvent(new CustomEvent('map-recenter'))}><LocateFixed size={17}/></button>{compact && <div className="map-legend"><b>URGENCE</b>{[['critical','Critique'],['high','Élevée'],['normal','Normale']].map(([key,label])=><span key={key}><i style={{background:urgencyColors[key]}}/>{label}</span>)}</div>}</div>
    {!compact && <div className="map-foot"><span>Les points regroupés représentent le <b>nombre de réclamations</b>, pas leur gravité.</span><span>Fond de carte © OpenStreetMap</span></div>}
  </section>
}
