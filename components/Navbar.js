"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ShoppingCart, LogOut, User, LayoutDashboard } from "lucide-react"
import s from "@/styles/navbar.module.css"
import { useCart } from "@/lib/cart-context"
import { createClient } from "@/lib/supabase/client"

export default function Navbar({ user, profile }) {
  const { count, setOpen } = useCart()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "?"

  const navLinks = [
    { href: "/",        label: "Home" },
    { href: "/shop",    label: "Shop" },
    { href: "/farmers", label: "Farmers" },
  ]

  return (
    <nav className={s.nav}>
      <div className={`container ${s.inner}`}>

        <Link href="/" className={s.brand}>
          <span className={s.brandName}>GLH</span>
          <span className={s.brandSub}>Co-operative Farms</span>
        </Link>

        <div className={s.links}>
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href}>
              <button className={`${s.link} ${pathname === href ? s.linkActive : ""}`}>
                {label}
              </button>
            </Link>
          ))}
          {user && (
            <Link href="/account">
              <button className={`${s.link} ${pathname.startsWith("/account") ? s.linkActive : ""}`}>
                My Account
              </button>
            </Link>
          )}
          {profile?.role === "producer" && (
            <Link href="/dashboard">
              <button className={`${s.link} ${pathname.startsWith("/dashboard") ? s.linkActive : ""}`}>
                <LayoutDashboard size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
                Dashboard
              </button>
            </Link>
          )}
        </div>

        <div className={s.right}>
          <button className={s.cartBtn} onClick={() => setOpen(true)}>
            <ShoppingCart size={16} />
            <span>Cart</span>
            {count > 0 && <span className={s.cartCount}>{count}</span>}
          </button>

          {user ? (
            <>
              <Link href="/account">
                <div className={s.avatar}>{initials}</div>
              </Link>
              <button className={s.signOutBtn} onClick={handleSignOut} title="Sign out">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link href="/login">
              <button className={s.link}>
                <User size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
                Sign In
              </button>
            </Link>
          )}
        </div>

      </div>
    </nav>
  )
}
