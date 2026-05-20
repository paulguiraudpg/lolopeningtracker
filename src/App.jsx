import { useState, useEffect, useRef, useCallback } from 'react'

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const OPENING_DATE = new Date('2026-06-15T00:00:00')
const RED = '#FF0038'
const BLACK = '#22222A'
const WHITE = '#FFFFFF'
const AMBER = '#FF9500'
const GREEN = '#30D158'
const GREY = '#C0C0C6'
const CARD_BG = '#2C2C34'
const BORDER = '#48484E'

function pctColor(pct) {
  // red → amber → green
  if (pct <= 50) {
    const t = pct / 50
    const r = Math.round(0xFF + t * (0xFF - 0xFF))
    const g = Math.round(0x00 + t * (0x95 - 0x00))
    const b = Math.round(0x38 + t * (0x00 - 0x38))
    return `rgb(${r},${g},${b})`
  } else {
    const t = (pct - 50) / 50
    const r = Math.round(0xFF + t * (0x30 - 0xFF))
    const g = Math.round(0x95 + t * (0xD1 - 0x95))
    const b = Math.round(0x00 + t * (0x58 - 0x00))
    return `rgb(${r},${g},${b})`
  }
}

// ─── INITIAL DATA ─────────────────────────────────────────────────────────────
const ASSORT_DEFAULTS = { assortAB: 'no', assortVectron: 'no', assortPOS: 'no', assortLinked: 'no', assortListLink: '' }

const INITIAL_SUPPLIERS = [
  {
    id: 's1', name: 'Brakes', purpose: 'wholesaler', contact: 'Hash Al-Sayed',
    acctCreated: 'no', acctFormAS: 'no', proquro: 'yes', linkedProquro: 'no', apicbase: 'yes',
    ...ASSORT_DEFAULTS,
    notes: 'need signature from Olympia, Hash confirmed account opening 19.05 awaiting missing info'
  },
  {
    id: 's2', name: 'Diverse Fine Food Ltd', purpose: 'specialty food', contact: 'Mark Wiltshire',
    acctCreated: 'yes', acctFormAS: 'yes', proquro: 'yes', linkedProquro: 'yes', apicbase: 'yes',
    ...ASSORT_DEFAULTS, notes: ''
  },
  {
    id: 's3', name: 'LWC Drinks Ltd', purpose: 'spirits & softs', contact: 'Simon Martin',
    acctCreated: 'no', acctFormAS: 'no', proquro: 'yes', linkedProquro: 'no', apicbase: 'yes',
    ...ASSORT_DEFAULTS,
    notes: 'need signature from Olympia, contract sent to supplier 19.05'
  },
  {
    id: 's4', name: 'Café Route Ltd', purpose: 'societyM', contact: 'Elif Uzunsakal',
    acctCreated: 'yes', acctFormAS: 'yes', proquro: 'yes', linkedProquro: 'yes', apicbase: 'yes',
    ...ASSORT_DEFAULTS, notes: ''
  },
  {
    id: 's5', name: 'Mozzo', purpose: 'coffee', contact: 'Danielle Faustino',
    acctCreated: 'yes', acctFormAS: 'yes', proquro: 'yes', linkedProquro: 'yes', apicbase: 'yes',
    ...ASSORT_DEFAULTS, notes: ''
  },
  {
    id: 's6', name: 'Jing Tea Ltd', purpose: 'tea', contact: 'Martina Halbritter',
    acctCreated: 'yes', acctFormAS: 'yes', proquro: 'yes', linkedProquro: 'yes', apicbase: 'yes',
    ...ASSORT_DEFAULTS, notes: ''
  },
  {
    id: 's7', name: 'Nespresso UK Ltd', purpose: 'societyM coffee', contact: 'Guy Slater',
    acctCreated: 'yes', acctFormAS: 'yes', proquro: 'yes', linkedProquro: 'yes', apicbase: 'yes',
    ...ASSORT_DEFAULTS, notes: ''
  },
  {
    id: 's8', name: 'The Bread Factory', purpose: 'bread', contact: 'Theo Schenk / Dominik Deli',
    acctCreated: 'no', acctFormAS: 'no', proquro: 'yes', linkedProquro: 'no', apicbase: 'yes',
    ...ASSORT_DEFAULTS, notes: 'need to complete form, pdf sent by email'
  },
  {
    id: 's9', name: 'Carlsberg', purpose: 'beer', contact: 'Michael Button',
    acctCreated: 'no', acctFormAS: 'no', proquro: 'no', linkedProquro: 'no', apicbase: 'no',
    ...ASSORT_DEFAULTS, notes: 'email sent 11.05, reminder 14.05, confirmation asked 18.05'
  },
  {
    id: 's10', name: 'Liberty Wines', purpose: 'wine', contact: 'Abi Hehir',
    acctCreated: 'no', acctFormAS: 'no', proquro: 'yes', linkedProquro: 'no', apicbase: 'yes',
    ...ASSORT_DEFAULTS, notes: 'signed contract sent to supplier 18.05'
  },
  {
    id: 's11', name: 'TBC CO2', purpose: 'CO2', contact: '—',
    acctCreated: 'no', acctFormAS: 'no', proquro: 'no', linkedProquro: 'no', apicbase: 'no',
    ...ASSORT_DEFAULTS, notes: 'need to find ref in Apicbase'
  }
]

const ACCT_CHECKS = [
  { key: 'acctCreated',   label: 'Account created at supplier' },
  { key: 'acctFormAS',    label: 'Supplier registration form AS' },
  { key: 'proquro',       label: 'Supplier on Proquro' },
  { key: 'linkedProquro', label: 'Supplier linked to LOL in Proquro' },
  { key: 'apicbase',      label: 'Supplier in Apicbase' },
]

function acctScore(s) {
  const yes = ACCT_CHECKS.filter(c => s[c.key] === 'yes').length
  return Math.round(yes / ACCT_CHECKS.length * 100)
}

function acctStatus(s) {
  const pct = acctScore(s)
  if (pct === 100) return 'completed'
  if (pct > 0) return 'in progress'
  return 'not started'
}

const ASSORT_CHECKS = [
  { key: 'assortAB',       label: 'Assortment in AB',        type: 'yesno' },
  { key: 'assortVectron',  label: 'PLU in Vectron',          type: 'yesno' },
  { key: 'assortPOS',      label: 'PLU displayed on POS',    type: 'yesno' },
  { key: 'assortLinked',   label: 'Link Apicbase & Vectron', type: 'yesno' },
  { key: 'assortListLink', label: 'Assortment list link',    type: 'link'  },
]

function assortScore(s) {
  const filled = ASSORT_CHECKS.filter(c =>
    c.type === 'yesno' ? s[c.key] === 'yes' : (s[c.key] || '').trim() !== ''
  ).length
  return Math.round(filled / ASSORT_CHECKS.length * 100)
}

function assortStatus(s) {
  const pct = assortScore(s)
  if (pct === 100) return 'completed'
  if (pct > 0) return 'in progress'
  return 'not started'
}

