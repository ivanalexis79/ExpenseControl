dbRequest.onupgradeneeded = (event) => {
    let db = event.target.result;
    // Verificar si el objeto almacenado 'gastos' ya existe antes de crearlo
    if (!db.objectStoreNames.contains("gastos")) {
        db.createObjectStore("gastos", { keyPath: "id", autoIncrement: true });
    }
};


