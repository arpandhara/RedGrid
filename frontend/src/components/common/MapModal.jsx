
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';

// Fix for default Leaflet marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to recenter map when coords change
const RecenterAutomatically = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
};

const MapModal = ({ isOpen, onClose, location, hospitalName }) => {
    if (!isOpen) return null;

    // Default to New Delhi if no location provided (safety fallback)
    // GeoJSON is [lng, lat], Leaflet wants [lat, lng]
    const lat = location?.coordinates ? location.coordinates[1] : 28.6139;
    const lng = location?.coordinates ? location.coordinates[0] : 77.2090;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative z-10 w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
            >
                {/* HEADER */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <MapPin className="text-red-500" size={20} />
                        {hospitalName || "Hospital Location"}
                    </h3>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* MAP */}
                <div className="h-[400px] w-full bg-zinc-950 relative">
                     <MapContainer 
                        center={[lat, lng]} 
                        zoom={13} 
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={false}
                     >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[lat, lng]}>
                            <Popup>
                                <div className='font-bold text-sm'>
                                    {hospitalName}
                                </div>
                            </Popup>
                        </Marker>
                        <RecenterAutomatically lat={lat} lng={lng} />
                     </MapContainer>

                     {/* EXTERNAL LINK OVERLAY */}
                     <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute bottom-4 right-4 z-[500] bg-white text-black text-xs font-bold px-4 py-2 rounded-full shadow-lg hover:bg-zinc-200 transition-colors flex items-center gap-2"
                     >
                        Open in Google Maps <ArrowUpRight size={12} />
                     </a>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

// Simple Arrow Component for the button
const ArrowUpRight = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 17L17 7" /><path d="M7 7h10v10" />
    </svg>
);

export default MapModal;
