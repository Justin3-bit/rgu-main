"use client"

import { useState } from "react"
import { LayoutDashboard, Package, ClipboardList, Leaf, TrendingUp, AlertTriangle, Clock, Edit3, Plus, X } from "lucide-react"
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
  const [farmEdit, setFarmEdit]   = useState({
    name:        farmer?.name        || "",
    region:      farmer?.region      || "",
    bio:         farmer?.bio         || "",
    hectares:    farmer?.hectares    || 0,
    joined_year: farmer?.joined_year || new Date().getFullYear(),
  })
  const [savingFarm, setSavingFarm] = useState(false)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [addingProduct, setAddingProduct]   = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: "", category: "", price: "", unit: "", stock: "", image_url: "",
  })
  const [imageUploading, setImageUploading] = useState(false)
  const [imgUploading,   setImgUploading]   = useState({})
  const [editingProduct, setEditingProduct] = useState(null)
  const [editForm,       setEditForm]       = useState({})
  const [savingEdit,     setSavingEdit]     = useState(false)
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
    toast.success("Stock updated ")
  }

  async function updateOrderStatus(orderId, status) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId)
    if (error) { toast.error(error.message); return }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    toast.success(`Order ${orderId} → ${status}`)
  }

  function startEdit(p) {
    setEditingProduct(p.id)
    setEditForm({ name: p.name, category: p.category || "", price: p.price, unit: p.unit, stock: p.stock })
  }

  async function saveEdit() {
    setSavingEdit(true)
    const payload = {
      name:     editForm.name,
      category: editForm.category,
      price:    parseFloat(editForm.price),
      unit:     editForm.unit,
      stock:    parseInt(editForm.stock) || 0,
    }
    const { error } = await supabase.from("products").update(payload).eq("id", editingProduct).eq("farmer_id", farmerId)
    setSavingEdit(false)
    if (error) { toast.error(error.message); return }
    setProducts(prev => prev.map(p => p.id === editingProduct ? { ...p, ...payload } : p))
    setEditingProduct(null)
    toast.success("Product updated")
  }

  async function updateProductImage(productId, file) {
    setImgUploading(prev => ({ ...prev, [productId]: true }))
    const ext  = file.name.split(".").pop()
    const path = `${farmerId}/${productId}-${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from("product-images").upload(path, file)
    if (upErr) { toast.error("Upload failed: " + upErr.message); setImgUploading(prev => ({ ...prev, [productId]: false })); return }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path)
    const { error: dbErr } = await supabase.from("products").update({ image_url: data.publicUrl }).eq("id", productId).eq("farmer_id", farmerId)
    setImgUploading(prev => ({ ...prev, [productId]: false }))
    if (dbErr) { toast.error(dbErr.message); return }
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, image_url: data.publicUrl } : p))
    toast.success("Image updated")
  }

  async function uploadImage(file) {
    setImageUploading(true)
    const ext  = file.name.split(".").pop()
    const path = `${farmerId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from("product-images").upload(path, file)
    setImageUploading(false)
    if (error) { toast.error("Image upload failed: " + error.message); return null }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path)
    return data.publicUrl
  }

  async function addProduct() {
    if (!newProduct.name || !newProduct.price || !newProduct.unit || !newProduct.stock) {
      toast.error("Please fill in name, price, unit and stock"); return
    }
    setAddingProduct(true)
    const { data, error } = await supabase
      .from("products")
      .insert({
        name:      newProduct.name,
        category:  newProduct.category,
        price:     parseFloat(newProduct.price),
        unit:      newProduct.unit,
        stock:     parseInt(newProduct.stock) || 0,
        image_url: newProduct.image_url || null,
        farmer_id: farmerId,
      })
      .select()
      .single()
    setAddingProduct(false)
    if (error) { toast.error(error.message); return }
    setProducts(prev => [...prev, data])
    setNewProduct({ name: "", category: "", price: "", unit: "", stock: "", image_url: "" })
    setShowAddProduct(false)
    toast.success("Product added")
  }

  async function saveFarm() {
    setSavingFarm(true)
    const payload = {
      ...farmEdit,
      hectares:    parseInt(farmEdit.hectares)    || 0,
      joined_year: parseInt(farmEdit.joined_year) || new Date().getFullYear(),
    }
    const { error } = await supabase.from("farmers").update(payload).eq("id", farmerId)
    setSavingFarm(false)
    if (error) toast.error(error.message)
    else       toast.success("Farm profile updated")
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
                {farmer?.region} · {farmer?.hectares} ha · Member since {farmer?.joined_year}
              </div>
            </div>
          </div>
         
        </div>

        {/* KPI grid */}
        <div className={s.kpiGrid} style={{fontFamily: "DM Sans, system-ui, sans-serif"}}>
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
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className={s.panel}>
            <div className={s.panelHead}>
              <div className={s.panelTitle}><Package size={16} />My Product Stock Levels</div>
              <button className={`${u.btn} ${u.btnPrimary}`} style={{ fontSize: "0.8rem", padding: "0.35rem 0.9rem" }} onClick={() => setShowAddProduct(v => !v)}>
                {showAddProduct ? <><X size={13} /> Cancel</> : <><Plus size={13} /> Add Product</>}
              </button>
            </div>
            <div className={u.tableWrap}>
              <table className={u.table}>
                <thead>
                  <tr>
                    <th>Product</th><th>Category</th><th>Price</th><th>Unit</th><th>Stock</th><th>Set New Stock</th><th>Image</th><th></th>
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
                      <td>
                        <label style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
                          {imgUploading[p.id] ? (
                            <span style={{ fontSize: "0.72rem", color: "var(--text-light)" }}>Uploading…</span>
                          ) : (
                            <>
                              {p.image_url
                                ? <img src={p.image_url} alt={p.name} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }} />
                                : <span style={{ fontSize: "0.72rem", color: "var(--text-light)" }}>No image</span>
                              }
                              <span style={{ fontSize: "0.7rem", color: "var(--earth-600)", textDecoration: "underline" }}>Change</span>
                            </>
                          )}
                          <input type="file" accept="image/*" style={{ display: "none" }} disabled={imgUploading[p.id]}
                            onChange={e => { const f = e.target.files?.[0]; if (f) updateProductImage(p.id, f) }}
                          />
                        </label>
                      </td>
                      <td>
                        <button className={`${u.btn} ${u.btnOutline}`} style={{ fontSize: "0.75rem", padding: "0.25rem 0.7rem" }}
                          onClick={() => editingProduct === p.id ? setEditingProduct(null) : startEdit(p)}>
                          {editingProduct === p.id ? <><X size={12} /> Cancel</> : <><Edit3 size={12} /> Edit</>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Edit Product form */}
          {editingProduct && (
            <div className={s.panel}>
              <div className={s.panelHead}>
                <div className={s.panelTitle}><Edit3 size={16} />Edit Product</div>
              </div>
              <div className={u.cardBody}>
                <div className={s.formStack}>
                  <div className={s.formRow}>
                    <div className={u.formGroup}>
                      <label className={u.label}>Product Name</label>
                      <input className={u.input} value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div className={u.formGroup}>
                      <label className={u.label}>Category</label>
                      <input className={u.input} value={editForm.category} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))} />
                    </div>
                  </div>
                  <div className={s.formRow}>
                    <div className={u.formGroup}>
                      <label className={u.label}>Price (£)</label>
                      <input className={u.input} type="number" min="0" step="0.01" value={editForm.price} onChange={e => setEditForm(p => ({ ...p, price: e.target.value }))} />
                    </div>
                    <div className={u.formGroup}>
                      <label className={u.label}>Unit</label>
                      <input className={u.input} value={editForm.unit} onChange={e => setEditForm(p => ({ ...p, unit: e.target.value }))} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button className={`${u.btn} ${u.btnPrimary}`} onClick={saveEdit} disabled={savingEdit}>
                      {savingEdit ? "Saving…" : "Save Changes"}
                    </button>
                    <button className={`${u.btn} ${u.btnOutline}`} onClick={() => setEditingProduct(null)}>Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Product form */}
          {showAddProduct && (
            <div className={s.panel}>
              <div className={s.panelHead}>
                <div className={s.panelTitle}><Plus size={16} />New Product</div>
              </div>
              <div className={u.cardBody}>
                <div className={s.formStack}>
                  <div className={s.formRow}>
                    <div className={u.formGroup}>
                      <label className={u.label}>Product Name *</label>
                      <input className={u.input} placeholder="e.g. Organic Carrots" value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div className={u.formGroup}>
                      <label className={u.label}>Product Image</label>
                      <input className={u.input} type="file" accept="image/*" disabled={imageUploading}
                        onChange={async e => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const url = await uploadImage(file)
                          if (url) setNewProduct(p => ({ ...p, image_url: url }))
                        }}
                      />
                      {imageUploading && <span style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>Uploading…</span>}
                      {newProduct.image_url && <img src={newProduct.image_url} alt="preview" style={{ marginTop: "0.5rem", width: 64, height: 64, objectFit: "cover", borderRadius: 6 }} />}
                    </div>
                  </div>
                  <div className={s.formRow}>
                    <div className={u.formGroup}>
                      <label className={u.label}>Category</label>
                      <input className={u.input} placeholder="e.g. Vegetables" value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))} />
                    </div>
                    <div className={u.formGroup}>
                      <label className={u.label}>Unit *</label>
                      <input className={u.input} placeholder="e.g. kg, bunch, head" value={newProduct.unit} onChange={e => setNewProduct(p => ({ ...p, unit: e.target.value }))} />
                    </div>
                  </div>
                  <div className={s.formRow}>
                    <div className={u.formGroup}>
                      <label className={u.label}>Price (£) *</label>
                      <input className={u.input} type="number" min="0" step="0.01" placeholder="0.00" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} />
                    </div>
                    <div className={u.formGroup}>
                      <label className={u.label}>Initial Stock *</label>
                      <input className={u.input} type="number" min="0" placeholder="0" value={newProduct.stock} onChange={e => setNewProduct(p => ({ ...p, stock: e.target.value }))} />
                    </div>
                  </div>
                  <button className={`${u.btn} ${u.btnPrimary}`} onClick={addProduct} disabled={addingProduct} style={{ alignSelf: "flex-start" }}>
                    {addingProduct ? "Adding…" : "Add Product"}
                  </button>
                </div>
              </div>
            </div>
          )}
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
                  <div className={u.formGroup}>
                    <label className={u.label}>Full Name</label>
                    <input className={u.input} value={farmEdit.name} onChange={e => setFarmEdit(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className={u.formGroup}>
                    <label className={u.label}>Region</label>
                    <input className={u.input} value={farmEdit.region} onChange={e => setFarmEdit(p => ({ ...p, region: e.target.value }))} />
                  </div>
                  <div className={u.formGroup}>
                    <label className={u.label}>Farm Size (hectares)</label>
                    <input className={u.input} type="number" min="0" value={farmEdit.hectares} onChange={e => setFarmEdit(p => ({ ...p, hectares: e.target.value }))} />
                  </div>
                  <div className={u.formGroup}>
                    <label className={u.label}>Member Since (year)</label>
                    <input className={u.input} type="number" value={farmEdit.joined_year} onChange={e => setFarmEdit(p => ({ ...p, joined_year: e.target.value }))} />
                  </div>
                  <div className={u.formGroup}>
                    <label className={u.label}>Bio</label>
                    <textarea
                      className={u.textarea}
                      rows={3}
                      value={farmEdit.bio}
                      onChange={e => setFarmEdit(p => ({ ...p, bio: e.target.value }))}
                    />
                  </div>
                  <button
                    className={`${u.btn} ${u.btnPrimary}`}
                    onClick={saveFarm}
                    disabled={savingFarm}
                    style={{ alignSelf: "flex-start" }}
                  >
                    <Edit3 size={14} />
                    {savingFarm ? "Saving…" : "Save Details"}
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
