import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Trophy, Lock } from "lucide-react";
import { ACHIEVEMENTS, getUnlocked } from "@/utils/achievements";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/achievements")({
  head: () => ({
    meta: [
      { title: "Achievements · Virtua Gallery" },
      { name: "description", content: "Track your progress and unlock achievements as you explore the gallery." },
    ],
  }),
  component: AchievementsPage,
  ssr: false,
});

function AchievementsPage() {
  const [unlocked, setUnlocked] = useState<string[]>([]);
  useEffect(() => { setUnlocked(getUnlocked()); }, []);
  const done = unlocked.length;
  const total = ACHIEVEMENTS.length;

  return (
    <div className="mx-auto max-w-5xl px-6 pb-24">
      <header className="mb-10">
        <span className="text-xs uppercase tracking-[0.3em] text-neon-cyan">Achievements</span>
        <h1 className="mt-2 font-display text-4xl md:text-5xl font-black">
          Your <span className="neon-text">collection</span>
        </h1>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-2 flex-1 max-w-sm rounded-full bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(done / total) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-neon-purple to-neon-cyan"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {done} / {total} unlocked
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ACHIEVEMENTS.map((a, i) => {
          const got = unlocked.includes(a.id);
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className={`rounded-2xl p-5 glass ${got ? "neon-border" : "opacity-60"}`}
            >
              <div className="flex items-start gap-3">
                <div className={`grid h-10 w-10 place-items-center rounded-xl ${got ? "bg-gradient-to-br from-neon-purple to-neon-blue text-white" : "bg-white/5 text-muted-foreground"}`}>
                  {got ? <Trophy className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <div className="font-display font-semibold">{a.title}</div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{a.description}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
