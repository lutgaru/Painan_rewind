import Globe from 'react-globe.gl';
import React from 'react';
import tierra from '../assets/8k_earth_daymap.jpg'
import * as THREE from 'three';
import { useStore } from '@nanostores/react';
import { timeDataStore } from '../scripts/timeData.ts';
import { getTLEbyDate } from '../scripts/tleManager.ts'
import { twoline2satrec, gstime, propagate, eciToGeodetic, radiansToDegrees } from 'satellite.js';

const { useState, useEffect, useRef, useMemo } = React;

const EARTH_RADIUS_KM = 6371; // km
const SAT_SIZE = 150; // km

// Orbit ring rebuild policy. Rebuilding is cheap now (geometry is updated in
// place, never destroyed), but we still avoid doing it every frame.
const ORBIT_SAMPLES = 180;          // points per revolution
const ORBIT_REBUILD_MS = 400;       // wall-clock throttle
const ORBIT_JUMP_MS = 30 * 60 * 1000; // force rebuild on big (scrub/reset) jumps

const fmtUTC = new Intl.DateTimeFormat('es-MX', {
  year: 'numeric', month: 'short', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'UTC',
});

function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!((canvas.getContext && canvas.getContext('webgl2')) || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

// One full revolution of ground-track points, centred on `centerDate`,
// sampled at uniform mission-time steps (no cumulative drift).
function buildOrbitPoints(satrec, centerDate, samples = ORBIT_SAMPLES) {
  const periodMin = satrec.no ? (2 * Math.PI) / satrec.no : 95;
  const periodMs = periodMin * 60 * 1000;
  const start = centerDate.getTime() - periodMs / 2;
  const points = [];
  for (let i = 0; i < samples; i++) {
    const t = new Date(start + (periodMs * i) / (samples - 1));
    const eci = propagate(satrec, t);
    if (!eci || !eci.position) continue;
    const gd = eciToGeodetic(eci.position, gstime(t));
    points.push([
      radiansToDegrees(gd.latitude),
      radiansToDegrees(gd.longitude),
      (gd.height / EARTH_RADIUS_KM) / 10,
    ]);
  }
  return points;
}

const World = (props) => {

  const [webglOK] = useState(() => typeof document !== 'undefined' && isWebGLAvailable());

  const $timeDataStore = useStore(timeDataStore);
  const { date: storeDate } = $timeDataStore;

  const globeEl = useRef();
  const containerRef = useRef();
  const [frameSize, setFrameSize] = useState({ width: 800, height: 600 });
  const [globeRadius, setGlobeRadius] = useState();

  const [objectsData, setObjectsData] = useState([]);
  const [orbitPaths, setOrbitPaths] = useState([]);

  // three-globe's data layer keys data by *object identity*. These datums are
  // created once and mutated in place, so the digest only ever updates the
  // existing marker/path instead of destroying and re-creating it each frame
  // (which is what caused the flicker).
  const satDatumRef = useRef({ id: null, lat: 0, lng: 0, alt: 0 });
  const orbitDatumRef = useRef({ id: null, points: [] });
  const satrecRef = useRef(null);
  const satrecIdRef = useRef(null);
  const lastOrbitWallRef = useRef(0);
  const lastOrbitMissionRef = useRef(0);

  useEffect(() => {
    const date = new Date(storeDate);

    // Resolve the TLE + satrec only when the TLE actually changes,
    // instead of re-parsing it on every frame.
    const tle = getTLEbyDate(date);
    const tleChanged = satrecIdRef.current !== tle.TLE_LINE0;
    if (tleChanged || !satrecRef.current) {
      satrecRef.current = twoline2satrec(tle.TLE_LINE1, tle.TLE_LINE2);
      satrecIdRef.current = tle.TLE_LINE0;
    }
    const satrec = satrecRef.current;
    if (!satrec) return;

    // ── Satellite position: mutate the stable datum, hand React a new array ──
    const eci = propagate(satrec, date);
    if (eci && eci.position) {
      const gd = eciToGeodetic(eci.position, gstime(date));
      const d = satDatumRef.current;
      d.id = satrecIdRef.current;
      d.lat = radiansToDegrees(gd.latitude);
      d.lng = radiansToDegrees(gd.longitude);
      d.alt = gd.height / EARTH_RADIUS_KM;
      setObjectsData([d]);

      // Follow the satellite — lat/lng only, so the user's zoom is preserved
      // (passing altitude back and forth caused micro zoom jitter).
      if (globeEl.current) {
        try { globeEl.current.pointOfView({ lat: d.lat, lng: d.lng }); } catch { /* not ready */ }
      }
    }

    // ── Orbit ring: throttle on wall-clock time or a large mission jump ──
    const missionNow = date.getTime();
    const wallNow = Date.now();
    const jumped = Math.abs(missionNow - lastOrbitMissionRef.current) > ORBIT_JUMP_MS;
    if (tleChanged || jumped || wallNow - lastOrbitWallRef.current > ORBIT_REBUILD_MS) {
      lastOrbitWallRef.current = wallNow;
      lastOrbitMissionRef.current = missionNow;

      const od = orbitDatumRef.current;
      od.id = satrecIdRef.current;
      od.points = buildOrbitPoints(satrec, date);
      setOrbitPaths([od]); // same datum, new array → geometry updated in place
    }
  }, [storeDate]);

  const satObject = useMemo(() => {
    if (!globeRadius) return undefined;

    const satGeometry = new THREE.OctahedronGeometry(SAT_SIZE * globeRadius / EARTH_RADIUS_KM / 2, 0);
    const satMaterial = new THREE.MeshLambertMaterial({ color: 'red', transparent: false, opacity: 0.7 });
    return new THREE.Mesh(satGeometry, satMaterial);
  }, [globeRadius]);

  useEffect(() => {
    // Keep the canvas fitted to its frame (defaults are viewport-sized,
    // which overflowed once the globe moved into the 70% column).
    if (!containerRef.current) return;
    const updateSize = () => {
      const rect = containerRef.current.getBoundingClientRect();
      setFrameSize((prev) => {
        const width = Math.floor(rect.width);
        const height = Math.floor(rect.height);
        return prev.width === width && prev.height === height ? prev : { width, height };
      });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Globe mounts async (client:only). Poll until the ref is ready,
    // then capture radius + set initial point of view exactly once.
    let cancelled = false;
    let attempts = 0;
    const waitForGlobe = () => {
      if (cancelled) return;
      if (globeEl.current) {
        try {
          setGlobeRadius(globeEl.current.getGlobeRadius());
          globeEl.current.pointOfView({ altitude: 3.5 });
        } catch { /* globe not ready yet */ }
        return;
      }
      if (++attempts < 60) requestAnimationFrame(waitForGlobe);
    };
    waitForGlobe();
    return () => { cancelled = true; };
  }, []);

  if (!webglOK) {
    return (
      <div style={{ width: '100%', height: '100%', minHeight: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--grouped-card)', padding: '24px', textAlign: 'center' }}>
        <div>
          <p style={{ color: 'var(--label)', fontWeight: 'bold', marginBottom: '8px' }}>Globo 3D no disponible</p>
          <p style={{ color: 'var(--secondary-label)', fontSize: '14px', maxWidth: '420px' }}>
            Este navegador tiene WebGL desactivado, así que la Tierra no puede dibujarse aquí.
            Activa la aceleración de hardware y recarga — la órbita y la telemetría funcionan sin el globo.
          </p>
        </div>
      </div>
    );
  }

  const fix = objectsData[0];
  const hud = {
    tleName: fix?.id,
    hasFix: !!fix,
    lat: fix ? fix.lat.toFixed(2) : '—',
    lng: fix ? fix.lng.toFixed(2) : '—',
    altKm: fix ? Math.round(fix.alt * EARTH_RADIUS_KM) : '—',
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
    <Globe

      ref={globeEl}
      width={frameSize.width}
      height={frameSize.height}
      globeImageUrl={tierra.src}
      objectsData={objectsData}
      objectLat="lat"
      objectLng="lng"
      objectAltitude="alt"
      objectThreeObject={satObject}
      pathsData={orbitPaths}
      pathPoints="points"
      pathPointLat={p => p[0]}
      pathPointLng={p => p[1]}
      pathPointAlt={p => p[2]}
      pathLabel={path => path.id}
      pathTransitionDuration={0}
    />

    {/* Live telemetry HUD — proves the globe is driven by real data */}
    <div className="globe-hud" aria-hidden="true">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
        <span className="globe-chip sf-mono">{fmtUTC.format(new Date(storeDate))} UTC</span>
        {hud.tleName && (
          <span className="globe-chip sf-mono" style={{ maxWidth: '58%', overflow: 'hidden', textOverflow: 'ellipsis' }} title={hud.tleName}>
            {hud.tleName}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <span className="globe-chip">{hud.hasFix ? <><b>{hud.lat}°</b><i>lat</i></> : <i>sin fix</i>}</span>
        <span className="globe-chip">{hud.hasFix ? <><b>{hud.lng}°</b><i>lon</i></> : <i>sin fix</i>}</span>
        <span className="globe-chip">{hud.hasFix ? <><b>{hud.altKm} km</b><i>alt</i></> : <i>sin fix</i>}</span>
      </div>
    </div>
    </div>
  );
};

export default World;
