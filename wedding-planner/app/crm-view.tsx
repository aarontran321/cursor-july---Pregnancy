'use client'

import { useMemo, useState } from 'react'
import { useCrm } from './crm/store'
import { downloadVendorsCsv } from './crm/csv'
import {
  CATEGORY_LABELS,
  COMM_LABELS,
  STATUS_LABELS,
  STATUS_ORDER,
  type CommType,
  type Vendor,
  type VendorCategory,
  type VendorStatus,
} from './crm/types'
import { LucideIcon, Phone, Mail, Handshake, FileText } from 'lucide-react'

const money = (n?: number) =>
  n === undefined || Number.isNaN(n)
    ? '—'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(n)

const COMM_ICONS: Record<CommType, LucideIcon> = {
  call: Phone,
  email: Mail,
  meeting: Handshake,
  note: FileText,
};

// Themed CRM, rendered as a tab inside the Marrymap dashboard. Uses the same
// CSS variables as the rest of the app, so it follows the light/dark toggle.
export default function CrmView() {
  const crm = useCrm()
  const [statusFilter, setStatusFilter] = useState<VendorStatus | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [layout, setLayout] = useState<'cards' | 'table'>('cards')

  const selected = crm.vendors.find((v) => v.id === selectedId) ?? null

  const stats = useMemo(() => {
    const active = crm.vendors.filter((v) => v.status !== 'declined')
    const booked = crm.vendors
      .filter((v) => v.status === 'booked')
      .reduce((sum, v) => sum + (v.quoteAmount ?? 0), 0)
    const projected = active.reduce((sum, v) => sum + (v.quoteAmount ?? 0), 0)
    const deposits = crm.vendors
      .filter((v) => v.status === 'booked' && v.depositAmount)
      .reduce((sum, v) => sum + (v.depositAmount ?? 0), 0)
    return { booked, projected, deposits, count: active.length }
  }, [crm.vendors])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: crm.vendors.length }
    for (const s of STATUS_ORDER) c[s] = crm.vendors.filter((v) => v.status === s).length
    return c
  }, [crm.vendors])

  const visible =
    statusFilter === 'all' ? crm.vendors : crm.vendors.filter((v) => v.status === statusFilter)

  const budgetPct = Math.min(100, Math.round((stats.projected / crm.budget) * 100))
  const overBudget = stats.projected > crm.budget

  return (
    <div className="app crm">
      <header className="crm-head">
        <div>
          <h1>Vendor CRM</h1>
          <p className="crm-sub">
            Track your wedding vendors, quotes, and conversations in one place.
          </p>
        </div>
        <div className="crm-actions">
          <button
            className="navlink"
            onClick={() => downloadVendorsCsv(visible)}
            title="Export current view to CSV (opens in Sheets or Excel)"
          >
            ↓ Export CSV
          </button>
          <button className="navlink" onClick={crm.resetToSeed}>
            Reset demo
          </button>
          <button className="invite-btn" onClick={() => setShowAdd(true)}>
            + Add vendor
          </button>
        </div>
      </header>

      <section className="crm-stats">
        <StatCard label="Active vendors" value={String(stats.count)} />
        <StatCard label="Projected spend" value={money(stats.projected)} />
        <StatCard label="Booked" value={money(stats.booked)} accent="good" />
        <StatCard label="Deposits due" value={money(stats.deposits)} accent="warn" />
      </section>

      <section className="crm-budget">
        <div className="crm-budget-head">
          <span>Projected vs. budget</span>
          <span className={overBudget ? 'over' : ''}>
            {money(stats.projected)} / {money(crm.budget)}
          </span>
        </div>
        <div className="crm-bar">
          <div
            className={`crm-bar-fill ${overBudget ? 'over' : ''}`}
            style={{ width: `${budgetPct}%` }}
          />
        </div>
        {overBudget && (
          <p className="crm-over-note">
            Projected spend is over budget by {money(stats.projected - crm.budget)}.
          </p>
        )}
      </section>

      <div className="crm-filters">
        <div className="crm-pills">
          <FilterPill
            active={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
            label="All"
            count={counts.all}
          />
          {STATUS_ORDER.map((s) => (
            <FilterPill
              key={s}
              active={statusFilter === s}
              onClick={() => setStatusFilter(s)}
              label={STATUS_LABELS[s]}
              count={counts[s]}
            />
          ))}
        </div>
        <div className="crm-viewtoggle">
          <button
            className={`crm-viewbtn ${layout === 'cards' ? 'active' : ''}`}
            onClick={() => setLayout('cards')}
          >
            Cards
          </button>
          <button
            className={`crm-viewbtn ${layout === 'table' ? 'active' : ''}`}
            onClick={() => setLayout('table')}
          >
            Table
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="crm-empty">No vendors here yet.</div>
      ) : layout === 'cards' ? (
        <div className="crm-grid">
          {visible.map((v) => (
            <VendorCard key={v.id} vendor={v} onClick={() => setSelectedId(v.id)} />
          ))}
        </div>
      ) : (
        <VendorTable vendors={visible} onSelect={setSelectedId} />
      )}

      {selected && (
        <VendorDrawer
          vendor={selected}
          onClose={() => setSelectedId(null)}
          onUpdate={crm.updateVendor}
          onAddLog={crm.addLogEntry}
          onDelete={(id) => {
            crm.deleteVendor(id)
            setSelectedId(null)
          }}
        />
      )}

      {showAdd && (
        <AddVendorDialog
          onClose={() => setShowAdd(false)}
          onCreate={(v) => {
            const id = crm.addVendor(v)
            setShowAdd(false)
            setSelectedId(id)
          }}
        />
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: 'good' | 'warn'
}) {
  return (
    <div className="crm-stat">
      <div className="crm-stat-label">{label}</div>
      <div className={`crm-stat-value ${accent ?? ''}`}>{value}</div>
    </div>
  )
}

