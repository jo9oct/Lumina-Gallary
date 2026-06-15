export function Footer() {
  return (
    <footer className="mt-32 border-t border-border/60">
      <div className="mx-auto max-w-7xl px-6 py-10 text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-3">
        <p>© {new Date().getFullYear()} Virtua Gallery — a frontend-only virtual museum.</p>
        <p className="opacity-70">Built with React · Three.js · Framer Motion</p>
      </div>
    </footer>
  );
}
