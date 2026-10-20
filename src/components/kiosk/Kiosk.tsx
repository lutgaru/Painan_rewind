import React, { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import World from "../world";
import ShortPlots from "../ShortPlots.jsx";
import LongPlots from "../LongPlots.jsx";
import mission from "../../data/mission.json";
import { timeDataStore } from "../../scripts/timeData.ts";

export interface KioskSlide {
  file: string;
  src: string;
  thumb: string;
  width: number;
  height: number;
  title: string;
  description: string;
}

interface Props {
  slides: KioskSlide[];
  satSrc: string;
  exitHref?: string;
}

const fmtClock = new Intl.DateTimeFormat("es-MX", {
  hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "UTC",
});
const fmtMission = new Intl.DateTimeFormat("es-MX", {
  year: "numeric", month: "short", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "UTC",
});

const nf = new Intl.NumberFormat("es-MX");

/* Facts shown in the info block. Launch date / site live in the video panel,
   so they are filtered out here to avoid duplicating information. */
const INFO_FACTS = mission.quickFacts.filter((f) => !["Lanzamiento", "Sitio"].includes(f.label));

function UtcClock() {
  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return <span className="kiosk-clock sf-mono">{fmtClock.format(clock)} UTC</span>;
}

function MissionInstant() {
  const { date } = useStore(timeDataStore);
  return <strong className="sf-mono">{fmtMission.format(new Date(date))}</strong>;
}

/* Silent playback: advances the mission clock every animation frame (delta-time,
   like the landing timeline) so the globe moves continuously instead of jumping
   in discrete steps. Loops within the archive range. */
function MissionRewind() {
  useEffect(() => {
    const SPEED = 2000; // mission-ms per real-ms (~33 min of mission per second)
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(now - last, 100); // clamp long gaps (hidden tab)
      last = now;
      const s = timeDataStore.get();
      const [from, to] = s.range;
      let next = s.date + dt * SPEED;
      if (next >= to) next = from + ((next - to) % (to - from));
      timeDataStore.set({ range: s.range, date: next });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return null;
}

function LaunchVideoEmbed({ src }: { src: string }) {
  return (
    <div className="kiosk-video-frame">
      <iframe
        src={src}
        title={mission.launchVideo.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}

function SatCarousel({ slides }: { slides: KioskSlide[] }) {
  const [i, setI] = useState(0);
  const n = slides.length;

  useEffect(() => {
    if (n < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % n), 6000);
    return () => clearInterval(t);
  }, [n]);

  const step = (d: number) => setI((v) => (v + d + n) % n);

  return (
    <div className="kiosk-carousel">
      <div className="kiosk-car-main">
        {slides.map((s, idx) => (
          <figure
            key={s.file}
            className={`kiosk-slide ${idx === i ? "is-active" : ""}`}
            aria-hidden={idx !== i}
          >
            <img src={s.thumb} alt={s.title} loading={idx === 0 ? "eager" : "lazy"} decoding="async" />
            <figcaption>
              <span className="kiosk-slide-title">{s.title}</span>
              <span className="kiosk-slide-desc">{s.description}</span>
            </figcaption>
          </figure>
        ))}

        {n > 1 && (
          <>
            <button type="button" className="kiosk-car-nav is-prev" onClick={() => step(-1)} aria-label="Foto anterior">‹</button>
            <button type="button" className="kiosk-car-nav is-next" onClick={() => step(1)} aria-label="Foto siguiente">›</button>
          </>
        )}
      </div>

      {n > 1 && (
        <div className="kiosk-car-thumbs" role="tablist" aria-label="Miniaturas de fotos">
          {slides.map((s, idx) => (
            <button
              key={s.file}
              type="button"
              role="tab"
              aria-selected={idx === i}
              aria-label={s.title}
              className={`kiosk-car-thumb ${idx === i ? "is-active" : ""}`}
              onClick={() => setI(idx)}
            >
              <img src={s.thumb} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Kiosk({ slides, satSrc, exitHref = "/" }: Props) {
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const onFs = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // Dev-only: React's development build emits a User Timing entry per rendered
  // component. Since the mission clock ticks every frame, those entries pile up
  // in the performance timeline and grow native memory without bound. Production
  // emits none, so this keeps long dev sessions safe without affecting the build.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const id = window.setInterval(() => performance.clearMeasures?.(), 2000);
    return () => window.clearInterval(id);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => {});
  };

  const videoSrc =
    `https://www.youtube-nocookie.com/embed/${mission.launchVideo.youtubeId}` +
    `?start=${mission.launchVideo.start}&autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1`;

  return (
    <div className="kiosk">
      <header className="kiosk-top">
        <div className="kiosk-brand">
          <span className="kiosk-dot" aria-hidden="true" />
          <span>PAINANI-1</span>
          <span className="kiosk-brand-sub">KIOSKO · ARCHIVO DE MISIÓN</span>
        </div>
        <div className="kiosk-toolbar">
          <UtcClock />
          <button
            type="button"
            className="kiosk-icon-btn"
            onClick={toggleFullscreen}
            aria-label={isFs ? "Salir de pantalla completa" : "Pantalla completa"}
            title="Pantalla completa"
          >
            {isFs ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 4v3.5A1.5 1.5 0 0 1 7.5 9H4M15 4v3.5A1.5 1.5 0 0 0 16.5 9H20M20 15h-3.5A1.5 1.5 0 0 0 15 16.5V20M4 15h3.5A1.5 1.5 0 0 1 9 16.5V20" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15" /></svg>
            )}
          </button>
          <a className="kiosk-icon-btn" href={exitHref} aria-label="Salir del modo kiosko" title="Salir del kiosko">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15" /><path d="M10 16l-4-4 4-4M6 12h9" /></svg>
          </a>
        </div>
      </header>

      <main className="kiosk-main">
        {/* ── COL 1 · título · video · ficha | imagen ── */}
        <section className="kiosk-left">
          <div className="kiosk-sat-head">
            <div>
              <h1 className="kiosk-sat-name">PAINANI-1</h1>
              <p className="kiosk-sat-full">{mission.fullName}</p>
            </div>
            <span className="kiosk-pill">{mission.status}</span>
          </div>

          <div className="kiosk-video-panel">
            <h2 className="kiosk-section-label">VIDEO · PAINANI-1 NANOSATÉLITE MEXICANO</h2>
            <div className="kiosk-video-slot">
              <LaunchVideoEmbed src={videoSrc} />
            </div>
          </div>

          <div className="kiosk-left-top">
            <div className="kiosk-sat-info">
              <h2 className="kiosk-section-label">FICHA DEL SATÉLITE · PAINANI-1</h2>

              <div className="kiosk-sat-about">
                <p className="kiosk-sat-summary">{mission.summary}</p>
                <p className="kiosk-sat-dates">
                  <span>Misión</span>
                  <strong>{mission.missionDates.launch} – {mission.missionDates.end}</strong>
                </p>
              </div>

              <ul className="kiosk-fact-grid">
                {INFO_FACTS.map((f) => (
                  <li key={f.label}>
                    <span>{f.label}</span>
                    <strong>{f.value}</strong>
                  </li>
                ))}
              </ul>

              <div className="kiosk-stats">
                <div><strong>{nf.format(mission.archive.shortBeacons)}</strong><span>balizas cortas</span></div>
                <div><strong>{nf.format(mission.archive.longBeacons)}</strong><span>balizas largas</span></div>
                <div><strong>{nf.format(mission.archive.tleCount)}</strong><span>TLEs históricos</span></div>
              </div>
              <p className="kiosk-stats-caption">Cobertura del archivo · {mission.archive.coverage}</p>
            </div>

            <div className="kiosk-sat-img">
              <img src={satSrc} alt="Modelo 3D del nanosatélite PAINANI-1" decoding="async" />
            </div>
          </div>
        </section>

        {/* ── COL 2 · galería de fotos ── */}
        <section className="kiosk-panel kiosk-gallery-panel">
          <h2 className="kiosk-section-label">GALERÍA SAT · visto desde arriba</h2>
          <SatCarousel slides={slides} />
        </section>

        {/* ── COL 3 · globo + telemetría ── */}
        <section className="kiosk-live">
          <div className="kiosk-panel kiosk-globe-panel">
            <h2 className="kiosk-section-label">ÓRBITA PROPAGADA · satellite.js + TLEs</h2>
            <div className="kiosk-globe-card">
              <World />
              <MissionRewind />
            </div>
            <div className="kiosk-globe-foot">
              <div className="kiosk-globe-readout">
                <span>Instante de misión</span>
                <MissionInstant />
              </div>
            </div>
          </div>

          <div className="kiosk-panel kiosk-tele-panel">
            <h2 className="kiosk-section-label">TELEMETRÍA · balizas cortas y largas</h2>
            <div className="kiosk-chartgrid">
              <ShortPlots />
              <LongPlots />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
