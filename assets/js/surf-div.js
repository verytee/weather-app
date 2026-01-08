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

// km → miles
const kmToMiles = km => km * 0.621371;

// 📍 Get location (with fallback)
function getPosition() {
  return new Promise((resolve) => {
    const fallback = { lat: 50.059, lon: -5.65393 };

    if (!navigator.geolocation) {
      resolve({ ...fallback, usedFallback: true });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => resolve({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        usedFallback: false
      }),
      () => resolve({ ...fallback, usedFallback: true }),
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

// Button logic
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("locBtn");
  if (!btn) return;

  btn.onclick = async () => {
    const output = document.getElementById("output");
    output.innerHTML = `<div class="status centered">Loading…</div>`;

    // 🧠 Check if this is a single-beach page
    const beachLat = btn.dataset.lat;
    const beachLon = btn.dataset.lon;
    const beachName = btn.dataset.beachName;

    // ===============================
    // 🏖 SINGLE BEACH PAGE
    // ===============================
    if (beachLat && beachLon) {
      const surf = await getSurfData(Number(beachLat), Number(beachLon));

      output.innerHTML = `
        <div class="status centered">
          📍 Showing surf for ${beachName}
        </div>

        <div class="beach-container">
          <div class="beach-card">
            <h3>${beachName}</h3>
            <p>🌊 Wave: ${surf.waveHeight} m</p>
            <p>📈 Swell: ${surf.swellHeight} m</p>
            <p>💨 Wind: ${surf.windSpeed} m/s</p>
          </div>
        </div>
      `;
      return;
    }

    // ===============================
    // 🌍 HOME PAGE (nearest beaches)
    // ===============================
    const { lat, lon, usedFallback } = await getPosition();
    const nearest = findNearestBeaches(lat, lon);

    const surfData = await Promise.all(
      nearest.map(b => {
        const beach = beaches.find(x => x.name === b.name);
        return getSurfData(beach.lat, beach.lon);
      })
    );

    const statusMsg = usedFallback
      ? "⚠️ Using fallback location (geolocation unavailable)"
      : "📍 Location detected successfully";

    output.innerHTML = `
      <div class="status centered">${statusMsg}</div>

      <div class="beach-container">
        ${nearest.map((b, i) => `
          <div class="beach-card">
            <h3>${b.name}</h3>
            <p><strong>${kmToMiles(b.distance).toFixed(2)} mi away</strong></p>
            <p>🌊 Wave: ${surfData[i].waveHeight} m</p>
            <p>📈 Swell: ${surfData[i].swellHeight} m</p>
            <p>💨 Wind: ${surfData[i].windSpeed} m/s</p>
          </div>
        `).join("")}
      </div>
    `;
  };
});

