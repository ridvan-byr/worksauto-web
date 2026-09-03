export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div id="worksauto-page-wrapper" className="animate-page-enter w-full">
      {children}
    </div>
  )
}
