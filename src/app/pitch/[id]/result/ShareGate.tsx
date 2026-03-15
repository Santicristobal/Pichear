"use client";

import { useState } from "react";

interface ShareGateProps {
  pitchId: string;
  startupName: string;
  shareUrl: string;
  children: React.ReactNode;
}

export default function ShareGate({
  pitchId,
  startupName,
  shareUrl,
  children,
}: ShareGateProps) {
  const storageKey = `roast-unlocked-${pitchId}`;
  const [unlocked, setUnlocked] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(storageKey);
  });

  function handleShare(platform: "twitter" | "linkedin") {
    const shareText = `Mi startup "${startupName}" fue al roast. Mira como le fue`;
    const url =
      platform === "twitter"
        ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
        : `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

    window.open(url, "_blank", "width=600,height=400");
    localStorage.setItem(storageKey, "true");
    setUnlocked(true);
  }

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <div className="mt-12">
      {/* Blurred preview */}
      <div className="relative">
        <div className="pointer-events-none select-none blur-md opacity-40">
          {children}
        </div>

        {/* Overlay con CTA */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-2xl border border-zinc-700 bg-zinc-900/95 p-8 text-center max-w-md mx-4">
            <p className="text-lg font-bold text-white mb-2">
              Comparti tu resultado para ver el feedback completo
            </p>
            <p className="text-sm text-zinc-400 mb-6">
              Los roasts completos de los 3 inversores, fortalezas, debilidades y recomendacion.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => handleShare("twitter")}
                className="rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-black hover:bg-zinc-200 transition-colors"
              >
                Compartir en Twitter
              </button>
              <button
                onClick={() => handleShare("linkedin")}
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Compartir en LinkedIn
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