const INITIAL_TASKS = [
  // Account opening
  { id: 't1', workstream: 'Account opening', name: 'Complete all account openings', owner: 'Paul', deadline: '2026-05-30', priority: 'Critical', status: 'in progress', notes: 'Completion % entered manually', depends: '' },
  // Alert65
  { id: 't2', workstream: 'Alert65 setup', name: 'Confirm access', owner: 'Paul', deadline: '2026-05-28', priority: 'Important', status: 'completed', notes: '', depends: '' },
  { id: 't3', workstream: 'Alert65 setup', name: 'Enter products and suppliers', owner: 'Paul', deadline: '2026-05-28', priority: 'Important', status: 'not started', notes: '', depends: 'Access confirmed' },
  { id: 't4', workstream: 'Alert65 setup', name: 'List fridges and freezers', owner: 'Paul', deadline: '2026-05-28', priority: 'Important', status: 'not started', notes: '', depends: 'Access confirmed, need to be on site' },
  { id: 't5', workstream: 'Alert65 setup', name: 'Ensure checklists activated and scan content', owner: 'Paul', deadline: '2026-05-28', priority: 'Important', status: 'not started', notes: '', depends: 'Products/suppliers entered' },
  { id: 't6', workstream: 'Alert65 setup', name: 'Test checklist completion in daily digest email', owner: 'Paul', deadline: '2026-05-28', priority: 'Important', status: 'not started', notes: '', depends: 'Checklists activated' },
  // Breakfast standard
  { id: 't7', workstream: 'Breakfast standard', name: 'List all breakfast items', owner: 'Hana', deadline: '2026-05-28', priority: 'Critical', status: 'not started', notes: '', depends: '' },
  { id: 't8', workstream: 'Breakfast standard', name: 'Define setup and produce mapping', owner: 'Paul', deadline: '2026-05-28', priority: 'Critical', status: 'not started', notes: '', depends: 'Breakfast items listed' },
  { id: 't9', workstream: 'Breakfast standard', name: 'Take pictures and update Copilot', owner: 'Paul', deadline: '2026-06-09', priority: 'Critical', status: 'not started', notes: '', depends: 'Setup mapping done + on site' },
  { id: 't10', workstream: 'Breakfast standard', name: 'Train the team', owner: 'Paul', deadline: '2026-06-12', priority: 'Critical', status: 'not started', notes: '', depends: 'Come-back week planning from Erik' },
  // OS&E
  { id: 't11', workstream: 'OS&E', name: 'Receive OS&E', owner: 'Paul & Hana', deadline: '2026-05-28', priority: 'Critical', status: 'not started', notes: 'postponed to 28-29 May', depends: '' },
  { id: 't12', workstream: 'OS&E', name: 'Complete OS&E setup on site', owner: 'Paul & Hana', deadline: '2026-05-28', priority: 'Critical', status: 'not started', notes: '', depends: 'OS&E received' },
  // Branded labels
  { id: 't13', workstream: 'Branded labels', name: 'Confirm branded labels received', owner: 'Paul & Hana', deadline: '2026-05-28', priority: 'Important', status: 'not started', notes: '', depends: '' },
  { id: 't14', workstream: 'Branded labels', name: 'Organize and store labels', owner: 'Paul & Hana', deadline: '2026-05-28', priority: 'Important', status: 'not started', notes: '', depends: 'Labels received' },
  // Orders
  { id: 't15', workstream: 'Orders', name: 'Draft all orders (bar / dry snacks / walk-in fridge / freezer / spirits room / OS&E consumables)', owner: 'Paul', deadline: '2026-05-22', priority: 'Critical', status: 'in progress', notes: '', depends: 'Assortment confirmed + supplier accounts open' },
  { id: 't16', workstream: 'Orders', name: 'Align with Hana on delivery date + order channel', owner: 'Paul', deadline: '2026-05-22', priority: 'Critical', status: 'in progress', notes: '', depends: '' },
  // Printed material
  { id: 't17', workstream: 'Printed material', name: 'Define the list of printed material needed', owner: 'Paul', deadline: '2026-05-28', priority: 'Important', status: 'not started', notes: '', depends: '' },
  { id: 't18', workstream: 'Printed material', name: 'Print all material + plastify and display', owner: 'Paul', deadline: '2026-06-12', priority: 'Important', status: 'not started', notes: '', depends: 'List defined + assortment confirmed' },
  // Assortment
  { id: 't19', workstream: 'Assortment', name: 'Confirm final product selection per category', owner: 'Hana', deadline: '2026-05-22', priority: 'Critical', status: 'not started', notes: '', depends: '' },
  { id: 't20', workstream: 'Assortment', name: 'Update assortment in Apicbase', owner: 'Abdoulaye', deadline: '2026-05-29', priority: 'Critical', status: 'not started', notes: '', depends: 'Product selection confirmed' },
  { id: 't21', workstream: 'Assortment', name: 'Finalize order lists in Apicbase', owner: 'Paul', deadline: '2026-06-03', priority: 'Critical', status: 'not started', notes: '', depends: 'Apicbase updated' },
  // Vectron
  { id: 't22', workstream: 'Vectron setup', name: 'Complete Vectron setup', owner: 'Abdoulaye', deadline: '2026-06-03', priority: 'Critical', status: 'not started', notes: '', depends: 'Assortment updated in Apicbase' },
  { id: 't23', workstream: 'Vectron setup', name: 'Test Vectron in operational conditions', owner: 'Paul', deadline: '2026-06-09', priority: 'Critical', status: 'not started', notes: '', depends: 'Vectron setup complete' },
  // Coffee machine
  { id: 't24', workstream: 'Coffee machine calibration', name: 'Confirm date of calibration by Mozzo', owner: 'Paul', deadline: '2026-05-09', priority: 'Critical', status: 'completed', notes: '18th of May', depends: '' },
  { id: 't25', workstream: 'Coffee machine calibration', name: 'Confirm when calibration is done', owner: 'Paul', deadline: '2026-05-22', priority: 'Critical', status: 'not started', notes: '', depends: 'Calibration date confirmed' },
  // Beer draft
  { id: 't26', workstream: 'Beer draft installation', name: 'Confirm beer draft installation date', owner: 'Paul & Hana', deadline: '2026-05-09', priority: 'Critical', status: 'in progress', notes: '', depends: '' },
  { id: 't27', workstream: 'Beer draft installation', name: 'Confirm when beer draft is installed', owner: 'Paul & Hana', deadline: 'TBC', priority: 'Critical', status: 'in progress', notes: '', depends: 'Installation date confirmed' },
  { id: 't28', workstream: 'Beer draft installation', name: 'Test beer system', owner: 'Paul', deadline: 'TBC', priority: 'Critical', status: 'not started', notes: '', depends: 'Beer draft installed' },
  // Come-back week training
  { id: 't29', workstream: 'Come-back week training', name: 'Define F&B training program for come-back week', owner: 'Paul', deadline: '2026-05-22', priority: 'Critical', status: 'in progress', notes: '', depends: 'Come-back week planning from Erik' },
  { id: 't30', workstream: 'Come-back week training', name: 'Confirm champions for come-back week', owner: 'Paul', deadline: '2026-05-22', priority: 'Critical', status: 'in progress', notes: '', depends: '' },
  { id: 't31', workstream: 'Come-back week training', name: 'Deliver come-back week F&B training', owner: 'Paul', deadline: '2026-06-12', priority: 'Critical', status: 'not started', notes: '', depends: 'Training program defined' },
]

const makeDeliveries = () => [
  { id: 'd-c1', supplier: 'Café Route', code: 'C1', date: '2026-06-05', purpose: 'lunch', status: 'not started' },
  { id: 'd-c2', supplier: 'Café Route', code: 'C2', date: '2026-06-11', purpose: 'lunch', status: 'not started' },
  { id: 'd-b1', supplier: 'Brakes', code: 'B1', date: '2026-06-05', purpose: 'fresh/frozen/dry prestock + breakfast buffet', status: 'not started' },
  { id: 'd-b2', supplier: 'Brakes', code: 'B2', date: '2026-06-10', purpose: 'sleepover top up', status: 'not started' },
  { id: 'd-b3', supplier: 'Brakes', code: 'B3', date: '2026-06-11', purpose: 'final restock before opening', status: 'not started' },
  { id: 'd-l1', supplier: 'LWC Drinks', code: 'L1', date: '2026-06-05', purpose: 'spirits & softs prestock', status: 'not started' },
  { id: 'd-l2', supplier: 'LWC Drinks', code: 'L2', date: '2026-06-10', purpose: 'sleepover top up + last restock', status: 'not started' },
  { id: 'd-m1', supplier: 'Mozzo', code: 'M1', date: '2026-06-05', purpose: 'coffee prestock', status: 'not started' },
  { id: 'd-j1', supplier: 'Jing Tea', code: 'J1', date: '2026-06-05', purpose: 'tea prestock', status: 'not started' },
  { id: 'd-w1', supplier: 'Liberty Wines', code: 'W1', date: '2026-06-05', purpose: 'wine prestock', status: 'not started' },
  { id: 'd-n1', supplier: 'Nespresso', code: 'N1', date: '2026-06-05', purpose: 'nespresso prestock', status: 'not started' },
  { id: 'd-bf1', supplier: 'Bread Factory', code: 'BF1', date: '2026-06-05', purpose: 'breakfast buffet', status: 'not started' },
  { id: 'd-bf2', supplier: 'Bread Factory', code: 'BF2', date: '2026-06-10', purpose: 'breakfast buffet & sleepover', status: 'not started' },
  { id: 'd-d1', supplier: 'Diverse', code: 'D1', date: '2026-06-05', purpose: 'snacks prestock', status: 'not started' },
  { id: 'd-d2', supplier: 'Diverse', code: 'D2', date: '2026-06-10', purpose: 'final restock', status: 'not started' },
]

