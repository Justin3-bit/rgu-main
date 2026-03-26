"use client"

import { useState } from "react"
import { ShoppingBag } from "lucide-react"
import s from "@/styles/pages.module.css"
import u from "@/styles/ui.module.css"
import StatusBadge from "@/components/StatusBadge"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

const TABS = [
  { key: "orders",  label: " Orders" },
  { key: "profile", label: " Profile" },
  { key: "address", label: " Address" },
]

export default function AccountClient({ user, profile, orders }) {
  const supabase = createClient()
  const [tab, setSaving_tab] = useState("orders")
  const [saving, setSaving]  = useState(false)
  const [form, setForm]      = useState({
    full_name: profile?.full_name || "",
    phone:     profile?.phone     || "",
    address:   profile?.address   || "",
    city:      profile?.city      || "",
    postcode:  profile?.postcode  || "",
  })

  function setTab(t) { setSaving_tab(t) }
  function upd(k, v) { setForm(p => ({ ...p, [k]: v })) }

  const initials = form.full_name
    ? form.full_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "?"

  async function saveProfile() {
    setSaving(true)
    const { error } = await supabase.from("profiles").update(form).eq("id", user.id)
    setSaving(false)
    if (error) toast.error(error.message)
    else       toast.success("Profile updated ")
  }

  return (
    <div className={s.page}>
      <div className="container">
        <div style={{ marginBottom: "2rem" }}>
          <div className={u.sectionTag}>My Account</div>
          <h1 className={u.sectionTitle}>Account Centre</h1>
        </div>

        <div className={s.accountLayout}>
          {/* Sidebar */}
          <div className={s.sidebar}>
            <div className={s.sidebarTop}>
              <div className={s.sidebarAvatar}>{initials}</div>
              <div className={s.sidebarName}>{form.full_name || "Your Name"}</div>
              <div className={s.sidebarEmail}>{user.email}</div>
            </div>
            <div className={s.sidebarMeta}>
              Member since {new Date(user.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
            </div>
          </div>

          {/* Main content */}
          <div>
            {/* Tab bar */}
            <div className={u.tabsList} style={{ marginBottom: "1.25rem" }}>
              {TABS.map(t => (
                <button
                  key={t.key}
                  className={`${u.tabsTrigger} ${tab === t.key ? u.tabsTriggerActive : ""}`}
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Orders tab */}
            {tab === "orders" && (
              orders.length === 0 ? (
                <div className={`${u.card} ${u.cardBody}`}>
                  <div className={u.emptyState}>
                    <div className={u.emptyIcon}><ShoppingBag size={40} color="var(--earth-200)" /></div>
                    <p>No orders yet.</p>
                    <a href="/shop" style={{ marginTop: "0.75rem", display: "inline-block", color: "var(--earth-700)", fontSize: "0.875rem", textDecoration: "underline" }}>
                      Start shopping
                    </a>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {orders.map(o => (
                    <div key={o.id} className={s.orderCard}>
                      <div className={s.orderCardHead}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <span className={s.orderId2}>{o.id}</span>
                          <span className={s.orderDate}>{new Date(o.created_at).toLocaleDateString("en-GB")}</span>
                        </div>
                        <StatusBadge status={o.status} />
                      </div>
                      <div className={s.orderCardBody}>
                        <div className={s.orderItems}>
                          {o.order_items?.map((item, i) => (
                            <span key={i}>
                              {item.products?.emoji} {item.products?.name} ×{item.qty}
                              {i < o.order_items.length - 1 ? ", " : ""}
                            </span>
                          ))}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.35rem" }}>
                          <span className={s.orderAddress}> {o.address}, {o.city} {o.postcode}</span>
                          <span className={s.orderTotal}>£{Number(o.total).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Profile tab */}
            {tab === "profile" && (
              <div className={u.card}>
                <div className={u.cardHeader}><div className={u.cardTitle}>Personal Information</div></div>
                <div className={u.cardBody}>
                  <div className={s.formStack}>
                    <div className={s.formRow}>
                      <div className={u.formGroup}>
                        <label className={u.label}>Full Name</label>
                        <input className={u.input} value={form.full_name} onChange={e => upd("full_name", e.target.value)} />
                      </div>
                      <div className={u.formGroup}>
                        <label className={u.label}>Phone</label>
                        <input className={u.input} value={form.phone} onChange={e => upd("phone", e.target.value)} placeholder="07700 900000" />
                      </div>
                    </div>
                    <div className={u.formGroup}>
                      <label className={u.label}>Email (cannot be changed here)</label>
                      <input className={u.input} value={user.email} disabled />
                    </div>
                    <button className={`${u.btn} ${u.btnPrimary}`} onClick={saveProfile} disabled={saving}>
                      {saving ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Address tab */}
            {tab === "address" && (
              <div className={u.card}>
                <div className={u.cardHeader}><div className={u.cardTitle}>Delivery Address</div></div>
                <div className={u.cardBody}>
                  <div className={s.formStack}>
                    <div className={u.formGroup}>
                      <label className={u.label}>Street Address</label>
                      <input className={u.input} value={form.address} onChange={e => upd("address", e.target.value)} placeholder="12 High Street" />
                    </div>
                    <div className={s.formRow}>
                      <div className={u.formGroup}>
                        <label className={u.label}>City / Town</label>
                        <input className={u.input} value={form.city} onChange={e => upd("city", e.target.value)} placeholder="London" />
                      </div>
                      <div className={u.formGroup}>
                        <label className={u.label}>Postcode</label>
                        <input className={u.input} value={form.postcode} onChange={e => upd("postcode", e.target.value)} placeholder="SW1A 1AA" />
                      </div>
                    </div>
                    <button className={`${u.btn} ${u.btnPrimary}`} onClick={saveProfile} disabled={saving}>
                      {saving ? "Saving…" : "Save Address"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
