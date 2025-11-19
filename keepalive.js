const https = require("https");

const URL = "https://skill-backend-ijg4.onrender.com/";

function ping() {
    console.log(`[${new Date().toISOString()}] → Enviando ping a Render...`);

    https.get(URL, (res) => {
        console.log(`Respuesta: ${res.statusCode}`);
    }).on("error", (err) => {
        console.error("Error en la petición:", err.message);
    });
}

// Ejecutar inmediatamente al arrancar
ping();

// Ejecutar cada 2 minutos (120.000 ms)
setInterval(ping, 120000);