import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardClient from "./DashboardClient"

export const metadata = { title: "Producer Dashboard | GLH Co-operative Farms" }

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, farmer_id")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "producer") redirect("/")

  const farmerId = profile.farmer_id

  const { data: farmer } = await supabase
    .from("farmers")
    .select("*")
    .eq("id", farmerId)
    .single()

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("farmer_id", farmerId)
    .order("name")

  const { data: orderItems } = await supabase
    .from("order_items")
    .select("order_id")
    .eq("farmer_id", farmerId)

  const orderIds = [...new Set((orderItems || []).map(i => i.order_id))]

  let orders = []
  if (orderIds.length > 0) {
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*, products(name, emoji, price))")
      .in("id", orderIds)
      .order("created_at", { ascending: false })
    orders = data || []
  }

  return (
    <DashboardClient
      farmer={farmer}
      products={products || []}
      orders={orders}
      farmerId={farmerId}
    />
  )
}
