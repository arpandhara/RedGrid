
const test = async () => {
    try {
        const address = "Marine Drive, Mumbai";
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
        
        console.log(`Fetching: ${url}`);
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'BloodDonationApp/1.0' // Required by OSM
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        console.log("OSM Fetch Result:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Fetch Error:", e);
    }
};

test();
