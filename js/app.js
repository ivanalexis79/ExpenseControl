let db;

const dbRequest = indexedDB.open("GastosDB", 1);

dbRequest.onsuccess = (event) => {
    db = event.target.result;
    console.log("Base de datos lista.");
};

function agregarGasto() {
    if (!db) {
        console.error("La base de datos aún no está lista.");
        return;
    }

    let tx = db.transaction("gastos", "readwrite");
    let store = tx.objectStore("gastos");
    store.add({ id: Date.now(), categoria: "Comida", monto: Math.random() * 100 });

    tx.oncomplete = () => {
        console.log("Gasto agregado exitosamente.");
    };

    tx.onerror = (event) => {
        console.error("Error al agregar gasto:", event.target.error);
    };
}
