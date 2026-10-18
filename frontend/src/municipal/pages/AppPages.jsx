import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Activity, ArrowRight, ArrowUpRight, Building2, Check, Clock3, MoreHorizontal, Search, Siren, TrendingUp, Users, Image as ImageIcon, FileClock } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import IssueMap from '../components/IssueMap'
import { statusLabels, urgencyLabels } from '../data/reportOptions'
import { useReports } from '../hooks/useReports'
import { useServices } from '../hooks/useServices'
import { reportService } from '../services/reportService'

const metricIcons = { reports: ClipboardIcon, critical: Siren, progress: Clock3, resolved: Check, satisfaction: Users }

function Badge({ children, kind = 'neutral' }) { return <span className={`badge ${kind}`}>{children}</span> }
function SectionTitle({ title, sub, action, to = '/reports' }) { return <div className="section-title"><div><h2>{title}</h2>{sub && <p>{sub}</p>}</div>{action && <Link className="text-link" to={to}>{action}<ArrowRight size={15} /></Link>}</div> }
function ReportTable({ rows = [], compact = false }) {
  return <div className="table-scroll"><table><thead><tr><th>RÃ‰CLAMATION</th><th>CATÃ‰GORIE</th><th>URGENCE</th><th>STATUT</th><th>{compact ? 'SIGNALEMENTS' : 'DATE'}</th><th></th></tr></thead><tbody>{rows.map((report) => <tr key={report.id}><td><Link className="report-cell" to={`/reports/${report.id}`}><span className="report-icon"><Activity size={16} /></span><span><b>{report.title}</b><small>{report.id}</small></span></Link></td><td>{report.category}</td><td><Badge kind={`urgency-${report.urgency}`}><i className="badge-dot" />{urgencyLabels[report.urgency]}</Badge></td><td><Badge kind={`status-${report.status}`}><i className="badge-dot" />{statusLabels[report.status]}</Badge></td><td>{compact ? <b>{report.reports}</b> : report.date}</td><td><Link className="more-link" to={`/reports/${report.id}`} aria-label={`Ouvrir ${report.id}`}><MoreHorizontal size={19} /></Link></td></tr>)}</tbody></table></div>
}
function StatCard({ label, value, delta, icon: Icon, tone, caption, to }) { const content = <><div className="stat-top"><span>{label}</span><span className={`stat-icon ${tone}`}><Icon size={18} /></span></div><div className="stat-value">{value}</div><div className="stat-bottom"><span className="stat-delta"><ArrowUpRight size={14} />{delta}</span><span>{caption}</span></div></>; return to ? <Link className="stat-card stat-card-link" to={to} aria-label={`${label} : ${value}. Voir les rÃ©clamations correspondantes`}>{content}</Link> : <article className="stat-card">{content}</article> }
function ClipboardIcon({ size = 18 }) { return <Users size={size} /> }
const chartColors = ['#6366F1', '#38BDF8', '#7C3AED', '#0EA5E9', '#CBD5E1', '#16A34A', '#EA580C']
const formatActivityDate = (value) => new Date(value).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })

