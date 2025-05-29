class GastosDB {
    constructor() {
        this.db = null;
        this.dbName = 'GastosDB';
        this.version = 1;
    }

    async inicializar() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => reject(request.error);
            
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                this.db = event.target.result;
                const transaction = event.target.transaction; // Usar la transacción existente
                this.crearTablas(transaction); // Pasar la transacción como parámetro
            };
        });
    }

    crearTablas(transaction) {
        // Crear tabla de categorías
        if (!this.db.objectStoreNames.contains('categorias')) {
            const categoriasStore = this.db.createObjectStore('categorias', {
                keyPath: 'id',
                autoIncrement: true
            });
            categoriasStore.createIndex('nombre', 'nombre', { unique: true });
        }

        // Crear tabla de gastos
        if (!this.db.objectStoreNames.contains('gastos')) {
            const gastosStore = this.db.createObjectStore('gastos', {
                keyPath: 'id',
                autoIncrement: true
            });
            gastosStore.createIndex('fecha', 'fecha', { unique: false });
            gastosStore.createIndex('categoria', 'categoria', { unique: false });
        }

        // Insertar categorías predeterminadas usando la transacción existente
        this.insertarCategoriasPredeterminadas(transaction);
    }

    insertarCategoriasPredeterminadas(transaction) {
        const categoriasPredeterminadas = [
            { nombre: 'Alimentación', icono: '🍽️' },
            { nombre: 'Transporte', icono: '🚗' },
            { nombre: 'Entretenimiento', icono: '🎬' },
            { nombre: 'Salud', icono: '🏥' },
            { nombre: 'Educación', icono: '📚' },
            { nombre: 'Servicios', icono: '💡' },
            { nombre: 'Ropa', icono: '👕' },
            { nombre: 'Otros', icono: '📦' }
        ];

        // Usar la transacción que ya está activa
        const categoriasStore = transaction.objectStore('categorias');
        
        categoriasPredeterminadas.forEach(categoria => {
            categoriasStore.add(categoria);
        });
    }

    // Método para agregar categoría (para uso normal, fuera del upgrade)
    async agregarCategoria(categoria) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['categorias'], 'readwrite');
            const store = transaction.objectStore('categorias');
            const request = store.add(categoria);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Método para obtener todas las categorías
    async obtenerCategorias() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['categorias'], 'readonly');
            const store = transaction.objectStore('categorias');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Método para agregar gasto
    async agregarGasto(gasto) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gastos'], 'readwrite');
            const store = transaction.objectStore('gastos');
            const request = store.add({
                ...gasto,
                fecha: new Date().toISOString()
            });
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Método para obtener todos los gastos
    async obtenerGastos() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gastos'], 'readonly');
            const store = transaction.objectStore('gastos');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Método para obtener resumen de gastos
    async obtenerResumenGastos() {
        try {
            const gastos = await this.obtenerGastos();
            const total = gastos.reduce((sum, gasto) => sum + gasto.monto, 0);
            
            return {
                total: total,
                totalGastos: gastos.length,
                gastos: gastos
            };
        } catch (error) {
            throw error;
        }
    }

    // Método para obtener gastos del mes actual
    async obtenerGastosMesActual() {
        try {
            const gastos = await this.obtenerGastos();
            const fechaActual = new Date();
            const mesActual = fechaActual.getMonth();
            const añoActual = fechaActual.getFullYear();
            
            return gastos.filter(gasto => {
                const fechaGasto = new Date(gasto.fecha);
                return fechaGasto.getMonth() === mesActual && 
                       fechaGasto.getFullYear() === añoActual;
            });
        } catch (error) {
            throw error;
        }
    }

    // Método para obtener gastos por categoría
    async obtenerGastosPorCategoria() {
        try {
            const gastos = await this.obtenerGastos();
            const categorias = await this.obtenerCategorias();
            
            const gastosPorCategoria = {};
            
            // Inicializar con todas las categorías
            categorias.forEach(categoria => {
                gastosPorCategoria[categoria.id] = {
                    nombre: categoria.nombre,
                    icono: categoria.icono,
                    total: 0,
                    gastos: []
                };
            });
            
            // Agrupar gastos por categoría
            gastos.forEach(gasto => {
                if (gastosPorCategoria[gasto.categoria]) {
                    gastosPorCategoria[gasto.categoria].total += gasto.monto;
                    gastosPorCategoria[gasto.categoria].gastos.push(gasto);
                }
            });
            
            return gastosPorCategoria;
        } catch (error) {
            throw error;
        }
    }

    // Método para eliminar gasto
    async eliminarGasto(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gastos'], 'readwrite');
            const store = transaction.objectStore('gastos');
            const request = store.delete(id);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    // Método para actualizar gasto
    async actualizarGasto(gasto) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gastos'], 'readwrite');
            const store = transaction.objectStore('gastos');
            const request = store.put(gasto);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

// Instancia global
const gastosDB = new GastosDB();

// Hacer disponible globalmente
window.gastosDB = gastosDB;
