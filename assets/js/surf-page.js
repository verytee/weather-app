// 🌊 Beach list
const beaches = [
  { name: "Fistral Beach", lat: 50.41588, lon: -5.10135 },
  { name: "Watergate Bay", lat: 50.427, lon: -5.066 },
  { name: "Perranporth Beach", lat: 50.3445, lon: -5.1544 },
  { name: "Polzeath Beach", lat: 50.5736, lon: -4.92 },
  { name: "Porthtowan Beach", lat: 50.280, lon: -5.254 },
  { name: "Porthmeor Beach, St Ives", lat: 50.1785, lon: -5.5986 },
  { name: "Sennen Beach", lat: 50.076, lon: -5.707 },
  { name: "Porthlevan", lat: 50.086, lon: -5.313 },
  { name: "Godrevy Beach & Gwithian Towans", lat: 50.226, lon: -5.386 },
  { name: "Crooklets, Bude", lat: 50.8306, lon: -4.5451 },
];

// Haversine formula for distance in km
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Get user location (with fallback)
function getPosition() {
  return new Promise((resolve) => {
    const fallback = { lat: 50.059, lon: -5.65393};
    if (!navigator.geolocation) {
      resolve(fallback);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(fallback),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  });
}


// Find nearest 3 beaches
function findNearestBeaches(userLat, userLon) {
  return beaches
    .map(beach => ({
      ...beach,
      distance: haversine(userLat, userLon, beach.lat, beach.lon)
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);
}

// Fetch surf data from Stormglass
async function getSurfData(lat, lon) {
  const apiKey = "faa183f4-ea4a-11f0-a148-0242ac130003-faa184bc-ea4a-11f0-a148-0242ac130003"; 
  const params = "waveHeight,swellHeight,windSpeed";
  const url = `https://api.stormglass.io/v2/weather/point?lat=${lat}&lng=${lon}&params=${params}`;

  try {
    const res = await fetch(url, { headers: { "Authorization": apiKey } });
    if (!res.ok) throw new Error("API request failed");

    const json = await res.json();
    const hours = json.hours || [];
    if (!hours.length) return { waveHeight: "N/A", swellHeight: "N/A", windSpeed: "N/A" };

    const now = hours[0];
    const getValue = (param) => {
      if (!param) return "N/A";
      const sources = Object.values(param);
      return sources.length ? sources[0] : "N/A";
    };

    return {
      waveHeight: getValue(now.waveHeight),
      swellHeight: getValue(now.swellHeight),
      windSpeed: getValue(now.windSpeed)
    };
  } catch (err) {
    return { waveHeight: "N/A", swellHeight: "N/A", windSpeed: "N/A" };
  }
}

// Open new page with list of nearest beaches
async function openBeachesPage(lat, lon) {
  const nearest = findNearestBeaches(lat, lon);

  // Fetch surf data for all beaches in parallel
  const surfDataPromises = nearest.map(b => getSurfData(b.lat, b.lon));
  const surfResults = await Promise.all(surfDataPromises);

  // Build HTML
  let html = `
    <html>
    <head>
      <title>Nearest Beaches</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        li { margin-bottom: 15px; }
      </style>
    </head>
    <body>
      <h2>3 Nearest Beaches with Live Surf</h2>
      <ul>
  `;

  nearest.forEach((beach, i) => {
    const surf = surfResults[i];
    html += `
      <li>
        <strong>${beach.name}</strong> – ${beach.distance.toFixed(2)} km<br>
        🌊 Wave height: ${surf.waveHeight} m<br>
        📈 Swell height: ${surf.swellHeight} m<br>
        💨 Wind speed: ${surf.windSpeed} m/s
      </li>
    `;
  });

  html += `
      </ul>
    </body>
    </html>
  `;

  const newWin = window.open("", "_blank");
  newWin.document.write(html);
  newWin.document.close();
}

// Attach button click after DOM loads
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("locBtn");
  if (btn) {
    btn.onclick = async () => {
      const { lat, lon } = await getPosition();
      openBeachesPage(lat, lon);
    };
  }
});