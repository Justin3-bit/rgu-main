import { createClient } from "@/lib/supabase/server"
import s from "@/styles/farmers.module.css"
import u from "@/styles/ui.module.css"

export const metadata = { title: "Our Farmers | GLH Co-operative Farms" }

export default async function FarmersPage() {
  const supabase = createClient()
  const { data: farmers } = await supabase.from("farmers").select("*").order("id")

  return (
    <div className={s.page}>
      <div className="container">

        <div style={{ marginBottom: "2.5rem" }}>
          <div className={u.sectionTag}>Our Growers</div>
          <h1 className={u.sectionTitle}>Meet the Farmers</h1>
          <p className={u.sectionSub}>
            Real people, real land. Every product you buy supports one of these dedicated farmers directly.
          </p>
        </div>

        <div className={s.grid}>
          {(farmers || []).map(f => (
            <div key={f.id} className={s.card}>
              <div className={s.cardTop}>
                <div className={s.avatar}>{f.photo_initials}</div>
                <div>
                  <div className={s.name}>{f.name}</div>
                  <div className={s.region}>📍 {f.region}</div>
                </div>
              </div>
              <div className={s.cardBody}>
                <p className={s.bio}>{f.bio}</p>
                <div className={s.chips}>
                  <span className={s.chip}>Since {f.joined_year}</span>
                  <span className={s.chip}>{f.hectares} ha</span>
                </div>
                {f.crops && f.crops.length > 0 && (
                  <div className={s.crops}>
                    {f.crops.map(c => (
                      <span key={c} className={s.cropTag}>{c}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className={s.cta}>
          <h2 className={s.ctaTitle}>Want to join GLH?</h2>
          <p className={s.ctaSub}>
            We welcome farmers across the UK who share our commitment to sustainable, community-first farming. Get in touch to apply for co-operative membership.
          </p>
          <a href="mailto:hello@glhfarms.co.uk" className={s.ctaLink}>
            Contact Us
          </a>
        </div>

      </div>
    </div>
  )
}