export function Overview() {
  const { reports } = useReports()
  const dateLabel = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()).toLocaleUpperCase('fr-FR')
  const urgent = reports.filter((report) => report.urgency === 'critical' || report.urgency === 'high').slice(0, 4)
  const recentActivity = reports.flatMap((report) => (report.history ?? []).map((event) => ({
    key: `${report.id}-${event.occurred_at}-${event.to_status}`,
    title: event.from_status ? `Statut modifiÃ© : ${statusLabels[event.to_status]}` : 'Nouveau signalement reÃ§u',
    detail: `${report.category} Â· ${formatActivityDate(event.occurred_at)}`,
    occurredAt: event.occurred_at,
  }))).sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt)).slice(0, 3)
  const metrics = [
    { label: 'Total des rÃ©clamations', value: reports.length, delta: 'Base actuelle', icon: 'reports', tone: 'sky', caption: 'enregistrÃ©es' },
    { label: 'Cas critiques', value: reports.filter((r) => r.urgency === 'critical' && r.status !== 'resolved').length, delta: 'Urgence', icon: 'critical', tone: 'red', caption: 'non rÃ©solus' },
    { label: 'En cours de traitement', value: reports.filter((r) => ['in_progress', 'transferred'].includes(r.status)).length, delta: 'Suivi', icon: 'progress', tone: 'violet', caption: 'en traitement' },
    { label: 'RÃ©clamations rÃ©solues', value: reports.filter((r) => r.status === 'resolved').length, delta: 'ClÃ´turÃ©es', icon: 'resolved', tone: 'green', caption: 'dans cet Ã©chantillon' },
  ].map((metric, index) => ({ ...metric, to: ['/reports', '/reports?priority=urgent', '/reports?status=in_progress', '/reports?status=resolved'][index] }))
  return <><div className="welcome-row"><div><div className="eyebrow"><span className="live-dot" /> {dateLabel}</div><h2>Bonjour, Ã©quipe municipale <span>ðŸ‘‹</span></h2><p>Voici un aperÃ§u de lâ€™activitÃ© de votre commune aujourdâ€™hui.</p></div><Link className="primary-button" to="/reports">Consulter les rÃ©clamations<ArrowRight size={16} /></Link></div><div className="demo-strip"><span className="demo-icon"><Activity size={15} /></span><span>Vue dâ€™ensemble de lâ€™activitÃ©</span><i />DonnÃ©es synchronisÃ©es avec le backend<span className="demo-period">Mise Ã  jour Ã  lâ€™ouverture</span></div><div className="stats-grid">{metrics.map((metric) => <StatCard key={metric.label} {...metric} icon={metricIcons[metric.icon]} />)}</div><div className="dashboard-grid"><div className="main-column"><div className="panel map-overview"><SectionTitle title="Carte des problÃ¨mes" sub="Signalements rÃ©cents autour de Hammamet" action="Voir la carte" to="/map" /><IssueMap compact /></div><div className="panel recent-panel"><SectionTitle title="RÃ©clamations rÃ©centes" sub="Derniers signalements enregistrÃ©s" action="Voir toutes les rÃ©clamations" /><ReportTable rows={reports.slice(0, 5)} compact /></div></div><div className="side-column"><section className="panel urgent-panel"><SectionTitle title="Cas urgents" sub="Ã€ traiter en prioritÃ©" action="Tout voir" to="/reports?priority=urgent" /><div className="urgent-list">{urgent.map((report) => <Link className="urgent-item" key={report.id} to={`/reports/${report.id}`}><span className={`urgent-bar ${report.urgency}`} /><span className="urgent-content"><b>{report.title}</b><small>{report.location}</small><span className="urgent-meta"><Badge kind={`urgency-${report.urgency}`}>{urgencyLabels[report.urgency]}</Badge><span>{report.date}</span></span></span><ArrowRight size={16} /></Link>)}</div><Link className="urgent-footer" to="/reports?priority=urgent">Consulter les rÃ©clamations urgentes<ArrowRight size={15} /></Link></section><section className="panel activity-panel"><SectionTitle title="ActivitÃ© rÃ©cente" /><div className="activity-list">{recentActivity.map((item, index) => <div key={item.key}><span className={`activity-dot ${['green', 'blue', 'orange'][index]}`} /><p><b>{item.title}</b><small>{item.detail}</small></p></div>)}</div><Link className="text-link" to="/analytics">Voir le rapport dâ€™activitÃ© <ArrowRight size={15} /></Link></section></div></div></>
}

export function MapPage() { return <><div className="page-intro"><p>Vue gÃ©ographique des rÃ©clamations citoyennes sur le territoire communal.</p></div><IssueMap /></> }

