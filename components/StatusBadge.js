import s from "@/styles/ui.module.css"

const map = {
  Processing: s.badgeProcessing,
  Shipped:    s.badgeShipped,
  Delivered:  s.badgeDelivered,
  Cancelled:  s.badgeCancelled,
}

export default function StatusBadge({ status }) {
  return <span className={`${s.badge} ${map[status] ?? s.badgeSecondary}`}>{status}</span>
}
