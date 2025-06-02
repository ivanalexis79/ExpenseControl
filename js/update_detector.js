// ========== SISTEMA DE ACTUALIZACIÓN PWA ==========
let newServiceWorker;
let refreshing = false;
let updateNotificationShown = false;

// Registrar Service Worker y detectar actualizaciones
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/ExpenseControl/service-worker.js')
        .then((registration) => {
            console.log('[PWA] Service Worker registrado:', registration);
            
            // Verificar actualizaciones cada 5 segundos (puedes ajustar el tiempo)
            setInterval(() => {
                registration.update();
            }, 5000);
            
            // Escuchar por actualizaciones
            registration.addEventListener('updatefound', () => {
                console.log('[PWA] Nueva versión detectada');
                newServiceWorker = registration.installing;
                
                newServiceWorker.addEventListener('statechange', () => {
                    console.log('[PWA] Estado del SW:', newServiceWorker.state);
                    if (newServiceWorker.state === 'installed') {
                        if (navigator.serviceWorker.controller && !updateNotificationShown) {
                            // Hay una nueva versión disponible
                            console.log('[PWA] Nueva versión lista para instalar');
                            updateNotificationShown = true;
                            setTimeout(() => {
                                mostrarNotificacionActualizacion();
                            }, 5000); // Esperar 5 segundo antes de mostrar
                        } else if (!navigator.serviceWorker.controller) {
                            // Primera instalación
                            console.log('[PWA] PWA instalada por primera vez');
                        }
                    }
                });
            });
        })
        .catch((error) => {
            console.error('[PWA] Error al registrar Service Worker:', error);
        });
    
    // Escuchar cuando el SW toma control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        console.log('[PWA] Recargando por nueva versión');
        window.location.reload();
    });
}

// Función para mostrar notificación de actualización
function mostrarNotificacionActualizacion() {
    // Verificar si ya existe una notificación
    if (document.getElementById('update-notification')) {
        console.log('[PWA] Notificación ya existe, no creando otra');
        return;
    }
    
    console.log('[PWA] Creando notificación de actualización');
    
    // Crear notificación de actualización
    const notification = document.createElement('div');
    notification.id = 'update-notification';
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            padding: 15px;
            text-align: center;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            animation: slideDown 0.5s ease-out;
        ">
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap;">
                <span style="font-weight: 500;">🔄 Nueva versión disponible</span>
                <button onclick="actualizarAplicacion()" style="
                    background: white;
                    color: #3b82f6;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    Actualizar Ahora
                </button>
                <button onclick="cerrarNotificacion()" style="
                    background: transparent;
                    color: white;
                    border: 1px solid white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-weight: 500;
                ">
                    Más Tarde
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    console.log('[PWA] Notificación mostrada');
    
    // Auto-cerrar después de 30 segundos (aumentado el tiempo)
    setTimeout(() => {
        if (document.getElementById('update-notification')) {
            console.log('[PWA] Auto-cerrando notificación por timeout');
            cerrarNotificacion();
        }
    }, 30000);
}

// Función para actualizar la aplicación
function actualizarAplicacion() {
    console.log('[PWA] Iniciando actualización...');
    if (newServiceWorker) {
        console.log('[PWA] Enviando skipWaiting al nuevo SW');
        newServiceWorker.postMessage({ action: 'skipWaiting' });
        
        // Cerrar notificación inmediatamente
        cerrarNotificacion();
        
        // Fallback: si no responde en 3 segundos, recargar manualmente
        setTimeout(() => {
            console.log('[PWA] Fallback: recargando manualmente');
            window.location.reload();
        }, 3000);
    } else {
        console.log('[PWA] No hay nuevo SW, recargando directamente');
        window.location.reload();
    }
}
// Función para cerrar la notificación
function cerrarNotificacion() {
    const notification = document.getElementById('update-notification');
    if (notification) {
        console.log('[PWA] Cerrando notificación');
        notification.style.animation = 'slideUp 0.3s ease-in';
        setTimeout(() => {
            if (notification && notification.parentNode) {
                notification.remove();
                updateNotificationShown = false; // Resetear flag
                console.log('[PWA] Notificación cerrada');
            }
        }, 300);
    }
}

// Función para verificar manualmente actualizaciones (opcional)
function verificarActualizaciones() {
    console.log('[PWA] Verificación manual iniciada');
    
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration('/ExpenseControl/service-worker.js')
            .then((registration) => {
                if (registration) {
                    console.log('[PWA] Forzando verificación de actualización');
                    return registration.update();
                }
            })
            .then(() => {
                console.log('[PWA] Verificación completada, esperando resultado...');
                
                // Esperar un momento para que se procese la actualización
                setTimeout(() => {
                    if (newServiceWorker && newServiceWorker.state === 'installed') {
                        console.log('[PWA] Nueva versión encontrada, mostrando notificación');
                        // Resetear el flag para permitir mostrar la notificación manualmente
                        updateNotificationShown = false;
                        mostrarNotificacionActualizacion();
                    } else {
                        console.log('[PWA] No se encontraron actualizaciones');
                        mostrarMensajeNoActualizacion();
                    }
                }, 2000);
            })
            .catch((error) => {
                console.error('[PWA] Error en verificación:', error);
                mostrarMensajeNoActualizacion();
            });
    } else {
        console.log('[PWA] Service Worker no disponible');
    }
}

function mostrarMensajeNoActualizacion() {
    const mensaje = document.createElement('div');
    mensaje.innerHTML = '
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: #48bb78;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: 500;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        ">
            ✅ La aplicación ya está actualizada
        </div>
    ';
    
    document.body.appendChild(mensaje);
    
    setTimeout(() => {
        if (mensaje && mensaje.parentNode) {
            mensaje.remove();
        }
    }, 3000);
}

// Función para obtener la versión actual (opcional)
function obtenerVersionActual() {
    return new Promise((resolve) => {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            const channel = new MessageChannel();
            channel.port1.onmessage = (event) => {
                resolve(event.data.version);
            };
            navigator.serviceWorker.controller.postMessage(
                { action: 'getVersion' }, 
                [channel.port2]
            );
        } else {
            resolve('No disponible');
        }
    });
}

// CSS adicional para las animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { transform: translateY(-100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    @keyframes slideUp {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(-100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

console.log('[PWA] Sistema de actualización inicializado');

// Función temporal para probar la notificación
window.testNotificacion = function() {
    console.log('[PWA] Forzando notificación de prueba');
    mostrarNotificacionActualizacion();
};
