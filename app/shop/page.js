import { createClient } from "@/lib/supabase/server"
import ShopClient from "./ShopClient"

export const metadata = { title: "Shop | GLH Co-operative Farms" }

export default async function ShopPage() {
  const supabase = createClient()
  const { data: products } = await supabase
    .from("products")
    .select("*, farmers(name)")
    .eq("active", true)
    .order("category")

  const categories = ["All", ...Array.from(new Set((products || []).map(p => p.category))).sort()]
  return <ShopClient products={products || []} categories={categories} />
}
