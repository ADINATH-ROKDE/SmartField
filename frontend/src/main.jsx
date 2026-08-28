import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Activity, BriefcaseBusiness, Check, Clock3, CloudSun, Crosshair, Gauge, LogOut, MapPin, Menu, Pause, Play, Route, Settings2, ShieldCheck, Sparkles, UserRound, Users, X } from 'lucide-react'
import './styles.css'

const API = import.meta.env.VITE_API_URL || '/api'

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    credentials: 'include',
    headers: options.body ? { 'Content-Type': 'application/json', ...options.headers } : options.headers,
  })
  const text = await response.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!response.ok) throw new Error(data?.message || data?.error || 'Something went wrong')
  return data
}

const api = {
  login: (body) => request('/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request('/logout', { method: 'POST' }),
  me: () => request('/me'),
  today: () => request('/salesman/today'),
  start: (body) => request('/salesman/start', { method: 'POST', body: JSON.stringify(body) }),
  location: (body) => request('/salesman/location', { method: 'POST', body: JSON.stringify(body) }),
  breakStart: () => request('/salesman/break/start', { method: 'POST' }),
  breakEnd: () => request('/salesman/break/end', { method: 'POST' }),
  end: (body) => request('/salesman/end', { method: 'POST', body: JSON.stringify(body) }),
  salesmen: () => request('/manager/salesmen'),
  details: (id) => request(`/manager/salesmen/${id}`),
  policy: () => request('/manager/policy'),
  updatePolicy: (minimumHours) => request('/manager/policy', { method: 'PUT', body: JSON.stringify({ minimumHours }) }),
  editSession: (id, body) => request(`/manager/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
}

function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { api.me().then(setUser).catch(() => {}).finally(() => setLoading(false)) }, [])
  return { user, loading, login: async (body) => { const next = await api.login(body); setUser(next); return next }, logout: async () => { await api.logout().catch(() => {}); setUser(null) } }
}

function formatTime(value) { return value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--' }
function formatDate(value) { return value ? new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '--' }
function statusLabel(status) { return (status || 'NOT_STARTED').replace('_', ' ') }
function statusTone(status) { return status === 'WORKING' ? 'green' : status === 'ON_BREAK' ? 'amber' : status === 'COMPLETED' ? 'blue' : 'muted' }
function initials(name = '') { return name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() }

function Login({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event) { event.preventDefault(); setError(''); setBusy(true); try { await onLogin(form) } catch (err) { setError(err.message) } finally { setBusy(false) } }
  return <main className="login-shell">
    <section className="login-art"><div className="brand-mark"><Crosshair size={20} /> SMARTFIELD</div><div className="art-copy"><span className="eyebrow">FIELD OPERATIONS / 01</span><h1>Keep every mile<br /><em>moving forward.</em></h1><p>One calm command center for the people doing the work and the teams supporting them.</p></div><div className="art-footer"><span><ShieldCheck size={15} /> Secure session access</span><span>© 2026 SmartField</span></div></section>
    <section className="login-panel"><div className="mobile-brand brand-mark"><Crosshair size={20} /> SMARTFIELD</div><div className="login-form-wrap"><span className="eyebrow">WELCOME BACK</span><h2>Sign in to your<br /><span>workspace.</span></h2><p className="muted intro">Use your SmartField account to continue.</p><form onSubmit={submit}><label>Username<input autoComplete="username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="Enter username" required /></label><label>Password<input autoComplete="current-password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Enter password" required /></label>{error && <div className="error-box">{error}</div>}<button className="button primary full" disabled={busy}>{busy ? <><span className="spinner" /> Signing in...</> : <>Enter workspace <span>→</span></>}</button></form><p className="login-note">Your session is protected and expires when you sign out.</p></div></section>
  </main>
}

function Sidebar({ user, page, setPage, onLogout, mobileOpen, setMobileOpen }) {
  const manager = user.role === 'MANAGER'
  return <><button className="mobile-menu" onClick={() => setMobileOpen(true)}><Menu /></button>{mobileOpen && <div className="scrim" onClick={() => setMobileOpen(false)} />}<aside className={`sidebar ${mobileOpen ? 'open' : ''}`}><div className="brand-mark"><Crosshair size={20} /> SMARTFIELD<button className="close-menu" onClick={() => setMobileOpen(false)}><X /></button></div><div className="side-user"><div className="avatar">{initials(user.name)}</div><div><strong>{user.name}</strong><small>{manager ? 'Manager' : 'Field salesman'}</small></div></div><nav><span className="nav-label">WORKSPACE</span><button className={page === 'overview' ? 'active' : ''} onClick={() => { setPage('overview'); setMobileOpen(false) }}><Gauge size={18} /> Overview</button>{manager && <><button className={page === 'team' ? 'active' : ''} onClick={() => { setPage('team'); setMobileOpen(false) }}><Users size={18} /> Sales team</button><button className={page === 'policy' ? 'active' : ''} onClick={() => { setPage('policy'); setMobileOpen(false) }}><Settings2 size={18} /> Work policy</button></>}{!manager && <button className={page === 'activity' ? 'active' : ''} onClick={() => { setPage('activity'); setMobileOpen(false) }}><Activity size={18} /> My activity</button>}</nav><div className="sidebar-bottom"><div className="help-card"><Sparkles size={17} /><div><strong>Stay on track</strong><small>Updates sync automatically.</small></div></div><button className="logout" onClick={onLogout}><LogOut size={17} /> Sign out</button></div></aside></>
}

function AppShell({ user, children, page, setPage, onLogout }) { const [mobileOpen, setMobileOpen] = useState(false); return <div className="app-shell"><Sidebar {...{ user, page, setPage, onLogout, mobileOpen, setMobileOpen }} /><main className="main-content">{children}</main></div> }
function PageHeader({ eyebrow, title, sub, action }) { return <header className="page-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{sub && <p className="muted">{sub}</p>}</div>{action}</header> }
function Stat({ icon: Icon, label, value, detail, tone = '' }) { return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={19} /></div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div> }
function Badge({ status }) { return <span className={`badge ${statusTone(status)}`}><i />{statusLabel(status)}</span> }
function Empty({ title, text }) { return <div className="empty"><Route size={26} /><strong>{title}</strong><p>{text}</p></div> }

function LocationMessage({ location, error }) { return <div className={`location-message ${error ? 'location-error' : ''}`}><MapPin size={17} /><span>{error || (location ? `Location ready · ±${Math.round(location.accuracy || 0)}m accuracy` : 'Location permission is required for work actions.')}</span></div> }

function GoogleMap({ point }) { if (!point) return <div className="map-empty"><MapPin size={25} /><strong>Waiting for a live location</strong><span>The salesman has not sent a location point yet.</span></div>; const query = `${point.latitude},${point.longitude}`; return <div className="map-frame"><iframe title="Salesman live location" src={`https://www.google.com/maps?q=${query}&z=15&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /><a href={`https://www.google.com/maps/search/?api=1&query=${query}`} target="_blank" rel="noreferrer" className="map-link"><MapPin size={14} /> Open in Google Maps</a></div> }
function WeatherCard({ point }) { const [weather, setWeather] = useState(null); const [error, setError] = useState(''); useEffect(() => { if (!point) { setWeather(null); return }; const controller = new AbortController(); setError(''); fetch(`https://api.open-meteo.com/v1/forecast?latitude=${point.latitude}&longitude=${point.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=celsius&wind_speed_unit=kmh`, { signal: controller.signal }).then(response => { if (!response.ok) throw new Error('Weather unavailable'); return response.json() }).then(setWeather).catch(err => { if (err.name !== 'AbortError') setError('Weather unavailable') }); return () => controller.abort() }, [point]); const current = weather?.current; return <div className="weather-card"><div className="weather-icon"><CloudSun size={22} /></div><div className="weather-main"><span>LOCAL CONDITIONS</span><strong>{current ? `${Math.round(current.temperature_2m)}°C` : '--'}</strong><small>{error || (current ? `Humidity ${current.relative_humidity_2m}% · Wind ${Math.round(current.wind_speed_10m)} km/h` : 'Loading climate data...')}</small></div></div> }

function SalesmanView({ user, initialPage }) {
  const [page, setPage] = useState(initialPage || 'overview'); const [data, setData] = useState(null); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(''); const [location, setLocation] = useState(null); const [locError, setLocError] = useState(''); const [notice, setNotice] = useState('')
  async function refresh() { setLoading(true); try { setData(await api.today()) } catch (err) { setNotice(err.message) } finally { setLoading(false) } }
  useEffect(() => { refresh() }, [])
  useEffect(() => {
    if (!navigator.geolocation) { setLocError('Geolocation is not supported by this browser.'); return }
    const watchId = navigator.geolocation.watchPosition(pos => {
      setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy })
      setLocError('')
    }, error => {
      setLocError(error.code === error.PERMISSION_DENIED ? 'Location access was denied. Allow it in browser settings to track work.' : 'Unable to get your current location.')
    }, { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 })
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])
  const session = data?.session || data; const status = session?.status || 'NOT_STARTED'; const activeBreak = session?.breaks?.some(item => !item.endTime); const working = session?.workingHours || 0
  useEffect(() => {
    if (!location || (status !== 'WORKING' && status !== 'ON_BREAK')) return
    const syncLocation = () => api.location(location).then(refresh).catch(err => setNotice(err.message))
    const interval = window.setInterval(syncLocation, 15000)
    return () => window.clearInterval(interval)
  }, [location, status])
  async function action(name, fn, needsLocation = false) { if (needsLocation && !location) { setLocError('Allow location access before starting or ending work.'); return }; setBusy(name); setNotice(''); try { await fn(); await refresh(); setNotice('Activity updated successfully.') } catch (err) { setNotice(err.message) } finally { setBusy('') } }
  if (loading) return <LoadingPage text="Loading your workspace" />
  return <AppShell {...{ user, page, setPage, onLogout: user.logout }}><PageHeader eyebrow="FIELD SALESMAN / TODAY" title={`Good morning, ${user.name.split(' ')[0]}.`} sub={new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })} action={<div className="live-pill"><i /> Live workspace</div>} />{notice && <div className="notice">{notice}</div>}<LocationMessage {...{ location, error: locError }} />{page === 'overview' ? <><div className="hero-status"><div><span className="eyebrow">TODAY'S STATUS</span><h2><Badge status={status} /></h2><p>{status === 'NOT_STARTED' ? 'Your day is ready when you are.' : status === 'COMPLETED' ? 'Nice work. Your day is complete.' : activeBreak ? 'Enjoy your break. We will keep the clock paused.' : 'You are on the move. Keep going.'}</p></div><div className="status-clock"><Clock3 size={22} /><strong>{working.toFixed(2)}<small> hrs</small></strong><span>Working time</span></div></div><div className="stats-grid"><Stat icon={Clock3} label="Working hours" value={`${working.toFixed(2)}h`} detail={`Required ${data?.minimumHours ?? 7}h`} tone="green" /><Stat icon={Route} label="Distance covered" value={`${(session?.distanceKm || 0).toFixed(1)} km`} detail="Today's route" tone="blue" /><Stat icon={MapPin} label="Location points" value={session?.locations?.length || 0} detail="Synced updates" tone="amber" /></div><div className="action-panel"><div><span className="eyebrow">QUICK ACTIONS</span><h3>Manage your workday</h3></div><div className="action-buttons">{status === 'NOT_STARTED' && <button className="button primary" disabled={!!busy} onClick={() => action('start', () => api.start(location), true)}>{busy === 'start' ? <span className="spinner" /> : <Play size={16} />} Start work</button>}{(status === 'WORKING' || status === 'ON_BREAK') && <><button className="button soft" disabled={!!busy} onClick={() => action('location', () => api.location(location), true)}><MapPin size={16} /> Update location</button>{activeBreak ? <button className="button amber" disabled={!!busy} onClick={() => action('break-end', api.breakEnd)}><Play size={16} /> End break</button> : <button className="button amber" disabled={!!busy} onClick={() => action('break-start', api.breakStart)}><Pause size={16} /> Take a break</button>}<button className="button danger" disabled={!!busy} onClick={() => { if (window.confirm('End your workday now?')) action('end', () => api.end(location), true) }}><Check size={16} /> End work</button></>}</div></div></> : <ActivityPage session={session} />}</AppShell>
}
function ActivityPage({ session }) { const points = session?.locations || []; return <><div className="section-heading"><div><span className="eyebrow">ACTIVITY LOG</span><h2>Today's movement</h2></div><span className="count-label">{points.length} location updates</span></div><div className="activity-list">{points.length ? points.slice().reverse().map((point, index) => <div className="activity-row" key={`${point.timestamp}-${index}`}><div className="timeline-dot"><MapPin size={14} /></div><div><strong>Location update</strong><p>{point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}</p></div><time>{formatTime(point.timestamp)}</time></div>) : <Empty title="No activity yet" text="Your location updates and breaks will appear here." />}</div></> }

function ManagerView({ user }) {
  const [page, setPage] = useState('overview'); const [people, setPeople] = useState([]); const [policy, setPolicy] = useState(null); const [selected, setSelected] = useState(null); const [loading, setLoading] = useState(true); const [notice, setNotice] = useState('')
  async function load() { setLoading(true); try { const [team, rules] = await Promise.all([api.salesmen(), api.policy()]); setPeople(team); setPolicy(rules) } catch (err) { setNotice(err.message) } finally { setLoading(false) } }
  useEffect(() => { load() }, [])
  useEffect(() => { if (page !== 'overview') return; const interval = window.setInterval(async () => { try { setPeople(await api.salesmen()) } catch (err) { setNotice(err.message) } }, 15000); return () => window.clearInterval(interval) }, [page])
  if (loading) return <LoadingPage text="Loading team workspace" />
  const working = people.filter(person => person.status === 'WORKING').length; const complete = people.filter(person => person.status === 'COMPLETED').length; const avg = people.length ? people.reduce((sum, person) => sum + (person.workingHours || 0), 0) / people.length : 0
  const trackingPerson = selected || people.find(person => person.locations?.length) || people[0]; const trackingPoint = trackingPerson?.locations?.[trackingPerson.locations.length - 1]
  return <AppShell {...{ user, page, setPage, onLogout: user.logout }}><PageHeader eyebrow="MANAGER / OPERATIONS" title="Team overview" sub={new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })} action={<div className="live-pill"><i /> Live workspace</div>} />{notice && <div className="notice">{notice}</div>}{page === 'policy' ? <Policy policy={policy} onSave={async value => { try { const next = await api.updatePolicy(value); setPolicy(next); setNotice('Work policy updated.') } catch (err) { setNotice(err.message) } }} /> : <><div className="stats-grid"><Stat icon={Users} label="Sales team" value={people.length} detail="Assigned today" tone="green" /><Stat icon={Activity} label="Working now" value={working} detail={`${complete} completed`} tone="blue" /><Stat icon={Clock3} label="Avg. hours" value={`${avg.toFixed(2)}h`} detail={`Target ${policy?.minimumHours ?? 7}h`} tone="amber" /></div><div className="tracking-head"><div><span className="eyebrow">LIVE LOCATION / AUTO REFRESH 15S</span><h2>Field tracking</h2></div><div className="tracking-person">{trackingPerson ? `${trackingPerson.salesman} · ${statusLabel(trackingPerson.status)}` : 'No salesman selected'}</div></div><div className="tracking-grid"><GoogleMap point={trackingPoint} /><WeatherCard point={trackingPoint} /></div><div className="section-heading"><div><span className="eyebrow">TODAY'S COVERAGE</span><h2>Sales activity</h2></div><button className="button soft small" onClick={load}>Refresh data</button></div><div className="team-table">{people.length ? people.map(person => <button className="team-row" key={person.id || person.salesman} onClick={async () => { if (person.id) setSelected(await api.details(person.id)) }}><div className="person"><div className="avatar small-avatar">{initials(person.salesman)}</div><div><strong>{person.salesman}</strong><small>Field salesman</small></div></div><Badge status={person.status} /><div className="row-metric"><span>Hours</span><strong>{(person.workingHours || 0).toFixed(2)}h</strong></div><div className="row-metric route-metric"><span>Distance</span><strong>{(person.distanceKm || 0).toFixed(1)} km</strong></div><span className="row-arrow">→</span></button>) : <Empty title="No salesmen found" text="Salesmen will appear here once they are assigned." />}</div></>}<DetailModal detail={selected} onClose={() => setSelected(null)} /></AppShell>}
function Policy({ policy, onSave }) { const [value, setValue] = useState(policy?.minimumHours ?? 7); const [busy, setBusy] = useState(false); async function submit(e) { e.preventDefault(); setBusy(true); await onSave(Number(value)); setBusy(false) } return <div className="policy-wrap"><div className="section-heading"><div><span className="eyebrow">WORKSPACE SETTINGS</span><h2>Work policy</h2><p className="muted">Set the minimum number of hours required for a completed day.</p></div></div><form className="policy-card" onSubmit={submit}><div className="policy-icon"><Settings2 /></div><div className="policy-copy"><strong>Minimum working hours</strong><span>Salesmen are flagged when they finish below this target.</span></div><div className="hours-input"><input type="number" min="0" step="0.5" value={value} onChange={e => setValue(e.target.value)} /><span>hours</span></div><button className="button primary" disabled={busy}>{busy ? <span className="spinner" /> : <Check size={16} />} Save policy</button></form></div> }
function DetailModal({ detail, onClose }) { const [hours, setHours] = useState(detail?.workingHours || 0); const [status, setStatus] = useState(detail?.status || 'NOT_STARTED'); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); useEffect(() => { setHours(detail?.workingHours || 0); setStatus(detail?.status || 'NOT_STARTED'); setError('') }, [detail]); if (!detail) return null; async function save() { setBusy(true); setError(''); try { await api.editSession(detail.id, { workingHours: Number(hours), status }); onClose() } catch (err) { setError(err.message) } finally { setBusy(false) } } return <div className="modal-backdrop" onClick={onClose}><div className="detail-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={onClose}><X /></button><span className="eyebrow">SALESMAN DETAIL</span><h2>{detail.salesman}</h2><Badge status={detail.status} /><div className="detail-grid"><div><span>Working hours</span><strong>{(detail.workingHours || 0).toFixed(2)}h</strong></div><div><span>Distance</span><strong>{(detail.distanceKm || 0).toFixed(1)} km</strong></div><div><span>Started</span><strong>{formatTime(detail.startTime)}</strong></div><div><span>Finished</span><strong>{formatTime(detail.endTime)}</strong></div></div><div className="edit-grid"><label>Working hours<input type="number" min="0" step="0.01" value={hours} onChange={e => setHours(e.target.value)} /></label><label>Status<select value={status} onChange={e => setStatus(e.target.value)}><option>NOT_STARTED</option><option>WORKING</option><option>ON_BREAK</option><option>COMPLETED</option></select></label></div>{error && <div className="error-box">{error}</div>}{detail.alert && <div className="alert-box">{detail.alert}</div>}<div className="route-summary"><MapPin size={17} /><span>{detail.locations?.length || 0} location points recorded today</span></div><button className="button primary full" disabled={busy} onClick={save}>{busy ? <span className="spinner" /> : <Check size={16} />} Save session</button></div></div> }
function LoadingPage({ text }) { return <div className="loading-page"><span className="spinner dark" /><p>{text}</p></div> }
function Root() { const auth = useAuth(); if (auth.loading) return <LoadingPage text="Preparing SmartField" />; if (!auth.user) return <Login onLogin={auth.login} />; return auth.user.role === 'MANAGER' ? <ManagerView user={{ ...auth.user, logout: auth.logout }} /> : <SalesmanView user={{ ...auth.user, logout: auth.logout }} /> }

createRoot(document.getElementById('root')).render(<Root />)
