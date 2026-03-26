"use client"

import { useState } from "react"
import { LayoutDashboard, Package, ClipboardList, Leaf, TrendingUp, AlertTriangle, Clock, Edit3 } from "lucide-react"
import s from "@/styles/pages.module.css"
import u from "@/styles/ui.module.css"
import StatusBadge from "@/components/StatusBadge"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

const TABS = [
  { key: "overview", label: "Overview",    icon: LayoutDashboard },
  { key: "orders",   label: "Orders",      icon: ClipboardList },
  { key: "stock",    label: "Stock",       icon: Package },
  { key: "profile",  label: "Farm Profile",icon: Leaf },
]

export default function DashboardClient({ farmer, products: initProducts, orders: initOrders, farmerId }) {
  const supabase = createClient()
  const [products, setProducts]   = useState(initProducts)
  const [orders,   setOrders]     = useState(initOrders)
  const [stockEdits, setStockEdits] = useState({})
  const [bioEdit,  setBioEdit]    = useState(farmer?.bio || "")
  const [savingBio, setSavingBio] = useState(false)
  const [tab,      setTab]        = useState("overview")

  const myProductIds = new Set(products.map(p => p.id))

  function getMyItems(order)  { return (order.order_items || []).filter(i => myProductIds.has(i.product_id)) }
  function getMyValue(order)  { return getMyItems(order).reduce((s, i) => s + Number(i.unit_price) * i.qty, 0) }

  const myRevenue    = orders.reduce((sum, o) => sum + getMyValue(o), 0)
  const totalStock   = products.reduce((s, p) => s + p.stock, 0)
  const lowCount     = products.filter(p => p.stock > 0 && p.stock < 30).length
  const outCount     = products.filter(p => p.stock === 0).length
  const pendingCount = orders.filter(o => o.status === "Processing").length

  function stockColorClass(stock) {
    if (stock === 0)  return s.chipStockOut
    if (stock < 30)   return s.chipStockLow
    return s.chipStockOk
  }

  function stockChipClass(stock) {
    if (stock === 0) return s.stockChipOut
    if (stock < 30)  return s.stockChipLow
    return s.stockChipOk
  }

  function stockTableColor(stock) {
    if (stock === 0) return { color: "var(--red-600)", fontWeight: 700 }
    if (stock < 30)  return { color: "var(--amber-600)", fontWeight: 700 }
    return { color: "#27ae60", fontWeight: 600 }
  }

  async function updateStock(productId) {
    const newStock = parseInt(stockEdits[productId])
    if (isNaN(newStock) || newStock < 0) { toast.error("Enter a valid stock number"); return }
    const { error } = await supabase
      .from("products")
      .update({ stock: newStock })
      .eq("id", productId)
      .eq("farmer_id", farmerId)
    if (error) { toast.error(error.message); return }
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p))
    setStockEdits(prev => { const n = { ...prev }; delete n[productId]; return n })
    toast.success("Stock updated 📦")
  }

  async function updateOrderStatus(orderId, status) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId)
    if (error) { toast.error(error.message); return }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    toast.success(`Order ${orderId} → ${status}`)
  }

  async function saveBio() {
    setSavingBio(true)
    const { error } = await supabase.from("farmers").update({ bio: bioEdit }).eq("id", farmerId)
    setSavingBio(false)
    if (error) toast.error(error.message)
    else       toast.success("Bio updated ✅")
  }

  const kpis = [
    { label: "My Revenue",          value: `£${myRevenue.toFixed(0)}`,     icon: TrendingUp,    sub: "From produce sales",         alert: false },
    { label: "Orders",              value: orders.length,                   icon: ClipboardList, sub: "Containing my produce",      alert: false },
    { label: "Pending",             value: pendingCount,                    icon: Clock,         sub: "Awaiting dispatch",          alert: pendingCount > 0 },
    { label: "Total Stock",         value: `${totalStock}`,                icon: Package,       sub: `${products.length} products`, alert: false },
    { label: "Low / Out of Stock",  value: lowCount + outCount,             icon: AlertTriangle, sub: "Needing attention",          alert: (lowCount + outCount) > 0 },
  ]

  return (
    <div className={s.page}>
      <div className="container">

        {/* Banner */}
        <div className={s.dashBanner}>
          <div className={s.dashBannerLeft}>
            <div className={s.dashAvatar}>{farmer?.photo_initials}</div>
            <div>
              <div className={s.dashRole}>Producer Dashboard</div>
              <div className={s.dashName}>{farmer?.name}</div>
              <div className={s.dashMeta}>
                📍 {farmer?.region} · {farmer?.hectares} ha · Member since {farmer?.joined_year}
              </div>
            </div>
          </div>
          <div className={s.cropPills}>
            {farmer?.crops?.map(c => <span key={c} className={s.cropPill}>{c}</span>)}
          </div>
        </div>

        {/* KPI grid */}
        <div className={s.kpiGrid}>
          {kpis.map(({ label, value, icon: Icon, sub, alert }) => (
            <div key={label} className={`${s.kpiCard} ${alert ? s.kpiCardAlert : ""}`}>
              <div className={s.kpiTop}>
                <span className={s.kpiLabel}>{label}</span>
                <Icon size={16} className={alert ? s.kpiIconAlert : s.kpiIcon} />
              </div>
              <div className={`${s.kpiValue} ${alert ? s.kpiValueAlert : ""}`}>{value}</div>
              <div className={s.kpiSub}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div className={u.tabsList} style={{ marginBottom: "1.5rem" }}>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`${u.tabsTrigger} ${tab === key ? u.tabsTriggerActive : ""}`}
              onClick={() => setTab(key)}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className={s.panelGrid}>
            {/* Quick stock */}
            <div className={s.panel}>
              <div className={s.panelHead}>
                <div className={s.panelTitle}><Package size={16} />Quick Stock Status</div>
              </div>
              <div className={s.stockChips}>
                {products.map(p => (
                  <div key={p.id} className={`${s.stockChip} ${stockChipClass(p.stock)}`}>
                    <div className={s.chipEmoji}>
                      {p.image_url
                        ? <img src={p.image_url} alt={p.name} style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4 }} />
                        : p.emoji
                      }
                    </div>
                    <div className={s.chipName}>{p.name}</div>
                    <div className={`${s.chipStock} ${stockColorClass(p.stock)}`}>
                      {p.stock === 0 ? "Out of stock" : p.stock < 30 ? `Low: ${p.stock} ${p.unit}s` : `${p.stock} ${p.unit}s`}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent orders */}
            <div className={s.panel}>
              <div className={s.panelHead}>
                <div className={s.panelTitle}><ClipboardList size={16} />Recent Orders</div>
                <span className={`${u.badge} ${u.badgeSecondary}`}>{orders.length} total</span>
              </div>
              {orders.length === 0 ? (
                <div className={u.emptyState}><p>No orders yet.</p></div>
              ) : (
                <div className={u.tableWrap}>
                  <table className={u.table}>
                    <thead>
                      <tr>
                        <th>Order</th><th>Customer</th><th>My Value</th><th>Date</th><th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map(o => (
                        <tr key={o.id}>
                          <td style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--earth-700)" }}>{o.id}</td>
                          <td>{o.customer_name}</td>
                          <td style={{ fontWeight: 600, color: "var(--earth-700)" }}>£{getMyValue(o).toFixed(2)}</td>
                          <td>{new Date(o.created_at).toLocaleDateString("en-GB")}</td>
                          <td><StatusBadge status={o.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ORDERS ── */}
        {tab === "orders" && (
          <div className={s.panel}>
            <div className={s.panelHead}>
              <div className={s.panelTitle}><ClipboardList size={16} />Orders Containing My Produce</div>
              <span className={`${u.badge} ${u.badgeSecondary}`}>{orders.length} total</span>
            </div>
            {orders.length === 0 ? (
              <div className={u.emptyState}><p>No orders yet.</p></div>
            ) : (
              <div className={u.tableWrap}>
                <table className={u.table}>
                  <thead>
                    <tr>
                      <th>Order ID</th><th>Customer</th><th>My Items</th><th>Date</th><th>My Value</th><th>Status</th><th>Update</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id}>
                        <td style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--earth-700)", whiteSpace: "nowrap" }}>{o.id}</td>
                        <td style={{ whiteSpace: "nowrap" }}>{o.customer_name}</td>
                        <td>
                          {getMyItems(o).map((item, i) => (
                            <div key={i} style={{ fontSize: "0.78rem", color: "var(--text-light)", whiteSpace: "nowrap" }}>
                              {item.products?.name} ×{item.qty}
                            </div>
                          ))}
                        </td>
                        <td style={{ whiteSpace: "nowrap", fontSize: "0.8rem" }}>{new Date(o.created_at).toLocaleDateString("en-GB")}</td>
                        <td style={{ fontWeight: 600, color: "var(--earth-700)", whiteSpace: "nowrap" }}>£{getMyValue(o).toFixed(2)}</td>
                        <td><StatusBadge status={o.status} /></td>
                        <td>
                          <select
                            className={s.statusSelect}
                            value={o.status}
                            onChange={e => updateOrderStatus(o.id, e.target.value)}
                          >
                            {["Processing","Shipped","Delivered","Cancelled"].map(st => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── STOCK ── */}
        {tab === "stock" && (
          <div className={s.panel}>
            <div className={s.panelHead}>
              <div className={s.panelTitle}><Package size={16} />My Product Stock Levels</div>
              <span className={`${u.badge} ${u.badgeSecondary}`}>{products.length} products</span>
            </div>
            <div className={u.tableWrap}>
              <table className={u.table}>
                <thead>
                  <tr>
                    <th>Product</th><th>Category</th><th>Price</th><th>Unit</th><th>Stock</th><th>Set New Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          {p.image_url
                            ? <img src={p.image_url} alt={p.name} style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} />
                            : <span style={{ fontSize: "1.2rem" }}>{p.emoji}</span>
                          }
                          <strong style={{ fontSize: "0.875rem" }}>{p.name}</strong>
                        </div>
                      </td>
                      <td>
                        <span className={`${u.badge} ${u.badgeSecondary}`}>{p.category}</span>
                      </td>
                      <td style={{ fontWeight: 600, color: "var(--earth-700)" }}>£{Number(p.price).toFixed(2)}</td>
                      <td style={{ fontSize: "0.78rem", color: "var(--text-light)" }}>per {p.unit}</td>
                      <td>
                        <span style={stockTableColor(p.stock)}>{p.stock}</span>
                        {p.stock === 0   && <span className={`${u.badge} ${u.badgeOut}`}    style={{ marginLeft: 6 }}>Out</span>}
                        {p.stock > 0 && p.stock < 30 && <span className={`${u.badge} ${u.badgeLow}`} style={{ marginLeft: 6 }}>Low</span>}
                      </td>
                      <td>
                        <div className={s.stockInputWrap}>
                          <input
                            type="number"
                            min="0"
                            className={s.stockInput}
                            placeholder={String(p.stock)}
                            value={stockEdits[p.id] ?? ""}
                            onChange={e => setStockEdits(prev => ({ ...prev, [p.id]: e.target.value }))}
                          />
                          <button
                            className={s.updateBtn}
                            onClick={() => updateStock(p.id)}
                            disabled={!stockEdits[p.id] && stockEdits[p.id] !== "0"}
                          >
                            Update
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── FARM PROFILE ── */}
        {tab === "profile" && (
          <div className={s.farmProfileGrid}>
            {/* Farm details */}
            <div className={s.panel}>
              <div className={s.panelHead}>
                <div className={s.panelTitle}><Leaf size={16} />Farm Details</div>
              </div>
              <div className={u.cardBody}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {[
                    ["Full Name",    farmer?.name],
                    ["Region",       farmer?.region],
                    ["Farm Size",    `${farmer?.hectares} hectares`],
                    ["Member Since", farmer?.joined_year],
                  ].map(([label, value]) => (
                    <div key={label} className={u.formGroup}>
                      <label className={u.label}>{label}</label>
                      <input className={u.input} value={value || ""} readOnly />
                    </div>
                  ))}
                  <div className={u.formGroup}>
                    <label className={u.label}>Bio</label>
                    <textarea
                      className={u.textarea}
                      rows={3}
                      value={bioEdit}
                      onChange={e => setBioEdit(e.target.value)}
                    />
                  </div>
                  <button
                    className={`${u.btn} ${u.btnPrimary}`}
                    onClick={saveBio}
                    disabled={savingBio}
                    style={{ alignSelf: "flex-start" }}
                  >
                    <Edit3 size={14} />
                    {savingBio ? "Saving…" : "Save Bio"}
                  </button>
                </div>
              </div>
            </div>

            {/* Crops + product summary */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className={s.panel}>
                <div className={s.panelHead}>
                  <div className={s.panelTitle}>My Crops</div>
                </div>
                <div className={u.cardBody}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {farmer?.crops?.map(c => (
                      <span key={c} className={`${u.badge} ${u.badgeSecondary}`} style={{ fontSize: "0.8rem", padding: "0.3rem 0.9rem" }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className={s.panel}>
                <div className={s.panelHead}>
                  <div className={s.panelTitle}>Product Summary</div>
                </div>
                <div className={u.tableWrap}>
                  <table className={u.table}>
                    <thead>
                      <tr><th>Product</th><th>Price</th><th>Stock</th></tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              {p.image_url
                                ? <img src={p.image_url} alt={p.name} style={{ width: 24, height: 24, objectFit: "cover", borderRadius: 3, flexShrink: 0 }} />
                                : <span>{p.emoji}</span>
                              }
                              {p.name}
                            </div>
                          </td>
                          <td style={{ fontWeight: 600, color: "var(--earth-700)" }}>
                            £{Number(p.price).toFixed(2)}/{p.unit}
                          </td>
                          <td style={stockTableColor(p.stock)}>{p.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