const COMEBACK_WEEKS = [
  {
    weekNum: 10,
    days: [
      {
        date: '2026-06-04', label: 'Thu 4 Jun',
        slots: [
          { id: 'w10-thu-b', type: 'breakfast', meal: 'breakfast small', pax: 0, prepBy: '', time: '08:15' },
          { id: 'w10-thu-l', type: 'lunch', meal: 'café route', pax: 0, prepBy: '', time: '12:30' },
          { id: 'w10-thu-s', type: 'pm snacks', meal: 'fruit & dry snacks', pax: 0, prepBy: '', time: '14:00' },
        ]
      },
      {
        date: '2026-06-05', label: 'Fri 5 Jun',
        slots: [
          { id: 'w10-fri-b', type: 'breakfast', meal: 'breakfast small', pax: 0, prepBy: '', time: '08:15' },
          { id: 'w10-fri-l', type: 'lunch', meal: 'breakfast buffet', pax: 0, prepBy: '', time: '12:45' },
          { id: 'w10-fri-s', type: 'pm snacks', meal: 'fruit & dry snacks', pax: 0, prepBy: '', time: '14:00' },
        ]
      }
    ]
  },
  {
    weekNum: 11,
    days: [
      { date: '2026-06-08', label: 'Mon 8 Jun', slots: [
        { id: 'w11-mon-b', type: 'breakfast', meal: '', pax: 0, prepBy: '', time: '08:15' },
        { id: 'w11-mon-l', type: 'lunch', meal: '', pax: 0, prepBy: '', time: '12:30' },
        { id: 'w11-mon-s', type: 'pm snacks', meal: '', pax: 0, prepBy: '', time: '14:00' },
      ]},
      { date: '2026-06-09', label: 'Tue 9 Jun', slots: [
        { id: 'w11-tue-b', type: 'breakfast', meal: '', pax: 0, prepBy: '', time: '08:15' },
        { id: 'w11-tue-l', type: 'lunch', meal: '', pax: 0, prepBy: '', time: '12:30' },
        { id: 'w11-tue-s', type: 'pm snacks', meal: '', pax: 0, prepBy: '', time: '14:00' },
      ]},
      { date: '2026-06-10', label: 'Wed 10 Jun', slots: [
        { id: 'w11-wed-b', type: 'breakfast', meal: '', pax: 0, prepBy: '', time: '08:15' },
        { id: 'w11-wed-l', type: 'lunch', meal: '', pax: 0, prepBy: '', time: '12:30' },
        { id: 'w11-wed-s', type: 'pm snacks', meal: '', pax: 0, prepBy: '', time: '14:00' },
      ]},
    ]
  }
]

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function useLS(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : initial
    } catch { return initial }
  })
  useEffect(() => { localStorage.setItem(key, JSON.stringify(val)) }, [key, val])
  return [val, setVal]
}

function daysToOpening() {
  const now = new Date()
  const diff = OPENING_DATE - now
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function statusScore(s) {
  if (s === 'completed') return 100
  if (s === 'in progress') return 50
  return 0
}

function isOverdue(deadline) {
  if (!deadline || deadline === 'TBC') return false
  return new Date(deadline) < new Date(new Date().toDateString())
}

function fmtDate(d) {
  if (!d || d === 'TBC') return 'TBC'
  const dt = new Date(d)
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const STATUS_CYCLE = ['not started', 'in progress', 'completed']
const DELIVERY_CYCLE = ['not started', 'drafted', 'ordered', 'received']

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const CALENDAR_GRID = [
  { week: 'wk 10', dates: ['', '', '', '2026-06-04', '2026-06-05'] },
  { week: 'wk 11', dates: ['2026-06-08', '2026-06-09', '2026-06-10', '2026-06-11', '2026-06-12'] },
]
const MEALS_CALENDAR_GRID = [
  { week: 'wk 10', dates: ['', '', '', '2026-06-04', '2026-06-05'] },
  { week: 'wk 11', dates: ['2026-06-08', '2026-06-09', '2026-06-10', '', ''] },
]

function statusColor(s) {
  if (s === 'completed' || s === 'received' || s === 'ready') return GREEN
  if (s === 'in progress' || s === 'ordered') return AMBER
  if (s === 'drafted') return '#007AFF'
  return RED
}

function fmtDuration(mins) {
  if (!mins) return '—'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h${m}`
}

function statusLabel(s) { return s }

// ─── UI ATOMS ─────────────────────────────────────────────────────────────────
function Pill({ status, onClick, small }) {
  const bg = statusColor(status)
  const style = {
    display: 'inline-block',
    padding: small ? '2px 7px' : '3px 10px',
    borderRadius: 20,
    background: bg,
    color: WHITE,
    fontSize: small ? 10 : 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    cursor: onClick ? 'pointer' : 'default',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  }
  return <span style={style} onClick={onClick}>{status}</span>
}

function OverdueBadge() {
  return (
    <span style={{
      background: RED, color: WHITE, borderRadius: '50%',
      width: 18, height: 18, display: 'inline-flex',
      alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 900, marginLeft: 6, flexShrink: 0
    }}>!</span>
  )
}

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      background: '#38383E', color: WHITE, border: `1px solid ${BORDER}`,
      borderRadius: 8, padding: '6px 10px', fontSize: 13, width: '100%',
      fontFamily: 'Arial, sans-serif', appearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
      paddingRight: 28,
    }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function YesNo({ label, value, onChange }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      paddingBottom: 10, marginBottom: 10, borderBottom: `1px solid ${BORDER}`
    }}>
      <span style={{ color: WHITE, fontSize: 13, flex: 1, paddingRight: 12, lineHeight: 1.3 }}>{label}</span>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {['yes', 'no'].map(opt => (
          <button key={opt} onClick={() => onChange(opt)} style={{
            padding: '5px 14px', borderRadius: 20,
            background: value === opt ? (opt === 'yes' ? GREEN : RED) : '#38383E',
            color: WHITE, border: 'none', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', textTransform: 'lowercase'
          }}>{opt}</button>
        ))}
      </div>
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text', multiline }) {
  const style = {
    background: '#38383E', color: WHITE, border: `1px solid ${BORDER}`,
    borderRadius: 8, padding: '7px 10px', fontSize: 13, width: '100%',
    fontFamily: 'Arial, sans-serif', resize: 'none', outline: 'none',
  }
  if (multiline) return (
    <textarea value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} rows={3} style={style} />
  )
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} style={style} />
  )
}

function Label({ children }) {
  return <div style={{ color: GREY, fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{children}</div>
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

// ─── ANIMATED RING ────────────────────────────────────────────────────────────
function Ring({ pct, size = 80, stroke = 7, label, sub, color = RED }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const [animated, setAnimated] = useState(0)
  useEffect(() => {
    let start = null
    const duration = 1200
    const step = ts => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setAnimated(Math.round(ease * pct))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [pct])
  const dash = (animated / 100) * circ
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#48484E" strokeWidth={stroke} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ - dash}`}
            style={{ transition: 'stroke-dasharray 0.05s' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column'
        }}>
          <span style={{ color: WHITE, fontSize: size > 70 ? 16 : 13, fontWeight: 800 }}>{animated}%</span>
        </div>
      </div>
      <div style={{ color: WHITE, fontSize: 11, fontWeight: 700, textAlign: 'center', lineHeight: 1.3 }}>{label}</div>
      {sub && <div style={{ color: GREY, fontSize: 10, textAlign: 'center' }}>{sub}</div>}
    </div>
  )
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
function ProgressBar({ pct, color = RED, height = 4 }) {
  const [animated, setAnimated] = useState(0)
  useEffect(() => {
    let start = null
    const duration = 900
    const step = ts => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      setAnimated(Math.round((1 - Math.pow(1 - p, 3)) * pct))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [pct])
  return (
    <div style={{ background: '#48484E', borderRadius: height, height, overflow: 'hidden', width: '100%' }}>
      <div style={{ height, background: color, width: `${animated}%`, borderRadius: height, transition: 'width 0.05s' }} />
    </div>
  )
}

// ─── SVG ICONS ────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 22, color = 'currentColor' }) => {
  const paths = {
    dashboard: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 12l-4-4M12 12l3.5-1"/>
        <circle cx="12" cy="12" r="1.5" fill={color} stroke="none"/>
        <path d="M12 6v1M18 12h-1M12 18v-1M6 12h1"/>
      </svg>
    ),
    suppliers: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-6 9 6v11a1 1 0 01-1 1H4a1 1 0 01-1-1z"/>
        <path d="M9 22V12h6v10"/>
      </svg>
    ),
    tasks: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/>
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    ),
    comeback: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <path d="M16 2v4M8 2v4M3 10h18"/>
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
      </svg>
    ),
    training: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
      </svg>
    ),
  }
  return paths[name] || null
}

