import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { timeDataStore, initialStartTime, initialEndTime, initialCurrentTime } from '../scripts/timeData.ts';

/* ───────────────────────── constants ───────────────────────── */

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

// 1× === realtime: one real second advances one mission second.
const REALTIME_SPEED = 1_000; // mission-ms per real second at 1×
const STORE_DEBOUNCE = 500;

// Speed slider is logarithmic: a fixed ratio between every step, so slow
// speeds stay controllable while the top end can span the 3-year archive.
const SPEED_MIN = 1.0;
const SPEED_MAX = 10_000;
const SPEED_RES = 1000;                 // slider detents (0…1000)
const SPEED_RANGE = SPEED_MAX / SPEED_MIN;
const DEFAULT_SPEED = 50;                // 3× realtime

const clampSpeed = (m) => Math.min(Math.max(m, SPEED_MIN), SPEED_MAX);
const posToSpeed = (p) => SPEED_MIN * Math.pow(SPEED_RANGE, Math.min(Math.max(p, 0), SPEED_RES) / SPEED_RES);
const speedToPos = (m) => (SPEED_RES * Math.log(clampSpeed(m) / SPEED_MIN)) / Math.log(SPEED_RANGE);
const fmtSpeed = (m) => {
  const v =
    m >= 1_000 ? `${m >= 10_000 ? Math.round(m / 1_000) : Math.round(m / 100) / 10}k`
    : m >= 100 ? `${Math.round(m)}`
    : m >= 10 ? `${Math.round(m * 10) / 10}`
    : `${Math.round(m * 100) / 100}`;
  return `${v}×`;
};

const BODY_TOP = 8;       // ruler body offset (room for the playhead pin)
const BODY_HEIGHT = 34;   // ruler body height
const LABEL_TOP = BODY_TOP + BODY_HEIGHT + 4;
const TRACK_HEIGHT = LABEL_TOP + 16;

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

/* ───────────────────────── formatting ───────────────────────── */

const formatTime = (ms) =>
  new Date(ms).toLocaleString('es-MX', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });

const formatShort = (ms) =>
  new Date(ms).toLocaleString('es-MX', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });

const fmtHM = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
const fmtDM = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' });
const fmtMY = new Intl.DateTimeFormat('es-MX', { month: 'short', year: 'numeric' });
const fmtY = new Intl.DateTimeFormat('es-MX', { year: 'numeric' });

/* ───────────────────────── ruler ticks ───────────────────────── */
/*
 * Each level is a "graduation" of the ruler. The component picks the finest
 * level whose label count fits the available width, and uses `minor` for the
 * small ticks in between. Ticks are calendar-aligned (midnight, Monday,
 * 1st of month, Jan 1…) so the divisions are meaningful dates, not just
 * evenly spaced numbers.
 */
const L = (u, n, ms) => ({ u, n, ms });
const H1 = L('h', 1, HOUR), H3 = L('h', 3, 3 * HOUR), H6 = L('h', 6, 6 * HOUR), H12 = L('h', 12, 12 * HOUR);
const D1 = L('d', 1, DAY), W1 = L('w', 1, WEEK);
const M1 = L('M', 1, 30.44 * DAY), M3 = L('M', 3, 91.3 * DAY), M6 = L('M', 6, 182.6 * DAY);
const Y1 = L('y', 1, 365.25 * DAY), Y2 = L('y', 2, 730.5 * DAY), Y5 = L('y', 5, 1826 * DAY), Y10 = L('y', 10, 3652 * DAY);

const LEVELS = [
  { ...H1, minor: null },
  { ...H3, minor: H1 },
  { ...H6, minor: H1 },
  { ...H12, minor: H3 },
  { ...D1, minor: H6 },
  { ...W1, minor: D1 },
  { ...M1, minor: W1 },
  { ...M3, minor: M1 },
  { ...M6, minor: M1 },
  { ...Y1, minor: M3 },
  { ...Y2, minor: Y1 },
  { ...Y5, minor: Y1 },
  { ...Y10, minor: Y1 },
];

