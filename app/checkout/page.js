import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import CheckoutClient from "./CheckoutClient"

export const metadata = { title: "Checkout | GLH Co-operative Farms" }

export default async function CheckoutPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, address, city, postcode")
    .eq("id", user.id)
    .single()

  return <CheckoutClient user={user} profile={profile} />
}
