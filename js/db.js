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
            gastosStore.createIndex('categoria_id', 'categoria_id', { unique: false }); // Cambio: usar categoria_id
        }

        // Insertar categorías predeterminadas usando la transacción existente
        this.insertarCategoriasPredeterminadas(transaction);
    }

    insertarCategoriasPredeterminadas(transaction) {
        const categoriasPredeterminadas = [
            { nombre: 'Alimentación', icono: '🍽️', color: '#FF6B6B' },
            { nombre: 'Transporte', icono: '🚗', color: '#4ECDC4' },
            { nombre: 'Entretenimiento', icono: '🎬', color: '#45B7D1' },
            { nombre: 'Salud', icono: '🏥', color: '#96CEB4' },
            { nombre: 'Educación', icono: '📚', color: '#FFEAA7' },
            { nombre: 'Servicios', icono: '💡', color: '#DDA0DD' },
            { nombre: 'Ropa', icono: '👕', color: '#98D8C8' },
            { nombre: 'Otros', icono: '📦', color: '#F7DC6F' }
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

    // Método para agregar gasto (mantener el nombre original)
    async agregarGasto(gasto) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gastos'], 'readwrite');
            const store = transaction.objectStore('gastos');
            
            // Mantener la fecha proporcionada o usar la fecha actual si no se proporciona
            const gastoConFecha = {
                ...gasto,
                fecha: gasto.fecha || new Date().toISOString().split('T')[0],
                fechaCreacion: new Date().toISOString()
            };
            
            const request = store.add(gastoConFecha);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // NUEVO: Alias para compatibilidad con app.js
    async insertarGasto(gasto) {
        return this.agregarGasto(gasto);
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

    // NUEVO: Método para obtener un gasto por ID
    async obtenerGastoPorId(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gastos'], 'readonly');
            const store = transaction.objectStore('gastos');
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Método para obtener resumen de gastos
    async obtenerResumenGastos() {
        try {
            const gastos = await this.obtenerGastos();
            const categorias = await this.obtenerCategorias();
            const total = gastos.reduce((sum, gasto) => sum + gasto.monto, 0);
            
            // Crear mapa de categorías para acceso rápido
            const categoriasMap = {};
            categorias.forEach(cat => {
                categoriasMap[cat.id] = {
                    id: cat.id,
                    nombre: cat.nombre,
                    icono: cat.icono,
                    color: cat.color
                };
            });
            
            // Agrupar gastos por categoría - CORRECCIÓN: usar categoria_id
            const gastosPorCategoria = {};
            const coloresCategoria = [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
            ];
            
            gastos.forEach(gasto => {
                const categoriaId = gasto.categoria_id || gasto.categoria; // Compatibilidad con ambos nombres
                if (!gastosPorCategoria[categoriaId]) {
                    gastosPorCategoria[categoriaId] = {
                        categoria: categoriasMap[categoriaId]?.nombre || 'Sin categoría',
                        total: 0,
                        gastos: [],
                        color: categoriasMap[categoriaId]?.color || coloresCategoria[Object.keys(gastosPorCategoria).length % coloresCategoria.length]
                    };
                }
                gastosPorCategoria[categoriaId].total += gasto.monto;
                gastosPorCategoria[categoriaId].gastos.push(gasto);
            });
            
            // Convertir a array
            const porCategoria = Object.values(gastosPorCategoria);
            
            return {
                total: total,
                totalGastos: gastos.length,
                gastos: gastos,
                porCategoria: porCategoria
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
                const fechaGasto = new Date(gasto.fecha + 'T00:00:00'); // Agregar tiempo para evitar problemas de timezone
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
                    color: categoria.color,
                    total: 0,
                    gastos: []
                };
            });
            
            // Agrupar gastos por categoría - CORRECCIÓN: usar categoria_id
            gastos.forEach(gasto => {
                const categoriaId = gasto.categoria_id || gasto.categoria; // Compatibilidad
                if (gastosPorCategoria[categoriaId]) {
                    gastosPorCategoria[categoriaId].total += gasto.monto;
                    gastosPorCategoria[categoriaId].gastos.push(gasto);
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

    // Método para actualizar gasto - CORRECCIÓN: recibir ID y datos por separado
    async actualizarGasto(id, gastoActualizado) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gastos'], 'readwrite');
            const store = transaction.objectStore('gastos');
            
            // Primero obtener el gasto existente para mantener ciertos campos
            const getRequest = store.get(id);
            
            getRequest.onsuccess = () => {
                const gastoExistente = getRequest.result;
                if (gastoExistente) {
                    // Combinar datos existentes con actualizaciones
                    const gastoFinal = {
                        ...gastoExistente,
                        ...gastoActualizado,
                        id: id, // Mantener el ID
                        fechaModificacion: new Date().toISOString()
                    };
                    
                    const putRequest = store.put(gastoFinal);
                    
                    putRequest.onsuccess = () => resolve(putRequest.result);
                    putRequest.onerror = () => reject(putRequest.error);
                } else {
                    reject(new Error('Gasto no encontrado'));
                }
            };
            
            getRequest.onerror = () => reject(getRequest.error);
        });
    }
}

// Instancia global
const gastosDB = new GastosDB();

// Hacer disponible globalmente
window.gastosDB = gastosDB;
