import React, { useState, useMemo, useEffect } from 'react';

// --- Funciones de Utilidad ---

// Convierte milisegundos Unix a una cadena de tiempo legible (ej: 01/01/2020 10:30:45)
const formatTime = (ms) => {
  const date = new Date(ms);
  // Opciones de formato, adaptadas a un rango de años
  const options = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false, // Usar formato 24 horas
  };
  return date.toLocaleString('es-ES', options);
};

// --- Componente Principal ---

const TimelineSlider = () => {
  // 1. Definición del Rango Base de Tiempo (2020-2022)
  const initialStartTime = useMemo(() => new Date('2020-01-01T00:00:00Z').getTime(), []);
  const initialEndTime = useMemo(() => new Date('2022-12-31T23:59:59Z').getTime(), []);
  // Establecer el tiempo actual al inicio de 2021 (para un punto intermedio)
  const initialCurrentTime = useMemo(() => new Date('2021-01-01T12:00:00Z').getTime(), []);

  // 2. Estados para los Sliders
  const [startTimeMs, setStartTimeMs] = useState(initialStartTime);
  const [endTimeMs, setEndTimeMs] = useState(initialEndTime);
  const [currentTimeMs, setCurrentTimeMs] = useState(initialCurrentTime);
  const [isPlaying, setIsPlaying] = useState(false);

  // 3. Efecto para la Reproducción Automática (Simulación)
  useEffect(() => {
    let intervalId;
    const speedFactor = 50000; // Incremento rápido para simular paso de tiempo en un rango de años (ej: 50,000 milisegundos por tic)

    if (isPlaying) {
      intervalId = setInterval(() => {
        setCurrentTimeMs(prevTime => {
          const newTime = prevTime + speedFactor; 
          
          // Detiene la reproducción si el tiempo actual excede el tiempo final
          if (newTime >= endTimeMs) {
            setIsPlaying(false);
            return endTimeMs;
          }
          return newTime;
        });
      }, 100); // 100ms de intervalo para un movimiento fluido

    }

    return () => clearInterval(intervalId);
  }, [isPlaying, endTimeMs]);


  // 4. Lógica de Manejo de Cambios
  const handleTimeChange = (e, setter) => {
    const value = Number(e.target.value);
    setter(value);
  };
  
  // Función para prevenir que el tiempo actual salga del rango
  const handleCurrentTimeChange = (e) => {
    const newTime = Number(e.target.value);
    // Asegurarse de que CurrentTime esté siempre entre StartTime y EndTime
    const clampedTime = Math.max(startTimeMs, Math.min(endTimeMs, newTime));
    setCurrentTimeMs(clampedTime);
    
    // Detener la reproducción si el usuario ajusta manualmente el slider
    if (isPlaying) {
        setIsPlaying(false);
    }
  };

  // El rango del slider de tiempo actual SIEMPRE es el que definen StartTime y EndTime
  const currentTimeSliderMin = startTimeMs;
  const currentTimeSliderMax = endTimeMs;

  // 5. Renderizado del Componente Regleta Horizontal
  return (
    <div className="p-4 bg-gray-900 text-white shadow-2xl w-full fixed bottom-0 left-0 z-50">
      <h1 className="text-xl font-bold mb-3 text-center text-blue-300">
        Regleta de Tiempo (2020 - 2022)
      </h1>

      <div className="flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-6">
        
        {/* Controles de Reproducción y Display de Current Time */}
        <div className="flex flex-col items-center justify-center w-full md:w-1/4 min-w-[250px] space-y-2">
            
            <span className="text-base font-mono font-semibold text-green-400">
                {formatTime(currentTimeMs)}
            </span>

            <div className="flex space-x-3">
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`px-4 py-1 rounded-full text-sm font-bold transition duration-300 shadow-md ${
                        isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                    }`}
                >
                    {isPlaying ? '⏸ Pausar' : '▶ Reproducir'}
                </button>
                <button
                    onClick={() => setCurrentTimeMs(initialCurrentTime)}
                    className="px-4 py-1 rounded-full text-sm bg-gray-600 text-white font-bold hover:bg-gray-500 transition duration-300 shadow-md"
                >
                    🔄 2021
                </button>
            </div>
        </div>


        {/* Sección de Sliders de Rango y Actual */}
        <div className="flex-1 w-full space-y-4">
            
            {/* 1. Slider de RANGO COMPLETO (Start/End Time) */}
            <div className="relative h-4 mt-2">
                <label className="absolute -top-6 left-0 text-sm font-medium text-blue-400">
                  Inicio: {formatTime(startTimeMs)}
                </label>
                <label className="absolute -top-6 right-0 text-sm font-medium text-blue-400">
                  Fin: {formatTime(endTimeMs)}
                </label>

                {/* Slider de Start Time */}
                <input
                  type="range"
                  min={initialStartTime}
                  max={endTimeMs} // El inicio no puede superar el final
                  value={startTimeMs}
                  onChange={(e) => handleTimeChange(e, setStartTimeMs)}
                  className="absolute w-full h-4 bg-transparent appearance-none cursor-pointer z-10 opacity-70"
                  style={{ top: '0', left: '0' }}
                />

                {/* Slider de End Time */}
                <input
                  type="range"
                  min={startTimeMs} // El final no puede ser inferior al inicio
                  max={initialEndTime} 
                  value={endTimeMs}
                  onChange={(e) => handleTimeChange(e, setEndTimeMs)}
                  className="absolute w-full h-4 bg-transparent appearance-none cursor-pointer z-10 opacity-70"
                  style={{ top: '0', left: '0' }}
                />

                {/* Barra de Fondo Visual del Rango (2020-2022) */}
                <div className="absolute top-1 w-full h-2 bg-gray-700 rounded-lg"></div>

                {/* Barra de Rango Seleccionado */}
                <div 
                    className="absolute top-1 h-2 bg-blue-500 rounded-lg"
                    style={{
                        left: `${((startTimeMs - initialStartTime) / (initialEndTime - initialStartTime)) * 100}%`,
                        width: `${((endTimeMs - startTimeMs) / (initialEndTime - initialStartTime)) * 100}%`
                    }}
                ></div>
            </div>

            {/* 2. Slider de TIEMPO ACTUAL (Current Time) */}
            <div className="relative h-6 pt-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Tiempo Actual
                </label>
                <input
                  type="range"
                  min={currentTimeSliderMin}
                  max={currentTimeSliderMax}
                  value={currentTimeMs}
                  onChange={handleCurrentTimeChange}
                  className="w-full h-3 bg-green-500 rounded-lg appearance-none cursor-pointer range-thumb-green"
                  style={{
                    // Aplicar el estilo de pulgar personalizado
                    '--tw-range-thumb-color': '#10B981', // green-500
                    '--tw-range-thumb-shadow': '0 0 0 4px #4AD498', // Anillo
                  }}
                />
            </div>
        </div>
      </div>
      
      {/* Espacio de relleno para que la regleta inferior no oculte el contenido superior */}
      <div className="h-4"></div> 
    </div>
  );
};

export default TimelineSlider;
