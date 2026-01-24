import React, { useState, useEffect, useCallback } from 'react';
import { Range } from 'react-range';
import { useStore } from '@nanostores/react';
import { timeDataStore, initialStartTime, initialEndTime} from '../scripts/timeData.ts';

// Utility Functions
const formatTime = (ms) => {
  const date = new Date(ms);
  const options = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };
  return date.toLocaleString('en-US', options);
};

const snapToStep = (value, step, min) =>
  Math.round((value - min) / step) * step + min;

const HOUR_IN_MS = 1000 * 60 * 60;
const PLAY_SPEED = 50000; // Speed factor for playback
const UPDATE_INTERVAL = 10; // Update interval in ms

const TimelineSlider = () => {
  // Get store data
  const { range: [storeStartTime, storeEndTime], date: storeDate } = useStore(timeDataStore);

  // Local state
  const [rangeValues, setRangeValues] = useState([storeStartTime, storeEndTime]);
  const [debouncedRange, setDebouncedRange] = useState(rangeValues);
  const [currentTimeMs, setCurrentTimeMs] = useState(storeDate);
  const [isPlaying, setIsPlaying] = useState(false);

  // Derived values
  const [startTimeMs, endTimeMs] = rangeValues;

  // Debounce range updates to avoid overloading store listeners
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedRange(rangeValues);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [rangeValues]);

  // Update global store when local state changes
  useEffect(() => {
    timeDataStore.set({
      date: currentTimeMs,
      range: debouncedRange,
    });
  }, [currentTimeMs, debouncedRange]);

  // Handlers
  const handleRangeChange = useCallback((values) => {
    const [newStart, newEnd] = values;
    setRangeValues(values);
    // Adjust current time if outside new range
    setCurrentTimeMs(current =>
      Math.min(Math.max(current, newStart), newEnd)
    );
  }, []);

  const handleCurrentTimeChange = useCallback((e) => {
    const newTime = Number(e.target.value);
    setCurrentTimeMs(Math.min(Math.max(newTime, startTimeMs), endTimeMs));
    setIsPlaying(false);
  }, [startTimeMs, endTimeMs]);

  const handleReset = useCallback(() => {
    setRangeValues([initialStartTime, initialEndTime]);
    setCurrentTimeMs(storeDate);
    setIsPlaying(false);
  }, [storeStartTime, storeEndTime, storeDate]);

  // Playback effect
  useEffect(() => {
    if (!isPlaying) return;

    const intervalId = setInterval(() => {
      setCurrentTimeMs(prevTime => {
        const newTime = prevTime + PLAY_SPEED;
        if (newTime >= endTimeMs) {
          setIsPlaying(false);
          return endTimeMs;
        }
        return newTime;
      });
    }, UPDATE_INTERVAL);

    return () => clearInterval(intervalId);
  }, [isPlaying, endTimeMs]);

  return (
    <div className="p-4 bg-gray-900 text-white shadow-2xl w-full fixed bottom-0 left-0 z-50">
      <h1 className="text-xl font-bold mb-3 text-center text-blue-300">
        Timeline Control
      </h1>

      <div className="flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-6">
        {/* Playback Controls */}
        <div className="flex flex-col items-center justify-center w-full md:w-1/4 min-w-[250px] space-y-2">
          <span className="text-base font-mono font-semibold text-green-400">
            {formatTime(currentTimeMs)}
          </span>

          <div className="flex space-x-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-4 py-1 rounded-full text-sm font-bold transition duration-300 shadow-md 
                ${isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-1 rounded-full text-sm bg-gray-600 text-white font-bold hover:bg-gray-500 transition duration-300 shadow-md"
            >
              🔄 Reset
            </button>
          </div>
        </div>

        {/* Sliders */}
        <div className="flex-1 w-full space-y-4">
          <Range
            step={HOUR_IN_MS}
            min={initialStartTime}
            max={initialEndTime}
            values={rangeValues}
            onChange={handleRangeChange}
            renderTrack={({ props, children }) => {
              const { key, ...trackProps } = props;
              return (
                <div
                  key={key}
                  {...trackProps}
                  className="h-2 w-full bg-gray-700 rounded-full relative"
                >
                  <div
                    className="absolute h-2 bg-blue-500 rounded-full"
                    style={{
                      left: `${((startTimeMs - initialStartTime) / (initialEndTime - initialStartTime)) * 100}%`,
                      width: `${((endTimeMs - startTimeMs) / (initialEndTime - initialStartTime)) * 100}%`,
                    }}
                  />
                  {children}
                </div>
              );
            }}
            renderThumb={({ props }) => {
              const { key, ...thumbProps } = props;
              return (
                <div
                  key={key}
                  {...thumbProps}
                  className="h-5 w-5 bg-white border-2 border-blue-500 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              );
            }}
          />

          <input
            type="range"
            min={startTimeMs}
            max={endTimeMs}
            value={currentTimeMs}
            onChange={handleCurrentTimeChange}
            className="w-full h-3 bg-green-500 rounded-lg appearance-none cursor-pointer range-thumb-green"
          />
        </div>
      </div>
    </div>
  );
};

export default TimelineSlider;