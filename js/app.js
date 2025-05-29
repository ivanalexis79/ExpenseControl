
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

// Editar gasto
    async editarGasto(id) {
        try {
            const gasto = await window.gastosDB.obtenerGastoPorId(id);
            if (!gasto) {
                alert('Gasto no encontrado');
                return;
            }
            
            // Llenar el formulario con los datos del gasto
            document.getElementById('descripcion').value = gasto.descripcion;
            document.getElementById('monto').value = gasto.monto;
            document.getElementById('categoria').value = gasto.categoria;
            document.getElementById('fecha').value = gasto.fecha;
            
            // Cambiar el botón para modo edición
            const btnAgregar = document.getElementById('btnAgregar');
            btnAgregar.textContent = 'Actualizar Gasto';
            btnAgregar.onclick = () => this.actualizarGasto(id);
            
            // Mostrar botón cancelar
            this.mostrarBtnCancelar();
            
        } catch (error) {
            console.error('Error al editar gasto:', error);
            alert('Error al cargar los datos del gasto');
        }
    }
    
    // Actualizar gasto existente
    async actualizarGasto(id) {
        const descripcion = document.getElementById('descripcion').value.trim();
        const monto = parseFloat(document.getElementById('monto').value);
        const categoria = document.getElementById('categoria').value;
        const fecha = document.getElementById('fecha').value;
        
        if (!this.validarFormulario(descripcion, monto, categoria, fecha)) {
            return;
        }
        
        try {
            const gastoActualizado = {
                descripcion,
                monto,
                categoria,
                fecha
            };
            
            await window.gastosDB.actualizarGasto(id, gastoActualizado);
            
            // Limpiar formulario y resetear botones
            this.limpiarFormulario();
            this.resetearBotones();
            
            // Actualizar la vista
            await this.cargarGastos();
            await this.cargarResumen();
            
            alert('Gasto actualizado correctamente');
            
        } catch (error) {
            console.error('Error al actualizar gasto:', error);
            alert('Error al actualizar el gasto');
        }
    }
    
    // Eliminar gasto
    async eliminarGasto(id) {
        if (!confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
            return;
        }
        
        try {
            await window.gastosDB.eliminarGasto(id);
            await this.cargarGastos();
            await this.cargarResumen();
            alert('Gasto eliminado correctamente');
            
        } catch (error) {
            console.error('Error al eliminar gasto:', error);
            alert('Error al eliminar el gasto');
        }
    }
    
    // Filtrar gastos
    async filtrarGastos() {
        const filtroCategoria = document.getElementById('filtroCategoria').value;
        const filtroFecha = document.getElementById('filtroFecha').value;
        
        try {
            let gastos;
            
            if (filtroCategoria && filtroFecha) {
                gastos = await window.gastosDB.filtrarGastos(filtroCategoria, filtroFecha);
            } else if (filtroCategoria) {
                gastos = await window.gastosDB.obtenerGastosPorCategoria(filtroCategoria);
            } else if (filtroFecha) {
                gastos = await window.gastosDB.obtenerGastosPorFecha(filtroFecha);
            } else {
                gastos = await window.gastosDB.obtenerTodosLosGastos();
            }
            
            this.mostrarGastos(gastos);
            
        } catch (error) {
            console.error('Error al filtrar gastos:', error);
        }
    }
    
    // Limpiar filtros
    async limpiarFiltros() {
        document.getElementById('filtroCategoria').value = '';
        document.getElementById('filtroFecha').value = '';
        await this.cargarGastos();
    }
    
    // Exportar gastos a CSV
    async exportarCSV() {
        try {
            const gastos = await window.gastosDB.obtenerTodosLosGastos();
            
            if (gastos.length === 0) {
                alert('No hay gastos para exportar');
                return;
            }
            
            // Crear contenido CSV
            const headers = ['Fecha', 'Descripción', 'Categoría', 'Monto'];
            const csvContent = [
                headers.join(','),
                ...gastos.map(gasto => [
                    gasto.fecha,
                    `"${gasto.descripcion}"`,
                    gasto.categoria,
                    gasto.monto
                ].join(','))
            ].join('\n');
            
            // Crear y descargar archivo
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `gastos_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            
        } catch (error) {
            console.error('Error al exportar CSV:', error);
            alert('Error al exportar los datos');
        }
    }
    
    // Generar reporte mensual
    async generarReporteMensual() {
        try {
            const gastos = await window.gastosDB.obtenerGastosMesActual();
            
            if (gastos.length === 0) {
                alert('No hay gastos en el mes actual');
                return;
            }
            
            // Agrupar por categoría
            const gastosPorCategoria = {};
            gastos.forEach(gasto => {
                if (!gastosPorCategoria[gasto.categoria]) {
                    gastosPorCategoria[gasto.categoria] = 0;
                }
                gastosPorCategoria[gasto.categoria] += gasto.monto;
            });
            
            // Crear reporte
            const total = gastos.reduce((sum, gasto) => sum + gasto.monto, 0);
            const fechaActual = new Date().toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long' 
            });
            
            let reporte = `REPORTE MENSUAL - ${fechaActual.toUpperCase()}\n`;
            reporte += `${'='.repeat(50)}\n\n`;
            reporte += `Total de gastos: ${gastos.length}\n`;
            reporte += `Monto total: $${total.toFixed(2)}\n\n`;
            reporte += `GASTOS POR CATEGORÍA:\n`;
            reporte += `${'-'.repeat(30)}\n`;
            
            Object.entries(gastosPorCategoria)
                .sort((a, b) => b[1] - a[1])
                .forEach(([categoria, monto]) => {
                    const porcentaje = ((monto / total) * 100).toFixed(1);
                    reporte += `${categoria}: $${monto.toFixed(2)} (${porcentaje}%)\n`;
                });
            
            // Mostrar reporte en modal o descargar
            this.mostrarReporte(reporte);
            
        } catch (error) {
            console.error('Error al generar reporte:', error);
            alert('Error al generar el reporte');
        }
    }
    
    // Mostrar reporte en modal
    mostrarReporte(reporte) {
        // Crear modal si no existe
        let modal = document.getElementById('modalReporte');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modalReporte';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h2>Reporte Mensual</h2>
                    <pre id="contenidoReporte"></pre>
                    <div class="modal-buttons">
                        <button onclick="gestorGastos.descargarReporte()">Descargar</button>
                        <button onclick="gestorGastos.cerrarModal()">Cerrar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Agregar evento para cerrar
            modal.querySelector('.close').onclick = () => this.cerrarModal();
        }
        
        // Mostrar reporte
        document.getElementById('contenidoReporte').textContent = reporte;
        modal.style.display = 'block';
        
        // Guardar reporte para descarga
        this.reporteActual = reporte;
    }
    
    // Descargar reporte como archivo de texto
    descargarReporte() {
        if (!this.reporteActual) return;
        
        const blob = new Blob([this.reporteActual], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `reporte_mensual_${new Date().toISOString().split('T')[0]}.txt`;
        link.click();
    }
    
    // Cerrar modal
    cerrarModal() {
        const modal = document.getElementById('modalReporte');
        if (modal) {
            modal.style.display = 'none';
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
        btnAgregar.onclick = () => this.agregarGasto();
        
        const btnCancelar = document.getElementById('btnCancelar');
        if (btnCancelar) {
            btnCancelar.style.display = 'none';
        }
    }
    
    // Validar formulario
    validarFormulario(descripcion, monto, categoria, fecha) {
        if (!descripcion) {
            alert('Por favor ingresa una descripción');
            return false;
        }
        
        if (isNaN(monto) || monto <= 0) {
            alert('Por favor ingresa un monto válido mayor a 0');
            return false;
        }
        
        if (!categoria) {
            alert('Por favor selecciona una categoría');
            return false;
        }
        
        if (!fecha) {
            alert('Por favor selecciona una fecha');
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
        // Filtros
        const filtroCategoria = document.getElementById('filtroCategoria');
        const filtroFecha = document.getElementById('filtroFecha');
        
        if (filtroCategoria) {
            filtroCategoria.addEventListener('change', () => this.filtrarGastos());
        }
        
        if (filtroFecha) {
            filtroFecha.addEventListener('change', () => this.filtrarGastos());
        }
        
        // Botón limpiar filtros
        const btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros');
        if (btnLimpiarFiltros) {
            btnLimpiarFiltros.addEventListener('click', () => this.limpiarFiltros());
        }
        
        // Botón exportar CSV
        const btnExportarCSV = document.getElementById('btnExportarCSV');
        if (btnExportarCSV) {
            btnExportarCSV.addEventListener('click', () => this.exportarCSV());
        }
        
        // Botón generar reporte
        const btnReporte = document.getElementById('btnReporte');
        if (btnReporte) {
            btnReporte.addEventListener('click', () => this.generarReporteMensual());
        }
        
        // Cerrar modal al hacer clic fuera de él
        window.addEventListener('click', (event) => {
            const modal = document.getElementById('modalReporte');
            if (modal && event.target === modal) {
                this.cerrarModal();
            }
        });
        
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
        
        // Envío del formulario con Enter
        const form = document.getElementById('formGasto');
        if (form) {
            form.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const btnAgregar = document.getElementById('btnAgregar');
                    btnAgregar.click();
                }
            });
        }
    }
}

// Inicializar la aplicación cuando se carga la página
document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar base de datos
    await window.gastosDB.inicializar();
    
    // Crear instancia del gestor
    window.gestorGastos = new GestorGastos();
    
    // Inicializar la aplicación
    await window.gestorGastos.inicializar();
    
    console.log('Aplicación de gestión de gastos inicializada correctamente');
});


}
