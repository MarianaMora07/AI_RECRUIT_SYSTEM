"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: string;
  accent?: "coral" | "gold" | "navy" | "rose";
  delay?: number;
}

const accents = {
  coral: "from-[#ff6b4a]/10 to-[#ff6b4a]/5 text-[#ff6b4a]",
  gold: "from-[#f4a261]/10 to-[#f4a261]/5 text-[#f4a261]",
  navy: "from-[#2d3a5c]/10 to-[#2d3a5c]/5 text-[#2d3a5c]",
  rose: "from-[#e8b4b8]/20 to-[#e8b4b8]/5 text-[#c97b82]",
};

export function StatCard({
  label,
  value,
  icon,
  accent = "coral",
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="stat-card group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs md:text-sm font-medium text-[var(--foreground-muted)] uppercase tracking-wide">
            {label}
          </p>
          <p className="text-3xl md:text-4xl font-extrabold mt-2 text-[var(--foreground)]">
            {value}
          </p>
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-xl",
              accents[accent]
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}
