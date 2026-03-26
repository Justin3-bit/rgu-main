"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, ChevronRight } from "lucide-react"
import s from "@/styles/pages.module.css"
import u from "@/styles/ui.module.css"
import { useCart } from "@/lib/cart-context"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

const STEPS = ["Review Cart", "Delivery", "Confirm"]

export default function CheckoutClient({ user, profile }) {
  const { items, total, clearCart } = useCart()
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep]       = useState(0)
  const [loading, setLoading] = useState(false)
  const [orderId, setOrderId] = useState(null)

  const [form, setForm] = useState({
    fullName: profile?.full_name || "",
    phone:    profile?.phone     || "",
    address:  profile?.address   || "",
    city:     profile?.city      || "",
    postcode: profile?.postcode  || "",
    notes:    "",
  })

  function upd(field, val) { setForm(prev => ({ ...prev, [field]: val })) }

  async function placeOrder() {
    setLoading(true)
    try {
      const { data: order, error: oErr } = await supabase
        .from("orders")
        .insert({
          customer_id:   user.id,
          customer_name: form.fullName,
          address:       form.address,
          city:          form.city,
          postcode:      form.postcode,
          phone:         form.phone,
          notes:         form.notes,
          status:        "Processing",
          total,
        })
        .select("id")
        .single()
      if (oErr) throw oErr

      const { error: iErr } = await supabase.from("order_items").insert(
        items.map(item => ({
          order_id:   order.id,
          product_id: item.id,
          farmer_id:  item.farmer_id,
          qty:        item.qty,
          unit_price: item.price,
        }))
      )
      if (iErr) throw iErr

      for (const item of items) {
        await supabase.rpc("decrement_stock", { p_id: item.id, qty: item.qty })
      }

      clearCart()
      setOrderId(order.id)
      setStep(3)
      toast.success("Order placed! 🌿")
    } catch (err) {
      toast.error("Something went wrong: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  /* ── Success screen ── */
  if (step === 3) return (
    <div className={s.page}>
      <div className="container">
        <div className={s.successBox}>
          <div className={s.successIcon}><CheckCircle2 size={44} /></div>
          <h2 className={s.successTitle}>Order Confirmed!</h2>
          <p className={s.successSub}>Thank you for supporting British farmers.</p>
          <div className={s.orderId}>{orderId}</div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-light)", marginTop: "0.25rem" }}>
            You'll receive an update once your order is shipped.
          </p>
          <div className={s.successActions}>
            <button className={`${u.btn} ${u.btnPrimary}`} onClick={() => router.push("/account")}>View Orders</button>
            <button className={`${u.btn} ${u.btnOutline}`} onClick={() => router.push("/shop")}>Continue Shopping</button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className={s.page}>
      <div className="container">
        <div style={{ marginBottom: "2rem" }}>
          <h1 className={u.sectionTitle}>Checkout</h1>
        </div>

        {/* Step indicator */}
        <div className={s.steps} style={{ marginBottom: "2rem" }}>
          {STEPS.map((label, i) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 0 }}>
              <div className={`${s.step} ${i === step ? s.stepActive : i < step ? s.stepDone : ""}`}>
                <div className={s.stepNum}>{i < step ? "✓" : i + 1}</div>
                <span style={{ display: "none", fontSize: "0.82rem" }}>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={s.stepDivider} />}
            </div>
          ))}
        </div>

        <div className={s.checkoutLayout}>
          {/* Main panel */}
          <div>
            {/* Step 0 — Cart Review */}
            {step === 0 && (
              <div className={u.card}>
                <div className={u.cardHeader}>
                  <div className={u.cardTitle}>Review Your Cart</div>
                </div>
                <div className={u.cardBody}>
                  {items.length === 0 ? (
                    <div className={u.emptyState}>
                      <div className={u.emptyIcon}>🛒</div>
                      <p>Your cart is empty.</p>
                      <button
                        className={`${u.btn} ${u.btnOutline}`}
                        style={{ marginTop: "1rem" }}
                        onClick={() => router.push("/shop")}
                      >
                        Add some items
                      </button>
                    </div>
                  ) : (
                    <>
                      {items.map(item => (
                        <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid var(--earth-50)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <span style={{ fontSize: "1.6rem" }}>{item.emoji}</span>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{item.name}</div>
                              <div style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>{item.farmer_name} · ×{item.qty}</div>
                            </div>
                          </div>
                          <strong style={{ color: "var(--earth-700)" }}>£{(item.price * item.qty).toFixed(2)}</strong>
                        </div>
                      ))}
                      <button
                        className={`${u.btn} ${u.btnPrimary}`}
                        style={{ marginTop: "1.25rem" }}
                        onClick={() => setStep(1)}
                      >
                        Continue to Delivery →
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Step 1 — Delivery */}
            {step === 1 && (
              <div className={u.card}>
                <div className={u.cardHeader}>
                  <div className={u.cardTitle}>Delivery Details</div>
                </div>
                <div className={u.cardBody}>
                  <div className={s.formStack}>
                    <div className={s.formRow}>
                      <div className={u.formGroup}>
                        <label className={u.label}>Full Name</label>
                        <input className={u.input} value={form.fullName} onChange={e => upd("fullName", e.target.value)} placeholder="Jane Smith" />
                      </div>
                      <div className={u.formGroup}>
                        <label className={u.label}>Phone</label>
                        <input className={u.input} value={form.phone} onChange={e => upd("phone", e.target.value)} placeholder="07700 900000" />
                      </div>
                    </div>
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
                    <div className={u.formGroup}>
                      <label className={u.label}>Special Instructions (optional)</label>
                      <textarea
                        className={u.textarea}
                        rows={2}
                        value={form.notes}
                        onChange={e => upd("notes", e.target.value)}
                        placeholder="Leave at front door, etc."
                      />
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <button className={`${u.btn} ${u.btnOutline}`} onClick={() => setStep(0)}>← Back</button>
                      <button
                        className={`${u.btn} ${u.btnPrimary}`}
                        disabled={!form.fullName || !form.address || !form.city || !form.postcode}
                        onClick={() => setStep(2)}
                      >
                        Review Order →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 — Confirm */}
            {step === 2 && (
              <div className={u.card}>
                <div className={u.cardHeader}>
                  <div className={u.cardTitle}>Confirm Your Order</div>
                </div>
                <div className={u.cardBody}>
                  <div className={s.deliveryAddress}>
                    <strong style={{ color: "var(--text-dark)" }}>{form.fullName}</strong><br />
                    {form.address}, {form.city}, {form.postcode}<br />
                    {form.phone && <>{form.phone}<br /></>}
                    {form.notes && <em style={{ color: "var(--text-light)" }}>"{form.notes}"</em>}
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
                    <button className={`${u.btn} ${u.btnOutline}`} onClick={() => setStep(1)}>← Back</button>
                    <button className={`${u.btn} ${u.btnGold}`} onClick={placeOrder} disabled={loading}>
                      {loading ? "Placing order…" : "Place Order 🌿"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Summary sidebar */}
          <div className={s.summaryCard}>
            <div className={s.summaryHead}>Order Summary</div>
            <div className={s.summaryBody}>
              {items.map(item => (
                <div key={item.id} className={s.summaryItem}>
                  <span>{item.emoji} {item.name} ×{item.qty}</span>
                  <span>£{(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
              <div className={s.separator} />
              <div className={s.summaryTotal}>
                <span>Total</span>
                <span className={s.summaryTotalAmt}>£{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
