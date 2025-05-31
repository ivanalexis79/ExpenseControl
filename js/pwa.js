// Prevenir zoom con múltiples toques
document.addEventListener("touchstart", (event) => {
  if (event.touches.length > 1) {
    event.preventDefault();
  }
}, { passive: false });

document.addEventListener("touchmove", (event) => {
  if (event.touches.length > 1) {
    event.preventDefault();
  }
}, { passive: false });

// Prevenir gestos de zoom (iOS)
document.addEventListener("gesturestart", (event) => {
  event.preventDefault();
});

document.addEventListener("gesturechange", (event) => {
  event.preventDefault();
});

document.addEventListener("gestureend", (event) => {
  event.preventDefault();
});

// Prevenir doble tap zoom
let lastTouchEnd = 0;
document.addEventListener("touchend", (event) => {
  const now = (new Date()).getTime();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, { passive: false });

// Bloquear zoom con rueda del mouse (desktop)
document.addEventListener("wheel", (event) => {
  if (event.ctrlKey) {
    event.preventDefault();
  }
}, { passive: false });