const alignStart = (ms, { u, n }) => {
  const d = new Date(ms);
  switch (u) {
    case 'h':
      d.setMinutes(0, 0, 0);
      d.setHours(Math.floor(d.getHours() / n) * n);
      break;
    case 'd':
      d.setHours(0, 0, 0, 0);
      break;
    case 'w': {
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
      break;
    }
    case 'M':
      d.setHours(0, 0, 0, 0);
      d.setDate(1);
      d.setMonth(Math.floor(d.getMonth() / n) * n);
      break;
    case 'y':
      d.setHours(0, 0, 0, 0);
      d.setMonth(0, 1);
      d.setFullYear(Math.floor(d.getFullYear() / n) * n);
      break;
    default:
  }
  return d;
};

const advance = (d, { u, n }) => {
  switch (u) {
    case 'h': d.setHours(d.getHours() + n); break;
    case 'd': d.setDate(d.getDate() + n); break;
    case 'w': d.setDate(d.getDate() + 7 * n); break;
    case 'M': d.setMonth(d.getMonth() + n); break;
    case 'y': d.setFullYear(d.getFullYear() + n); break;
    default:
  }
};

const ticksFor = (level, from, to) => {
  const out = [];
  const d = alignStart(from, level);
  for (let i = 0; i < 3000 && d.getTime() <= to; i++) {
    const t = d.getTime();
    if (t >= from) out.push(t);
    advance(d, level);
  }
  return out;
};

const labelFor = (level, t) => {
  const d = new Date(t);
  switch (level.u) {
    case 'h': return d.getHours() === 0
      ? { text: fmtDM.format(d), strong: true }
      : { text: fmtHM.format(d), strong: false };
    case 'd':
    case 'w': return { text: fmtDM.format(d), strong: false };
    case 'M': return { text: fmtMY.format(d), strong: false };
    default: return { text: fmtY.format(d), strong: false };
  }
};

const buildRuler = (from, to, width) => {
  const span = Math.max(to - from, 1);
  const maxMajor = Math.max(2, Math.floor(width / 92));

  let idx = LEVELS.findIndex((lv) => span / lv.ms <= maxMajor);
  if (idx === -1) idx = LEVELS.length - 1;
  const major = LEVELS[idx];

  const majorTimes = ticksFor(major, from, to);
  const majorSet = new Set(majorTimes);

  let minorTimes = [];
  if (major.minor && span / major.minor.ms <= 240) {
    minorTimes = ticksFor(major.minor, from, to).filter((t) => !majorSet.has(t));
  }

  return {
    major: majorTimes.map((t) => ({ t, ...labelFor(major, t) })),
    minor: minorTimes,
  };
};

/* ───────────────────────── handles ───────────────────────── */

const gripStyle = (side, dragging) => ({
  position: 'absolute',
  top: BODY_TOP - 4,
  height: BODY_HEIGHT + 8,
  width: 16,
  background: 'var(--system-blue)',
  borderRadius: side === 'start' ? '9px 0 0 9px' : '0 9px 9px 0',
  transform: `translateX(${side === 'start' ? '-100%' : '0'})`,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: dragging ? 'grabbing' : 'grab',
  zIndex: 2,
  boxShadow: dragging ? 'var(--shadow-2)' : 'none',
  transition: 'box-shadow var(--spring-fast)',
});

