//Bloquear el gesto de recarga (pull-to-refresh) chrome / safari
document.addEventListener("touchmove", (event) => {
  if (event.touches.length > 1) {
    event.preventDefault();
  }
}, { passive: false });
//Bloquear el gesto de recarga (pull-to-refresh) navegador android
window.addEventListener("beforeunload", (event) => {
  event.preventDefault();
  event.returnValue = "";
});

//evita pinch-to-zoom
document.addEventListener("gesturestart", (event) => {
  event.preventDefault();
});
