// Script para el modal overlay del botón FAB
document.addEventListener('DOMContentLoaded', function() {
    // Crear el div overlay
    const overlay = document.createElement('div');
    overlay.id = 'fab-overlay';
    overlay.className = "mdl-card";
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: white;
        z-index: 9999;
        display: none;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;







    // Crear el contenido del overlay
    const overlayContent = document.createElement('div');
    overlayContent.style.cssText = `
        position: relative;
        width: 100%;
        height: 100%;
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    `;

    // Crear el botón de cerrar
    const closeButton = document.createElement('div');
    closeButton.className="mdl-card__menu"
    closeButton.innerHTML = `

    <button class="mdl-button mdl-button--icon mdl-js-button mdl-js-ripple-effect">
      <i class="material-icons">close</i>
    </button>



    `;



    // Contenido del overlay (puedes personalizar esto)
    const overlayText = document.createElement('div');
    overlayText.innerHTML = `
                 <form id="formGasto">
                    <div class="form-group">
                        <label for="monto">💵 Monto:</label>
                        <input type="number" id="monto" name="monto" step="0.01" min="0" required>
                    </div>

                    <div class="form-group">
                        <label for="descripcion">📝 Descripción:</label>
                        <input type="text" id="descripcion" name="descripcion" placeholder="Ej: Almuerzo, Gasolina..." required>
                    </div>

                    <div class="form-group">
                        <label for="categoria">🏷️ Categoría:</label>
                        <select id="categoria" name="categoria" required>
                            <option value="">Seleccionar categoría...</option>
                            <!-- Las opciones se llenan dinámicamente desde la DB -->
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="fecha">📅 Fecha:</label>
                        <input type="date" id="fecha" name="fecha" required>
                    </div>

                    <button type="submit" class="btn btn-primary" id="GuardarGasto">
                        ➕ Agregar Gasto
                    </button>
                </form>
    `;

    // Ensamblar el overlay
    overlayContent.appendChild(closeButton);
    overlayContent.appendChild(overlayText);
    overlay.appendChild(overlayContent);
    document.body.appendChild(overlay);

    // Función para mostrar el overlay
    function showOverlay() {
        overlay.style.display = 'block';
        // Pequeño delay para que la transición funcione
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);
        // Prevenir scroll del body
        document.body.style.overflow = 'hidden';
    }

    // Función para ocultar el overlay
    function hideOverlay() {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
            // Restaurar scroll del body
            document.body.style.overflow = '';
        }, 300);
    }

    // Event listener para el botón FAB
    const fabButton = document.getElementById('HomeAgregarGasto');
    if (fabButton) {
        fabButton.addEventListener('click', function(e) {
            e.preventDefault();
            showOverlay();
        });
    }

     // Event listener para el botón Guardar
    const NormalButton = document.getElementById('GuardarGasto');
    if (NormalButton) {
        NormalButton.addEventListener('click', function(e) {
           // e.preventDefault();
          //  hideOverlay();
        setTimeout(() => {
     hideOverlay();
        }, 10);

        });
    }
   


    // Event listener para el botón de cerrar
    closeButton.addEventListener('click', hideOverlay);

    // Cerrar con tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && overlay.style.display === 'block') {
            hideOverlay();
        }
    });

    // Opcional: cerrar al hacer click fuera del contenido (en el overlay)
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            hideOverlay();
        }
    });
});