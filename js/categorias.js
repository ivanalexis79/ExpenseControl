// Gestor de Categorías - categorias.js

class CategoriasManager {
    constructor() {
        this.categoriaOtros = null; // Para almacenar la categoría "Otros Gastos"
    }

    // Inicializar el gestor de categorías
    async init() {
        await this.asegurarCategoriaOtros();
        await this.cargarCategoriasEnSelect();
    }

    // Asegurar que existe la categoría "Otros Gastos"
    async asegurarCategoriaOtros() {
        try {
            const categorias = await window.gastosDB.obtenerCategorias();
            this.categoriaOtros = categorias.find(cat => cat.nombre === 'Otros Gastos' || cat.nombre === 'Otros');
            
            if (!this.categoriaOtros) {
                // Crear la categoría "Otros Gastos" si no existe
                const id = await window.gastosDB.insertarCategoria({
                    nombre: 'Otros Gastos',
                    color: '#95A5A6'
                });
                this.categoriaOtros = { id, nombre: 'Otros Gastos', color: '#95A5A6' };
            }
        } catch (error) {
            console.error('Error al asegurar categoría Otros:', error);
        }
    }

    // Cargar categorías en los select del DOM
    async cargarCategoriasEnSelect() {
        try {
            const categorias = await window.gastosDB.obtenerCategorias();
            
            // Selects a actualizar
            const selects = [
                document.getElementById('categoria'),
                document.getElementById('editarCategoria'),
                document.getElementById('filtroCategoria')
            ];

            selects.forEach(select => {
                if (select) {
                    // Limpiar opciones existentes excepto la primera
                    const firstOption = select.firstElementChild;
                    select.innerHTML = '';
                    if (firstOption && firstOption.value === '') {
                        select.appendChild(firstOption);
                    }

                    // Agregar categorías
                    categorias.forEach(categoria => {
                        const option = document.createElement('option');
                        option.value = categoria.id;
                        option.textContent = categoria.nombre;
                        option.style.color = categoria.color;
                        select.appendChild(option);
                    });
                }
            });
        } catch (error) {
            console.error('Error al cargar categorías en select:', error);
        }
    }

    // Mostrar modal de gestión de categorías
    mostrarGestorCategorias() {
        this.crearModalCategorias();
        this.cargarListaCategorias();
    }

