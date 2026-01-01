
import fetch from 'node-fetch';

/**
 * Geocodes an address or query string using Nominatim.
 * @param {string} query - The address to geocode.
 * @returns {Promise<Array<number>|null>} - Returns [lon, lat] or null if failed.
 */
export const geocodeAddress = async (query) => {
    if (!query || query.length < 3) return null;

    try {
        console.log(`Attempting to geocode: "${query}"`);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;

        // Nominatim requires a User-Agent
        const res = await fetch(url, { headers: { 'User-Agent': 'BloodDonationApp/1.0' } });

        if (!res.ok) {
            console.error(`Geocoding HTTP Error: ${res.status}`);
            return null;
        }

        const results = await res.json();

        if (results && results.length > 0) {
            const { lat, lon } = results[0];
            if (lat && lon) {
                console.log(`Geocoded "${query}" to [${lon}, ${lat}]`);
                return [parseFloat(lon), parseFloat(lat)];
            }
        }

        console.log(`Geocoder returned 0 results for: "${query}"`);
        return null;

    } catch (error) {
        console.error("Geocoding service failed:", error.message);
        return null;
    }
};
