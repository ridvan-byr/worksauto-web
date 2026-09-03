export function restartPageAnimation() {
  if (typeof window === "undefined") return
  window.scrollTo({ top: 0, behavior: "smooth" })
  const el = document.getElementById("worksauto-page-wrapper")
  if (el) {
    el.classList.remove("animate-page-enter")
    // Trigger DOM reflow to restart CSS animation cleanly
    void el.offsetWidth
    el.classList.add("animate-page-enter")
  }
}