export function ReportsPage() {
  const { reports, loading, error } = useReports()
  const [params, setParams] = useSearchParams()
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('recent')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const filter = params.get('priority') === 'urgent' ? 'urgent' : params.get('status') || 'all'
  const query = params.get('q') || ''
  const rows = useMemo(() => reports.filter((report) => {
    const urgencyMatch = filter !== 'urgent' || report.urgency === 'critical' || report.urgency === 'high'
    const statusMatch = ['all', 'urgent'].includes(filter) || (filter === 'processing' ? ['in_progress', 'transferred'].includes(report.status) : report.status === filter)
    return urgencyMatch && statusMatch && (!category || report.category === category) && `${report.title} ${report.id} ${report.category} ${report.location}`.toLowerCase().includes(query.toLowerCase())
  }).sort((a, b) => sort === 'oldest' ? new Date(a.submitted_at || a.date) - new Date(b.submitted_at || b.date) : sort === 'title' ? a.title.localeCompare(b.title, 'fr') : new Date(b.submitted_at || b.date) - new Date(a.submitted_at || a.date)), [reports, filter, query, category, sort])
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize)
  function selectFilter(next) {
    const updated = new URLSearchParams(params)
    if (next === 'urgent') { updated.set('priority', 'urgent'); updated.delete('status') }
    else updated.delete('priority')
    if (['new', 'in_progress', 'processing', 'transferred', 'resolved', 'rejected'].includes(next)) updated.set('status', next)
    else updated.delete('status')
    setParams(updated, { replace: true })
  }
  const tabs = [['all', 'Toutes'], ['urgent', 'Urgentes'], ['new', 'Nouvelles'], ['processing', 'En cours'], ['transferred', 'Transmises'], ['resolved', 'RÃ©solues'], ['rejected', 'RejetÃ©es']]
  const countFor = (key) => key === 'all' ? reports.length : key === 'urgent' ? reports.filter((report) => report.urgency === 'critical' || report.urgency === 'high').length : key === 'processing' ? reports.filter((report) => ['in_progress', 'transferred'].includes(report.status)).length : reports.filter((report) => report.status === key).length
  return <><div className="page-intro"><p>Suivez et gÃ©rez lâ€™ensemble des signalements reÃ§us par la municipalitÃ©.</p></div><section className="panel reports-panel"><div className="reports-toolbar"><div className="tabs">{tabs.map(([key, label]) => <button key={key} className={filter === key ? 'selected' : ''} onClick={() => { selectFilter(key); setPage(1) }}>{label}<span>{countFor(key)}</span></button>)}</div><label className="table-search"><Search size={16} /><input value={query} onChange={(event) => { const next = new URLSearchParams(params); if (event.target.value) next.set('q', event.target.value); else next.delete('q'); setParams(next, { replace: true }); setPage(1) }} placeholder="Rechercher..." aria-label="Rechercher dans les rÃ©clamations" /></label><div className="report-controls"><label>CatÃ©gorie<select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }}><option value="">Toutes catÃ©gories</option>{[...new Set(reports.map(r => r.category))].map(c => <option key={c}>{c}</option>)}</select></label><label>Trier par<select value={sort} onChange={(e) => setSort(e.target.value)}><option value="recent">Plus rÃ©centes</option><option value="oldest">Plus anciennes</option><option value="title">Titre A Ã  Z</option></select></label></div></div>{error ? <div className="empty-results">{error}</div> : loading ? <div className="empty-results">Chargement des rÃ©clamationsâ€¦</div> : pageRows.length ? <ReportTable rows={pageRows} /> : <div className="empty-results">Aucune rÃ©clamation ne correspond Ã  votre recherche. Modifiez les filtres ou la recherche.</div>}<div className="table-footer"><span>Affichage de <b>{rows.length ? (page - 1) * pageSize + 1 : 0}â€“{Math.min(page * pageSize, rows.length)}</b> sur <b>{rows.length}</b></span><div className="pagination"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>PrÃ©cÃ©dent</button><span>Page {page} sur {pageCount}</span><button disabled={page >= pageCount} onClick={() => setPage(page + 1)}>Suivant</button></div></div></section></>
}

