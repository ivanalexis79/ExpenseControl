const dbRequest = indexedDB.open("GastosDB", 1);

dbRequest.onupgradeneeded = (event) => {
    let db = event.target.result;
    db.createObjectStore("gastos", { keyPath: "id", autoIncrement: true });
};

dbRequest.onsuccess = (event) => {
    let db = event.target.result;
    console.log("Base de datos lista.");
};
