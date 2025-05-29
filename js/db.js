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
}

// Instancia global
const gastosDB = new GastosDB();
