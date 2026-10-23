"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { markVideoWatchedAction } from "@/actions/progress";
import { PlayIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui";

interface YTPlayer {
  destroy: () => void;
}

interface YTNamespace {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars?: Record<string, string | number>;
      events?: { onStateChange?: (event: { data: number }) => void };
    }
  ) => YTPlayer;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<YTNamespace>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error("YouTube API unavailable"));
    };

    if (document.getElementById("youtube-iframe-api")) return;
    const script = document.createElement("script");
    script.id = "youtube-iframe-api";
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => reject(new Error("Could not load video player"));
    document.head.appendChild(script);
  });

  return apiPromise;
}

export function ModuleVideo({
  videoId,
  moduleSlug,
  watched,
  labels,
}: {
  videoId: string;
  moduleSlug: string;
  watched: boolean;
  labels: {
    play: string;
    fallback: string;
    markWatched: string;
    marking: string;
    watchedNote: string;
    error: string;
  };
}) {
  const [activated, setActivated] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [marking, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  function saveWatched() {
    startTransition(async () => {
      const result = await markVideoWatchedAction(moduleSlug);
      if (result.ok) router.refresh();
      else setLoadError(true);
    });
  }

  useEffect(() => {
    if (!activated || !containerRef.current) return;
    let player: YTPlayer | undefined;
    let cancelled = false;

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled || !containerRef.current) return;
        player = new YT.Player(containerRef.current, {
          videoId,
          playerVars: {
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onStateChange: (event) => {
              if (event.data === 0) saveWatched();
            },
          },
        });
        setLoadError(false);
      })
      .catch(() => setLoadError(true));

    return () => {
      cancelled = true;
      try {
        player?.destroy();
      } catch {
        // Player may already be removed with the iframe.
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activated, videoId]);

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-brand-200 bg-brand-950 shadow-sm">
        {activated ? (
          <div className="aspect-video w-full">
            <div ref={containerRef} className="h-full w-full" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setActivated(true)}
            className="group flex aspect-video w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 text-white transition hover:from-brand-800"
            aria-label={labels.play}
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-brand-800 shadow-lg transition group-hover:scale-105">
              <PlayIcon className="ml-1 h-7 w-7" />
            </span>
            <span className="text-sm font-semibold">{labels.play}</span>
            <span className="px-6 text-xs text-brand-200">
              youtube.com · external video
            </span>
          </button>
        )}
      </div>

      {watched ? (
        <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-800" role="status">
          ✓ {labels.watchedNote}
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">{labels.fallback}</p>
          <button
            type="button"
            onClick={saveWatched}
            disabled={marking}
            className={buttonClass("secondary") + " shrink-0"}
          >
            {marking ? labels.marking : labels.markWatched}
          </button>
        </div>
      )}

      {loadError && (
        <p className="mt-2 text-sm font-medium text-red-700" role="alert">
          {labels.error}
        </p>
      )}
    </div>
  );
}
