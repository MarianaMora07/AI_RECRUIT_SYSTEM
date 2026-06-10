"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { APP_LOGO, APP_LOGO_ALT, APP_NAME } from "@/lib/constants/branding";

type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  size?: LogoSize;
  showName?: boolean;
  className?: string;
  variant?: "default" | "light";
}

const sizes: Record<LogoSize, { img: number; text: string }> = {
  sm: { img: 32, text: "text-sm" },
  md: { img: 40, text: "text-base" },
  lg: { img: 56, text: "text-xl" },
};

export function Logo({
  size = "md",
  showName = true,
  className,
  variant = "default",
}: LogoProps) {
  const [imgError, setImgError] = useState(false);
  const dim = sizes[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {!imgError ? (
        <Image
          src={APP_LOGO}
          alt={APP_LOGO_ALT}
          width={dim.img}
          height={dim.img}
          className="object-contain shrink-0"
          style={{ width: dim.img, height: dim.img }}
          onError={() => setImgError(true)}
          priority
        />
      ) : (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg font-extrabold text-white",
            size === "sm" ? "h-8 w-8 text-xs" : size === "md" ? "h-10 w-10 text-sm" : "h-14 w-14 text-base",
            variant === "light" ? "gradient-brand" : "bg-[var(--institutional)]"
          )}
        >
          {APP_NAME.slice(0, 2).toUpperCase()}
        </div>
      )}
      {showName && (
        <div className="min-w-0">
          <p
            className={cn(
              "font-extrabold tracking-tight leading-tight truncate",
              dim.text,
              variant === "light" ? "text-white" : "text-[var(--foreground)]"
            )}
          >
            {APP_NAME}
          </p>
        </div>
      )}
    </div>
  );
}
