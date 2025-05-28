// GastosDB - Sistema de base de datos IndexedDB para control de gastos personales

class GastosDB {
    constructor() {
        this.dbName = 'GastosDB';
        this.dbVersion = 1;
        this.db = null;
    }

    // Inicializar la base de datos
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                reject(new Error('Error al abrir la base de datos'));
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('Base de datos abierta correctamente');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                this.db = event.target.result;
                this.createTables();
            };
        });
    }

    // Crear las tablas (object stores)
    createTables() {
        // Tabla de categorías
        if (!this.db.objectStoreNames.contains('categorias')) {
            const categoriasStore = this.db.createObjectStore('categorias', {
                keyPath: 'id',
                autoIncrement: true
            });
            categoriasStore.createIndex('nombre', 'nombre', { unique: true });
            
            // Insertar categorías por defecto
            categoriasStore.transaction.oncomplete = () => {
                this.insertarCategoriasDefault();
            };
        }

        // Tabla de gastos
        if (!this.db.objectStoreNames.contains('gastos')) {
            const gastosStore = this.db.createObjectStore('gastos', {
                keyPath: 'id',
                autoIncrement: true
            });
            gastosStore.createIndex('fecha', 'fecha', { unique: false });
            gastosStore.createIndex('categoria_id', 'categoria_id', { unique: false });
            gastosStore.createIndex('monto', 'monto', { unique: false });
        }

        console.log('Tablas creadas correctamente');
    }

    // Insertar categorías por defecto
    async insertarCategoriasDefault() {
        const categoriasDefault = [
            { nombre: 'Alimentación', color: '#FF6B6B' },
            { nombre: 'Transporte', color: '#4ECDC4' },
            { nombre: 'Entretenimiento', color: '#45B7D1' },
            { nombre: 'Salud', color: '#96CEB4' },
            { nombre: 'Hogar', color: '#FFEAA7' },
            { nombre: 'Educación', color: '#DDA0DD' },
            { nombre: 'Otros', color: '#95A5A6' }
        ];

        for (const categoria of categoriasDefault) {
            await this.insertarCategoria(categoria);
        }
    }

    // === FUNCIONES PARA CATEGORÍAS ===

    // Insertar categoría
    async insertarCategoria(categoria) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['categorias'], 'readwrite');
            const store = transaction.objectStore('categorias');
            
            const categoriaData = {
                nombre: categoria.nombre,
                color: categoria.color || '#95A5A6',
                fecha_creacion: new Date().toISOString()
            };

            const request = store.add(categoriaData);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(new Error('Error al insertar categoría'));
            };
        });
    }

    // Obtener todas las categorías
    async obtenerCategorias() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['categorias'], 'readonly');
            const store = transaction.objectStore('categorias');
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(new Error('Error al obtener categorías'));
            };
        });
    }

    // Editar categoría
    async editarCategoria(id, datosActualizados) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['categorias'], 'readwrite');
            const store = transaction.objectStore('categorias');
            
            const getRequest = store.get(id);
            
            getRequest.onsuccess = () => {
                const categoria = getRequest.result;
                if (categoria) {
                    Object.assign(categoria, datosActualizados);
                    categoria.fecha_modificacion = new Date().toISOString();
                    
                    const updateRequest = store.put(categoria);
                    updateRequest.onsuccess = () => resolve(categoria);
                    updateRequest.onerror = () => reject(new Error('Error al actualizar categoría'));
                } else {
                    reject(new Error('Categoría no encontrada'));
                }
            };

            getRequest.onerror = () => {
                reject(new Error('Error al buscar categoría'));
            };
        });
    }

    // Eliminar categoría
    async eliminarCategoria(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['categorias'], 'readwrite');
            const store = transaction.objectStore('categorias');
            const request = store.delete(id);

            request.onsuccess = () => {
                resolve(true);
            };

            request.onerror = () => {
                reject(new Error('Error al eliminar categoría'));
            };
        });
    }

    // === FUNCIONES PARA GASTOS ===

    // Insertar gasto
    async insertarGasto(gasto) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gastos'], 'readwrite');
            const store = transaction.objectStore('gastos');
            
            const gastoData = {
                monto: parseFloat(gasto.monto),
                descripcion: gasto.descripcion || '',
                categoria_id: parseInt(gasto.categoria_id),
                fecha: gasto.fecha || new Date().toISOString().split('T')[0],
                fecha_creacion: new Date().toISOString()
            };

            const request = store.add(gastoData);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(new Error('Error al insertar gasto'));
            };
        });
    }

    // Obtener todos los gastos
    async obtenerGastos() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gastos'], 'readonly');
            const store = transaction.objectStore('gastos');
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(new Error('Error al obtener gastos'));
            };
        });
    }

    // Obtener gastos por categoría
    async obtenerGastosPorCategoria(categoriaId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gastos'], 'readonly');
            const store = transaction.objectStore('gastos');
            const index = store.index('categoria_id');
            const request = index.getAll(categoriaId);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(new Error('Error al obtener gastos por categoría'));
            };
        });
    }

    // Obtener gastos por rango de fechas
    async obtenerGastosPorFecha(fechaInicio, fechaFin) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gastos'], 'readonly');
            const store = transaction.objectStore('gastos');
            const index = store.index('fecha');
            const range = IDBKeyRange.bound(fechaInicio, fechaFin);
            const request = index.getAll(range);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(new Error('Error al obtener gastos por fecha'));
            };
        });
    }

    // Editar gasto
    async editarGasto(id, datosActualizados) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gastos'], 'readwrite');
            const store = transaction.objectStore('gastos');
            
            const getRequest = store.get(id);
            
            getRequest.onsuccess = () => {
                const gasto = getRequest.result;
                if (gasto) {
                    Object.assign(gasto, datosActualizados);
                    if (datosActualizados.monto) {
                        gasto.monto = parseFloat(datosActualizados.monto);
                    }
                    if (datosActualizados.categoria_id) {
                        gasto.categoria_id = parseInt(datosActualizados.categoria_id);
                    }
                    gasto.fecha_modificacion = new Date().toISOString();
                    
                    const updateRequest = store.put(gasto);
                    updateRequest.onsuccess = () => resolve(gasto);
                    updateRequest.onerror = () => reject(new Error('Error al actualizar gasto'));
                } else {
                    reject(new Error('Gasto no encontrado'));
                }
            };

            getRequest.onerror = () => {
                reject(new Error('Error al buscar gasto'));
            };
        });
    }

    // Eliminar gasto
    async eliminarGasto(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gastos'], 'readwrite');
            const store = transaction.objectStore('gastos');
            const request = store.delete(id);

            request.onsuccess = () => {
                resolve(true);
            };

            request.onerror = () => {
                reject(new Error('Error al eliminar gasto'));
            };
        });
    }

    // === FUNCIONES DE UTILIDAD ===

    // Obtener resumen de gastos
    async obtenerResumenGastos() {
        const gastos = await this.obtenerGastos();
        const categorias = await this.obtenerCategorias();
        
        const total = gastos.reduce((sum, gasto) => sum + gasto.monto, 0);
        
        const porCategoria = categorias.map(categoria => {
            const gastosCategoria = gastos.filter(g => g.categoria_id === categoria.id);
            const totalCategoria = gastosCategoria.reduce((sum, gasto) => sum + gasto.monto, 0);
            
            return {
                categoria: categoria.nombre,
                color: categoria.color,
                total: totalCategoria,
                cantidad: gastosCategoria.length,
                porcentaje: total > 0 ? (totalCategoria / total * 100).toFixed(2) : 0
            };
        }).filter(item => item.total > 0);

        return {
            total,
            totalGastos: gastos.length,
            porCategoria
        };
    }

    // Obtener gastos del mes actual
    async obtenerGastosMesActual() {
        const ahora = new Date();
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);
        
        return await this.obtenerGastosPorFecha(
            inicioMes.toISOString().split('T')[0],
            finMes.toISOString().split('T')[0]
        );
    }

    // Cerrar conexión a la base de datos
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}

// Inicialización y uso de la base de datos
const gastosDB = new GastosDB();

// Función para inicializar la aplicación
async function inicializarApp() {
    try {
        await gastosDB.init();
        console.log('Base de datos inicializada correctamente');
        
        // Ejemplo de uso:
        // await gastosDB.insertarGasto({
        //     monto: 25.50,
        //     descripcion: 'Almuerzo en restaurante',
        //     categoria_id: 1,
        //     fecha: '2025-05-27'
        // });
        
    } catch (error) {
        console.error('Error al inicializar la base de datos:', error);
    }
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GastosDB;
}

// Auto-inicializar si se ejecuta en el navegador
if (typeof window !== 'undefined') {
    window.GastosDB = GastosDB;
    window.gastosDB = gastosDB;
    
    // Inicializar automáticamente cuando se carga la página
    document.addEventListener('DOMContentLoaded', inicializarApp);
}
