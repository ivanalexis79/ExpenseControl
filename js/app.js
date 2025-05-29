// Registrar Service Worker
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js")
    .then(() => console.log("Service Worker registrado correctamente."))
    .catch((error) => console.error("Error al registrar Service Worker:", error));
}

// Base de Datos - IndexedDB
class GastosDB {
    constructor() {
        this.db = null;
        this.version = 1;
        this.nombreDB = 'GastosPersonalesDB';
    }

    async inicializar() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.nombreDB, this.version);

            request.onerror = () => {
                reject(new Error('Error al abrir la base de datos'));
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                this.db = event.target.result;
                this.crearTablas();
            };
        });
    }

    crearTablas() {
        // Crear tabla de categorías
        if (!this.db.objectStoreNames.contains('categorias')) {
            const categoriasStore = this.db.createObjectStore('categorias', { keyPath: 'id', autoIncrement: true });
            categoriasStore.createIndex('nombre', 'nombre', { unique: false });
        }

        // Crear tabla de gastos
        if (!this.db.objectStoreNames.contains('gastos')) {
            const gastosStore = this.db.createObjectStore('gastos', { keyPath: 'id', autoIncrement: true });
            gastosStore.createIndex('fecha', 'fecha', { unique: false });
            gastosStore.createIndex('categoria_id', 'categoria_id', { unique: false });
        }

        // Insertar categorías predeterminadas
        this.insertarCategoriasPredeterminadas();
    }

    insertarCategoriasPredeterminadas() {
        const categoriasPredeterminadas = [
            { nombre: 'Alimentación', color: '#FF6B6B' },
            { nombre: 'Transporte', color: '#4ECDC4' },
            { nombre: 'Entretenimiento', color: '#45B7D1' },
            { nombre: 'Salud', color: '#96CEB4' },
            { nombre: 'Educación', color: '#FFEAA7' },
            { nombre: 'Ropa', color: '#DDA0DD' },
            { nombre: 'Hogar', color: '#98D8C8' },
            { nombre: 'Otros', color: '#F7DC6F' }
        ];

        const transaction = this.db.transaction(['categorias'], 'readwrite');
        const store = transaction.objectStore('categorias');

        categoriasPredeterminadas.forEach(categoria => {
            store.add(categoria);
        });
    }

    // Métodos para gastos
    async insertarGasto(gasto) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gastos'], 'readwrite');
            const store = transaction.objectStore('gastos');
            
            const request = store.add({
                ...gasto,
                fecha_creacion: new Date().toISOString()
            });

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async obtenerGastos() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gastos'], 'readonly');
            const store = transaction.objectStore('gastos');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async obtenerGastoPorId(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gastos'], 'readonly');
            const store = transaction.objectStore('gastos');
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async actualizarGasto(id, gastoActualizado) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gastos'], 'readwrite');
            const store = transaction.objectStore('gastos');
            
            // Primero obtener el gasto existente
            const getRequest = store.get(id);
            getRequest.onsuccess = () => {
                const gastoExistente = getRequest.result;
                if (gastoExistente) {
                    const gastoCompleto = {
                        ...gastoExistente,
                        ...gastoActualizado,
                        id: id
                    };
                    
                    const putRequest = store.put(gastoCompleto);
                    putRequest.onsuccess = () => resolve(putRequest.result);
                    putRequest.onerror = () => reject(putRequest.error);
                } else {
                    reject(new Error('Gasto no encontrado'));
                }
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    async eliminarGasto(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gastos'], 'readwrite');
            const store = transaction.objectStore('gastos');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async obtenerCategorias() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['categorias'], 'readonly');
            const store = transaction.objectStore('categorias');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async obtenerGastosMesActual() {
        const ahora = new Date();
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);
        
        const gastos = await this.obtenerGastos();
        return gastos.filter(gasto => {
            const fechaGasto = new Date(gasto.fecha);
            return fechaGasto >= inicioMes && fechaGasto <= finMes;
        });
    }

    async obtenerResumenGastos() {
        const gastos = await this.obtenerGastos();
        const total = gastos.reduce((sum, gasto) => sum + gasto.monto, 0);
        return {
            total: total,
            totalGastos: gastos.length
        };
    }
}

