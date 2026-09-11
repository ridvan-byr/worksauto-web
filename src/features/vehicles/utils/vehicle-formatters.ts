export function formatFuelType(fuel?: string | null): string {
  if (!fuel) return "Benzin"
  const upper = fuel.trim().toUpperCase()
  if (upper === "DIESEL" || upper === "DIZEL") return "Dizel"
  if (upper === "GASOLINE" || upper === "BENZIN") return "Benzin"
  if (upper === "LPG") return "LPG"
  if (upper === "HYBRID" || upper === "HIBRIT") return "Hibrit"
  if (upper === "ELECTRIC" || upper === "ELEKTRIK") return "Elektrik"
  return fuel
}

export function formatTransmission(trans?: string | null): string {
  if (!trans) return "Otomatik"
  const upper = trans.trim().toUpperCase()
  if (upper === "MANUAL" || upper === "MANUEL") return "Manuel"
  if (upper === "AUTOMATIC" || upper === "OTOMATIK") return "Otomatik"
  if (upper === "SEMI_AUTOMATIC" || upper === "YARI_OTOMATIK" || upper === "SEMI-AUTOMATIC") return "Yarı Otomatik"
  return trans
}
