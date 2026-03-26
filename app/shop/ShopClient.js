"use client"

import { useState } from "react"
import { ShoppingCart } from "lucide-react"
import s from "@/styles/shop.module.css"
import u from "@/styles/ui.module.css"
import { useCart } from "@/lib/cart-context"
import { toast } from "sonner"

export default function ShopClient({ products, categories }) {
  const [activeCategory, setActiveCategory] = useState("All")
  const { addItem } = useCart()

  const filtered = activeCategory === "All"
    ? products
    : products.filter(p => p.category === activeCategory)

  function handleAdd(product) {
    addItem({
      id:          product.id,
      name:        product.name,
      price:       Number(product.price),
      unit:        product.unit,
      emoji:       product.emoji,
      image_url:   product.image_url,
      farmer_name: product.farmers?.name,
      farmer_id:   product.farmer_id,
    })
    toast.success(`${product.name} added to cart`)
  }

  function stockInfo(stock) {
    if (stock === 0) return { label: "Out of stock", cls: s.stockOut }
    if (stock < 30)  return { label: `Low: ${stock}`,  cls: s.stockLow }
    return               { label: "In stock",          cls: s.stockOk  }
  }

  return (
    <div className={s.page}>
      <div className="container">

        <div className={s.header}>
          <div className={u.sectionTag}>Fresh Harvest</div>
          <h1 className={u.sectionTitle}>Our Produce</h1>
          <p className={u.sectionSub}>
            All items are sourced directly from GLH partner farms.
          </p>
        </div>

        <div className={s.filters}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`${s.filterBtn} ${activeCategory === cat ? s.filterActive : ""}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className={u.emptyState}>
            <div className={u.emptyIcon}>🌿</div>
            <p>No products in this category.</p>
          </div>
        ) : (
          <div className={s.grid}>
            {filtered.map(p => {
              const { label, cls } = stockInfo(p.stock)
              return (
                <div key={p.id} className={s.card}>
                  <div className={s.emojiWrap}>
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} className={s.productImg} />
                      : <span className={s.productEmoji}>{p.emoji}</span>
                    }
                    <span className={`${s.stockBadge} ${cls}`}>{label}</span>
                  </div>
                  <div className={s.cardBody}>
                    <div className={s.productName}>{p.name}</div>
                   
                    <p className={s.productDesc}>{p.description}</p>
                    <div className={s.cardFooter}>
                      <div>
                        <span className={s.price}>£{Number(p.price).toFixed(2)}</span>
                        <span className={s.unit}> / {p.unit}</span>
                      </div>
                      <button
                        className={s.addBtn}
                        disabled={p.stock === 0}
                        onClick={() => handleAdd(p)}
                      >
                        <ShoppingCart size={13} />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
