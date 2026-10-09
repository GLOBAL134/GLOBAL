"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
const visaPhotos = Array.from({ length: 10 }, (_, i) => `${base}/images/visa-slider/visa-slide-${String(i + 1).padStart(2, "0")}.webp`);
const officePhotos = Array.from({ length: 3 }, (_, i) => `${base}/images/office-slider/office-slide-${String(i + 1).padStart(2, "0")}.webp`);

function PhotoSlider({ photos, className, fadeMs }: { photos: string[]; className: string; fadeMs: number }) {
  const root = useRef<HTMLDivElement>(null);
  const hasFaded = useRef(false);
  const [index, setIndex] = useState(0);
  const [incoming, setIncoming] = useState<number | null>(null);
  const [shown, setShown] = useState(false);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => {
      setReduced(media.matches);
      if (media.matches) { setIncoming(null); setShown(false); }
    };
    const updateVisibility = () => setPageVisible(document.visibilityState === "visible");
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (root.current) observer.observe(root.current);
    updateMotion();
    updateVisibility();
    media.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (reduced || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    const next = new Image();
    next.src = photos[(index + 1) % photos.length];
    next.decode().then(() => { if (!cancelled) setReady(true); }).catch(() => { if (!cancelled) setReady(false); });
    return () => { cancelled = true; };
  }, [index, photos, reduced]);

  useEffect(() => {
    if (!ready || !visible || !pageVisible || reduced || incoming !== null) return;
    const timer = window.setTimeout(() => setIncoming((index + 1) % photos.length), 5000 - (hasFaded.current ? fadeMs : 0));
    return () => window.clearTimeout(timer);
  }, [fadeMs, index, incoming, pageVisible, photos, ready, reduced, visible]);

  useEffect(() => {
    if (incoming === null) return;
    if (reduced) return;
    // Paint the decoded incoming image at opacity 0 before starting its fade.
    const first = requestAnimationFrame(() => {
      const second = requestAnimationFrame(() => setShown(true));
      frames.push(second);
    });
    const frames = [first];
    return () => frames.forEach(cancelAnimationFrame);
  }, [incoming, reduced]);

  const frame = (photo: number, fading: boolean) => (
    <div key={photo} data-photo-index={photo + 1} className={`photo-frame${fading ? ` incoming${shown ? " shown" : ""}` : ""}`}
      style={{ "--fade-duration": `${fadeMs}ms` } as CSSProperties}
      onTransitionEnd={fading ? (event) => {
        if (event.target !== event.currentTarget || event.propertyName !== "opacity") return;
        hasFaded.current = true;
        setIndex(photo);
        setIncoming(null);
        setShown(false);
        setReady(false);
      } : undefined}>
      <img src={photos[photo]} alt="" aria-hidden="true" loading={photo === 0 ? "eager" : "lazy"} decoding="async" />
    </div>
  );

  return <div ref={root} className={`photo-slides ${className}`} aria-hidden="true">
    {frame(index, false)}
    {incoming !== null && frame(incoming, true)}
  </div>;
}

export function VisaPhotoSlider() {
  return <PhotoSlider photos={visaPhotos} className="service-photo-slides" fadeMs={1000} />;
}

export function OfficePhotoSlider() {
  return <PhotoSlider photos={officePhotos} className="office-photo-slides" fadeMs={800} />;
}
