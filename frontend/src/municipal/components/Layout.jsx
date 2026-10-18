import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, LayoutDashboard, Map, Menu, Settings, ChartNoAxesColumn, Building2, ClipboardList, Search, Waves, X, House, Lightbulb } from 'lucide-react'
import { urgencyLabels } from '../data/reportOptions'
import { useReports } from '../hooks/useReports'
import { apiRequest } from '../../api'

const links = [
  { to: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/map', label: 'Carte des problèmes', icon: Map },
  { to: '/reports', label: 'Gestion des réclamations', icon: ClipboardList },
  { to: '/ideas', label: 'Idées citoyennes', icon: Lightbulb },
  { to: '/analytics', label: 'Statistiques', icon: ChartNoAxesColumn },
  { to: '/services', label: 'Services municipaux', icon: Building2 },
]
const titles = { '/dashboard': 'Tableau de bord', '/map': 'Carte des problèmes', '/reports': 'Gestion des réclamations', '/ideas': 'Idées citoyennes', '/analytics': 'Statistiques', '/services': 'Services municipaux', '/settings': 'Paramètres' }

export function Layout() {
  const [open, setOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [staff, setStaff] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [login, setLogin] = useState({ email: '', password: '' })
  const [authError, setAuthError] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const { reports } = useReports()
  useEffect(() => {
    if (!sessionStorage.getItem('hc_api_token')) {
      setAuthReady(true)
      return
    }
    apiRequest('/user').then((payload) => {
      if (payload.data?.role === 'staff' || payload.data?.role === 'admin') setStaff(payload.data)
      else sessionStorage.removeItem('hc_api_token')
    }).catch(() => sessionStorage.removeItem('hc_api_token')).finally(() => setAuthReady(true))
  }, [])
  const urgentReports = reports.filter((report) => report.urgency === 'critical' || report.urgency === 'high').slice(0, 3)
  const title = location.pathname.startsWith('/reports/') ? 'Détail de la réclamation' : titles[location.pathname] || 'Tableau de bord'
  function handleSearch(event) {
    event.preventDefault()
    const query = search.trim()
    if (query) {
      setNotificationsOpen(false)
      setProfileOpen(false)
      navigate(`/reports?q=${encodeURIComponent(query)}`)
    }
  }
  async function signIn(event) {
    event.preventDefault()
    setAuthError('')
    try {
      const payload = await apiRequest('/login', { method: 'POST', body: JSON.stringify(login) })
      if (!['staff', 'admin'].includes(payload.data?.role)) throw new Error('Ce compte ne dispose pas d’un accès municipal.')
      sessionStorage.setItem('hc_api_token', payload.token)
      setStaff(payload.data)
      window.location.reload()
    } catch (error) {
      setAuthError(error.message)
    }
  }
  if (!authReady || (sessionStorage.getItem('hc_api_token') && !staff)) return <main className="main-area"><section className="panel empty-results">Vérification de l’accès municipal…</section></main>
  if (!staff) return <main className="main-area"><section className="panel empty-results"><h1>Connexion municipale</h1><form onSubmit={signIn}><label>Adresse e-mail<input type="email" value={login.email} onChange={(event) => setLogin({ ...login, email: event.target.value })} required /></label><label>Mot de passe<input type="password" value={login.password} onChange={(event) => setLogin({ ...login, password: event.target.value })} required /></label>{authError && <p role="alert">{authError}</p>}<button className="primary-button" type="submit">Se connecter</button></form></section></main>
  return <div className="app-shell">
    {open && <button className="scrim" aria-label="Fermer le menu" onClick={() => setOpen(false)} />}
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="brand"><span className="brand-mark"><Waves size={22}/></span><span>Hammamet <b>Connect</b><small>ADMINISTRATION MUNICIPALE</small></span><button className="icon-button close-menu" onClick={() => setOpen(false)} aria-label="Fermer"><X size={19}/></button></div>
      <div className="nav-caption">MENU PRINCIPAL</div>
      <nav>{links.map(({to,label,icon:Icon}) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={19}/><span>{label}</span>{to === '/reports' && <i className="nav-count">{reports.length}</i>}</NavLink>)}</nav>
      <div className="sidebar-bottom"><NavLink to="/settings" onClick={() => setOpen(false)} className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}><Settings size={19}/><span>Paramètres</span></NavLink><Link to="/" onClick={() => setOpen(false)} className="nav-link"><House size={19}/><span>Portail citoyen</span></Link><div className="sidebar-note"><div className="note-mark"><Waves size={15}/></div><div><strong>Hammamet Connect</strong><small>Au service de votre ville</small></div></div><div className="sidebar-foot">© 2026 Municipalité de Hammamet</div></div>
    </aside>
    <main className="main-area"><header className="topbar"><button className="icon-button mobile-menu" onClick={() => setOpen(true)} aria-label="Ouvrir le menu"><Menu size={21}/></button><div className="mobile-brand"><span className="brand-mark"><Waves size={18}/></span>Hammamet <b>Connect</b></div><div className="page-heading"><span>Espace administration</span><h1>{title}</h1></div><form className="global-search" onSubmit={handleSearch}><Search size={17}/><input aria-label="Rechercher une réclamation" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une réclamation..."/><kbd>Entrée</kbd></form><div className="header-menu-wrap"><button className="notification icon-button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen((value) => !value); setProfileOpen(false) }}><Bell size={19}/>{urgentReports.length > 0 && <i/>}</button>{notificationsOpen && <div className="header-popover notification-popover"><strong>Signalements à suivre</strong><small>Données de démonstration</small>{urgentReports.length ? urgentReports.map((report) => <Link key={report.id} to={`/reports/${report.id}`} onClick={() => setNotificationsOpen(false)}><span className={`urgent-bar ${report.urgency}`}/><span><b>{report.title}</b><small>{urgencyLabels[report.urgency]} · {report.id}</small></span></Link>) : <p>Aucun cas urgent.</p>}<Link className="popover-footer" to="/reports?priority=urgent" onClick={() => setNotificationsOpen(false)}>Voir les cas urgents →</Link></div>}</div><div className="header-menu-wrap"><button className="profile" aria-expanded={profileOpen} onClick={() => { setProfileOpen((value) => !value); setNotificationsOpen(false) }}><span className="avatar">AM</span><span className="profile-text"><b>Administration</b><small>Municipalité</small></span><ChevronDown size={16}/></button>{profileOpen && <div className="header-popover profile-popover"><strong>Administration municipale</strong><Link to="/settings" onClick={() => setProfileOpen(false)}>Paramètres</Link><Link to="/reports" onClick={() => setProfileOpen(false)}>Gestion des réclamations</Link></div>}</div></header><div className="page-content"><Outlet/></div></main>
  </div>
}


