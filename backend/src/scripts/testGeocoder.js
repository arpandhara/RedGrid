
import NodeGeocoder from 'node-geocoder';

const test = async () => {
    console.log("Testing ArcGIS...");
    const geocoder = NodeGeocoder({
        provider: 'arcgis'
    });

    try {
        const fullAddress = "Marine Drive, Mumbai";
        console.log(`Attempting to geocode: "${fullAddress}"`);
        const results = await geocoder.geocode(fullAddress);
        console.log("Geocoder Results:", JSON.stringify(results, null, 2));
    } catch (e) {
        console.error("ArcGIS Error:", e);
    }
};

test();
