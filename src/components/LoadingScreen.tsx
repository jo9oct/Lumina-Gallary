import { motion } from "framer-motion";

export function LoadingScreen({ label = "Preparing gallery" }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <motion.div
          className="h-16 w-16 rounded-full border-2 border-neon-purple/40 border-t-neon-cyan"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
        <motion.p
          className="text-sm tracking-[0.3em] uppercase text-muted-foreground"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {label}
        </motion.p>
      </div>
    </div>
  );
}
