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

    // Slower update for orbit path
    const now = time.getTime();
    if (now - lastOrbitUpdate.current > 1000) { // Update every 1 second
      lastOrbitUpdate.current = now;

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
    if (!globeEl.current) return;
    setGlobeRadius(globeEl.current.getGlobeRadius());
    globeEl.current.pointOfView({ altitude: 3.5 });
  }, []);

  useEffect(() => {
    if (globeEl.current && satPosition) {
      const { lat, lng } = satPosition;
      const pov = globeEl.current.pointOfView();
      // Center view on satellite
      globeEl.current.pointOfView({
        lat,
        lng,
        altitude: pov.altitude
      });
    }
  }, [satPosition]);



  if (!webglOK) {
    return (
      <div style={{ width: '100%', height: '100%', minHeight: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050810', padding: '24px', textAlign: 'center' }}>
        <div>
          <p style={{ color: '#93c5fd', fontWeight: 'bold', marginBottom: '8px' }}>3D globe unavailable</p>
          <p style={{ color: '#9ca3af', fontSize: '14px', maxWidth: '420px' }}>
            This browser has WebGL disabled, so the Earth cannot render here.
            Enable hardware acceleration in your browser settings and reload — the orbit data and telemetry below work without it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
    <Globe

      ref={globeEl}
      width={frameSize.width}
      height={frameSize.height}
      globeImageUrl={tierra.src}
      objectsData={objectsData}
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
    </div>
  );
};

export default World;