// ─── TAB NAVIGATION ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard', label: 'dashboard' },
  { id: 'suppliers', label: 'suppliers' },
  { id: 'tasks', label: 'tasks' },
  { id: 'comeback', label: 'comeback' },
  { id: 'training', label: 'training' },
]

// ─── COCKPIT TAB ──────────────────────────────────────────────────────────────
function CockpitTab({ suppliers, tasks }) {
  const days = daysToOpening()
  const [countAnim, setCountAnim] = useState(0)

  useEffect(() => {
    let start = null
    const duration = 1000
    const step = ts => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      setCountAnim(Math.round((1 - Math.pow(1 - p, 4)) * days))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [days])

  const acctPct = Math.round(suppliers.reduce((a, s) => a + acctScore(s), 0) / suppliers.length)
  const assortPct = Math.round(suppliers.reduce((a, s) => a + assortScore(s), 0) / suppliers.length)
  const tasksPct = Math.round(tasks.reduce((a, t) => a + statusScore(t.status), 0) / tasks.length)
  const overallPct = Math.round((acctPct + assortPct + tasksPct) / 3)
  const cardColor = pctColor(overallPct)

  const overdueTasks = tasks.filter(t => isOverdue(t.deadline) && t.status !== 'completed')
  const nextTasks = [...tasks]
    .filter(t => t.status !== 'completed' && t.deadline !== 'TBC' && t.deadline && !isOverdue(t.deadline))
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3)

  return (
    <div style={{ padding: '16px', overflowY: 'auto', height: '100%', paddingBottom: 80 }}>
      {/* Countdown */}
      <div style={{
        background: cardColor,
        borderRadius: 20, padding: '28px 20px', textAlign: 'center', marginBottom: 20
      }}>
        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 600, letterSpacing: 2, marginBottom: 4 }}>DAYS TO OPENING</div>
        <div style={{ color: WHITE, fontSize: 72, fontWeight: 900, lineHeight: 1, letterSpacing: -2 }}>{countAnim}</div>
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 6 }}>June 15, 2026 · citizenM London Olympia</div>
      </div>

      {/* Progress rings */}
      <div style={{
        background: CARD_BG, borderRadius: 16, padding: 20, marginBottom: 16,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24
      }}>
        <Ring pct={acctPct} label={<>supplier<br/>accounts</>} color={pctColor(acctPct)} />
        <Ring pct={assortPct} label={<>assortment<br/>set up</>} color={pctColor(assortPct)} />
        <Ring pct={tasksPct} label={<>preopening<br/>tasks</>} color={pctColor(tasksPct)} />
        <Ring pct={0} label={<>f&b orders<br/>& deliveries</>} color={pctColor(0)} />
      </div>

      {/* Overdue alert */}
      {overdueTasks.length > 0 && (
        <div style={{
          background: 'rgba(255,0,56,0.12)', border: `1px solid ${RED}`,
          borderRadius: 12, padding: 14, marginBottom: 16
        }}>
          <div style={{ color: RED, fontWeight: 800, fontSize: 13, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>⚠</span> {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}
          </div>
          {overdueTasks.map(t => (
            <div key={t.id} style={{ color: '#ffcdd2', fontSize: 12, marginBottom: 4, paddingLeft: 8, borderLeft: `2px solid ${RED}` }}>
              {t.name} <span style={{ color: 'rgba(255,100,100,0.7)' }}>· {fmtDate(t.deadline)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Next critical tasks */}
      <div style={{ background: CARD_BG, borderRadius: 16, padding: 16 }}>
        <div style={{ color: GREY, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>NEXT CRITICAL TASKS</div>
        {nextTasks.length === 0 && <div style={{ color: GREY, fontSize: 13 }}>all caught up!</div>}
        {nextTasks.map(t => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            paddingBottom: 12, marginBottom: 12,
            borderBottom: `1px solid ${BORDER}`,
          }}>
            <div style={{
              minWidth: 44, textAlign: 'center', background: '#38383E',
              borderRadius: 8, padding: '4px 0'
            }}>
              <div style={{ color: RED, fontSize: 11, fontWeight: 700 }}>{fmtDate(t.deadline).split(' ')[1]}</div>
              <div style={{ color: WHITE, fontSize: 16, fontWeight: 900 }}>{fmtDate(t.deadline).split(' ')[0]}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: WHITE, fontSize: 13, fontWeight: 600, marginBottom: 3, lineHeight: 1.3 }}>{t.name}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ color: GREY, fontSize: 11 }}>{t.owner}</span>
                <Pill status={t.status} small />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── SUPPLIERS TAB ────────────────────────────────────────────────────────────
function SupplierCard({ supplier, onUpdate, subView }) {
  const [expanded, setExpanded] = useState(false)
  const isAccount = subView === 'account'
  const relevantStatus = isAccount ? acctStatus(supplier) : assortStatus(supplier)
  const pct = isAccount ? acctScore(supplier) : assortScore(supplier)
  const col = pctColor(pct)

  return (
    <div style={{
      background: CARD_BG, borderRadius: 14, marginBottom: 10,
      overflow: 'hidden', border: `1px solid ${BORDER}`
    }}>
      <div onClick={() => setExpanded(e => !e)} style={{
        padding: '14px 16px', cursor: 'pointer', display: 'flex',
        alignItems: 'center', gap: 12
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ color: WHITE, fontWeight: 700, fontSize: 14 }}>{supplier.name}</span>
          <div style={{ marginTop: 8 }}>
            <Pill status={relevantStatus} small />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: `conic-gradient(${col} ${pct * 3.6}deg, #48484E 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: CARD_BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: WHITE, fontSize: 11, fontWeight: 700 }}>{pct}%</span>
            </div>
          </div>
          <span style={{ color: GREY, fontSize: 16, lineHeight: 1 }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${BORDER}` }}>
          <div style={{ height: 12 }} />
          {isAccount ? (
            <>
              {ACCT_CHECKS.map(c => (
                <YesNo key={c.key} label={c.label} value={supplier[c.key]}
                  onChange={v => onUpdate({ [c.key]: v })} />
              ))}
              <Section label="notes">
                <Input multiline value={supplier.notes} onChange={v => onUpdate({ notes: v })} placeholder="Add notes…" />
              </Section>
            </>
          ) : (
            <>
              {ASSORT_CHECKS.map(c => c.type === 'yesno' ? (
                <YesNo key={c.key} label={c.label} value={supplier[c.key]}
                  onChange={v => onUpdate({ [c.key]: v })} />
              ) : (
                <Section key={c.key} label={c.label}>
                  <Input value={supplier[c.key] || ''} onChange={v => onUpdate({ [c.key]: v })} placeholder="Paste link…" />
                </Section>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function SuppliersTab({ suppliers, setSuppliers }) {
  const [subView, setSubView] = useState('account')
  const acctPct = Math.round(suppliers.reduce((a, s) => a + acctScore(s), 0) / suppliers.length)
  const assortPct = Math.round(suppliers.reduce((a, s) => a + assortScore(s), 0) / suppliers.length)
  const currentPct = subView === 'account' ? acctPct : assortPct

  const update = (id, changes) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...changes } : s))
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Sub-tab buttons */}
      <div style={{ display: 'flex', padding: '14px 16px 10px', gap: 10, flexShrink: 0 }}>
        {['account', 'assortment'].map(id => {
          const active = subView === id
          return (
            <button key={id} onClick={() => setSubView(id)} style={{
              flex: 1, padding: '11px 0',
              background: active ? WHITE : CARD_BG,
              border: `1.5px solid ${active ? WHITE : BORDER}`,
              borderRadius: 12,
              color: active ? BLACK : GREY,
              fontSize: 14, fontWeight: 800, cursor: 'pointer',
              textTransform: 'lowercase', letterSpacing: 0.3,
            }}>{id}</button>
          )
        })}
      </div>
      {/* Cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', paddingBottom: 80 }}>
        {[...suppliers].sort((a, b) => {
          const order = { 'not started': 0, 'in progress': 1, 'completed': 2 }
          const sa = subView === 'account' ? acctStatus(a) : assortStatus(a)
          const sb = subView === 'account' ? acctStatus(b) : assortStatus(b)
          return (order[sa] ?? 1) - (order[sb] ?? 1)
        }).map(s => (
          <SupplierCard key={s.id} supplier={s} subView={subView} onUpdate={changes => update(s.id, changes)} />
        ))}
      </div>
    </div>
  )
}

// ─── TASKS TAB ────────────────────────────────────────────────────────────────
function TaskCard({ task, onUpdate, acctPct }) {
  const [expanded, setExpanded] = useState(false)
  const overdue = isOverdue(task.deadline) && task.status !== 'completed'

  const cycleStatus = () => {
    const idx = STATUS_CYCLE.indexOf(task.status)
    onUpdate({ status: STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length] })
  }

  return (
    <div style={{
      background: CARD_BG, borderRadius: 12, marginBottom: 8,
      border: `1px solid ${overdue && task.status !== 'completed' ? RED : BORDER}`,
      overflow: 'hidden'
    }}>
      <div onClick={() => setExpanded(e => !e)} style={{ padding: '12px 14px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{
                color: WHITE, fontSize: 13, fontWeight: 600, lineHeight: 1.3,
                textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                opacity: task.status === 'completed' ? 0.5 : 1
              }}>{task.name}</span>
              {overdue && <OverdueBadge />}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ color: GREY, fontSize: 11 }}>{task.owner}</span>
              <span style={{ color: task.priority === 'Critical' ? RED : AMBER, fontSize: 11, fontWeight: 600 }}>{task.priority}</span>
              <span style={{ color: GREY, fontSize: 11 }}>{fmtDate(task.deadline)}</span>
            </div>
          </div>
          {acctPct != null && (
            <span style={{ color: WHITE, fontSize: 11, fontWeight: 800, background: pctColor(acctPct), borderRadius: 20, padding: '3px 9px', flexShrink: 0 }}>{acctPct}%</span>
          )}
          {acctPct == null && <Pill status={task.status} small onClick={e => { e.stopPropagation(); cycleStatus() }} />}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${BORDER}` }}>
          <div style={{ height: 10 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <Label>status</Label>
              <Select value={task.status} onChange={v => onUpdate({ status: v })}
                options={['not started', 'in progress', 'completed']} />
            </div>
            <div>
              <Label>priority</Label>
              <Select value={task.priority} onChange={v => onUpdate({ priority: v })}
                options={['Critical', 'Important', 'Nice to have']} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <Section label="owner">
              <Input value={task.owner} onChange={v => onUpdate({ owner: v })} placeholder="Owner" />
            </Section>
            <Section label="deadline">
              <Input value={task.deadline} onChange={v => onUpdate({ deadline: v })} placeholder="YYYY-MM-DD or TBC" />
            </Section>
          </div>
          {task.depends && (
            <div style={{ color: GREY, fontSize: 12, marginBottom: 10, fontStyle: 'italic' }}>
              Depends on: {task.depends}
            </div>
          )}
          <Section label="notes">
            <Input multiline value={task.notes} onChange={v => onUpdate({ notes: v })} placeholder="Add notes…" />
          </Section>
        </div>
      )}
    </div>
  )
}

function TasksTab({ tasks, setTasks, suppliers }) {
  const [filterOwner, setFilterOwner] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [collapsed, setCollapsed] = useState(() =>
    Object.fromEntries([...new Set(INITIAL_TASKS.map(t => t.workstream))].map(w => [w, true]))
  )

  const acctPct = suppliers ? Math.round(suppliers.reduce((a, s) => a + acctScore(s), 0) / suppliers.length) : null

  const owners = ['all', ...new Set(tasks.map(t => t.owner))]
  const statuses = ['all', 'not started', 'in progress', 'completed']

  const filtered = tasks.filter(t =>
    (filterOwner === 'all' || t.owner === filterOwner) &&
    (filterStatus === 'all' || t.status === filterStatus)
  )

  const workstreams = [...new Set(filtered.map(t => t.workstream))]
  const totalPct = Math.round(tasks.reduce((a, t) => a + statusScore(t.status), 0) / tasks.length)

  const update = (id, changes) => setTasks(prev => prev.map(t => t.id === id ? { ...t, ...changes } : t))

  const addTask = () => {
    const id = `t${Date.now()}`
    setTasks(prev => [...prev, {
      id, workstream: 'Custom', name: 'New task', owner: '', deadline: '',
      priority: 'Important', status: 'not started', notes: '', depends: ''
    }])
  }

  const allWorkstreams = [...new Set(tasks.map(t => t.workstream))]
  const allCollapsed = allWorkstreams.every(ws => collapsed[ws] !== false)
  const toggleAll = () => {
    const next = allCollapsed ? false : true
    setCollapsed(Object.fromEntries(allWorkstreams.map(w => [w, next])))
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Title row */}
      <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ color: WHITE, fontSize: 20, fontWeight: 900, textTransform: 'lowercase' }}>tasks</div>
        <button onClick={toggleAll} style={{
          background: 'none', border: `1px solid ${BORDER}`, borderRadius: 6,
          color: GREY, fontSize: 10, fontWeight: 600, cursor: 'pointer',
          padding: '3px 8px', fontFamily: 'Arial', letterSpacing: 0.3,
          textTransform: 'lowercase',
        }}>{allCollapsed ? 'expand all' : 'collapse all'}</button>
      </div>
      {/* Header */}
      <div style={{ padding: '12px 16px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
        {[
          { label: 'owner', allLabel: 'all owners', val: filterOwner, set: setFilterOwner, opts: owners },
          { label: 'status', allLabel: 'all statuses', val: filterStatus, set: setFilterStatus, opts: statuses },
        ].map(f => (
          <select key={f.label} value={f.val} onChange={e => f.set(e.target.value)} style={{
            background: f.val !== 'all' ? RED : '#2C2C2E', color: WHITE,
            border: `1px solid ${f.val !== 'all' ? RED : BORDER}`,
            borderRadius: 20, padding: '5px 10px', fontSize: 11, cursor: 'pointer',
            fontFamily: 'Arial', whiteSpace: 'nowrap', flexShrink: 0
          }}>
            {f.opts.map(o => <option key={o} value={o}>{o === 'all' ? f.allLabel : o}</option>)}
          </select>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={addTask} style={{
          background: RED, color: WHITE, border: 'none', borderRadius: 20,
          padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0
        }}>+ add task</button>
      </div>

      {/* Task list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', paddingBottom: 80 }}>
        {workstreams.map(ws => {
          const wsTasks = filtered.filter(t => t.workstream === ws)
          const wsPct = Math.round(wsTasks.reduce((a, t) => a + statusScore(t.status), 0) / wsTasks.length)
          const displayPct = ws === 'Account opening' && acctPct != null ? acctPct : wsPct
          const isCollapsed = collapsed[ws] !== false
          return (
            <div key={ws} style={{ marginBottom: 20 }}>
              <div
                onClick={() => setCollapsed(c => ({ ...c, [ws]: !c[ws] }))}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, cursor: 'pointer', userSelect: 'none' }}
              >
                <span style={{ color: WHITE, fontSize: 13, fontWeight: 800, textTransform: 'lowercase' }}>{ws}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: GREY, fontSize: 11 }}>{displayPct}%</span>
                  <span style={{ color: GREY, fontSize: 12, lineHeight: 1 }}>{isCollapsed ? '▶' : '▼'}</span>
                </div>
              </div>
              <ProgressBar pct={displayPct} height={3} />
              {!isCollapsed && (
                <>
                  <div style={{ height: 10 }} />
                  {wsTasks.map(t => (
                    <TaskCard key={t.id} task={t} onUpdate={changes => update(t.id, changes)}
                      acctPct={t.id === 't1' ? acctPct : null} />
                  ))}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── COMEBACK TAB ─────────────────────────────────────────────────────────────
function MealSlot({ slot, onUpdate }) {
  const [open, setOpen] = useState(false)
  const typeColor = { breakfast: '#007AFF', lunch: '#30B0C7', 'pm snacks': GREEN }
  return (
    <div style={{
      background: '#38383E', borderRadius: 10, marginBottom: 6,
      border: `1px solid ${BORDER}`, overflow: 'hidden'
    }}>
      <div onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer'
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          background: typeColor[slot.type] || GREY
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: GREY, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{slot.type} · {slot.time}</div>
          <div style={{ color: WHITE, fontSize: 13, fontWeight: 600, marginTop: 2 }}>
            {slot.meal || <span style={{ color: '#6C6C70' }}>tap to add</span>}
          </div>
        </div>
        {slot.pax > 0 && <span style={{ color: GREY, fontSize: 12, flexShrink: 0 }}>{slot.pax} pax</span>}
        <span style={{ color: GREY, fontSize: 16 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ padding: '0 12px 12px', borderTop: `1px solid ${BORDER}` }}>
          <div style={{ height: 8 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <Section label="meal">
              <Input value={slot.meal} onChange={v => onUpdate({ meal: v })} placeholder="Meal name" />
            </Section>
            <Section label="pax">
              <Input type="number" value={slot.pax} onChange={v => onUpdate({ pax: Number(v) })} placeholder="0" />
            </Section>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Section label="prep by">
              <Input value={slot.prepBy} onChange={v => onUpdate({ prepBy: v })} placeholder="Name" />
            </Section>
            <Section label="start time">
              <Input value={slot.time} onChange={v => onUpdate({ time: v })} placeholder="HH:MM" />
            </Section>
          </div>
        </div>
      )}
    </div>
  )
}


function MealsCalendar({ weeks, setWeeks }) {
  const [selectedDate, setSelectedDate] = useState(null)
  const typeColor = { breakfast: '#007AFF', lunch: '#30B0C7', 'pm snacks': GREEN }

  const dateMap = {}
  weeks.forEach((w, wi) => w.days.forEach((day, di) => {
    dateMap[day.date] = { weekIdx: wi, dayIdx: di, day }
  }))

  const updateSlot = (weekIdx, dayIdx, slotIdx, changes) => {
    setWeeks(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      Object.assign(next[weekIdx].days[dayIdx].slots[slotIdx], changes)
      return next
    })
  }

  const selectedEntry = selectedDate ? dateMap[selectedDate] : null

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', paddingBottom: 80 }}>
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '36px repeat(5, 1fr)', gap: 4, marginBottom: 4 }}>
        <div />
        {WEEK_DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', color: GREY, fontSize: 10, fontWeight: 700 }}>{d}</div>
        ))}
      </div>
      {/* Week rows */}
      {MEALS_CALENDAR_GRID.map(({ week, dates }) => (
        <div key={week} style={{ display: 'grid', gridTemplateColumns: '36px repeat(5, 1fr)', gap: 4, marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: GREY, fontSize: 8, fontWeight: 700, writingMode: 'vertical-rl', textTransform: 'uppercase', letterSpacing: 1 }}>{week}</span>
          </div>
          {dates.map((date, di) => {
            if (!date) return <div key={`e-${di}`} />
            const entry = dateMap[date]
            const slots = entry?.day.slots || []
            const isSelected = date === selectedDate
            return (
              <div key={date} onClick={() => setSelectedDate(isSelected ? null : date)} style={{
                background: isSelected ? WHITE : CARD_BG,
                border: `1.5px solid ${isSelected ? WHITE : BORDER}`,
                borderRadius: 10, padding: '8px 4px', textAlign: 'center',
                cursor: 'pointer', minHeight: 68
              }}>
                <div style={{ color: isSelected ? BLACK : WHITE, fontSize: 16, fontWeight: 900, lineHeight: 1 }}>
                  {new Date(date).getDate()}
                </div>
                <div style={{ color: isSelected ? '#666' : GREY, fontSize: 9, marginBottom: 6 }}>
                  {new Date(date).toLocaleDateString('en-GB', { month: 'short' })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
                  {slots.map(s => (
                    <div key={s.id} style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: s.meal ? typeColor[s.type] : 'transparent',
                      border: `1.5px solid ${typeColor[s.type] || GREY}`,
                      opacity: s.meal ? 1 : 0.4,
                    }} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ))}
      {/* Dot legend */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 10, marginBottom: 16 }}>
        {Object.entries(typeColor).map(([type, color]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
            <span style={{ color: GREY, fontSize: 10 }}>{type}</span>
          </div>
        ))}
      </div>
      {/* Selected day detail */}
      {selectedEntry && (
        <div>
          <div style={{ color: WHITE, fontSize: 13, fontWeight: 800, marginBottom: 10, textTransform: 'lowercase' }}>
            {selectedEntry.day.label}
          </div>
          {selectedEntry.day.slots.map((slot, si) => (
            <MealSlot key={slot.id} slot={slot}
              onUpdate={changes => updateSlot(selectedEntry.weekIdx, selectedEntry.dayIdx, si, changes)} />
          ))}
        </div>
      )}
    </div>
  )
}

function MealsSubTab({ weeks, setWeeks }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <MealsCalendar weeks={weeks} setWeeks={setWeeks} />
    </div>
  )
}

function DeliveriesCalendar({ deliveries, cycleStatus }) {
  const [selectedDate, setSelectedDate] = useState(null)

  const byDay = deliveries.reduce((acc, d) => {
    if (!acc[d.date]) acc[d.date] = []
    acc[d.date].push(d)
    return acc
  }, {})

  const fmtDayFull = dateStr =>
    new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', paddingBottom: 80 }}>
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '36px repeat(5, 1fr)', gap: 4, marginBottom: 4 }}>
        <div />
        {WEEK_DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', color: GREY, fontSize: 10, fontWeight: 700 }}>{d}</div>
        ))}
      </div>
      {/* Week rows */}
      {CALENDAR_GRID.map(({ week, dates }) => (
        <div key={week} style={{ display: 'grid', gridTemplateColumns: '36px repeat(5, 1fr)', gap: 4, marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: GREY, fontSize: 8, fontWeight: 700, writingMode: 'vertical-rl', textTransform: 'uppercase', letterSpacing: 1 }}>{week}</span>
          </div>
          {dates.map((date, di) => {
            if (!date) return <div key={`e-${di}`} />
            const dels = byDay[date] || []
            const isSelected = date === selectedDate
            const allDone = dels.length > 0 && dels.every(d => d.status === 'received')
            return (
              <div key={date} onClick={() => setSelectedDate(isSelected ? null : date)} style={{
                background: isSelected ? WHITE : CARD_BG,
                border: `1.5px solid ${isSelected ? WHITE : BORDER}`,
                borderRadius: 10, padding: '8px 4px', textAlign: 'center',
                cursor: 'pointer', minHeight: 68
              }}>
                <div style={{ color: isSelected ? BLACK : WHITE, fontSize: 16, fontWeight: 900, lineHeight: 1 }}>
                  {new Date(date).getDate()}
                </div>
                <div style={{ color: isSelected ? '#666' : GREY, fontSize: 9, marginBottom: 6 }}>
                  {new Date(date).toLocaleDateString('en-GB', { month: 'short' })}
                </div>
                {dels.length > 0 && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 20, height: 20, borderRadius: '50%',
                    background: allDone ? GREEN : (isSelected ? BLACK : '#48484E'),
                    color: WHITE, fontSize: 11, fontWeight: 800,
                  }}>{dels.length}</div>
                )}
              </div>
            )
          })}
        </div>
      ))}
      {/* Selected day detail */}
      {selectedDate && (
        <div style={{ marginTop: 16 }}>
          <div style={{ color: WHITE, fontSize: 13, fontWeight: 800, marginBottom: 10 }}>
            {fmtDayFull(selectedDate)}
          </div>
          {(byDay[selectedDate] || []).length === 0 ? (
            <div style={{ color: GREY, fontSize: 13 }}>no deliveries this day</div>
          ) : (
            <div style={{ background: CARD_BG, borderRadius: 12, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
              {(byDay[selectedDate] || []).map((d, i, arr) => (
                <div key={d.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
                  borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : 'none'
                }}>
                  <div style={{
                    background: '#48484E', borderRadius: 6, padding: '4px 8px',
                    color: WHITE, fontSize: 11, fontWeight: 800, flexShrink: 0
                  }}>{d.code}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: WHITE, fontSize: 13, fontWeight: 600 }}>{d.supplier}</div>
                    <div style={{ color: GREY, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.purpose}</div>
                  </div>
                  <Pill status={d.status} small onClick={() => cycleStatus(d.id)} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DeliveriesSubTab({ deliveries, setDeliveries }) {
  const cycleStatus = id => {
    setDeliveries(prev => prev.map(d => {
      if (d.id !== id) return d
      const idx = DELIVERY_CYCLE.indexOf(d.status)
      return { ...d, status: DELIVERY_CYCLE[(idx + 1) % DELIVERY_CYCLE.length] }
    }))
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <DeliveriesCalendar deliveries={deliveries} cycleStatus={cycleStatus} />
    </div>
  )
}

function ComebackTab({ weeks, setWeeks, deliveries, setDeliveries }) {
  const [subTab, setSubTab] = useState('meals')
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', padding: '12px 16px 0', gap: 0, flexShrink: 0 }}>
        {['meals', 'deliveries'].map(t => (
          <button key={t} onClick={() => setSubTab(t)} style={{
            flex: 1, padding: '9px 0', background: 'none', border: 'none',
            borderBottom: subTab === t ? `2px solid ${RED}` : `2px solid ${BORDER}`,
            color: subTab === t ? WHITE : GREY,
            fontSize: 13, fontWeight: 700, cursor: 'pointer', textTransform: 'lowercase'
          }}>{t}</button>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        {subTab === 'meals'
          ? <MealsSubTab weeks={weeks} setWeeks={setWeeks} />
          : <DeliveriesSubTab deliveries={deliveries} setDeliveries={setDeliveries} />
        }
      </div>
    </div>
  )
}

// ─── TRAINING TAB ─────────────────────────────────────────────────────────────
const TRAINING_STATUSES = ['not started', 'in progress', 'ready']

function TrainingCard({ training, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false)

  const parts = training.parts || []
  const totalMins = parts.reduce((a, p) => a + (Number(p.duration) || 0), 0)
  const status = training.status || 'not started'

  const addPart = () => onUpdate({ parts: [...parts, { id: Date.now(), name: '', duration: '' }] })
  const updatePart = (id, changes) => onUpdate({ parts: parts.map(p => p.id === id ? { ...p, ...changes } : p) })
  const removePart = id => onUpdate({ parts: parts.filter(p => p.id !== id) })

  return (
    <div style={{ background: CARD_BG, borderRadius: 14, marginBottom: 12, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
      <div onClick={() => setExpanded(e => !e)} style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: WHITE, fontWeight: 700, fontSize: 14 }}>{training.name || 'untitled training'}</div>
          <div style={{ color: GREY, fontSize: 12, marginTop: 3 }}>
            {fmtDuration(totalMins)} · {parts.length} part{parts.length !== 1 ? 's' : ''}
          </div>
        </div>
        <Pill status={status} small onClick={e => {
          e.stopPropagation()
          const idx = TRAINING_STATUSES.indexOf(status)
          onUpdate({ status: TRAINING_STATUSES[(idx + 1) % TRAINING_STATUSES.length] })
        }} />
        <span style={{ color: GREY, fontSize: 16, marginLeft: 4 }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${BORDER}` }}>
          <div style={{ height: 12 }} />

          <Section label="training name">
            <Input value={training.name} onChange={v => onUpdate({ name: v })} placeholder="e.g. breakfast training" />
          </Section>

          <Section label="presentation / material">
            <div style={{ display: 'flex', gap: 6 }}>
              {TRAINING_STATUSES.map(s => (
                <button key={s} onClick={() => onUpdate({ status: s })} style={{
                  flex: 1, padding: '7px 4px', borderRadius: 8, border: 'none',
                  background: status === s ? statusColor(s) : '#38383E',
                  color: WHITE, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  textTransform: 'lowercase',
                }}>{s}</button>
              ))}
            </div>
          </Section>

          <div style={{ color: GREY, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, marginBottom: 10 }}>PARTS</div>
          {parts.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ color: GREY, fontSize: 12, flexShrink: 0, minWidth: 16, textAlign: 'right' }}>{i + 1}.</span>
              <div style={{ flex: 1 }}>
                <Input value={p.name} onChange={v => updatePart(p.id, { name: v })} placeholder="Part name" />
              </div>
              <div style={{ width: 68, flexShrink: 0 }}>
                <Input type="number" value={p.duration} onChange={v => updatePart(p.id, { duration: v })} placeholder="min" />
              </div>
              <button onClick={() => removePart(p.id)} style={{ background: 'none', border: 'none', color: RED, fontSize: 18, cursor: 'pointer', padding: 0, flexShrink: 0 }}>×</button>
            </div>
          ))}

          {parts.length > 0 && (
            <div style={{ textAlign: 'right', color: GREY, fontSize: 12, marginBottom: 10 }}>
              total — <span style={{ color: WHITE, fontWeight: 700 }}>{fmtDuration(totalMins)}</span>
            </div>
          )}

          <button onClick={addPart} style={{
            background: '#38383E', color: WHITE, border: `1px dashed ${BORDER}`,
            borderRadius: 10, padding: '9px', fontSize: 12, cursor: 'pointer',
            width: '100%', marginBottom: 16
          }}>+ add part</button>

          <button onClick={onDelete} style={{
            background: 'rgba(255,0,56,0.1)', color: RED,
            border: `1px solid rgba(255,0,56,0.3)`, borderRadius: 10,
            padding: '8px', fontSize: 12, cursor: 'pointer', width: '100%'
          }}>delete training</button>
        </div>
      )}
    </div>
  )
}

function TrainingTab({ trainings, setTrainings }) {
  const add = () => setTrainings(prev => [...prev, {
    id: `tr${Date.now()}`, name: '', status: 'not started', parts: []
  }])
  const update = (id, changes) => setTrainings(prev => prev.map(t => t.id === id ? { ...t, ...changes } : t))
  const del = id => setTrainings(prev => prev.filter(t => t.id !== id))

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <span style={{ color: GREY, fontSize: 12 }}>{trainings.length} session{trainings.length !== 1 ? 's' : ''}</span>
        <button onClick={add} style={{
          background: RED, color: WHITE, border: 'none', borderRadius: 20,
          padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer'
        }}>+ add training</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', paddingBottom: 80 }}>
        {trainings.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 20px', color: GREY, fontSize: 14
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>no training sessions yet</div>
            <div style={{ fontSize: 12 }}>tap "+ add training" to create one</div>
          </div>
        )}
        {trainings.map(t => (
          <TrainingCard key={t.id} training={t}
            onUpdate={changes => update(t.id, changes)}
            onDelete={() => del(t.id)} />
        ))}
      </div>
    </div>
  )
}

// ─── SPLASH SCREEN ────────────────────────────────────────────────────────────
function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState('in') // 'in' | 'hold' | 'out'

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 600)
    const t2 = setTimeout(() => setPhase('out'), 1000)
    const t3 = setTimeout(() => onDone(), 1400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  const logoStyle = {
    width: 180,
    transition: phase === 'in'
      ? 'opacity 0.6s ease, transform 0.6s ease'
      : 'opacity 0.4s ease',
    opacity: phase === 'out' ? 0 : 1,
    transform: phase === 'in' ? 'scale(0.82)' : 'scale(1)',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: BLACK,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: phase === 'out' ? 'opacity 0.4s ease' : 'none',
      opacity: phase === 'out' ? 0 : 1,
    }}>
      <svg style={logoStyle} viewBox="0 0 283.46 283.46" xmlns="http://www.w3.org/2000/svg">
        <path fill="#FF0038" d="M47.12,83.05c-13.36,0-22.93-10.34-22.93-23.19s9.57-23.37,22.93-23.37c10.7,0,18.8,6,21.39,16H56.35a10.62,10.62,0,0,0-9.23-5.61c-6.29,0-11.38,5.87-11.38,13,0,7,5.09,12.77,11.38,12.77A10.44,10.44,0,0,0,56.43,67H68.59C66,77.1,57.9,83.05,47.12,83.05Z"/>
        <path fill="#FF0038" d="M82.87,82H71.49V37.61H82.87Z"/>
        <path fill="#FF0038" d="M112.36,81.93c-13,1.38-19.92-6.47-19.92-18.62V47.7H87.1V37.61h5.34V22.17h11.39V37.61h8V47.7h-8V63.39c0,6.21,2.84,8.54,8.53,8.19Z"/>
        <path fill="#FF0038" d="M128.34,82H117V37.61h11.38Z"/>
        <path fill="#FF0038" d="M171,82h-38.8V72.19l23.45-24.32H133.12V37.61h37.09V47.79l-23,24H171Z"/>
        <path fill="#FF0038" d="M182.52,64.25a11.3,11.3,0,0,0,11.12,8.8,10.31,10.31,0,0,0,9.4-5.17H215.2c-2.58,9.05-10.43,15.17-21.47,15.17A23,23,0,0,1,171,59.86c0-12.85,10.26-23.37,22.77-23.37,13.11,0,24,10.17,22.33,27.76Zm22.25-9.31a11.14,11.14,0,0,0-11.13-8.45c-5.17,0-9.31,3.28-10.95,8.45Z"/>
        <path fill="#FF0038" d="M259.32,82H247.93v-26c0-2.58-.77-8.79-8.27-8.79A8.43,8.43,0,0,0,231,56.06V82H219.65V37.61h10.87v4.31A14.65,14.65,0,0,1,242,36.49c10.43,0,17.33,7.84,17.33,19.57Z"/>
        <polygon fill="#FF0038" points="25.72 262.29 81.57 262.29 25.72 174.09 25.72 262.29"/>
        <polygon fill="#FF0038" points="25.72 89.47 25.72 147.34 97.78 261 154.75 171.67 103.14 89.47 25.72 89.47"/>
        <path fill="#FF0038" d="M207.09,89.47l-45.79,72V262.29h98V89.47Z"/>
        <path fill="#fff" d="M207.56,256.37h-2.74v-6.26a1.85,1.85,0,0,0-2-2,2,2,0,0,0-2.08,2v6.26H198V240.91h2.77v5.32a4,4,0,0,1,2.45-.83c2.62,0,4.36,1.89,4.36,4.71Z"/>
        <path fill="#fff" d="M226.39,256.35c-3.14.33-4.8-1.56-4.8-4.49V248.1H220.3v-2.43h1.29v-2.73h2.74v2.73h1.94v2.43h-1.94v3.78c0,1.5.69,2.06,2.06,2Z"/>
        <rect fill="#fff" x="240" y="240.91" width="2.74" height="15.46"/>
        <path fill="#fff" d="M249.31,256.62c-2.72,0-4.74-1.44-5.07-3.74H247a2.44,2.44,0,0,0,2.29,1.24c1.1,0,1.93-.33,1.93-1s-.37-.85-2.24-1.14-4.47-.82-4.47-3.2c0-1.69,1.48-3.43,4.57-3.43,2.45,0,4.28,1.33,4.64,3.34h-2.85c-.17-.5-.77-.89-1.79-.89-1.27,0-1.78.46-1.78.85,0,.56.78.75,2.11,1,2.66.43,4.58,1,4.58,3.34C254,255.12,252.05,256.62,249.31,256.62Z"/>
        <path fill="#fff" d="M232.87,245.4a5.61,5.61,0,0,0,0,11.22,5.09,5.09,0,0,0,5.18-3.66h-2.93a2.5,2.5,0,0,1-2.27,1.25,2.72,2.72,0,0,1-2.68-2.12h8.09C238.65,247.85,236,245.4,232.87,245.4Zm-2.66,4.44a2.75,2.75,0,0,1,2.64-2,2.68,2.68,0,0,1,2.68,2Z"/>
        <path fill="#fff" d="M214.21,245.4a5.61,5.61,0,1,0,5.41,5.63A5.45,5.45,0,0,0,214.21,245.4Zm0,8.7a2.8,2.8,0,0,1-2.64-3,2.86,2.86,0,0,1,2.64-3.14c1.46,0,2.64,1.29,2.64,3.14A2.79,2.79,0,0,1,214.21,254.1Z"/>
      </svg>
    </div>
  )
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [splash, setSplash] = useState(() => !sessionStorage.getItem('splashShown'))
  const [activeTab, setActiveTab] = useState('dashboard')
  const [prevTab, setPrevTab] = useState(null)
  const [sliding, setSliding] = useState(false)

  const [suppliers, setSuppliers] = useLS('lol_suppliers', INITIAL_SUPPLIERS)
  const [tasks, setTasks] = useLS('lol_tasks', INITIAL_TASKS)

  // Migration: reset suppliers if stored data uses old schema
  useEffect(() => {
    if (suppliers.length > 0 && ('accountStatus' in suppliers[0] || 'assortmentStatus' in suppliers[0])) {
      setSuppliers(INITIAL_SUPPLIERS)
    }
  }, [])
  const [weeks, setWeeks] = useLS('lol_weeks', COMEBACK_WEEKS)
  const [deliveries, setDeliveries] = useLS('lol_deliveries', makeDeliveries())
  const [trainings, setTrainings] = useLS('lol_trainings', [])

  const tabOrder = TABS.map(t => t.id)

  const navigate = useCallback((id) => {
    if (id === activeTab || sliding) return
    setPrevTab(activeTab)
    setSliding(true)
    setActiveTab(id)
    setTimeout(() => { setPrevTab(null); setSliding(false) }, 320)
  }, [activeTab, sliding])

  const overdueTasks = tasks.filter(t => isOverdue(t.deadline) && t.status !== 'completed')

  const renderTab = (id) => {
    switch (id) {
      case 'dashboard': return <CockpitTab suppliers={suppliers} tasks={tasks} />
      case 'suppliers': return <SuppliersTab suppliers={suppliers} setSuppliers={setSuppliers} />
      case 'tasks': return <TasksTab tasks={tasks} setTasks={setTasks} suppliers={suppliers} />
      case 'comeback': return <ComebackTab weeks={weeks} setWeeks={setWeeks} deliveries={deliveries} setDeliveries={setDeliveries} />
      case 'training': return <TrainingTab trainings={trainings} setTrainings={setTrainings} />
      default: return null
    }
  }

  const getSlideDir = (from, to) => {
    return tabOrder.indexOf(to) > tabOrder.indexOf(from) ? 1 : -1
  }

  const dir = prevTab ? getSlideDir(prevTab, activeTab) : 0

  return (
    <div style={{
      width: '100%', height: '100%', maxWidth: 430, margin: '0 auto',
      background: BLACK, display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden'
    }}>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(${dir * 100}%); }
          to { transform: translateX(0); }
        }
        @keyframes slideOut {
          from { transform: translateX(0); }
          to { transform: translateX(${dir * -100}%); }
        }
        .slide-in { animation: slideIn 0.3s cubic-bezier(0.4,0,0.2,1) forwards; }
        .slide-out { animation: slideOut 0.3s cubic-bezier(0.4,0,0.2,1) forwards; }
        ::-webkit-scrollbar { width: 0; }
        * { -webkit-tap-highlight-color: transparent; }
        select option { background: #38383E; color: white; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.3; }
      `}</style>

      {splash && <SplashScreen onDone={() => { sessionStorage.setItem('splashShown', '1'); setSplash(false) }} />}
      {/* Tab page title */}
      {activeTab !== 'tasks' && <div style={{
        padding: '14px 16px 10px', background: BLACK,
        borderBottom: `1px solid ${BORDER}`, flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ color: WHITE, fontSize: 20, fontWeight: 900, textTransform: 'lowercase' }}>
            {activeTab}
          </div>
        </div>
      </div>}

      {/* Tab content with slide transition */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        {prevTab && (
          <div className="slide-out" style={{ position: 'absolute', inset: 0, zIndex: 1, overflow: 'hidden' }}>
            {renderTab(prevTab)}
          </div>
        )}
        <div className={sliding ? 'slide-in' : ''} style={{ position: 'absolute', inset: 0, zIndex: 2, overflow: 'hidden' }}>
          {renderTab(activeTab)}
        </div>
      </div>

      {/* Bottom tab bar */}
      <div style={{
        display: 'flex', background: BLACK,
        borderTop: `1px solid ${BORDER}`,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        flexShrink: 0, zIndex: 100
      }}>
        {TABS.map(tab => {
          const isActive = tab.id === activeTab
          const hasAlert = tab.id === 'tasks' && overdueTasks.length > 0
          const iconColor = isActive ? RED : '#7A7A82'

          return (
            <button key={tab.id} onClick={() => navigate(tab.id)} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '8px 4px', background: 'none', border: 'none',
              cursor: 'pointer', position: 'relative', minHeight: 56,
              color: iconColor,
            }}>
              <div style={{ position: 'relative', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={tab.id} size={22} color={iconColor} />
                {hasAlert && (
                  <div style={{
                    position: 'absolute', top: -4, right: -6,
                    background: RED, borderRadius: '50%', width: 14, height: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, color: WHITE, fontWeight: 900
                  }}>{overdueTasks.length}</div>
                )}
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, marginTop: 3,
                color: isActive ? RED : '#7A7A82',
                textTransform: 'lowercase', letterSpacing: 0.2
              }}>{tab.label}</span>
              {isActive && (
                <div style={{
                  position: 'absolute', bottom: 0, left: '20%', right: '20%',
                  height: 2, background: RED, borderRadius: 1
                }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
