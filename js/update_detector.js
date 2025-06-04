// ========== SISTEMA DE ACTUALIZACIÓN PWA ==========
let newServiceWorker;
let refreshing = false;
let updateNotificationShown = false;
let registration = null; // Guardar referencia del registration

// Registrar Service Worker y detectar actualizaciones
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/ExpenseControl/service-worker.js')
        .then((reg) => {
            console.log('[PWA] Service Worker registrado:', reg);
            registration = reg; // Guardar referencia
            
            // Verificar actualizaciones cada 30 segundos
            setInterval(() => {
                if (registration) {
                    console.log('[PWA] Verificación automática de actualización');
                    registration.update();
                }
            }, 30000);
            
            // Configurar listeners de actualización
            setupUpdateListeners(reg);
        })
        .catch((error) => {
            console.error('[PWA] Error al registrar Service Worker:', error);
        });
    
    // Escuchar cuando el SW toma control (SOLO si el usuario eligió actualizar)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        // Solo recargar si el usuario eligió actualizar explícitamente
        if (updateNotificationShown && document.getElementById('update-notification')) {
            // Hay una notificación activa, no recargar automáticamente
            console.log('[PWA] Nuevo SW tomó control, pero esperando decisión del usuario');
            return;
        }
        refreshing = true;
        console.log('[PWA] Recargando por nueva versión (autorizada por usuario)');
        window.location.reload();
    });
}

// Función para configurar los listeners de actualización
function setupUpdateListeners(reg) {
    // Verificar si ya hay un SW esperando
    if (reg.waiting) {
        console.log('[PWA] SW ya esperando al registrar');
        newServiceWorker = reg.waiting;
        setupServiceWorkerListener(newServiceWorker);
        if (!updateNotificationShown) {
            mostrarNotificacionActualizacion();
        }
    }
    
    // Verificar si hay uno instalándose
    if (reg.installing) {
        console.log('[PWA] SW instalándose al registrar');
        newServiceWorker = reg.installing;
        setupServiceWorkerListener(newServiceWorker);
    }
    
    // Escuchar por nuevas actualizaciones
    reg.addEventListener('updatefound', () => {
        console.log('[PWA] Nueva versión detectada en updatefound');
        newServiceWorker = reg.installing;
        
        if (newServiceWorker) {
            setupServiceWorkerListener(newServiceWorker);
        }
    });
}

// Función para configurar el listener del service worker
function setupServiceWorkerListener(sw) {
    sw.addEventListener('statechange', () => {
        console.log('[PWA] Estado del SW cambiado a:', sw.state);
        
        switch (sw.state) {
            case 'installed':
                if (navigator.serviceWorker.controller) {
                    // Hay una nueva versión disponible
                    console.log('[PWA] Nueva versión lista para instalar');
                    if (!updateNotificationShown) {
                        updateNotificationShown = true;
                        setTimeout(() => {
                            mostrarNotificacionActualizacion();
                        }, 1000); // Reducido a 1 segundo
                    }
                } else {
                    // Primera instalación
                    console.log('[PWA] PWA instalada por primera vez');
                }
                break;
            case 'redundant':
                console.log('[PWA] SW se volvió redundante');
                break;
        }
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
    
    // Auto-cerrar después de 30 segundos
    setTimeout(() => {
        if (document.getElementById('update-notification')) {
            console.log('[PWA] Auto-cerrando notificación por timeout');
            cerrarNotificacion();
        }
    }, 30000);
}

// Función para actualizar la aplicación
function actualizarAplicacion() {
    console.log('[PWA] Usuario eligió actualizar - iniciando actualización...');
    
    // Marcar que el usuario autorizó la actualización
    refreshing = true;
    
    // Cerrar notificación inmediatamente
    cerrarNotificacion();
    
    if (newServiceWorker) {
        console.log('[PWA] Enviando skipWaiting al nuevo SW');
        
        // Escuchar el evento controllerchange específicamente para esta actualización
        const handleControllerChange = () => {
            console.log('[PWA] Nuevo SW tomó control, recargando...');
            navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
            window.location.reload();
        };
        
        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
        
        // Enviar skipWaiting
        newServiceWorker.postMessage({ action: 'skipWaiting' });
        
        // Fallback: si no responde en 5 segundos, recargar manualmente
        setTimeout(() => {
            console.log('[PWA] Fallback: recargando manualmente');
            navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
            window.location.reload();
        }, 5000);
    } else {
        console.log('[PWA] No hay nuevo SW, recargando directamente');
        window.location.reload();
    }
}

// Función para cerrar la notificación
function cerrarNotificacion() {
    const notification = document.getElementById('update-notification');
    if (notification) {
        console.log('[PWA] Usuario eligió cerrar notificación - respetando decisión');
        notification.style.animation = 'slideUp 0.3s ease-in';
        setTimeout(() => {
            if (notification && notification.parentNode) {
                notification.remove();
                updateNotificationShown = false; // Resetear flag
                console.log('[PWA] Notificación cerrada por usuario');
            }
        }, 300);
    }
}

// Función para verificar manualmente actualizaciones (CORREGIDA)
function verificarActualizaciones() {
    console.log('[PWA] Verificación manual iniciada');
    
    if (!registration) {
        console.log('[PWA] No hay registration disponible');
        return;
    }
    
    // Primero verificar si ya hay un SW esperando
    if (registration.waiting) {
        console.log('[PWA] SW esperando encontrado');
        newServiceWorker = registration.waiting;
        if (!updateNotificationShown) {
            updateNotificationShown = true;
            mostrarNotificacionActualizacion();
        }
        return;
    }
    
    // Si no hay SW esperando, buscar actualizaciones
    console.log('[PWA] Buscando nuevas actualizaciones...');
    registration.update()
        .then(() => {
            console.log('[PWA] Update() completado');
            
            // Dar tiempo para que se procese la actualización
            setTimeout(() => {
                if (registration.waiting && !updateNotificationShown) {
                    console.log('[PWA] Nueva actualización encontrada después de update()');
                    newServiceWorker = registration.waiting;
                    updateNotificationShown = true;
                    mostrarNotificacionActualizacion();
                } else if (registration.installing) {
                    console.log('[PWA] SW instalándose, esperando...');
                    newServiceWorker = registration.installing;
                    setupServiceWorkerListener(newServiceWorker);
                } else {
                    console.log('[PWA] No se encontraron actualizaciones');
                    mostrarMensajeNoActualizacion();
                }
            }, 2000); // Dar 2 segundos para que se procese
        })
        .catch((error) => {
            console.error('[PWA] Error en verificación:', error);
        });
}

// Función para mostrar mensaje de no actualización
function mostrarMensajeNoActualizacion() {
    const mensaje = document.createElement('div');
    mensaje.innerHTML = `
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
    `;
    
    document.body.appendChild(mensaje);
    
    setTimeout(() => {
        if (mensaje && mensaje.parentNode) {
            mensaje.remove();
        }
    }, 3000);
}

// Función para obtener la versión actual
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
    updateNotificationShown = false; // Resetear para permitir mostrar
    mostrarNotificacionActualizacion();
};

// Función de debug para ver el estado
window.debugPWA = function() {
    console.log('[PWA DEBUG] Estado actual:', {
        registration: !!registration,
        newServiceWorker: !!newServiceWorker,
        updateNotificationShown,
        refreshing,
        waiting: registration?.waiting,
        installing: registration?.installing,
        active: registration?.active
    });
};
