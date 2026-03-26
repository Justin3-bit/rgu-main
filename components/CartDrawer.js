"use client"

import { useRouter } from "next/navigation"
import { X, Minus, Plus } from "lucide-react"
import s from "@/styles/cart.module.css"
import { useCart } from "@/lib/cart-context"

export default function CartDrawer() {
  const { items, open, setOpen, updateQty, removeItem, total } = useCart()
  const router = useRouter()

  function handleCheckout() {
    setOpen(false)
    router.push("/checkout")
  }

  return (
    <>
      <div
        className={`${s.overlay} ${open ? s.overlayOpen : ""}`}
        onClick={() => setOpen(false)}
      />
      <div className={`${s.panel} ${open ? s.panelOpen : ""}`}>

        <div className={s.header}>
          <h2 className={s.headerTitle}>🛒 Your Cart</h2>
          <button className={s.closeBtn} onClick={() => setOpen(false)}>
            <X size={16} />
          </button>
        </div>

        <div className={s.items}>
          {items.length === 0 ? (
            <div className={s.empty}>
              <div className={s.emptyIcon}>🌾</div>
              <p>Your cart is empty.</p>
              <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>Browse the shop to add fresh produce.</p>
              <button
                onClick={() => { setOpen(false); router.push("/shop") }}
                style={{ marginTop: "1rem", background: "var(--earth-100)", border: "1.5px solid var(--border)", color: "var(--earth-700)", padding: "0.45rem 1rem", borderRadius: "var(--radius-sm)", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "0.82rem" }}
              >
                Browse Shop
              </button>
            </div>
          ) : items.map(item => (
            <div key={item.id} className={s.item}>
              <div className={s.itemEmoji}>
                {item.image_url
                  ? <img src={item.image_url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "4px" }} />
                  : item.emoji
                }
              </div>
              <div className={s.itemInfo}>
                <div className={s.itemName}>{item.name}</div>
                <div className={s.itemFarmer}>{item.farmer_name}</div>
                <div className={s.qtyRow}>
                  <button className={s.qtyBtn} onClick={() => updateQty(item.id, item.qty - 1)}>
                    <Minus size={11} />
                  </button>
                  <span className={s.qtyNum}>{item.qty}</span>
                  <button className={s.qtyBtn} onClick={() => updateQty(item.id, item.qty + 1)}>
                    <Plus size={11} />
                  </button>
                </div>
              </div>
              <div className={s.itemRight}>
                <div className={s.itemPrice}>£{(item.price * item.qty).toFixed(2)}</div>
                <button className={s.removeBtn} onClick={() => removeItem(item.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className={s.footer}>
            <div className={s.totalRow}>
              <span className={s.totalLabel}>Subtotal</span>
              <span className={s.totalAmount}>£{total.toFixed(2)}</span>
            </div>
            <p className={s.checkoutNote}>Delivery calculated at checkout</p>
            <button
              onClick={handleCheckout}
              style={{ width: "100%", background: "var(--earth-700)", color: "#fff", border: "none", padding: "0.8rem", borderRadius: "var(--radius-sm)", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", fontFamily: "var(--font-sans)" }}
            >
              Proceed to Checkout →
            </button>
          </div>
        )}
      </div>
    </>
  )
}