// Funciones de utilidad
function mostrarLoading(mostrar) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = mostrar ? 'block' : 'none';
    }
}

function mostrarToast(mensaje, tipo = 'info') {
    // Crear toast si no existe
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    
    toast.textContent = mensaje;
    toast.className = `toast ${tipo} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Aplicación Principal
class GastosApp {
    constructor() {
        this.gastoEditando = null;
        this.reporteActual = null;
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

            // Cargar categorías en el select
            await this.cargarCategorias();
            
            // Cargar datos iniciales
            await this.cargarResumen();
            await this.cargarGastos();
            
            // Configurar eventos
            this.configurarEventos();
            
            console.log('Aplicación inicializada correctamente');
        } catch (error) {
            console.error('Error al inicializar la aplicación:', error);
        }
    }

    // Cargar categorías en el select
    async cargarCategorias() {
        try {
            const categorias = await window.gastosDB.obtenerCategorias();
            const select = document.getElementById('categoria');
            if (select) {
                select.innerHTML = '<option value="">Seleccionar categoría</option>';
                categorias.forEach(categoria => {
                    const option = document.createElement('option');
                    option.value = categoria.id;
                    option.textContent = categoria.nombre;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error al cargar categorías:', error);
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

    // Actualizar toda la interfaz
    async actualizarTodo() {
        await this.cargarResumen();
        await this.cargarGastos();
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
                        <button class="btn btn-small btn-secondary" onclick="window.appGastos.editarGasto(${gasto.id})" title="Editar">
                            ✏️
                        </button>
                        <button class="btn btn-small btn-danger" onclick="window.appGastos.eliminarGasto(${gasto.id})" title="Eliminar">
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
    async editarGasto(id) {
        try {
            const gasto = await window.gastosDB.obtenerGastoPorId(id);
            if (!gasto) {
                mostrarToast('Gasto no encontrado', 'error');
                return;
            }
            
            // Llenar el formulario con los datos del gasto
            document.getElementById('descripcion').value = gasto.descripcion;
            document.getElementById('monto').value = gasto.monto;
            document.getElementById('categoria').value = gasto.categoria_id;
            document.getElementById('fecha').value = gasto.fecha;
            
            // Cambiar el botón para modo edición
            const btnAgregar = document.getElementById('btnAgregar');
            btnAgregar.textContent = 'Actualizar Gasto';
            btnAgregar.onclick = (e) => {
                e.preventDefault();
                this.actualizarGasto(id);
            };
            
            // Mostrar botón cancelar
            this.mostrarBtnCancelar();
            this.gastoEditando = id;
            
        } catch (error) {
            console.error('Error al editar gasto:', error);
            mostrarToast('Error al cargar los datos del gasto', 'error');
        }
    }
    
    // Actualizar gasto existente
    async actualizarGasto(id) {
        const descripcion = document.getElementById('descripcion').value.trim();
        const monto = parseFloat(document.getElementById('monto').value);
        const categoria_id = parseInt(document.getElementById('categoria').value);
        const fecha = document.getElementById('fecha').value;
        
        if (!this.validarFormulario(descripcion, monto, categoria_id, fecha)) {
            return;
        }
        
        try {
            mostrarLoading(true);
            
            const gastoActualizado = {
                descripcion,
                monto,
                categoria_id,
                fecha
            };
            
            await window.gastosDB.actualizarGasto(id, gastoActualizado);
            
            // Limpiar formulario y resetear botones
            this.limpiarFormulario();
            this.resetearBotones();
            
            // Actualizar la vista
            await this.actualizarTodo();
            
            mostrarToast('Gasto actualizado correctamente', 'success');
            
        } catch (error) {
            console.error('Error al actualizar gasto:', error);
            mostrarToast('Error al actualizar el gasto', 'error');
        } finally {
            mostrarLoading(false);
        }
    }
    
    // Eliminar gasto
    async eliminarGasto(id) {
        if (!confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
            return;
        }
        
        try {
            mostrarLoading(true);
            await window.gastosDB.eliminarGasto(id);
            await this.actualizarTodo();
            mostrarToast('Gasto eliminado correctamente', 'success');
            
        } catch (error) {
            console.error('Error al eliminar gasto:', error);
            mostrarToast('Error al eliminar el gasto', 'error');
        } finally {
            mostrarLoading(false);
        }
    }
    
    // Mostrar botón cancelar
    mostrarBtnCancelar() {
        let btnCancelar = document.getElementById('btnCancelar');
        if (!btnCancelar) {
            btnCancelar = document.createElement('button');
            btnCancelar.id = 'btnCancelar';
            btnCancelar.type = 'button';
            btnCancelar.className = 'btn btn-secondary';
            btnCancelar.textContent = 'Cancelar';
            btnCancelar.onclick = () => {
                this.limpiarFormulario();
                this.resetearBotones();
            };
            
            const btnAgregar = document.getElementById('btnAgregar');
            btnAgregar.parentNode.insertBefore(btnCancelar, btnAgregar.nextSibling);
        }
        btnCancelar.style.display = 'inline-block';
    }
    
    // Resetear botones al estado original
    resetearBotones() {
        const btnAgregar = document.getElementById('btnAgregar');
        btnAgregar.textContent = 'Agregar Gasto';
        btnAgregar.onclick = null; // Remover el evento onclick
        
        const btnCancelar = document.getElementById('btnCancelar');
        if (btnCancelar) {
            btnCancelar.style.display = 'none';
        }
        
        this.gastoEditando = null;
    }
    
    // Validar formulario
    validarFormulario(descripcion, monto, categoria_id, fecha) {
        if (!descripcion) {
            mostrarToast('Por favor ingresa una descripción', 'error');
            return false;
        }
        
        if (isNaN(monto) || monto <= 0) {
            mostrarToast('Por favor ingresa un monto válido mayor a 0', 'error');
            return false;
        }
        
        if (!categoria_id) {
            mostrarToast('Por favor selecciona una categoría', 'error');
            return false;
        }
        
        if (!fecha) {
            mostrarToast('Por favor selecciona una fecha', 'error');
            return false;
        }
        
        return true;
    }
    
    // Limpiar formulario
    limpiarFormulario() {
        document.getElementById('descripcion').value = '';
        document.getElementById('monto').value = '';
        document.getElementById('categoria').value = '';
        document.getElementById('fecha').value = new Date().toISOString().split('T')[0];
    }
    
    // Configurar eventos
    configurarEventos() {
        // Formulario principal
        const form = document.getElementById('formGasto');
        if (form) {
            form.addEventListener('submit', (e) => {
                if (this.gastoEditando) {
                    e.preventDefault();
                    this.actualizarGasto(this.gastoEditando);
                } else {
                    this.agregarGasto(e);
                }
            });
        }
        
        // Validación en tiempo real del monto
        const montoInput = document.getElementById('monto');
        if (montoInput) {
            montoInput.addEventListener('input', (e) => {
                const valor = e.target.value;
                if (valor && (isNaN(valor) || parseFloat(valor) < 0)) {
                    e.target.setCustomValidity('Ingresa un número válido mayor o igual a 0');
                } else {
                    e.target.setCustomValidity('');
                }
            });
        }
    }
}

// Inicializar la aplicación cuando se carga la página
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Inicializar base de datos
        window.gastosDB = new GastosDB();
        await window.gastosDB.inicializar();
        
        // Crear instancia de la aplicación
        window.appGastos = new GastosApp();
        
        // Inicializar la aplicación
        await window.appGastos.init();
        
        console.log('Aplicación de gestión de gastos inicializada correctamente');
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        mostrarToast('Error al inicializar la aplicación', 'error');
    }
});
