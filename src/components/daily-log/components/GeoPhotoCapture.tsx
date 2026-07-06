import React, { useRef, useState, useCallback } from 'react';
import { Camera, MapPin, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GeoPhotoCaptureProps {
  onCapture: (file: File, location: { lat: number; lng: number } | null) => void;
}

export function GeoPhotoCapture({ onCapture }: GeoPhotoCaptureProps) {
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCaptureClick = () => {
    // Open file picker with camera intent on mobile
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoDataUrl(e.target?.result as string);
      getLocationAndFinalize(file);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const getLocationAndFinalize = (file: File) => {
    setIsLocating(true);
    setError(null);
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(loc);
          setIsLocating(false);
          onCapture(file, loc);
        },
        (err) => {
          console.warn('Geolocation error:', err);
          // Fallback to mock location if permission denied/unavailable for demo
          const mockLoc = { lat: 37.7749, lng: -122.4194 };
          setLocation(mockLoc);
          setIsLocating(false);
          onCapture(file, mockLoc);
          setError('Could not get actual location. Using fallback location.');
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      const mockLoc = { lat: 37.7749, lng: -122.4194 };
      setLocation(mockLoc);
      setIsLocating(false);
      onCapture(file, mockLoc);
      setError('Geolocation not supported by browser.');
    }
  };

  const resetCapture = () => {
    setPhotoDataUrl(null);
    setLocation(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Note: In real app, we'd signal to parent to clear the capture
    onCapture(new File([], "reset"), null); 
  };

  return (
    <div className="w-full">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      
      <AnimatePresence mode="wait">
        {!photoDataUrl ? (
          <motion.div
            key="capture-btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full aspect-video sm:aspect-[21/9] bg-gray-50 dark:bg-[#111] border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
            onClick={handleCaptureClick}
          >
            <div className="w-14 h-14 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-500 dark:text-gray-400">
              <Camera className="w-7 h-7" />
            </div>
            <p className="font-medium text-gray-900 dark:text-white text-center">Capture Site Photo</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
              Required for your daily log
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-black shadow-sm"
          >
            <img 
              src={photoDataUrl} 
              alt="Site Capture" 
              className="w-full aspect-video sm:aspect-[21/9] object-cover opacity-80"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isLocating ? (
                    <div className="flex items-center gap-2 text-white bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Locating...
                    </div>
                  ) : location ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-emerald-400 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm font-medium">
                        <MapPin className="w-4 h-4" />
                        Geo-tagged
                      </div>
                      <div className="text-[10px] text-gray-300 font-mono bg-black/50 backdrop-blur-md px-2 py-1 rounded-md inline-block self-start">
                        {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                      </div>
                    </div>
                  ) : null}
                </div>
                
                <button
                  type="button"
                  onClick={resetCapture}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white p-2 rounded-full transition-colors"
                  title="Retake Photo"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              
              {error && (
                <div className="mt-2 flex items-center gap-1.5 text-amber-400 text-xs bg-black/50 backdrop-blur-md px-2 py-1.5 rounded-lg">
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
