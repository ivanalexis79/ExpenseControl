
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js")
    .then(() => console.log("Service Worker registrado correctamente."))
    .catch((error) => console.error("Error al registrar Service Worker:", error));
}



let db;

const dbRequest = indexedDB.open("GastosDB", 1);

dbRequest.onsuccess = (event) => {
    db = event.target.result;
    console.log("Base de datos lista.");
};

dbRequest.onerror = (event) => {
    console.error("Error al abrir la base de datos:", event.target.error);
};

dbRequest.onupgradeneeded = (event) => {
    alert();
    let db = event.target.result;
    // Verificar si el objeto almacenado 'gastos' ya existe antes de crearlo
    if (!db.objectStoreNames.contains("gastos")) {
        db.createObjectStore("gastos", { keyPath: "id", autoIncrement: true });
    }
};

function agregarGasto() {
    if (!db) {
        console.error("La base de datos aún no está lista.");
        return;
    }

    // Verificar que el objeto almacenado 'gastos' existe antes de ejecutar la transacción
    if (!db.objectStoreNames.contains("gastos")) {
        console.error("Error: el objeto almacenado 'gastos' no existe en la base de datos.");
        return;
    }

    let tx = db.transaction("gastos", "readwrite");
    let store = tx.objectStore("gastos");
    let nuevoGasto = { id: Date.now(), categoria: "Comida", monto: Math.random() * 100 };

    let addRequest = store.add(nuevoGasto);

    addRequest.onsuccess = () => {
        console.log("Gasto agregado exitosamente:", nuevoGasto);
    };

    addRequest.onerror = (event) => {
        console.error("Error al agregar gasto:", event.target.error);
    };
}
