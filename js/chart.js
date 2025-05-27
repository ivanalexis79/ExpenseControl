const ctx = document.getElementById("graficoGastos").getContext("2d");
const chart = new Chart(ctx, {
    type: "doughnut",
    data: {
        labels: ["Comida", "Transporte", "Entretenimiento"],
        datasets: [{
            data: [50, 30, 20],
            backgroundColor: ["#ff6384", "#36a2eb", "#ffce56"]
        }]
    }
});
