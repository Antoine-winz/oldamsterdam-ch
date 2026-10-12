import { useEffect, useRef } from "react";

export default function PageTracker({ path, language }: { path: string; language?: string }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get("utm_source") || null;
    const utmMedium = params.get("utm_medium") || null;
    const utmCampaign = params.get("utm_campaign") || null;

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path,
        language: language || null,
        referrer: document.referrer || null,
        utmSource,
        utmMedium,
        utmCampaign,
      }),
      credentials: "include",
    }).catch(() => {});
  }, [path, language]);

  return null;
}
