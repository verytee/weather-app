document.addEventListener("DOMContentLoaded", () => {

// =========================
// MODAL ELEMENTS
// =========================
const modal = document.getElementById("mapModal");
const modalLocation = document.getElementById("modalLocation");
const modalDescription = document.getElementById("modalDescription");
const modalSwell = document.getElementById("modalSwell");
const modalPeriod = document.getElementById("modalPeriod");
const modalWind = document.getElementById("modalWind");
const modalRating = document.getElementById("modalRating");

const closeBtn = modal.querySelector(".map-modal-close");
const backdrop = modal.querySelector(".map-modal-backdrop");

// =========================
// MODAL CONTROLS
// =========================
function openModal() {
  console.log("openModal() called");  
  modal.classList.add("is-open");
}

function closeModal() {
  modal.classList.remove("is-open");
}

closeBtn.addEventListener("click", closeModal);
backdrop.addEventListener("click", closeModal);


// On button press - API info

const API_KEY = "5cf33e4c-ea2f-11f0-b5c3-0242ac130003-5cf33eb0-ea2f-11f0-b5c3-0242ac130003";

const USE_MOCK = true; // true = local JSON, false = real API

// Coordinates for all pins so clicks always resolve
const beaches = {
  "Watergate Bay": { lat: 50.4426, lng: -5.0592 },
  "Porthtowan": { lat: 50.2724, lng: -5.2424 },
  "Gwithian Beach": { lat: 50.2137, lng: -5.4021 },
  "Sennen Cove": { lat: 50.0764, lng: -5.6939 },
  "Praa Sands": { lat: 50.0936, lng: -5.3924 },
  "Fistral Beach": { lat: 50.4169, lng: -5.0983 },
  "Kennack Sands": { lat: 50.0118, lng: -5.0995 }
};


function surfRating(swell, period, wind) {
  if (swell >= 1.5 && period >= 10 && wind < 10) return "🔥 Epic";
  if (swell >= 1.0 && period >= 8) return "✅ Good";
  if (swell >= 0.5) return "🙂 Rideable";
  return "😴 Flat";
}

async function loadSurfForBeach(beachName) {
  modalDescription.textContent = "Loading surf data… 🌊";
  modalRating.textContent = "";

  const beach = beaches[beachName];
  if (!beach) {
    modalDescription.textContent = "Unknown beach.";
    return;
  }

  const { lat, lng } = beach;

  try {
    let data;

    if (USE_MOCK) {
      const res = await fetch("./mockApi.json");
      if (!res.ok) throw new Error("Mock data failed");
      data = await res.json();
    } else {
      const res = await fetch(
        `https://api.stormglass.io/v2/weather/point?lat=${lat}&lng=${lng}&params=swellHeight,swellPeriod,windSpeed`,
        {
          headers: { Authorization: API_KEY }
        }
      );
      data = await res.json();
    }

    const hour = data.hours?.[0];
    if (!hour) throw new Error("No surf data");

    const swell = hour.swellHeight?.sg ?? hour.swellHeight?.noaa;
    const period = hour.swellPeriod?.sg ?? hour.swellPeriod?.noaa;
    const wind = hour.windSpeed?.sg ?? hour.windSpeed?.noaa;

    modalSwell.textContent = swell?.toFixed(1) ?? "–";
    modalPeriod.textContent = period?.toFixed(1) ?? "–";
    modalWind.textContent = wind?.toFixed(1) ?? "–";

    modalRating.textContent = surfRating(swell, period, wind);

    modalDescription.textContent =
      "Live surf conditions powered by Stormglass.";

  } catch (err) {
    console.error(err);
    modalDescription.textContent = "Error loading surf data.";
  }
}

// Map pins (dynamic beaches)
document.querySelectorAll(".map-pin").forEach(pin => {
  pin.addEventListener("click", () => {
    console.log("PIN CLICKED:", pin.dataset.location);

    const beachName = pin.dataset.location;
    modalLocation.textContent = beachName;
    openModal();
    loadSurfForBeach(beachName);
  });
});
});
