// Prevenir pull-to-refresh - Método principal
document.addEventListener("touchstart", (event) => {
  if (event.touches.length > 1) {
    event.preventDefault();
  }
  
  // Guardar posición inicial del toque
  window.startTouchY = event.touches[0].clientY;
}, { passive: false });

document.addEventListener("touchmove", (event) => {
  // Prevenir zoom con múltiples dedos
  if (event.touches.length > 1) {
    event.preventDefault();
    return;
  }
  
  // Prevenir pull-to-refresh
  const currentY = event.touches[0].clientY;
  const isScrollingDown = currentY > window.startTouchY;
  const isAtTop = window.scrollY === 0 || document.documentElement.scrollTop === 0;
  
  if (isScrollingDown && isAtTop) {
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

// Bloquear zoom con Ctrl+rueda (desktop)
document.addEventListener("wheel", (event) => {
  if (event.ctrlKey) {
    event.preventDefault();
  }
}, { passive: false });

// Prevenir refresh con teclas (F5, Ctrl+R)
document.addEventListener("keydown", (event) => {
  if (event.key === "F5" || (event.ctrlKey && event.key === "r")) {
    event.preventDefault();
  }
});