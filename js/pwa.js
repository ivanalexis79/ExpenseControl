// Variables globales para control de gestos
let startTouchY = 0;
let startTouchTime = 0;
let isTrackingPullToRefresh = false;
let pullToRefreshBlocked = false;

// Estrategia híbrida: Detectar pull-to-refresh temprano y usar listeners pasivos cuando sea seguro
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
  const isAtTop = window.scrollY <= 3 && 
                  (document.documentElement.scrollTop <= 3 || 
                   document.body.scrollTop <= 3);
  
  // Solo activar tracking si estamos en el tope
  isTrackingPullToRefresh = isAtTop;
  pullToRefreshBlocked = false;
  
}, { passive: false });

// Listener principal para pull-to-refresh (no-pasivo solo cuando es necesario)
document.addEventListener("touchmove", (event) => {
  // Prevenir zoom con múltiples dedos siempre
  if (event.touches.length > 1) {
    event.preventDefault();
    return;
  }
  
  // Solo procesar si estamos tracking pull-to-refresh
  if (isTrackingPullToRefresh && !pullToRefreshBlocked) {
    const currentY = event.touches[0].clientY;
    const deltaY = currentY - startTouchY;
    const deltaTime = Date.now() - startTouchTime;
    
    // Detectar scroll hacia arriba (usuario quiere navegar normalmente)
    if (deltaY < -10) {
      isTrackingPullToRefresh = false;
      return; // Dejar que el scroll normal continúe
    }
    
    // Detectar pull-to-refresh genuino
    if (deltaY > 30 && deltaTime > 150) {
      event.preventDefault();
      pullToRefreshBlocked = true;
      
      // Opcional: Mostrar feedback visual
      console.log("Pull-to-refresh bloqueado");
    }
  }
}, { passive: false });

// Listener pasivo adicional para optimizar performance
document.addEventListener("touchmove", (event) => {
  // Este listener es pasivo y no interfiere con el scroll
  // Se usa solo para tracking interno si es necesario
  
  if (!isTrackingPullToRefresh) {
    // Aquí puedes agregar lógica que no requiera preventDefault
    // como analytics, logging, etc.
  }
}, { passive: true });

// Reset al terminar el toque
document.addEventListener("touchend", (event) => {
  isTrackingPullToRefresh = false;
  pullToRefreshBlocked = false;
}, { passive: true });

// Prevenir gestos de zoom (iOS) - Estos son específicos y necesarios
document.addEventListener("gesturestart", (event) => {
  event.preventDefault();
}, { passive: false });

document.addEventListener("gesturechange", (event) => {
  event.preventDefault();
}, { passive: false });

document.addEventListener("gestureend", (event) => {
  event.preventDefault();
}, { passive: false });

// Prevención de doble tap mejorada
let lastTouchEnd = 0;
let lastTouchPosition = { x: 0, y: 0 };

document.addEventListener("touchend", (event) => {
  const now = Date.now();
  
  // Solo verificar doble tap si hay un toque válido
  if (event.changedTouches && event.changedTouches.length > 0) {
    const currentTouch = event.changedTouches[0];
    const currentPosition = { x: currentTouch.clientX, y: currentTouch.clientY };
    
    // Calcular distancia del toque anterior
    const distance = Math.sqrt(
      Math.pow(currentPosition.x - lastTouchPosition.x, 2) + 
      Math.pow(currentPosition.y - lastTouchPosition.y, 2)
    );
    
    // Solo prevenir doble tap en la misma área y tiempo corto
    if (now - lastTouchEnd <= 300 && distance < 40) {
      event.preventDefault();
    }
    
    lastTouchPosition = currentPosition;
  }
  
  lastTouchEnd = now;
}, { passive: false });

// Bloquear zoom con Ctrl+rueda (desktop) - Sin cambios
document.addEventListener("wheel", (event) => {
  if (event.ctrlKey) {
    event.preventDefault();
  }
}, { passive: false });

// Prevenir refresh con teclas (F5, Ctrl+R) - Sin cambios
document.addEventListener("keydown", (event) => {
  if (event.key === "F5" || (event.ctrlKey && event.key === "r")) {
    event.preventDefault();
  }
}, { passive: true }); // Cambiado a pasivo ya que no afecta scroll
