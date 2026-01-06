const modal = document.getElementById("mapModal");
const modalLocation = document.getElementById("modalLocation");
const modalDescription = document.getElementById("modalDescription");
const closeBtn = modal.querySelector(".map-modal-close");
const backdrop = modal.querySelector(".map-modal-backdrop");
const pins = document.querySelectorAll(".map-pin");

function openModalFromPin(pin) {
    modalLocation.textContent = pin.dataset.location || "";
    modalDescription.textContent = pin.dataset.description || "";
    modal.classList.add("is-open");
}

function closeModal() {
    modal.classList.remove("is-open");
}

pins.forEach((pin) => {
    pin.addEventListener("click", () => openModalFromPin(pin));
});

closeBtn.addEventListener("click", closeModal);
backdrop.addEventListener("click", closeModal);
