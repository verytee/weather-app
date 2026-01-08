// 🌍 List of 10 beaches
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

// 📐 Haversine formula
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
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

// 📍 Get location (with fallback)
function getPosition() {
  return new Promise((resolve) => {
    const fallback = { lat: 50.059, lon: -5.65393};

    if (!navigator.geolocation) {
      resolve(fallback);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude
      }),
      () => resolve(fallback),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  });
}

// 🔎 Find nearest beaches
function findNearestBeaches(userLat, userLon) {
  return beaches
    .map(beach => ({
      name: beach.name,
      distance: haversine(userLat, userLon, beach.lat, beach.lon)
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);
}

// 🌊 Fetch surf data from Stormglass
async function getSurfData(lat, lon) {
  const apiKey = "faa183f4-ea4a-11f0-a148-0242ac130003-faa184bc-ea4a-11f0-a148-0242ac130003"; 
  const params = "waveHeight,swellHeight,windSpeed";
  const url = `https://api.stormglass.io/v2/weather/point?lat=${lat}&lng=${lon}&params=${params}`;

  try {
    const res = await fetch(url, {
      headers: { "Authorization": apiKey }
    });
    if (!res.ok) throw new Error("API request failed");

    const json = await res.json();
    const hours = json.hours || [];
    if (hours.length === 0) return { waveHeight: "N/A", swellHeight: "N/A", windSpeed: "N/A" };

    const now = hours[0];

 // Helper to get first available source
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

// 🖱 Button click
document.getElementById("locBtn").onclick = async () => {
  const output = document.getElementById("output");
  output.innerHTML = "Finding nearest beaches...";

  const { lat, lon } = await getPosition();
  const nearest = findNearestBeaches(lat, lon);

  let html = "<h3>Nearest beaches with live surf</h3><ul>";

  for (const beach of nearest) {
    const surf = await getSurfData(beach.lat, beach.lon);
    html += `
      <li>
        <strong>${beach.name}</strong> – ${beach.distance.toFixed(2)} km<br>
        🌊 Wave height: ${surf.waveHeight} m<br>
        📈 Swell height: ${surf.swellHeight} m<br>
        💨 Wind speed: ${surf.windSpeed} m/s
      </li>`;
  }

  html += "</ul>";
  output.innerHTML = html;
};
