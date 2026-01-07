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

const USE_MOCK = true; // 👈 true = local JSON, false = real API

const beaches = {
  "Fistral Beach": {
    lat: 50.4169,
    lng: -5.0983
  },
  "Charlestown Beach": {
    lat: 50.3399,
    lng: -4.7924
  }
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
      const res = await fetch("./mockAPI.json");
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
