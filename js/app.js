
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js")
    .then(() => console.log("Service Worker registrado correctamente."))
    .catch((error) => console.error("Error al registrar Service Worker:", error));
}


// Aplicación Principal - app.js

class GastosApp {
    constructor() {
        this.gastoEditando = null;
    }

    // Inicializar la aplicación
    async init() {
        try {
            // Establecer fecha actual por defecto
            const hoy = new Date().toISOString().split('T')[0];
            const fechaInput = document.getElementById('fecha');
            if (fechaInput) {
                fechaInput.value = hoy;
            }

            // Cargar datos iniciales
            await this.cargarResumen();
            await this.cargarGastos();
            
            console.log('Aplicación inicializada correctamente');
        } catch (error) {
            console.error('Error al inicializar la aplicación:', error);
        }
    }

    // Agregar nuevo gasto
    async agregarGasto(event) {
        event.preventDefault();
        
        try {
            mostrarLoading(true);
            
            const formData = new FormData(event.target);
            const gasto = {
                monto: parseFloat(formData.get('monto')),
                descripcion: formData.get('descripcion').trim(),
                categoria_id: parseInt(formData.get('categoria')),
                fecha: formData.get('fecha')
            };

            // Validaciones
            if (gasto.monto <= 0) {
                mostrarToast('El monto debe ser mayor a 0', 'error');
                return;
            }

            if (!gasto.descripcion) {
                mostrarToast('La descripción es requerida', 'error');
                return;
            }

            if (!gasto.categoria_id) {
                mostrarToast('Selecciona una categoría', 'error');
                return;
            }

            // Insertar en la base de datos
            await window.gastosDB.insertarGasto(gasto);
            
            // Limpiar formulario
            event.target.reset();
            const hoy = new Date().toISOString().split('T')[0];
            document.getElementById('fecha').value = hoy;
            
            // Actualizar interfaz
            await this.actualizarTodo();
            
            mostrarToast('Gasto agregado exitosamente', 'success');
            
        } catch (error) {
            console.error('Error al agregar gasto:', error);
            mostrarToast('Error al agregar el gasto', 'error');
        } finally {
            mostrarLoading(false);
        }
    }

    // Cargar lista de gastos
    async cargarGastos(soloMesActual = false) {
        try {
            let gastos;
            if (soloMesActual) {
                gastos = await window.gastosDB.obtenerGastosMesActual();
            } else {
                gastos = await window.gastosDB.obtenerGastos();
            }
            
            const categorias = await window.gastosDB.obtenerCategorias();
            const container = document.getElementById('listaGastos');
            
            if (!container) return;

            if (gastos.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>📝 No hay gastos registrados</p>
                        <p style="color: #666; font-size: 14px;">
                            ${soloMesActual ? 'Este mes' : ''} Agrega tu primer gasto usando el formulario de arriba
                        </p>
                    </div>
                `;
                return;
            }

            // Ordenar gastos por fecha (más recientes primero)
            gastos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            
            container.innerHTML = '';
            
            gastos.forEach(gasto => {
                const categoria = categorias.find(cat => cat.id === gasto.categoria_id);
                const categoriaInfo = categoria || { nombre: 'Categoría eliminada', color: '#ccc' };
                
                const fecha = new Date(gasto.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });

                const item = document.createElement('div');
                item.className = 'gasto-item';
                item.style.borderLeftColor = categoriaInfo.color;
                
                item.innerHTML = `
                    <div class="gasto-info">
                        <div class="gasto-header">
                            <span class="gasto-descripcion">${gasto.descripcion}</span>
                            <span class="gasto-monto">$${gasto.monto.toFixed(2)}</span>
                        </div>
                        <div class="gasto-details">
                            <span class="gasto-categoria" style="color: ${categoriaInfo.color}">
                                🏷️ ${categoriaInfo.nombre}
                            </span>
                            <span class="gasto-fecha">📅 ${fecha}</span>
                        </div>
                    </div>
                    <div class="gasto-actions">
                        <button class="btn btn-small btn-secondary" onclick="editarGasto(${gasto.id})" title="Editar">
                            ✏️
                        </button>
                        <button class="btn btn-small btn-danger" onclick="eliminarGasto(${gasto.id})" title="Eliminar">
                            🗑️
                        </button>
                    </div>
                `;
                
                container.appendChild(item);
            });
            
        } catch (error) {
            console.error('Error al cargar gastos:', error);
            mostrarToast('Error al cargar los gastos', 'error');
        }
    }

    // Cargar resumen de gastos
    async cargarResumen() {
        try {
            const resumen = await window.gastosDB.obtenerResumenGastos();
            const gastosMes = await window.gastosDB.obtenerGastosMesActual();
            const totalMes = gastosMes.reduce((sum, gasto) => sum + gasto.monto, 0);
            
            // Actualizar elementos del resumen
            const totalElement = document.getElementById('totalGastos');
            const mesElement = document.getElementById('gastosMes');
            const cantidadElement = document.getElementById('cantidadGastos');
            
            if (totalElement) totalElement.textContent = `$${resumen.total.toFixed(2)}`;
            if (mesElement) mesElement.textContent = `$${totalMes.toFixed(2)}`;
            if (cantidadElement) cantidadElement.textContent = resumen.totalGastos.toString();
            
        } catch (error) {
            console.error('Error al cargar resumen:', error);
        }
    }

    // Editar gasto
    /*
    async editarGasto(id) {
        try {
            const gastos = await window.gastosDB.obtenerGastos();
            const gasto = gastos.find(g => g.id === id);
            
            if (!gasto) {
                mostrarToast('Gasto no encontrado', 'error');
                return;
            }

            this.gastoEditando = gasto;
            
            // Llenar formulario de edición
            document.getElementById('editarId').value = gasto.id;
            document.getElementById('editarMonto').value
*/
