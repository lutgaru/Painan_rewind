import React, { useState, useMemo, useEffect } from 'react';
import { Range } from 'react-range';

// --- Utility Functions ---
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

const TimelineSlider = () => {
  // 1. Base Time Range Definition (2023-2025)
  const initialStartTime = useMemo(() => new Date('2023-01-01T00:00:00Z').getTime(), []);
  const initialEndTime = useMemo(() => new Date('2025-12-31T23:59:59Z').getTime(), []);
  const initialCurrentTime = useMemo(() => new Date('2024-01-01T12:00:00Z').getTime(), []);

  // 2. States for Sliders
  const [rangeValues, setRangeValues] = useState([initialStartTime, initialEndTime]);
  const [currentTimeMs, setCurrentTimeMs] = useState(initialCurrentTime);
  const [isPlaying, setIsPlaying] = useState(false);

  const startTimeMs = rangeValues[0];
  const endTimeMs = rangeValues[1];

  // 3. Effect for Auto-Play
  useEffect(() => {
    let intervalId;
    const speedFactor = 50000;

    if (isPlaying) {
      intervalId = setInterval(() => {
        setCurrentTimeMs(prevTime => {
          const newTime = prevTime + speedFactor;
          if (newTime >= endTimeMs) {
            setIsPlaying(false);
            return endTimeMs;
          }
          return newTime;
        });
      }, 100);
    }

    return () => clearInterval(intervalId);
  }, [isPlaying, endTimeMs]);

  // 4. Change Handlers
  const handleRangeChange = (values) => {
    setRangeValues(values);
    const [newStart, newEnd] = values;
    if (currentTimeMs < newStart) setCurrentTimeMs(newStart);
    if (currentTimeMs > newEnd) setCurrentTimeMs(newEnd);
  };

  const handleCurrentTimeChange = (e) => {
    const newTime = Number(e.target.value);
    const clamped = Math.max(startTimeMs, Math.min(endTimeMs, newTime));
    setCurrentTimeMs(clamped);
    if (isPlaying) setIsPlaying(false);
  };

  return (
    <div className="p-4 bg-gray-900 text-white shadow-2xl w-full fixed bottom-0 left-0 z-50">
      <h1 className="text-xl font-bold mb-3 text-center text-blue-300">
        Timeline Slider (2023 - 2025)
      </h1>

      <div className="flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-6">
        {/* Playback Controls and Current Time Display */}
        <div className="flex flex-col items-center justify-center w-full md:w-1/4 min-w-[250px] space-y-2">
          <span className="text-base font-mono font-semibold text-green-400">
            {formatTime(currentTimeMs)}
          </span>

          <div className="flex space-x-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-4 py-1 rounded-full text-sm font-bold transition duration-300 shadow-md ${
                isPlaying
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
            <button
              onClick={() => {
                setCurrentTimeMs(initialCurrentTime);
                setRangeValues([initialStartTime, initialEndTime]);
              }}
              className="px-4 py-1 rounded-full text-sm bg-gray-600 text-white font-bold hover:bg-gray-500 transition duration-300 shadow-md"
            >
              🔄 Reset
            </button>
          </div>
        </div>

        {/* Range and Current Sliders Section */}
        <div className="flex-1 w-full space-y-4">
          {/* --- Double Range Slider (react-range) --- */}
          <div className="relative w-full py-2">
            <label className="absolute -top-6 left-0 text-sm font-medium text-blue-400">
              Start: {formatTime(startTimeMs)}
            </label>
            <label className="absolute -top-6 right-0 text-sm font-medium text-blue-400">
              End: {formatTime(endTimeMs)}
            </label>

            <Range
              step={1000 * 60 * 60 * 24} // 1 día
              min={initialStartTime}
              max={initialEndTime}
              values={rangeValues}
              onChange={handleRangeChange}
              renderTrack={({ props, children }) => (
                <div
                  {...props}
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
              )}
              renderThumb={({ props }) => (
                <div
                  {...props}
                  className="h-5 w-5 bg-white border-2 border-blue-500 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              )}
            />
          </div>

          {/* Current Time Slider */}
          <div className="relative h-6 pt-2">
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Current Time
            </label>
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

      <div className="h-4"></div>
    </div>
  );
};

export default TimelineSlider;