    // Crear el modal de gestión de categorías
    crearModalCategorias() {
        // Eliminar modal existente si existe
        const modalExistente = document.getElementById('modalCategorias');
        if (modalExistente) {
            modalExistente.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'modalCategorias';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <span class="close" onclick="cerrarModalCategorias()">&times;</span>
                <h2>🏷️ Gestión de Categorías</h2>
                
                <!-- Formulario para nueva categoría -->
                <div class="categoria-form">
                    <h3>Agregar Nueva Categoría</h3>
                    <form id="formNuevaCategoria" onsubmit="agregarCategoria(event)">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="nombreCategoria">Nombre:</label>
                                <input type="text" id="nombreCategoria" required maxlength="50">
                            </div>
                            <div class="form-group">
                                <label for="colorCategoria">Color:</label>
                                <div class="color-input-group">
                                    <input type="color" id="colorCategoria" value="#667eea">
                                    <div class="color-presets">
                                        <button type="button" class="color-preset" style="background: #FF6B6B" onclick="setColor('#FF6B6B')"></button>
                                        <button type="button" class="color-preset" style="background: #4ECDC4" onclick="setColor('#4ECDC4')"></button>
                                        <button type="button" class="color-preset" style="background: #45B7D1" onclick="setColor('#45B7D1')"></button>
                                        <button type="button" class="color-preset" style="background: #96CEB4" onclick="setColor('#96CEB4')"></button>
                                        <button type="button" class="color-preset" style="background: #FFEAA7" onclick="setColor('#FFEAA7')"></button>
                                        <button type="button" class="color-preset" style="background: #DDA0DD" onclick="setColor('#DDA0DD')"></button>
                                        <button type="button" class="color-preset" style="background: #95A5A6" onclick="setColor('#95A5A6')"></button>
                                    </div>
                                </div>
                            </div>
                            <div class="form-group">
                                <button type="submit" class="btn btn-primary">➕ Agregar</button>
                            </div>
                        </div>
                    </form>
                </div>

                <!-- Lista de categorías existentes -->
                <div class="categorias-lista">
                    <h3>Categorías Existentes</h3>
                    <div id="listaCategorias">
                        <!-- Se llena dinámicamente -->
                    </div>
                </div>
            </div>
        `;

        // Agregar estilos específicos del modal
        if (!document.getElementById('modalCategoriasStyles')) {
            const styles = document.createElement('style');
            styles.id = 'modalCategoriasStyles';
            styles.innerHTML = `
                .modal-large {
                    max-width: 800px;
                    width: 95%;
                }
                
                .categoria-form {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 30px;
                }
                
                .form-row {
                    display: flex;
                    gap: 15px;
                    align-items: end;
                    flex-wrap: wrap;
                }
                
                .form-row .form-group {
                    flex: 1;
                    min-width: 150px;
                }
                
                .color-input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                
                .color-presets {
                    display: flex;
                    gap: 5px;
                    flex-wrap: wrap;
                }
                
                .color-preset {
                    width: 25px;
                    height: 25px;
                    border: 2px solid #ddd;
                    border-radius: 50%;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                
                .color-preset:hover {
                    transform: scale(1.1);
                    border-color: #333;
                }
                
                .categoria-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px;
                    background: white;
                    border-radius: 8px;
                    margin-bottom: 10px;
                    border-left: 5px solid;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                
                .categoria-info {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    flex: 1;
                }
                
                .categoria-color {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    border: 2px solid #ddd;
                }
                
                .categoria-nombre {
                    font-weight: 600;
                    font-size: 16px;
                }
                
                .categoria-stats {
                    font-size: 14px;
                    color: #666;
                }
                
                .categoria-actions {
                    display: flex;
                    gap: 8px;
                }
                
                .btn-icon {
                    padding: 8px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s;
                }
                
                .btn-edit {
                    background: #e3f2fd;
                    color: #1976d2;
                }
                
                .btn-edit:hover {
                    background: #bbdefb;
                }
                
                .btn-delete {
                    background: #ffebee;
                    color: #d32f2f;
                }
                
                .btn-delete:hover {
                    background: #ffcdd2;
                }
                
                .btn-delete:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    // Cargar la lista de categorías en el modal
    async cargarListaCategorias() {
        try {
            const categorias = await window.gastosDB.obtenerCategorias();
            const gastos = await window.gastosDB.obtenerGastos();
            
            const container = document.getElementById('listaCategorias');
            container.innerHTML = '';

            if (categorias.length === 0) {
                container.innerHTML = '<p>No hay categorías disponibles.</p>';
                return;
            }

            categorias.forEach(categoria => {
                // Contar gastos por categoría
                const gastosCategoria = gastos.filter(g => g.categoria_id === categoria.id);
                const totalGastos = gastosCategoria.reduce((sum, g) => sum + g.monto, 0);
                
                const item = document.createElement('div');
                item.className = 'categoria-item';
                item.style.borderLeftColor = categoria.color;
                
                const esOtros = categoria.nombre === 'Otros Gastos' || categoria.nombre === 'Otros';
                
                item.innerHTML = `
                    <div class="categoria-info">
                        <div class="categoria-color" style="background-color: ${categoria.color}"></div>
                        <div>
                            <div class="categoria-nombre">${categoria.nombre}</div>
                            <div class="categoria-stats">
                                ${gastosCategoria.length} gastos • $${totalGastos.toFixed(2)}
                            </div>
                        </div>
                    </div>
                    <div class="categoria-actions">
                        <button class="btn-icon btn-edit" onclick="editarCategoria(${categoria.id})" title="Editar">
                            ✏️
                        </button>
                        <button class="btn-icon btn-delete" 
                                onclick="eliminarCategoria(${categoria.id})" 
                                ${esOtros ? 'disabled title="No se puede eliminar la categoría Otros"' : 'title="Eliminar"'}>
                            🗑️
                        </button>
                    </div>
                `;
                
                container.appendChild(item);
            });
        } catch (error) {
            console.error('Error al cargar lista de categorías:', error);
        }
    }

    // Agregar nueva categoría
    async agregarCategoria(event) {
        event.preventDefault();
        
        try {
            mostrarLoading(true);
            
            const nombre = document.getElementById('nombreCategoria').value.trim();
            const color = document.getElementById('colorCategoria').value;
            
            if (!nombre) {
                mostrarToast('El nombre de la categoría es requerido', 'error');
                return;
            }

            // Verificar que no exista una categoría con el mismo nombre
            const categorias = await window.gastosDB.obtenerCategorias();
            const existeNombre = categorias.some(cat => 
                cat.nombre.toLowerCase() === nombre.toLowerCase()
            );
            
            if (existeNombre) {
                mostrarToast('Ya existe una categoría con ese nombre', 'error');
                return;
            }

            await window.gastosDB.insertarCategoria({ nombre, color });
            
            // Limpiar formulario
            document.getElementById('formNuevaCategoria').reset();
            document.getElementById('colorCategoria').value = '#667eea';
            
            // Actualizar listas
            await this.cargarListaCategorias();
            await this.cargarCategoriasEnSelect();
            
            mostrarToast('Categoría agregada exitosamente', 'success');
            
        } catch (error) {
            console.error('Error al agregar categoría:', error);
            mostrarToast('Error al agregar la categoría', 'error');
        } finally {
            mostrarLoading(false);
        }
    }

    // Editar categoría
    async editarCategoria(id) {
        try {
            const categorias = await window.gastosDB.obtenerCategorias();
            const categoria = categorias.find(cat => cat.id === id);
            
            if (!categoria) {
                mostrarToast('Categoría no encontrada', 'error');
                return;
            }

            const nuevoNombre = prompt('Nuevo nombre para la categoría:', categoria.nombre);
            if (!nuevoNombre || nuevoNombre.trim() === '') return;

            const nuevoColor = prompt('Nuevo color (código hex):', categoria.color);
            if (!nuevoColor) return;

            // Verificar que no exista otra categoría con el mismo nombre
            const existeNombre = categorias.some(cat => 
                cat.id !== id && cat.nombre.toLowerCase() === nuevoNombre.toLowerCase()
            );
            
            if (existeNombre) {
                mostrarToast('Ya existe una categoría con ese nombre', 'error');
                return;
            }

            mostrarLoading(true);
            
            await window.gastosDB.editarCategoria(id, {
                nombre: nuevoNombre.trim(),
                color: nuevoColor
            });
            
            await this.cargarListaCategorias();
            await this.cargarCategoriasEnSelect();
            
            mostrarToast('Categoría actualizada exitosamente', 'success');
            
        } catch (error) {
            console.error('Error al editar categoría:', error);
            mostrarToast('Error al editar la categoría', 'error');
        } finally {
            mostrarLoading(false);
        }
    }

    // Eliminar categoría
    async eliminarCategoria(id) {
        try {
            const categorias = await window.gastosDB.obtenerCategorias();
            const categoria = categorias.find(cat => cat.id === id);
            
            if (!categoria) {
                mostrarToast('Categoría no encontrada', 'error');
                return;
            }

            // No permitir eliminar la categoría "Otros"
            if (categoria.nombre === 'Otros Gastos' || categoria.nombre === 'Otros') {
                mostrarToast('No se puede eliminar la categoría Otros', 'error');
                return;
            }

            const gastos = await window.gastosDB.obtenerGastos();
            const gastosCategoria = gastos.filter(g => g.categoria_id === id);
            
            let mensaje = `¿Estás seguro de eliminar la categoría "${categoria.nombre}"?`;
            if (gastosCategoria.length > 0) {
                mensaje += `\n\nEsta categoría tiene ${gastosCategoria.length} gasto(s) asociado(s). Estos gastos se reasignarán a "Otros Gastos".`;
            }
            
            if (!confirm(mensaje)) return;

            mostrarLoading(true);
            
            // Asegurar que existe la categoría "Otros Gastos"
            await this.asegurarCategoriaOtros();
            
            // Reasignar gastos a "Otros Gastos"
            if (gastosCategoria.length > 0) {
                for (const gasto of gastosCategoria) {
                    await window.gastosDB.editarGasto(gasto.id, {
                        categoria_id: this.categoriaOtros.id
                    });
                }
            }
            
            // Eliminar la categoría
            await window.gastosDB.eliminarCategoria(id);
            
            await this.cargarListaCategorias();
            await this.cargarCategoriasEnSelect();
            
            // Actualizar gráfico si existe
            if (window.actualizarGrafico) {
                window.actualizarGrafico();
            }
            
            const gastosReasignados = gastosCategoria.length > 0 ? 
                ` ${gastosCategoria.length} gasto(s) fueron reasignados a "Otros Gastos".` : '';
            
            mostrarToast(`Categoría eliminada exitosamente.${gastosReasignados}`, 'success');
            
        } catch (error) {
            console.error('Error al eliminar categoría:', error);
            mostrarToast('Error al eliminar la categoría', 'error');
        } finally {
            mostrarLoading(false);
        }
    }
}

// Crear instancia global
const categoriasManager = new CategoriasManager();

// Funciones globales para usar desde HTML
window.categoriasManager = categoriasManager;
window.mostrarGestorCategorias = () => categoriasManager.mostrarGestorCategorias();
window.agregarCategoria = (event) => categoriasManager.agregarCategoria(event);
window.editarCategoria = (id) => categoriasManager.editarCategoria(id);
window.eliminarCategoria = (id) => categoriasManager.eliminarCategoria(id);

window.cerrarModalCategorias = () => {
    const modal = document.getElementById('modalCategorias');
    if (modal) {
        modal.remove();
    }
};

window.setColor = (color) => {
    document.getElementById('colorCategoria').value = color;
};

// Inicializar cuando la base de datos esté lista
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.gastosDB && window.gastosDB.db) {
            categoriasManager.init();
        } else {
            // Esperar un poco más
            setTimeout(() => {
                categoriasManager.init();
            }, 1000);
        }
    }, 500);
});