export function DetailPage() {
  const { id } = useParams()
  const { reports, loading, refresh } = useReports()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageError, setMessageError] = useState(false)
  const [nextStatus, setNextStatus] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [staffNote, setStaffNote] = useState('')
  const [urgency, setUrgency] = useState('')
  const [serviceId, setServiceId] = useState('')
  const { services } = useServices()
  const report = reports.find((item) => item.id === id)
  async function saveStatus(event) {
    event.preventDefault()
    if (!nextStatus) { setMessageError(true); setMessage('Veuillez choisir un statut.'); return }
    if (nextStatus === 'rejected' && !rejectionReason.trim()) { setMessageError(true); setMessage('Un motif est obligatoire pour rejeter une rÃ©clamation.'); return }
    setSaving(true)
    setMessage('')
    setMessageError(false)
    try {
      await reportService.update(id, { status: nextStatus, ...(nextStatus === 'rejected' ? { rejection_reason: rejectionReason.trim() } : {}), staff_note: staffNote.trim() })
      await refresh()
      setMessage('Statut mis Ã  jour avec succÃ¨s.')
      setNextStatus(''); setRejectionReason(''); setStaffNote('')
    } catch (error) {
      setMessageError(true)
      setMessage(error.message || 'La mise Ã  jour du statut a Ã©chouÃ©.')
    } finally {
      setSaving(false)
    }
  }
  async function saveUrgency(event) {
    event.preventDefault()
    if (!urgency) return
    setSaving(true)
    try {
      await reportService.setUrgency(id, { urgency })
      await refresh()
      setMessage('Ã‰valuation de lâ€™urgence enregistrÃ©e.')
      setUrgency('')
    } catch (error) {
      setMessageError(true)
      setMessage(error.message)
    } finally { setSaving(false) }
  }
  async function saveAssignment(event) {
    event.preventDefault()
    if (!serviceId) return
    setSaving(true)
    try {
      await reportService.assign(id, { municipal_service_id: Number(serviceId) })
      await refresh()
      setMessage('Service municipal affectÃ©.')
      setServiceId('')
    } catch (error) {
      setMessageError(true)
      setMessage(error.message)
    } finally { setSaving(false) }
  }
  if (loading) return <div className="panel empty-detail">Chargement de la rÃ©clamationâ€¦</div>
  if (!report) return <div className="panel empty-detail"><h2>RÃ©clamation introuvable</h2><Link className="text-link" to="/reports">Retour aux rÃ©clamations</Link></div>
  const history = [...(report.history ?? [])].reverse()
  return <><Link className="back-link" to="/reports">â† Retour aux rÃ©clamations</Link><div className="detail-heading"><div><div className="detail-badges"><Badge kind={`urgency-${report.urgency}`}>Urgence : {urgencyLabels[report.urgency]}</Badge><Badge kind={`status-${report.status}`}>{statusLabels[report.status]}</Badge></div><h2>{report.title}</h2><p>{report.reference ?? report.id} <span>Â·</span> SignalÃ©e le {report.date}</p></div></div>
    {message && <p className={`inline-notice ${messageError ? 'notice-error' : ''}`} role={messageError ? 'alert' : 'status'}>{message}</p>}
    <div className="detail-workspace"><div className="detail-primary-column">
      <section className="panel detail-main"><SectionTitle title="DÃ©tails du signalement" /><p className="detail-description">{report.description}</p><div className="detail-facts"><div><small>CATÃ‰GORIE</small><b>{report.category}</b></div><div><small>DATE DE SOUMISSION</small><b>{report.date}</b></div><div><small>LOCALISATION EXACTE</small><b>{report.location || 'Point indiquÃ© sur la carte'}</b></div><div><small>COORDONNÃ‰ES (LAT, LON)</small><b>{report.coordinates ? `${report.coordinates[0].toFixed(5)}, ${report.coordinates[1].toFixed(5)}` : 'Non indiquÃ©es'}</b></div><div><small>IMPORTANCE</small><b>{report.importance}</b></div><div><small>URGENCE</small><b>{urgencyLabels[report.urgency] || 'Ã€ Ã©valuer'}</b></div><div><small>RAPPORTS Ã€ Lâ€™APPUI</small><b>{report.reports} contributions</b></div><div><small>SERVICE MUNICIPAL AFFECTÃ‰</small><b>{report.assigned_service || 'Ã€ affecter'}</b></div></div></section>
      <section className="panel evidence-panel"><SectionTitle title="Photos et Ã©lÃ©ments transmis" sub="PiÃ¨ces jointes associÃ©es Ã  cette rÃ©clamation" />{report.evidence?.length ? <div className="evidence-grid">{report.evidence.map((item, index) => <figure key={item.id ?? item.url ?? index}><a href={item.url} target="_blank" rel="noreferrer"><img src={item.url} alt={item.original_name ? `PiÃ¨ce jointe : ${item.original_name}` : 'PiÃ¨ce jointe transmise avec la rÃ©clamation'} /></a><figcaption><b>{item.original_name || 'Photo jointe'}</b><span>{[item.uploaded_at ? new Date(item.uploaded_at).toLocaleString('fr-FR') : null, item.mime_type, item.storage_disk, item.storage_path, item.size ? `${item.size} octets` : null].filter(Boolean).join(' Â· ') || 'MÃ©tadonnÃ©es de stockage non disponibles'}</span></figcaption></figure>)}</div> : <div className="evidence-empty"><span><ImageIcon size={20}/></span><b>Aucune photo jointe</b><p>Aucun Ã©lÃ©ment visuel nâ€™est disponible dans ces donnÃ©es de dÃ©monstration.</p></div>}</section>
      <section className="panel history-panel"><SectionTitle title="Historique de traitement" sub="Ã‰vÃ©nements enregistrÃ©s pendant cette dÃ©monstration" /><div className="history-timeline">{history.map((item,index)=><article key={`${item.occurred_at}-${index}`}><span className="timeline-marker"><FileClock size={14}/></span><div><b>{item.from_status ? `${statusLabels[item.from_status]} â†’ ${statusLabels[item.to_status]}` : `CrÃ©ation Â· ${statusLabels[item.to_status]}`}</b><time>{new Date(item.occurred_at).toLocaleString('fr-FR')}</time>{item.rejection_reason && <p><b>Motif du rejet :</b> {item.rejection_reason}</p>}{item.note && <p>{item.note}</p>}</div></article>)}</div></section>
    </div><aside className="detail-secondary-column">
      <section className="panel workflow-panel"><SectionTitle title="Ã‰valuation municipale" sub="Lâ€™urgence est dÃ©cidÃ©e et enregistrÃ©e par lâ€™Ã©quipe municipale."/><form onSubmit={saveUrgency}><label>Urgence officielle<select value={urgency} onChange={(event)=>setUrgency(event.target.value)} required><option value="">{report.urgency ? `Actuelle : ${urgencyLabels[report.urgency]}` : 'Choisir une urgence'}</option><option value="critical">Critique</option><option value="high">Ã‰levÃ©e</option><option value="normal">Normale</option></select></label><button className="primary-button" disabled={saving || !urgency}>Enregistrer lâ€™urgence</button></form><form onSubmit={saveStatus} noValidate><label>Statut<select value={nextStatus} onChange={(e)=>setNextStatus(e.target.value)} required><option value="">Conserver le statut actuel</option>{Object.entries(statusLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>{nextStatus==='rejected' && <label>Motif du rejet <textarea value={rejectionReason} onChange={(e)=>setRejectionReason(e.target.value)} required rows="3" placeholder="Expliquez pourquoi la rÃ©clamation est rejetÃ©e" /></label>}<label>Note de traitement interne<textarea value={staffNote} onChange={(e)=>setStaffNote(e.target.value)} rows="3" placeholder="Ajouter une note interne" /></label><button className="primary-button" type="submit" disabled={saving || !nextStatus || (nextStatus==='rejected' && !rejectionReason.trim())}>{saving?'Enregistrementâ€¦':'Enregistrer le statut'}</button></form><form onSubmit={saveAssignment}><label>Service municipal<select value={serviceId} onChange={(event)=>setServiceId(event.target.value)}><option value="">Actuel : {report.assigned_service || 'non affectÃ©'}</option>{services.map((service)=><option key={service.id} value={service.id}>{service.name}</option>)}</select></label><button className="primary-button" disabled={saving || !serviceId}>Affecter le service</button></form></section>
      <section className="panel detail-map"><SectionTitle title="Emplacement" sub={report.location}/><IssueMap compact focusReport={report} /></section>
      <section className="panel staff-notes-panel"><SectionTitle title="Notes de lâ€™Ã©quipe" />{report.staff_notes?.length ? report.staff_notes.map((item,index)=><p key={`${item.created_at}-${index}`}><span>{item.note}</span><small>{new Date(item.created_at).toLocaleString('fr-FR')}</small></p>) : <div className="muted-empty">Aucune note de traitement enregistrÃ©e.</div>}</section>
    </aside></div></>
}

export function AnalyticsPage() {
  const { reports } = useReports()
  const chartStart = new Date()
  chartStart.setHours(0, 0, 0, 0)
  chartStart.setDate(chartStart.getDate() - 6)
  const weeklyReports = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(chartStart)
    day.setDate(chartStart.getDate() + index)
    const key = day.toLocaleDateString('fr-CA')
    return { day: new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(day), count: reports.filter((report) => report.submitted_at && new Date(report.submitted_at).toLocaleDateString('fr-CA') === key).length }
  })
  const metrics = [
    { label: 'Total des rÃ©clamations', value: reports.length, delta: 'DÃ©monstration', icon: 'reports', tone: 'sky', caption: 'dans lâ€™Ã©chantillon' },
    { label: 'Cas critiques ouverts', value: reports.filter((r) => r.urgency === 'critical' && r.status !== 'resolved').length, delta: 'Urgence', icon: 'critical', tone: 'red', caption: 'Ã  surveiller' },
    { label: 'En cours ou transmises', value: reports.filter((r) => ['in_progress','transferred'].includes(r.status)).length, delta: 'Traitement', icon: 'progress', tone: 'violet', caption: 'par les services' },
    { label: 'RÃ©solues', value: reports.filter((r) => r.status === 'resolved').length, delta: 'ClÃ´turÃ©es', icon: 'resolved', tone: 'green', caption: 'dans lâ€™Ã©chantillon' },
  ]
  const categoryCounts = [...new Set(reports.map((report) => report.category))].map((name, index) => ({ name, value: reports.filter((r) => r.category === name).length, color: chartColors[index % chartColors.length] }))
  const categoryTotal = categoryCounts.reduce((sum, item) => sum + item.value, 0)
  const serviceCounts = [...new Set(reports.map((r) => r.assigned_service))].map((name) => ({
    name,
    resolved: reports.filter((r) => r.assigned_service === name && r.status === 'resolved').length,
    pending: reports.filter((r) => r.assigned_service === name && !['resolved', 'rejected'].includes(r.status)).length,
  }))
  return <><div className="page-intro"><p>Indicateurs de suivi et tendances des rÃ©clamations municipales.</p><Badge kind="demo-badge">DonnÃ©es de dÃ©monstration Â· Ã©tat temporaire</Badge></div><div className="stats-grid analytics-stats">{metrics.map((metric) => <StatCard key={metric.label} {...metric} icon={metricIcons[metric.icon]} />)}</div><div className="charts-grid"><section className="panel chart-panel"><SectionTitle title="Signalements au fil du temps" sub="Volume quotidien · 7 derniers jours" />{reports.length === 0 ? <div className="chart-empty">Aucun signalement disponible pour cette période.</div> : <div className="chart-area"><ResponsiveContainer width="100%" height="100%"><AreaChart data={weeklyReports}><defs><linearGradient id="areaBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366F1" stopOpacity={0.18} /><stop offset="95%" stopColor="#6366F1" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#EEF2F7" vertical={false} /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} /><Tooltip /><Area type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={2.5} fill="url(#areaBlue)" /></AreaChart></ResponsiveContainer></div>}</section><section className="panel chart-panel category-panel"><SectionTitle title="Par catÃ©gorie" sub="RÃ©partition des signalements" />{categoryTotal === 0 ? <div className="chart-empty">Aucune catégorie à présenter.</div> : <div className="pie-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryCounts} dataKey="value" nameKey="name" innerRadius={62} outerRadius={87} paddingAngle={4} stroke="none">{categoryCounts.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="pie-center"><b>{categoryTotal}</b><small>Total</small></div></div>}<div className="category-legend">{categoryCounts.map((item) => <div key={item.name}><i style={{ background: item.color }} />{item.name}<b>{categoryTotal ? Math.round(item.value / categoryTotal * 100) : 0}%</b></div>)}</div></section></div><section className="panel service-chart"><SectionTitle title="Performance des services" sub="RÃ©clamations traitÃ©es par service municipal" />{serviceCounts.length === 0 ? <div className="chart-empty">Aucune donnée de service disponible.</div> : <div className="chart-area bar-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={serviceCounts}><CartesianGrid stroke="#EEF2F7" vertical={false} /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} /><Tooltip /><Bar dataKey="resolved" name="RÃ©solues" stackId="a" fill="#6366F1" /><Bar dataKey="pending" name="En attente" stackId="a" fill="#BAE6FD" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>}</section></>
}