function FilterPill({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
}) {
  return (
    <button className={`crm-pill ${active ? 'active' : ''}`} onClick={onClick}>
      {label}
      <span className="crm-count">{count}</span>
    </button>
  )
}

function StatusBadge({ status }: { status: VendorStatus }) {
  return <span className={`crm-badge ${status}`}>{STATUS_LABELS[status]}</span>
}

function VendorCard({ vendor, onClick }: { vendor: Vendor; onClick: () => void }) {
  const last = vendor.log[0];
  const LastIcon = last ? COMM_ICONS[last.type] : null;
  return (
    <button className="crm-card" onClick={onClick}>
      <div className="crm-card-top">
        <div>
          <div className="crm-card-cat">{CATEGORY_LABELS[vendor.category]}</div>
          <div className="crm-card-name">{vendor.name}</div>
        </div>
        <StatusBadge status={vendor.status} />
      </div>
      {vendor.contactName && <div className="crm-card-contact">{vendor.contactName}</div>}
      <div className="crm-card-quote">
        <span>Quote</span>
        <span className="crm-card-amount">{money(vendor.quoteAmount)}</span>
      </div>
      {last && (
        <div className="crm-card-last flex items-center gap-2">
          <LastIcon size={16} />
          <span>{last.summary}</span>
        </div>
      )}
    </button>
  )
}

