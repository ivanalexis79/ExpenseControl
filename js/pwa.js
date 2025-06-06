// Variables globales para control de gestos
let startTouchY = 0;
let startTouchTime = 0;
let shouldPreventRefresh = false;

// Prevenir pull-to-refresh - Método corregido y optimizado
document.addEventListener("touchstart", (event) => {
  // Prevenir zoom con múltiples dedos
  if (event.touches.length > 1) {
    event.preventDefault();
    return;
  }
  
  // Guardar posición inicial del toque y tiempo
  startTouchY = event.touches[0].clientY;
  startTouchTime = Date.now();
  
  // Verificar si estamos en posición para pull-to-refresh
  const isAtTop = window.scrollY <= 2 && 
                  (document.documentElement.scrollTop <= 2 || 
                   document.body.scrollTop <= 2);
  
  // Solo marcar como potencial pull-to-refresh si estamos en el tope
  shouldPreventRefresh = isAtTop;
}, { passive: false });

document.addEventListener("touchmove", (event) => {
  // Prevenir zoom con múltiples dedos siempre
  if (event.touches.length > 1) {
    event.preventDefault();
    return;
  }
  
  // Solo verificar pull-to-refresh si inicialmente estábamos en el tope
  if (shouldPreventRefresh) {
    const currentY = event.touches[0].clientY;
    const deltaY = currentY - startTouchY;
    const currentTime = Date.now();
    const deltaTime = currentTime - startTouchTime;
    
    // Detectar pull-to-refresh: movimiento hacia abajo desde el tope
    const isPullingToRefresh = deltaY > 20 && // Aumentado el umbral a 20px
                              deltaTime > 100; // Aumentado a 100ms para mayor precisión
    
    if (isPullingToRefresh) {
      event.preventDefault();
    } else if (deltaY < -5) {
      // Si se mueve hacia arriba (scroll normal), dejar de monitorear
      shouldPreventRefresh = false;
    }
  }
}, { passive: false });

// Reset del flag al terminar el toque
document.addEventListener("touchend", () => {
  shouldPreventRefresh = false;
}, { passive: true });

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

// Prevenir doble tap zoom - Mejorado para evitar conflictos con scroll
let lastTouchEnd = 0;
let lastTouchPosition = { x: 0, y: 0 };

document.addEventListener("touchend", (event) => {
  const now = Date.now();
  const currentTouch = event.changedTouches[0];
  const currentPosition = { x: currentTouch.clientX, y: currentTouch.clientY };
  
  // Calcular distancia del toque anterior
  const distance = Math.sqrt(
    Math.pow(currentPosition.x - lastTouchPosition.x, 2) + 
    Math.pow(currentPosition.y - lastTouchPosition.y, 2)
  );
  
  // Solo prevenir si es un doble tap en la misma área (distancia < 50px)
  if (now - lastTouchEnd <= 300 && distance < 50) {
    event.preventDefault();
  }
  
  lastTouchEnd = now;
  lastTouchPosition = currentPosition;
  shouldPreventRefresh = false; // Reset del flag
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