export function ServicesPage() {
  const [expanded, setExpanded] = useState('')
  const { services, loading, error } = useServices()
  return <><div className="page-intro"><p>Organisation des ï¿½quipes et suivi de la performance des services.</p></div>{error ? <div className="panel empty-results">{error}</div> : loading ? <div className="panel empty-results">Chargement des services municipauxï¿½</div> : services.length ? <div className="service-grid">{services.map((service) => <section key={service.key} className="panel service-card"><div className={`service-symbol ${service.key}`}><Building2 size={20} /></div><div className="service-heading"><div><h3>{service.name}</h3><span>Service municipal</span></div><button className="more-link" aria-label={`${expanded === service.name ? 'Masquer' : 'Afficher'} les dï¿½tails ${service.name}`} aria-expanded={expanded === service.name} onClick={() => setExpanded(expanded === service.name ? '' : service.name)}><MoreHorizontal size={20} /></button></div><div className="service-numbers"><div><small>ï¿½QUIPE</small><b>{service.agents}</b></div><div><small>TAUX DE TRAITEMENT</small><b>{service.percent}</b></div></div><div className="progress-track"><i style={{ width: service.percent }} /></div>{expanded === service.name && <div className="service-extra"><span>{service.category}</span><Link to={`/reports?q=${encodeURIComponent(service.category)}`}>Voir les rï¿½clamations de ce service ?</Link></div>}<Link className="text-link" to={`/reports?q=${encodeURIComponent(service.category)}`}>Voir les rï¿½clamations<ArrowRight size={15} /></Link></section>)}</div> : <div className="panel empty-results">Aucun service municipal nï¿½est configurï¿½.</div>}</>
}
export function SettingsPage() { return <><div className="page-intro"><p>PrÃ©fÃ©rences de lâ€™espace dâ€™administration municipale.</p></div><section className="panel settings-placeholder"><span className="settings-symbol"><TrendingUp size={22} /></span><h2>ParamÃ¨tres de lâ€™administration</h2><p>La configuration des notifications, des Ã©quipes et des accÃ¨s sera disponible ici.</p><Badge kind="demo-badge">Espace en prÃ©paration</Badge></section></> }