const Handle = ({ kind, pct, value, min, max, label, dragging, onKeyDown }) => {
  const common = {
    'data-handle': kind,
    role: 'slider',
    tabIndex: 0,
    'aria-label': label,
    'aria-valuemin': min,
    'aria-valuemax': max,
    'aria-valuenow': Math.round(value),
    'aria-valuetext': formatShort(value),
    'aria-orientation': 'horizontal',
    onKeyDown: (e) => onKeyDown(kind, e),
    className: 'ruler-handle',
  };

  if (kind === 'now') {
    return (
      <div
        {...common}
        style={{
          position: 'absolute', left: `${pct}%`, top: 0, height: BODY_TOP + BODY_HEIGHT + 4,
          width: 24, transform: 'translateX(-50%)', zIndex: 3,
          cursor: dragging ? 'grabbing' : 'grab',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}
      >
        <div
          style={{
            width: 14, height: 14, borderRadius: '50%', background: 'var(--system-green)',
            border: '2px solid var(--grouped-card)', boxShadow: 'var(--shadow-2)',
            transform: dragging ? 'scale(1.2)' : 'none',
            transition: 'transform var(--spring-fast)', pointerEvents: 'none',
          }}
        />
        <div style={{ width: 2, flex: 1, background: 'var(--system-green)', pointerEvents: 'none' }} />
      </div>
    );
  }

  return (
    <div {...common} style={{ ...gripStyle(kind, dragging), left: `${pct}%` }}>
      <div style={{ width: 2, height: 18, borderRadius: 2, background: 'rgba(255,255,255,0.85)', pointerEvents: 'none' }} />
    </div>
  );
};

/* ───────────────────────── component ───────────────────────── */

const TimelineSlider = ({ autoPlay = false, defaultSpeed = DEFAULT_SPEED } = {}) => {
  const { range: [storeStartTime, storeEndTime], date: storeDate } = useStore(timeDataStore);
  const initialSpeed = clampSpeed(defaultSpeed);

  const [rangeValues, setRangeValues] = useState([storeStartTime, storeEndTime]);
  const [debouncedRange, setDebouncedRange] = useState(rangeValues);
  const [currentTimeMs, setCurrentTimeMs] = useState(storeDate);
  const [isPlaying, setIsPlaying] = useState(!!autoPlay);
  const [dragging, setDragging] = useState(null);
  const [width, setWidth] = useState(640);
  const [speed, setSpeed] = useState(initialSpeed);

  const trackRef = useRef(null);
  const dragRef = useRef(null);

  // Read the live speed inside the rAF loop without re-running the effect
  // (changing speed mid-play must not restart the loop or reset `last`).
  const speedRef = useRef(initialSpeed);
  const applySpeed = useCallback((mult) => {
    const s = clampSpeed(mult);
    setSpeed(s);
    speedRef.current = s;
  }, []);

  const [startTimeMs, endTimeMs] = rangeValues;
  const span = Math.max(initialEndTime - initialStartTime, 1);
  const pct = useCallback((v) => ((v - initialStartTime) / span) * 100, [span]);

  /* ── store sync (unchanged behaviour: range debounced, date immediate) ── */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedRange(rangeValues), STORE_DEBOUNCE);
    return () => clearTimeout(t);
  }, [rangeValues]);

  useEffect(() => {
    timeDataStore.set({ date: currentTimeMs, range: debouncedRange });
  }, [currentTimeMs, debouncedRange]);

  /* ── measure the track so tick density adapts to the width ── */
  useEffect(() => {
    const el = trackRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  const ruler = useMemo(
    () => buildRuler(initialStartTime, initialEndTime, width),
    [width]
  );

  /* ── playback (rAF + delta time: smooth and frame-rate independent) ── */
  useEffect(() => {
    if (!isPlaying) return;
    let raf;
    let last = performance.now();
    const tick = (now) => {
      const dt = now - last;
      last = now;
      setCurrentTimeMs((prev) => Math.min(prev + (dt * REALTIME_SPEED * speedRef.current) / 1000, endTimeMs));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, endTimeMs]);

  useEffect(() => {
    if (isPlaying && currentTimeMs >= endTimeMs) setIsPlaying(false);
  }, [isPlaying, currentTimeMs, endTimeMs]);

  const togglePlay = useCallback(() => {
    if (!isPlaying && currentTimeMs >= endTimeMs) setCurrentTimeMs(startTimeMs); // replay from start
    setIsPlaying((p) => !p);
  }, [isPlaying, currentTimeMs, startTimeMs, endTimeMs]);

  const handleReset = useCallback(() => {
    // Reset to the true initial values (the store mirrors local state, so
    // storeDate would be a no-op) and bypass the debounce so the globe and
    // plots update immediately.
    setRangeValues([initialStartTime, initialEndTime]);
    setDebouncedRange([initialStartTime, initialEndTime]);
    setCurrentTimeMs(initialCurrentTime);
    setIsPlaying(false);
    applySpeed(DEFAULT_SPEED);
  }, [applySpeed]);

  /* ── one place that moves any of the three handles ── */
  const applyValue = useCallback((kind, raw) => {
    const step = kind === 'now' ? MINUTE : HOUR;
    const snapped = initialStartTime + Math.round((raw - initialStartTime) / step) * step;

    if (kind === 'start') {
      const ns = clamp(snapped, initialStartTime, Math.max(endTimeMs - HOUR, initialStartTime));
      setRangeValues([ns, endTimeMs]);
      setCurrentTimeMs((c) => clamp(c, ns, endTimeMs));
    } else if (kind === 'end') {
      const ne = clamp(snapped, Math.min(startTimeMs + HOUR, initialEndTime), initialEndTime);
      setRangeValues([startTimeMs, ne]);
      setCurrentTimeMs((c) => clamp(c, startTimeMs, ne));
    } else {
      setCurrentTimeMs(clamp(snapped, startTimeMs, endTimeMs));
      setIsPlaying(false);
    }
  }, [startTimeMs, endTimeMs]);

  const valueFromX = useCallback((clientX) => {
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    return initialStartTime + ratio * span;
  }, [span]);

  const valueOf = (kind) => (kind === 'start' ? startTimeMs : kind === 'end' ? endTimeMs : currentTimeMs);

  /* ── pointer interaction (mouse, touch and pen through one path) ── */
  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    const grabbed = e.target.closest?.('[data-handle]')?.dataset.handle;
    const v = valueFromX(e.clientX);

    let kind = grabbed;
    let offset = 0;

    if (kind) {
      offset = valueOf(kind) - v; // keep the grab point, no jump
    } else {
      // Click on the ruler: scrub the playhead inside the range,
      // otherwise pull the nearest range handle.
      if (v >= startTimeMs && v <= endTimeMs) kind = 'now';
      else kind = Math.abs(v - startTimeMs) < Math.abs(v - endTimeMs) ? 'start' : 'end';
      applyValue(kind, v);
    }

    dragRef.current = { kind, offset };
    setDragging(kind);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    applyValue(drag.kind, valueFromX(e.clientX) + drag.offset);
  };

  const endDrag = () => {
    dragRef.current = null;
    setDragging(null);
  };

  /* ── keyboard: arrows = 1 h, Shift = 1 day, PageUp/Down = 1 week ── */
  const onHandleKeyDown = (kind, e) => {
    const dir = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 1, PageDown: -1 }[e.key];
    const v = valueOf(kind);
    let next = null;

    if (dir) {
      const unit = e.key.startsWith('Page') ? WEEK : e.shiftKey ? DAY : HOUR;
      next = v + dir * unit;
    } else if (e.key === 'Home') {
      next = kind === 'now' ? startTimeMs : initialStartTime;
    } else if (e.key === 'End') {
      next = kind === 'now' ? endTimeMs : initialEndTime;
    }

    if (next !== null) {
      e.preventDefault();
      applyValue(kind, next);
    }
  };

  const selLeft = pct(startTimeMs);
  const selRight = pct(endTimeMs);

  return (
    <div
      className="apple-card"
      style={{ padding: 14, borderRadius: 'var(--radius-l)' }}
      role="group"
      aria-label="Control de línea de tiempo"
    >
      <style>{`
        .ruler-handle:focus-visible { outline: 2px solid var(--system-blue); outline-offset: 2px; }
      `}</style>

      {/* Controls + readouts */}
      <div className="flex items-center justify-between flex-wrap" style={{ gap: 10, marginBottom: 10 }}>
        <div className="flex items-center" style={{ gap: 8 }}>
          <button
            onClick={togglePlay}
            className="apple-btn"
            style={{
              minHeight: 40, fontSize: 15, padding: '0 18px',
              background: isPlaying ? 'var(--system-red)' : 'var(--system-blue)',
              color: '#fff',
            }}
            aria-pressed={isPlaying}
          >
            {isPlaying ? '❚❚ Pausa' : '▶ Ver viaje'}
          </button>
          <button
            onClick={handleReset}
            className="apple-btn apple-btn-gray"
            style={{ minHeight: 40, minWidth: 40, fontSize: 15 }}
            aria-label="Restablecer rango y velocidad"
          >
            ↺
          </button>

          {/* Playback speed — logarithmic scale (1× = realtime), live */}
          <label
            title="Velocidad de reproducción (escala logarítmica · 1× = tiempo real)"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              height: 40, padding: '0 12px', borderRadius: 999,
              background: 'var(--fill-tertiary)',
            }}
          >
            <span className="sf-mono type-caption1" style={{ color: 'var(--secondary-label)', letterSpacing: '0.08em' }}>VEL</span>
            <input
              type="range"
              min={0}
              max={SPEED_RES}
              step={1}
              value={Math.round(speedToPos(speed))}
              onChange={(e) => applySpeed(posToSpeed(Number(e.target.value)))}
              aria-label="Velocidad de reproducción de la línea de tiempo"
              aria-valuetext={fmtSpeed(speed)}
              style={{ width: 96, minHeight: 40, height: 40, margin: 0, accentColor: 'var(--system-blue)', cursor: 'pointer' }}
            />
            <span className="sf-mono type-caption1" style={{ minWidth: 44, textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {fmtSpeed(speed)}
            </span>
          </label>
        </div>

        <span className="sf-mono type-callout" style={{ fontWeight: 600 }} aria-live="off">
          {formatTime(currentTimeMs)}
        </span>

        <span className="sf-mono type-footnote" style={{ color: 'var(--secondary-label)' }}>
          {formatShort(startTimeMs)} – {formatShort(endTimeMs)}
        </span>
      </div>

      {/* The ruler: range + playhead in one control */}
      <div style={{ padding: '0 14px' }}>
        <div
          ref={trackRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          style={{
            position: 'relative', height: TRACK_HEIGHT,
            touchAction: 'pan-y', userSelect: 'none',
            cursor: dragging ? 'grabbing' : 'pointer',
          }}
        >
          {/* Ruler body */}
          <div
            style={{
              position: 'absolute', left: 0, right: 0, top: BODY_TOP, height: BODY_HEIGHT,
              borderRadius: 10, background: 'var(--fill-tertiary)', overflow: 'hidden',
            }}
          >
            {/* Selected range */}
            <div
              style={{
                position: 'absolute', top: 0, bottom: 0,
                left: `${selLeft}%`, width: `${Math.max(selRight - selLeft, 0)}%`,
                background: 'color-mix(in srgb, var(--system-blue) 16%, transparent)',
                borderTop: '2px solid var(--system-blue)',
                borderBottom: '2px solid var(--system-blue)',
                boxSizing: 'border-box',
              }}
            />

            {/* Graduations — anchored to the bottom edge like a real ruler */}
            {ruler.minor.map((t) => (
              <div
                key={`m${t}`}
                style={{
                  position: 'absolute', bottom: 0, left: `${pct(t)}%`,
                  width: 1, height: 10, background: 'var(--secondary-label)', opacity: 0.45,
                }}
              />
            ))}
            {ruler.major.map(({ t }) => (
              <div
                key={`M${t}`}
                style={{
                  position: 'absolute', bottom: 0, left: `${pct(t)}%`,
                  width: 1.5, height: 24, background: 'var(--secondary-label)',
                }}
              />
            ))}

            {/* Soften everything outside the range */}
            <div
              style={{
                position: 'absolute', top: 0, bottom: 0, left: 0, width: `${selLeft}%`,
                background: 'color-mix(in srgb, var(--grouped-card) 62%, transparent)',
              }}
            />
            <div
              style={{
                position: 'absolute', top: 0, bottom: 0, left: `${selRight}%`, right: 0,
                background: 'color-mix(in srgb, var(--grouped-card) 62%, transparent)',
              }}
            />
          </div>

          {/* Date labels */}
          {ruler.major.map(({ t, text, strong }) => {
            const p = pct(t);
            const shift = p < 3 ? '0' : p > 97 ? '-100%' : '-50%';
            return (
              <span
                key={`l${t}`}
                className="sf-mono type-caption1"
                style={{
                  position: 'absolute', top: LABEL_TOP, left: `${p}%`,
                  transform: `translateX(${shift})`, whiteSpace: 'nowrap',
                  color: 'var(--secondary-label)', fontWeight: strong ? 700 : 400,
                  pointerEvents: 'none',
                }}
              >
                {text}
              </span>
            );
          })}

          {/* Handles */}
          <Handle
            kind="start" pct={selLeft} value={startTimeMs}
            min={initialStartTime} max={endTimeMs - HOUR}
            label="Inicio del rango" dragging={dragging === 'start'} onKeyDown={onHandleKeyDown}
          />
          <Handle
            kind="end" pct={selRight} value={endTimeMs}
            min={startTimeMs + HOUR} max={initialEndTime}
            label="Fin del rango" dragging={dragging === 'end'} onKeyDown={onHandleKeyDown}
          />
          <Handle
            kind="now" pct={clamp(pct(currentTimeMs), 0, 100)} value={currentTimeMs}
            min={startTimeMs} max={endTimeMs}
            label="Instante actual de la misión" dragging={dragging === 'now'} onKeyDown={onHandleKeyDown}
          />
        </div>
      </div>
    </div>
  );
};

export default TimelineSlider;