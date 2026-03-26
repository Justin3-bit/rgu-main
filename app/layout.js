import { DM_Sans, Playfair_Display } from "next/font/google"
import "@/styles/globals.css"
import { CartProvider } from "@/lib/cart-context"
import CartDrawer from "@/components/CartDrawer"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import { createClient } from "@/lib/supabase/server"
import { Toaster } from "sonner"

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600"],
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "600", "700", "900"],
})

export const metadata = {
  title: "GLH Co-operative Farms",
  description: "Farm-fresh British produce direct from our co-operative farmers to your table.",
}

export default async function RootLayout({ children }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, role, farmer_id")
      .eq("id", user.id)
      .single()
    profile = data
  }

  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable}`}>
      <body>
        <CartProvider>
          <div className="page">
            <Navbar user={user} profile={profile} />
            <CartDrawer />
            <main>{children}</main>
            <Footer />
          </div>
          <Toaster richColors position="bottom-right" />
        </CartProvider>
      </body>
    </html>
  )
}
