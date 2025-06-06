// Variables globales para control de gestos
let startTouchY = 0;
let startTouchTime = 0;

// Prevenir pull-to-refresh - Método corregido
document.addEventListener("touchstart", (event) => {
  // Prevenir zoom con múltiples dedos
  if (event.touches.length > 1) {
    event.preventDefault();
    return;
  }
  
  // Guardar posición inicial del toque y tiempo
  startTouchY = event.touches[0].clientY;
  startTouchTime = Date.now();
}, { passive: false });

document.addEventListener("touchmove", (event) => {
  // Prevenir zoom con múltiples dedos
  if (event.touches.length > 1) {
    event.preventDefault();
    return;
  }
  
  const currentY = event.touches[0].clientY;
  const deltaY = currentY - startTouchY;
  const currentTime = Date.now();
  const deltaTime = currentTime - startTouchTime;
  
  // Verificar si estamos en la parte superior con tolerancia
  const isAtTop = window.scrollY <= 2 && 
                  (document.documentElement.scrollTop <= 2 || 
                   document.body.scrollTop <= 2);
  
  // Detectar pull-to-refresh: movimiento hacia abajo (deltaY > 0) desde el tope
  const isPullingToRefresh = deltaY > 15 && // Umbral mínimo de 15px
                            isAtTop && 
                            deltaTime > 50; // Mínimo 50ms para evitar toques accidentales
  
  // Solo prevenir el pull-to-refresh específico, no el scroll normal
  if (isPullingToRefresh) {
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

// Prevenir doble tap zoom - Reducido el tiempo para mayor fluidez
let lastTouchEnd = 0;
document.addEventListener("touchend", (event) => {
  const now = Date.now();
  // Reducido de 300ms a 200ms para permitir scroll más fluido
  if (now - lastTouchEnd <= 200) {
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
