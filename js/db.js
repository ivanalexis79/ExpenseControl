const dbRequest = indexedDB.open("GastosDB", 1);

dbRequest.onupgradeneeded = (event) => {
    let db = event.target.result;
    // Verificar si el objeto almacenado 'gastos' ya existe antes de crearlo
    if (!db.objectStoreNames.contains("gastos")) {
        db.createObjectStore("gastos", { keyPath: "id", autoIncrement: true });
    }
};

dbRequest.onsuccess = (event) => {
    let db = event.target.result;
    console.log("Base de datos lista.");
};
