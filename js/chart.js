// Chart.js integrado con GastosDB para mostrar gastos por categoría

class GastosChart {
    constructor() {
        this.chart = null;
        this.ctx = null;
    }

    // Inicializar el gráfico
    async init() {
        try {
            // Esperar a que GastosDB esté listo
            if (!window.gastosDB || !window.gastosDB.db) {
                console.log('Esperando a que GastosDB esté listo...');
                await this.esperarDB();
            }

            this.ctx = document.getElementById("graficoGastos").getContext("2d");
            await this.crearGrafico();
            console.log('Gráfico inicializado correctamente');
        } catch (error) {
            console.error('Error al inicializar el gráfico:', error);
            this.mostrarGraficoVacio();
        }
    }

    // Esperar a que la base de datos esté lista
    async esperarDB() {
        return new Promise((resolve) => {
            const checkDB = () => {
                if (window.gastosDB && window.gastosDB.db) {
                    resolve();
                } else {
                    setTimeout(checkDB, 100);
                }
            };
            checkDB();
        });
    }

    // Crear el gráfico con datos reales
    async crearGrafico() {
        const datosGrafico = await this.obtenerDatosGrafico();
        
        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(this.ctx, {
            type: "doughnut",
            data: {
                labels: datosGrafico.labels,
                datasets: [{
                    data: datosGrafico.valores,
                    backgroundColor: datosGrafico.colores,
                    borderColor: "#fff",
                    borderWidth: 2,
                    hoverBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%',
                animation: {
                    animateRotate: true,
                    duration: 1000
                }
            }
        });
    }

    // Obtener datos para el gráfico desde la base de datos
    async obtenerDatosGrafico() {
        try {
            const resumen = await window.gastosDB.obtenerResumenGastos();
            
            if (resumen.porCategoria.length === 0) {
                return this.datosVacios();
            }

            // Ordenar por total descendente
            const categorias = resumen.porCategoria.sort((a, b) => b.total - a.total);

            return {
                labels: categorias.map(cat => cat.categoria),
                valores: categorias.map(cat => cat.total),
                colores: categorias.map(cat => cat.color)
            };
        } catch (error) {
            console.error('Error al obtener datos para el gráfico:', error);
            return this.datosVacios();
        }
    }

    // Datos por defecto cuando no hay gastos
    datosVacios() {
        return {
            labels: ['Sin gastos registrados'],
            valores: [1],
            colores: ['#e0e0e0']
        };
    }

    // Mostrar gráfico vacío en caso de error
    mostrarGraficoVacio() {
        if (this.chart) {
            this.chart.destroy();
        }

        const ctx = document.getElementById("graficoGastos").getContext("2d");
        this.chart = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ['Error al cargar datos'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#ff6b6b'],
                    borderColor: "#fff",
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                }
            }
        });
    }

    // Actualizar el gráfico con nuevos datos
    async actualizar() {
        try {
            const datosGrafico = await this.obtenerDatosGrafico();
            
            if (this.chart) {
                this.chart.data.labels = datosGrafico.labels;
                this.chart.data.datasets[0].data = datosGrafico.valores;
                this.chart.data.datasets[0].backgroundColor = datosGrafico.colores;
                this.chart.update('active');
            } else {
                await this.crearGrafico();
            }
        } catch (error) {
            console.error('Error al actualizar el gráfico:', error);
        }
    }

    // Obtener gráfico para el mes actual
    async actualizarMesActual() {
        try {
            const gastosMes = await window.gastosDB.obtenerGastosMesActual();
            const categorias = await window.gastosDB.obtenerCategorias();
            
            if (gastosMes.length === 0) {
                const datosVacios = this.datosVacios();
                datosVacios.labels = ['Sin gastos este mes'];
                this.actualizarConDatos(datosVacios);
                return;
            }

            // Agrupar gastos por categoría
            const gastosPorCategoria = {};
            gastosMes.forEach(gasto => {
                if (!gastosPorCategoria[gasto.categoria_id]) {
                    gastosPorCategoria[gasto.categoria_id] = 0;
                }
                gastosPorCategoria[gasto.categoria_id] += gasto.monto;
            });

            // Crear datos para el gráfico
            const labels = [];
            const valores = [];
            const colores = [];

            Object.keys(gastosPorCategoria).forEach(categoriaId => {
                const categoria = categorias.find(cat => cat.id == categoriaId);
                if (categoria) {
                    labels.push(categoria.nombre);
                    valores.push(gastosPorCategoria[categoriaId]);
                    colores.push(categoria.color);
                }
            });

            this.actualizarConDatos({ labels, valores, colores });
        } catch (error) {
            console.error('Error al actualizar gráfico del mes:', error);
        }
    }

    // Actualizar el gráfico con datos específicos
    actualizarConDatos(datos) {
        if (this.chart) {
            this.chart.data.labels = datos.labels;
            this.chart.data.datasets[0].data = datos.valores;
            this.chart.data.datasets[0].backgroundColor = datos.colores;
            this.chart.update('active');
        }
    }

    // Destruir el gráfico
    destruir() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }
}

// Crear instancia global del gráfico
const gastosChart = new GastosChart();

// Función para inicializar el gráfico
async function inicializarGrafico() {
    try {
        await gastosChart.init();
    } catch (error) {
        console.error('Error al inicializar el gráfico:', error);
    }
}

// Funciones de utilidad para usar desde otros archivos
window.gastosChart = gastosChart;

// Función para actualizar el gráfico después de agregar/editar/eliminar gastos
window.actualizarGrafico = () => gastosChart.actualizar();

// Función para mostrar solo gastos del mes actual
window.mostrarGraficoMesActual = () => gastosChart.actualizarMesActual();

// Auto-inicializar cuando la página esté cargada
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Esperar un poco más para asegurar que GastosDB esté listo
        setTimeout(inicializarGrafico, 500);
    });
} else {
    setTimeout(inicializarGrafico, 500);
}

// También inicializar cuando GastosDB esté listo (por si acaso)
window.addEventListener('load', () => {
    setTimeout(inicializarGrafico, 1000);
});
