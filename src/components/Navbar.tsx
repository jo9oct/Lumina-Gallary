import { Link } from "@tanstack/react-router";
import { Heart, Clock, LayoutDashboard, Home, Box, Info, Menu, X, Trophy } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const links = [
  { to: "/", label: "Home", icon: Home },
  { to: "/gallery", label: "Gallery", icon: Box },
  { to: "/favorites", label: "Favorites", icon: Heart },
  { to: "/recent", label: "Recent", icon: Clock },
  { to: "/achievements", label: "Achievements", icon: Trophy },
  { to: "/admin", label: "Curator", icon: LayoutDashboard },
  { to: "/about", label: "About", icon: Info },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className="mx-auto mt-4 flex max-w-7xl items-center justify-between rounded-2xl glass px-4 py-2.5 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-neon-purple to-neon-blue text-primary-foreground shadow-lg shadow-neon-purple/30">
            VA
          </span>
          <span className="neon-text">Virtua Gallery</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="group flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              activeProps={{ className: "text-foreground bg-white/5" }}
            >
              <Icon className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100" />
              {label}
            </Link>
          ))}
        </nav>
        <button
          aria-label="Toggle menu"
          className="md:hidden rounded-lg p-2 hover:bg-white/5"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-auto mt-2 max-w-7xl rounded-2xl glass-strong p-2 md:hidden"
          >
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground"
                activeProps={{ className: "text-foreground bg-white/5" }}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
