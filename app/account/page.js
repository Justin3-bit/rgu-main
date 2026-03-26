import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AccountClient from "./AccountClient"

export const metadata = { title: "My Account | GLH Co-operative Farms" }

export default async function AccountPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*, products(name, emoji))")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })

  return <AccountClient user={user} profile={profile} orders={orders || []} />
}
