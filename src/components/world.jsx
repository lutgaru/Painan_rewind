import Globe from 'react-globe.gl';
import React, { use } from 'react';
import tierra from '../assets/8k_earth_daymap.jpg'
import * as THREE from 'three';
import { useStore } from '@nanostores/react';
import { timeDataStore } from '../scripts/timeData.ts';
import { getTLEbyDate } from '../scripts/tleManager.ts'
import { twoline2satrec, gstime, propagate, eciToGeodetic, radiansToDegrees } from 'satellite.js';

// var THREE=require('three')



const { useState, useEffect, useRef, useMemo } = React;

const EARTH_RADIUS_KM = 6371; // km
const SAT_SIZE = 150; // km
//const TIME_STEP = 1; // per frame

const fmtUTC = new Intl.DateTimeFormat('es-MX', {
  year: 'numeric', month: 'short', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'UTC',
});

function julianToDate(jd) {
  const Z = Math.floor(jd + 0.5);
  const F = jd + 0.5 - Z;
  let A = Z;
  if (Z >= 2299161) {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A += 1 + alpha - Math.floor(alpha / 4);
  }
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);

  const day = B - D - Math.floor(30.6001 * E) + F;
  let month = E < 14 ? E - 1 : E - 13;
  let year = month > 2 ? C - 4716 : C - 4715;

  const dayInt = Math.floor(day);
  const dayFrac = day - dayInt;
  const hours = Math.floor(dayFrac * 24);
  const minutes = Math.floor((dayFrac * 24 - hours) * 60);
  const seconds = Math.floor((((dayFrac * 24 - hours) * 60) - minutes) * 60);

  return new Date(Date.UTC(year, month - 1, dayInt, hours, minutes, seconds));
}

function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!((canvas.getContext && canvas.getContext('webgl2')) || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

const World = (props) => {

  const [webglOK] = useState(() => typeof document !== 'undefined' && isWebGLAvailable());

  const $timeDataStore = useStore(timeDataStore);
  const { date: storeDate } = $timeDataStore;

  const globeEl = useRef();
  const containerRef = useRef();
  const [frameSize, setFrameSize] = useState({ width: 800, height: 600 });
  const [satData, setSatData] = useState();
  const [orbitPaths, setOrbitPaths] = useState([]);
  const [globeRadius, setGlobeRadius] = useState();
  const [time, setTime] = useState(new Date(storeDate));
  const [satPosition, setSatPosition] = useState(null);
  const lastOrbitUpdate = useRef(0);
  const lastOrbitMission = useRef(0);


  useEffect(() => {
    // This effect detects changes from the timeDataStore and updates the local time state.
    setTime(new Date(storeDate));
    const tle = getTLEbyDate(new Date(storeDate));
    // Create satrec object
    const satrec = twoline2satrec(tle.TLE_LINE1, tle.TLE_LINE2);

    // Create satellite data object with ID
    const satDataObj = {
      satrec: satrec,
      id: tle.TLE_LINE0
    };

    // Set as array since objectsData expects array
    if(      !satData || satData[0].id !== satDataObj.id    )
      {
    setSatData([satDataObj]);
    console.log('TLE used for simulation:', tle.TLE_LINE0, tle.TLE_LINE1, tle.TLE_LINE2);
    }
  }, [storeDate]);

  useEffect(() => {
    if (!satData) return;

    // Fast update for satellite position
    const gmst = gstime(time);
    const eci = propagate(satData[0].satrec, time);
    if (eci.position) {
      const gdPos = eciToGeodetic(eci.position, gmst);
      setSatPosition({
        lat: radiansToDegrees(gdPos.latitude),
        lng: radiansToDegrees(gdPos.longitude),
        alt: gdPos.height / EARTH_RADIUS_KM
      });
    }

    // Slower update for orbit path — throttled on WALL-CLOCK time, not mission
    // time. Mission time can jump backwards (reset / scrub), which made
    // `missionNow - last` hugely negative and froze the orbit forever while
    // the sat marker kept moving → desync. A large mission jump forces an
    // immediate recompute so reset re-syncs instantly.
    const missionNow = time.getTime();
    const wallNow = Date.now();
    const missionJumped = Math.abs(missionNow - lastOrbitMission.current) > 60 * 1000;
    if (wallNow - lastOrbitUpdate.current > 1000 || missionJumped) { // Update at most 1/sec, or immediately on jump
      lastOrbitUpdate.current = wallNow;
      lastOrbitMission.current = missionNow;

      let OrbitPaths = []
      let tiempo = new Date(time.getTime() - 30 * 60 * 1000)
      let propi = {
        "id": satData[0].id,
      }
      let points = []
      for (let x = 0; x < 150; x++) {
        let eci = propagate(satData[0].satrec, tiempo);
        let gmst = gstime(tiempo);
        let gdPos = eciToGeodetic(eci.position, gmst);
        tiempo = new Date(tiempo.getTime() + (x * 600))
        points.push([
          radiansToDegrees(gdPos.latitude),
          radiansToDegrees(gdPos.longitude),
          (gdPos.height / EARTH_RADIUS_KM) / 10])
      }
      OrbitPaths.push({ points, propi })
      setOrbitPaths(OrbitPaths);
    }

  }, [satData, time]);

  const objectsData = useMemo(() => {
    if (!satPosition || !satData) return [];
    return [{ ...satData[0], ...satPosition }];
  }, [satPosition, satData]);


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

  useEffect(() => {
    if (!globeEl.current || !satPosition) return;
    try {
      const { lat, lng } = satPosition;
      const pov = globeEl.current.pointOfView();
      // Center view on satellite (orbit + camera follow the sat)
      globeEl.current.pointOfView({
        lat,
        lng,
        altitude: pov.altitude
      });
    } catch { /* globe transitioning — skip this frame */ }
  }, [satPosition]);



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

  const hud = {
    tleName: satData?.[0]?.id,
    hasFix: !!satPosition,
    lat: satPosition ? satPosition.lat.toFixed(2) : '—',
    lng: satPosition ? satPosition.lng.toFixed(2) : '—',
    altKm: satPosition ? Math.round(satPosition.alt * EARTH_RADIUS_KM) : '—',
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
      objectAlt="alt"
      objectThreeObject={satObject}
      pathsData={orbitPaths}
      pathPoints="points"
      pathPointLat={p => p[0]}
      pathPointLng={p => p[1]}
      pathPointAlt={p => p[2]}
      pathLabel={path => path.propi.id}
      //pathDashLength={1}
      //pathDashGap={0.008}
      pathTransitionDuration={0}
    //   arcColor={'color'}
    //   arcDashLength={() => Math.random()}
    //   arcDashGap={() => Math.random()}
    // arcDashAnimateTime={() => Math.random() * 4000 + 500}
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