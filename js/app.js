function agregarGasto() {
    let dbRequest = indexedDB.open("GastosDB", 1);
    dbRequest.onsuccess = (event) => {
        let db = event.target.result;
        let tx = db.transaction("gastos", "readwrite");
        let store = tx.objectStore("gastos");
        store.add({ id: Date.now(), categoria: "Comida", monto: Math.random() * 100 });
        console.log("Gasto agregado");
    };
}
