import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Users, Leaf, Package, TrendingUp, ShieldCheck, Sprout } from "lucide-react"
import s from "@/styles/home.module.css"
import u from "@/styles/ui.module.css"

export default async function HomePage() {
  const supabase = createClient()
  const { data: farmers }  = await supabase.from("farmers").select("*").limit(4)
  const { data: products } = await supabase.from("products").select("*, farmers(name)").eq("active", true).limit(4).order("id")

  const missions = [
    { icon: Users,       title: "Farmer First",         desc: "Every product sold ensures the farmer receives a fair, transparent share — no middlemen inflating prices." },
    { icon: Leaf,        title: "Sustainable Practices", desc: "Our farmers commit to regenerative methods that protect soil health and local ecosystems for future generations." },
    { icon: Package,     title: "Direct Outlet",         desc: "GLH provides a direct marketplace so farmers can sell produce without the uncertainty of commodity markets." },
    { icon: TrendingUp,  title: "Stock Visibility",      desc: "Real-time stock management ensures customers always know what's available and farmers can plan accordingly." },
    { icon: ShieldCheck, title: "Full Traceability",     desc: "Every product is linked to a named farmer and farm. You always know exactly where your food comes from." },
    { icon: Sprout,      title: "Community Impact",      desc: "Profits are reinvested into farmer training, sustainable infrastructure, and co-operative development." },
  ]

  return (
    <>
      {/* Hero */}
      <section className={s.hero}>
        <div className={s.heroBg} />
        <div className={`container ${s.heroInner}`}>
         
          <h1 className={s.heroH1}>
            From Our Farms<br />
            <span className={s.heroAccent}>To Your Table</span>
          </h1>
          <p className={s.heroSub}>
            GLH Co-operative connects smallholder farmers across the UK with consumers who care.
          </p>
          <div className={s.heroActions}>
            <Link href="/shop">
              <button className={`${u.btn} ${u.btnGold} ${u.btnLg}`}>Shop Fresh Produce →</button>
            </Link>
            <Link href="/farmers">
              <button className={`${u.btn} ${u.btnOutline} ${u.btnLg}`} style={{ borderColor: "rgba(255,255,255,0.35)", color: "#fff" }}>
                Meet the Farmers
              </button>
            </Link>
          </div>
          <div className={s.stats}>
            {[["4","Partner Farmers"],["12+","Crop Varieties"],["4","UK Regions"],["100%","British Grown"]].map(([n, l]) => (
              <div key={l}>
                <div className={s.statNum}>{n}</div>
                <div className={s.statLabel}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className={s.missionSection}>
        <div className="container">
          <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 2.5rem" }}>
            <div className={u.sectionTag}>Who We Are</div>
            <h2 className={u.sectionTitle}>Our Mission & Values</h2>
            <p className={u.sectionSub} style={{ margin: "0.6rem auto 0" }}>
              We believe farming is the foundation of every thriving community.
            </p>
          </div>
          <div className={s.missionGrid}>
            {missions.map(({ icon: Icon, title, desc }) => (
              <div key={title} className={s.missionCard}>
                <div className={s.missionIcon}><Icon size={20} /></div>
                <h3 className={s.missionTitle}>{title}</h3>
                <p className={s.missionDesc}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured produce */}
      {products && products.length > 0 && (
        <section className={s.featuredSection}>
          <div className="container">
            <div className={s.sectionRow}>
              <div>
                <div className={u.sectionTag}>Fresh Harvest</div>
                <h2 className={u.sectionTitle}>Featured Produce</h2>
              </div>
              <Link href="/shop">
                <button className={`${u.btn} ${u.btnOutline}`}>View All →</button>
              </Link>
            </div>
            <div className={u.grid4}>
              {products.map(p => (
                <div key={p.id} className={s.miniCard}>
                  <div className={s.miniEmoji}>
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : p.emoji
                    }
                  </div>
                  <div className={s.miniBody}>
                    <div className={s.miniName}>{p.name}</div>
                    <div className={s.miniFarmer}>{p.farmers?.name}</div>
                    <div className={s.miniPrice}>
                      £{Number(p.price).toFixed(2)}
                      <span className={s.miniUnit}> / {p.unit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Farmers preview */}
      {farmers && farmers.length > 0 && (
        <section className={s.farmersSection}>
          <div className="container">
            <div className={s.sectionRow}>
              <div>
                <div className={u.sectionTag}>Our Growers</div>
                <h2 className={u.sectionTitle}>Meet the Farmers</h2>
              </div>
              <Link href="/farmers">
                <button className={`${u.btn} ${u.btnOutline}`}>All Farmers →</button>
              </Link>
            </div>
            <div className={u.grid4}>
              {farmers.map(f => (
                <div key={f.id} className={s.farmerMiniCard}>
                  <div className={s.farmerMiniTop}>
                    <div className={s.farmerMiniAvatar}>{f.photo_initials}</div>
                    <div>
                      <div className={s.farmerMiniName}>{f.name}</div>
                      <div className={s.farmerMiniRegion}>📍 {f.region}</div>
                    </div>
                  </div>
                  <div className={s.farmerMiniBody}>
                    <div className={s.cropTags}>
                      {f.crops?.map(c => <span key={c} className={s.cropTag}>{c}</span>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className={s.ctaSection}>
        <div className="container">
          <h2 className={s.ctaTitle}>Ready to support local farmers?</h2>
          <p className={s.ctaSub}>Browse seasonal produce and place your first order today. Every purchase goes directly to a British farmer.</p>
          <Link href="/shop">
            <button className={`${u.btn} ${u.btnGold} ${u.btnLg}`}>Browse the Shop →</button>
          </Link>
        </div>
      </section>
    </>
  )
}