function VendorTable({
  vendors,
  onSelect,
}: {
  vendors: Vendor[]
  onSelect: (id: string) => void
}) {
  return (
    <div className="crm-table-wrap">
      <table className="crm-table">
        <thead>
          <tr>
            <th>Vendor</th>
            <th>Category</th>
            <th>Status</th>
            <th>Contact</th>
            <th className="right">Quote</th>
            <th className="right">Deposit</th>
            <th>Deposit due</th>
            <th>Last activity</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((v) => (
            <tr key={v.id} onClick={() => onSelect(v.id)}>
              <td className="strong">{v.name}</td>
              <td className="muted">{CATEGORY_LABELS[v.category]}</td>
              <td>
                <StatusBadge status={v.status} />
              </td>
              <td className="muted">
                {v.contactName ?? <span className="dim">—</span>}
                {v.email && <div className="crm-td-sub">{v.email}</div>}
              </td>
              <td className="right strong">{money(v.quoteAmount)}</td>
              <td className="right muted">{money(v.depositAmount)}</td>
              <td className="muted">{v.depositDueDate ?? <span className="dim">—</span>}</td>
              <td className="muted">{v.log[0]?.date ?? <span className="dim">—</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function VendorDrawer({
  vendor,
  onClose,
  onUpdate,
  onAddLog,
  onDelete,
}: {
  vendor: Vendor
  onClose: () => void
  onUpdate: (id: string, patch: Partial<Vendor>) => void
  onAddLog: (vendorId: string, entry: { type: CommType; date: string; summary: string }) => void
  onDelete: (id: string) => void
}) {
  const [logType, setLogType] = useState<CommType>('note')
  const [logSummary, setLogSummary] = useState('')
  

  const submitLog = () => {
    const summary = logSummary.trim()
    if (!summary) return
    onAddLog(vendor.id, {
      type: logType,
      date: new Date().toISOString().slice(0, 10),
      summary,
    })
    setLogSummary('')
  }

  return (
    <div className="crm-drawer-overlay" onClick={onClose}>
      <aside className="crm-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="crm-drawer-head">
          <div>
            <div className="crm-card-cat">{CATEGORY_LABELS[vendor.category]}</div>
            <h2>{vendor.name}</h2>
          </div>
          <button className="crm-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="crm-drawer-body">
          <section>
            <div className="crm-section-label">Status</div>
            <div className="crm-status-pipe">
              {STATUS_ORDER.map((s) => (
                <button
                  key={s}
                  onClick={() => onUpdate(vendor.id, { status: s })}
                  className={`crm-badge ${s} ${vendor.status === s ? 'on' : 'off'}`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </section>

          <section className="crm-fields">
            <div className="crm-section-label">Contact</div>
            <Field
              label="Contact name"
              value={vendor.contactName}
              onChange={(contactName) => onUpdate(vendor.id, { contactName })}
            />
            <Field
              label="Email"
              value={vendor.email}
              onChange={(email) => onUpdate(vendor.id, { email })}
              type="email"
            />
            <Field
              label="Phone"
              value={vendor.phone}
              onChange={(phone) => onUpdate(vendor.id, { phone })}
            />
            <Field
              label="Website"
              value={vendor.website}
              onChange={(website) => onUpdate(vendor.id, { website })}
            />
          </section>

          <section className="crm-fields">
            <div className="crm-section-label">Quote &amp; booking</div>
            <NumField
              label="Quote amount"
              value={vendor.quoteAmount}
              onChange={(quoteAmount) => onUpdate(vendor.id, { quoteAmount })}
            />
            <NumField
              label="Deposit amount"
              value={vendor.depositAmount}
              onChange={(depositAmount) => onUpdate(vendor.id, { depositAmount })}
            />
            <Field
              label="Deposit due"
              value={vendor.depositDueDate}
              onChange={(depositDueDate) => onUpdate(vendor.id, { depositDueDate })}
              type="date"
            />
          </section>

          <section>
            <div className="crm-section-label">Notes</div>
            <textarea
              className="crm-input crm-textarea"
              value={vendor.notes ?? ''}
              onChange={(e) => onUpdate(vendor.id, { notes: e.target.value })}
              rows={3}
              placeholder="Add notes…"
            />
          </section>

          <section>
            <div className="crm-section-label">Communication log</div>
            <div className="crm-log-add">
              <select
                className="crm-input crm-select"
                value={logType}
                onChange={(e) => setLogType(e.target.value as CommType)}
              >
                {(Object.keys(COMM_LABELS) as CommType[]).map((t) => (
                  <option key={t} value={t}>
                  {COMM_LABELS[t]}
                  </option>

                ))}
              </select>
              <input
                className="crm-input"
                value={logSummary}
                onChange={(e) => setLogSummary(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitLog()}
                placeholder="Log an interaction…"
              />
              <button className="invite-btn" onClick={submitLog}>
                Add
              </button>
            </div>

            {vendor.log.length === 0 ? (
              <p className="crm-log-empty">No interactions logged yet.</p>
            ) : (
              <ol className="crm-log">
                {vendor.log.map((entry) => {
                const EntryIcon = COMM_ICONS[entry.type];

                return (
                  <li key={entry.id} className="crm-log-item">
                    <span className="crm-log-dot">
                      <EntryIcon size={16} />
                    </span>

                    <div className="crm-log-row">
                      <span className="crm-log-type">{COMM_LABELS[entry.type]}</span>
                      <span className="crm-log-date">{entry.date}</span>
                    </div>

                    <p className="crm-log-summary">{entry.summary}</p>
                  </li>
                );
              })}

              </ol>
            )}
          </section>

          <button className="crm-delete" onClick={() => onDelete(vendor.id)}>
            Delete vendor
          </button>
        </div>
      </aside>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value?: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <label className="crm-field">
      <span>{label}</span>
      <input
        className="crm-input"
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string
  value?: number
  onChange: (v: number | undefined) => void
}) {
  return (
    <label className="crm-field">
      <span>{label}</span>
      <div className="crm-num">
        <span className="crm-num-prefix">$</span>
        <input
          className="crm-input crm-num-input"
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        />
      </div>
    </label>
  )
}

function AddVendorDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (v: {
    name: string
    category: VendorCategory
    contactName?: string
    email?: string
    status: VendorStatus
  }) => void
}) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<VendorCategory>('photographer')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')

  const submit = () => {
    if (!name.trim()) return
    onCreate({
      name: name.trim(),
      category,
      contactName: contactName.trim() || undefined,
      email: email.trim() || undefined,
      status: 'lead',
    })
  }

  return (
    <div className="mm-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Add vendor</h3>
        <p className="modal-sub">Create a new lead in your pipeline.</p>
        <label>Name</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Lumière Photography"
        />
        <label>Category</label>
        <select
          className="crm-input crm-select"
          value={category}
          onChange={(e) => setCategory(e.target.value as VendorCategory)}
        >
          {(Object.keys(CATEGORY_LABELS) as VendorCategory[]).map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <label>Contact name</label>
        <input value={contactName} onChange={(e) => setContactName(e.target.value)} />
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div className="modal-actions">
          <button className="ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" onClick={submit} disabled={!name.trim()}>
            Add vendor
          </button>
        </div>
      </div>
    </div>
  )
}
