"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Leaf } from "lucide-react"
import s from "@/styles/pages.module.css"
import u from "@/styles/ui.module.css"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState("login")

  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [regForm, setRegForm]     = useState({ fullName: "", email: "", password: "", confirm: "" })

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: loginForm.email, password: loginForm.password,
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success("Welcome back! 👋")
    router.push("/")
    router.refresh()
  }

  async function handleRegister(e) {
    e.preventDefault()
    if (regForm.password !== regForm.confirm) { toast.error("Passwords do not match"); return }
    if (regForm.password.length < 6)          { toast.error("Password must be at least 6 characters"); return }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: regForm.email,
      password: regForm.password,
      options: { data: { full_name: regForm.fullName, role: "customer" } },
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success("Account created! Check your email to confirm. 🌱")
    router.push("/")
    router.refresh()
  }

  return (
    <div className={s.page}>
      <div className="container">
        <div className={s.loginWrap}>

          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <div className={s.loginIconWrap}>
              <Leaf size={32} />
            </div>
            <h1 className={s.loginTitle}>GLH Account</h1>
            <p className={s.loginSub}>Sign in or create your customer account</p>
          </div>

          <div className={s.loginBox}>
            {/* Tabs */}
            <div className={s.tabsWrap}>
              <button className={`${s.tab} ${tab === "login" ? s.tabActive : ""}`} onClick={() => setTab("login")}>
                Sign In
              </button>
              <button className={`${s.tab} ${tab === "register" ? s.tabActive : ""}`} onClick={() => setTab("register")}>
                Create Account
              </button>
            </div>

            {/* Login form */}
            {tab === "login" && (
              <form onSubmit={handleLogin} className={s.formStack}>
                <div className={u.formGroup}>
                  <label className={u.label}>Email</label>
                  <input
                    className={u.input}
                    type="email"
                    placeholder="you@example.com"
                    value={loginForm.email}
                    onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className={u.formGroup}>
                  <label className={u.label}>Password</label>
                  <input
                    className={u.input}
                    type="password"
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className={`${u.btn} ${u.btnPrimary} ${u.btnFull} ${u.btnLg}`} disabled={loading}>
                  {loading ? "Signing in…" : "Sign In"}
                </button>
                <div className={s.demoBox}>
                  <div className={s.demoBoxTitle}> Producer access</div>
                  Producers are invited by GLH admin and linked to a farmer profile. Contact{" "}
                  <a href="mailto:hello@glhfarms.co.uk" style={{ color: "var(--earth-700)" }}>hello@glhfarms.co.uk</a>{" "}
                  to request access.
                </div>
              </form>
            )}

            {/* Register form */}
            {tab === "register" && (
              <form onSubmit={handleRegister} className={s.formStack}>
                <div className={u.formGroup}>
                  <label className={u.label}>Full Name</label>
                  <input
                    className={u.input}
                    placeholder="Jane Smith"
                    value={regForm.fullName}
                    onChange={e => setRegForm({ ...regForm, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className={u.formGroup}>
                  <label className={u.label}>Email</label>
                  <input
                    className={u.input}
                    type="email"
                    placeholder="you@example.com"
                    value={regForm.email}
                    onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className={s.formRow}>
                  <div className={u.formGroup}>
                    <label className={u.label}>Password</label>
                    <input
                      className={u.input}
                      type="password"
                      placeholder="••••••••"
                      value={regForm.password}
                      onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className={u.formGroup}>
                    <label className={u.label}>Confirm</label>
                    <input
                      className={u.input}
                      type="password"
                      placeholder="••••••••"
                      value={regForm.confirm}
                      onChange={e => setRegForm({ ...regForm, confirm: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className={`${u.btn} ${u.btnPrimary} ${u.btnFull} ${u.btnLg}`} disabled={loading}>
                  {loading ? "Creating account…" : "Create Account"}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
