import React, { useState, useEffect, useCallback } from 'react';
import { Range } from 'react-range';
import { useStore } from '@nanostores/react';
import { timeDataStore, initialStartTime, initialEndTime, initialCurrentTime } from '../scripts/timeData.ts';

const formatTime = (ms) => {
  const date = new Date(ms);
  return date.toLocaleString('es-MX', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
};

const HOUR_IN_MS = 1000 * 60 * 60;
const PLAY_SPEED = 50000;
const UPDATE_INTERVAL = 10;

const TimelineSlider = () => {
  const { range: [storeStartTime, storeEndTime], date: storeDate } = useStore(timeDataStore);

  const [rangeValues, setRangeValues] = useState([storeStartTime, storeEndTime]);
  const [debouncedRange, setDebouncedRange] = useState(rangeValues);
  const [currentTimeMs, setCurrentTimeMs] = useState(storeDate);
  const [isPlaying, setIsPlaying] = useState(false);

  const [startTimeMs, endTimeMs] = rangeValues;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedRange(rangeValues), 500);
    return () => clearTimeout(t);
  }, [rangeValues]);

  useEffect(() => {
    timeDataStore.set({ date: currentTimeMs, range: debouncedRange });
  }, [currentTimeMs, debouncedRange]);

  const handleRangeChange = useCallback((values) => {
    const [newStart, newEnd] = values;
    setRangeValues(values);
    setCurrentTimeMs((current) => Math.min(Math.max(current, newStart), newEnd));
  }, []);

  const handleCurrentTimeChange = useCallback((e) => {
    setCurrentTimeMs(Math.min(Math.max(Number(e.target.value), startTimeMs), endTimeMs));
    setIsPlaying(false);
  }, [startTimeMs, endTimeMs]);

  const handleReset = useCallback(() => {
    // NOTE: resetting to storeDate is a no-op — the store mirrors local state
    // (see effect below), so storeDate === currentTimeMs. Reset to the true
    // initial values instead, and push the range through immediately so the
    // globe + plots update without waiting out the 500ms debounce.
    setRangeValues([initialStartTime, initialEndTime]);
    setDebouncedRange([initialStartTime, initialEndTime]);
    setCurrentTimeMs(initialCurrentTime);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setCurrentTimeMs((prev) => {
        const next = prev + PLAY_SPEED;
        if (next >= endTimeMs) { setIsPlaying(false); return endTimeMs; }
        return next;
      });
    }, UPDATE_INTERVAL);
    return () => clearInterval(id);
  }, [isPlaying, endTimeMs]);

  const pct = (v) => ((v - initialStartTime) / (initialEndTime - initialStartTime)) * 100;

  return (
    <div
      className="apple-card"
      style={{ padding: 20, borderRadius: 'var(--radius-l)' }}
      role="group"
      aria-label="Control de línea de tiempo"
    >
      <div className="flex items-center justify-between flex-wrap" style={{ gap: 8, marginBottom: 12 }}>
        <h2 className="type-headline" style={{ fontSize: 15 }}>Línea de tiempo</h2>
        <span className="sf-mono type-footnote" style={{ color: 'var(--secondary-label)' }}>
          {new Date(startTimeMs).getFullYear()} — {new Date(endTimeMs).getFullYear()}
        </span>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center" style={{ gap: 16 }}>
        {/* Playback cluster — 44pt targets */}
        <div className="flex flex-col items-center justify-center" style={{ gap: 8, minWidth: 220 }}>
          <span className="sf-mono type-callout" style={{ fontWeight: 600 }} aria-live="polite">
            {formatTime(currentTimeMs)}
          </span>
          <div className="flex" style={{ gap: 8 }}>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="apple-btn"
              style={{
                minHeight: 44, fontSize: 15, padding: '0 20px',
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
              style={{ minHeight: 44, fontSize: 15 }}
              aria-label="Restablecer rango"
            >
              ↺
            </button>
          </div>
        </div>

        {/* Sliders */}
        <div className="flex-1 w-full" style={{ display: 'grid', gap: 4 }}>
          <label className="sf-mono type-caption1" style={{ color: 'var(--secondary-label)', letterSpacing: '0.06em' }}>
            RANGO DE ARCHIVO
          </label>
          <Range
            step={HOUR_IN_MS}
            min={initialStartTime}
            max={initialEndTime}
            values={rangeValues}
            onChange={handleRangeChange}
            renderTrack={({ props, children }) => {
              // IMPORTANT: react-range positions thumbs via props.style (absolute + left %).
              // We must merge — never replace — trackProps.style, and keep {children}
              // (the thumbs) as direct children of the measured track element.
              const { key, style, ...trackProps } = props;
              return (
                <div
                  key={key}
                  {...trackProps}
                  style={{
                    ...style,
                    position: 'relative',
                    height: 44, display: 'flex', alignItems: 'center', width: '100%',
                    touchAction: 'pan-y',
                  }}
                >
                  <div style={{
                    height: 6, width: '100%', borderRadius: 999,
                    background: 'var(--fill-tertiary)', position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', top: 0, bottom: 0, borderRadius: 999,
                      background: 'var(--system-blue)',
                      left: `${pct(startTimeMs)}%`, width: `${Math.max(pct(endTimeMs) - pct(startTimeMs), 0)}%`,
                    }} />
                  </div>
                  {children}
                </div>
              );
            }}
            renderThumb={({ props, index, isDragged }) => {
              // IMPORTANT: thumbProps.style carries position:absolute + left/top.
              // Merging preserves drag positioning; replacing it stacks all thumbs at 0,0.
              const { key, style, ...thumbProps } = props;
              return (
                <div
                  key={key}
                  {...thumbProps}
                  role="slider"
                  aria-label={index === 0 ? 'Inicio del rango' : 'Fin del rango'}
                  style={{
                    ...style,
                    height: 28, width: 28, borderRadius: '50%',
                    background: 'var(--grouped-card)',
                    border: '0.5px solid var(--separator)',
                    boxShadow: 'var(--shadow-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: isDragged ? 'grabbing' : 'grab',
                    // Preserve react-range's centering translate, append press scale.
                    transform: `${style?.transform ?? ''}${isDragged ? ' scale(1.15)' : ''}`,
                    transition: 'transform var(--spring-fast), box-shadow var(--spring-fast)',
                  }}
                >
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--system-blue)', pointerEvents: 'none' }} />
                </div>
              );
            }}
          />
          <label className="sf-mono type-caption1" style={{ color: 'var(--secondary-label)', letterSpacing: '0.06em' }}>
            INSTANTE ACTUAL
          </label>
          <input
            type="range"
            min={startTimeMs}
            max={endTimeMs}
            value={currentTimeMs}
            onChange={handleCurrentTimeChange}
            aria-label="Instante actual de la misión"
            style={{ width: '100%', accentColor: 'var(--system-green)', cursor: 'pointer' }}
          />
        </div>
      </div>
    </div>
  );
};

export default TimelineSlider;
