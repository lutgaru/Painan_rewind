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

const World = (props) => {

  const $timeDataStore = useStore(timeDataStore);
  const { date: storeDate } = $timeDataStore;

  const globeEl = useRef();
  const [satData, setSatData] = useState();
  const [orbitPaths, setOrbitPaths] = useState([]);
  const [globeRadius, setGlobeRadius] = useState();
  const [time, setTime] = useState(new Date(storeDate));

  useEffect(() => {
    // This effect detects changes from the timeDataStore and updates the local time state.
    setTime(new Date(storeDate));
    const tle = getTLEbyDate(new Date(storeDate));
    console.log('Selected TLE for date', new Date(storeDate), ':', tle.TLE_LINE0, tle.TLE_LINE1, tle.TLE_LINE2);
    // Create satrec object
    const satrec = twoline2satrec(tle.TLE_LINE1, tle.TLE_LINE2);

    // Create satellite data object with ID
    const satDataObj = {
      satrec: satrec,
      id: tle.TLE_LINE0
    };

    // Set as array since objectsData expects array
    setSatData([satDataObj]);
  }, [storeDate]);


  const objectsData = useMemo(() => {
    if (!satData) return [];

    // Update satellite positions
    const gmst = gstime(time);
    return satData.map(d => {
      const eci = propagate(d.satrec, time);
      if (eci.position) {
        const gdPos = eciToGeodetic(eci.position, gmst);
        const lat = radiansToDegrees(gdPos.latitude);
        const lng = radiansToDegrees(gdPos.longitude);
        const alt = gdPos.height / EARTH_RADIUS_KM;
        //console.log(alt)

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
        //console.log(points)
        OrbitPaths.push({ points, propi })
        //console.log(OrbitPaths)

        setOrbitPaths(OrbitPaths)

        return { ...d, lat, lng, alt };
      }
      return d;
    });
  }, [satData, time]);

  const satObject = useMemo(() => {
    if (!globeRadius) return undefined;

    const satGeometry = new THREE.OctahedronGeometry(SAT_SIZE * globeRadius / EARTH_RADIUS_KM / 2, 0);
    const satMaterial = new THREE.MeshLambertMaterial({ color: 'red', transparent: false, opacity: 0.7 });
    return new THREE.Mesh(satGeometry, satMaterial);
  }, [globeRadius]);

  useEffect(() => {
    setGlobeRadius(globeEl.current.getGlobeRadius());
    globeEl.current.pointOfView({ altitude: 3.5 });
  }, []);



  return (
    <Globe

      ref={globeEl}
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
  );
};

export default World;