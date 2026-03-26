import Link from "next/link"
import s from "@/styles/pages.module.css"

export default function Footer() {
  return (
    <footer className={s.footer}>
      <div className="container">
        <div className={s.footerGrid}>
          <div>
            <div className={s.footerBrand}>GLH</div>
            <p className={s.footerTagline}>
              A UK co-operative connecting smallholder farmers directly with consumers who care about provenance, sustainability, and fair trade.
            </p>
          </div>
          <div>
            <h4 className={s.footerHeading}>Quick Links</h4>
            <ul className={s.footerLinks}>
              {[["Shop", "/shop"], ["Our Farmers", "/farmers"], ["My Account", "/account"], ["Dashboard", "/dashboard"]].map(([label, href]) => (
                <li key={href}><Link href={href}>{label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className={s.footerHeading}>Get in Touch</h4>
            <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>hello@glhfarms.co.uk</p>
            <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)", marginTop: "0.25rem" }}>0800 123 4567</p>
            <p className={s.footerCopy}>© {new Date().getFullYear()} GLH Co-operative Farms Ltd.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
