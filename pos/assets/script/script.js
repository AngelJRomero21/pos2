async function cargarDatos() {
    try {
        const response = await fetch('/pos/json/comercio.json');
        const datosComercio = await response.json();
        return datosComercio;
    } catch (error) {
        console.error("Error al cargar los datos del comercio:", error);
        alert("Error al cargar los datos del comercio.");
    }
}

document.addEventListener("DOMContentLoaded", function() {
    const rememberedUsername = localStorage.getItem("rememberedUsername");
    if (rememberedUsername) {
        document.getElementById("username").value = rememberedUsername;
        document.getElementById("remember-me").checked = true;
    }
});

document.getElementById("login-form").addEventListener("submit", async function(event) {
    event.preventDefault();

    const datosComercio = await cargarDatos();
    const usuarioIngresado = document.getElementById("username").value;
    const contrasenaIngresada = document.getElementById("password").value;
    const rememberMeChecked = document.getElementById("remember-me").checked;

    if (usuarioIngresado === datosComercio.usuario && contrasenaIngresada === datosComercio.contrasena) {
        if (rememberMeChecked) {
            localStorage.setItem("rememberedUsername", usuarioIngresado);
        } else {
            localStorage.removeItem("rememberedUsername");
        }
        document.getElementById("login-container").style.transform = "translateX(-100%)";
        setTimeout(() => {
            document.getElementById("login-container").style.display = "none";
            document.getElementById("pos-container").style.display = "block";
            document.getElementById("pos-container").style.transform = "translateX(0)";
        }, 500);
        document.getElementById("nombre-comercio").textContent = datosComercio.comercio;
        document.getElementById("logo").src = datosComercio.logo;
    } else {
        alert("Usuario o contraseña incorrectos.");
    }
});

// Función para traducir el código de razón a un mensaje comprensible
function obtenerMensajeDeRazon(codigoRazon) {
const mensajesDeRazon = {
    "AB01": "Tiempo de espera agotado",
    "AB07": "Agente fuera de línea",
    "AC01": "Número de cuenta incorrecto",
    "AC04": "Cuenta cancelada",
    "AC06": "Cuenta bloqueada",
    "AC09": "Moneda no válida",
    "ACCP": "Operación Aceptada",
    "AG01": "Transacción Restringida",
    "AG10": "Agente suspendido o excluido",
    "AM02": "Monto de la transacción no permitido",
    "AM03": "Moneda no permitida",
    "AM04": "Saldo insuficiente",
    "AM05": "Operación duplicada",
    "BE01": "Datos del cliente no corresponden a la cuenta",
    "BE20": "Longitud del nombre inválida",
    "CH20": "Número de decimales incorrecto",
    "CUST": "Cancelación solicitada por el deudor",
    "DS02": "Operación cancelada",
    "DT03": "Fecha de procesamiento no bancaria no válida",
    "FF05": "Código del producto incorrecto",
    "FF07": "Código del subproducto incorrecto",
    "MD01": "No posee afiliación",
    "MD09": "Afiliación Inactiva",
    "MD15": "Monto incorrecto",
    "MD21": "Cobro no permitido",
    "MD22": "Afiliación Suspendida",
    "RC08": "Código del Banco no existe en el sistema de compensación/Liquidación",
    "TKCM": "Código único de operación de débito incorrecto",
    "AG09": "Pago no recibido",
    "TM01": "Fuera del horario permitido",
    "VE01": "Rechazo técnico",
    "VE02": "Rechazo técnico",
    "VE03": "Pago en curso",
    "VE04": "Pago ya realizado"
};

return mensajesDeRazon[codigoRazon] || "Código de razón desconocido";
}





document.getElementById("payment-form").addEventListener("submit", function(event) {
event.preventDefault();

let amount = document.getElementById("amount").value;
amount = amount.replace(",", ".");

if (isNaN(amount) || parseFloat(amount) <= 0) {
    alert("Por favor, ingresa un monto válido.");
    return;
}

const bpayKey = "MWQ3OTUwYjAtNWRhYy00MWIyLWIyZGEtNjc1MjVmNTQ2NGFj";
const reference = `REF${Date.now()}`;

if (amount) {
    const config = {
        clientId: bpayKey,
        amount: parseFloat(amount),
        ref: reference,
        onConnected: (res) => {
            console.log("Conexión establecida:", res);
        },
        onSuccess: async (res) => {
            console.log("Respuesta exitosa:", res);  // Mostrar en consola

            const razonCodigo = res.data.Rsn || res.data.Sts;
            const mensajeTraducido = obtenerMensajeDeRazon(razonCodigo);

            alert(`Pago exitoso: ${mensajeTraducido}`);  // Mostrar alerta con el mensaje traducido

            const instrId = res.data.InstrId;
            const nbDbtr = res.data.NbDbtr;
            const e2e = res.data.E2E;

            const descripcion = `InstrId: ${instrId}, NbDbtr: ${nbDbtr}, E2E: ${e2e}`;
            
            const payload = {
                amount: parseFloat(amount),
                description: descripcion,
                currency: "unit",
                subject: "paquechiroco",
                type: "debit.toUser"
            };

            try {
                const apiResponse = await fetch('https://apisms.cromstudio.com.ve:2053/api/payments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload)
                });

                const responseData = await apiResponse.json();
                console.log("Respuesta de la API:", responseData);
                agregarTransaccionAlHistorial(amount, 'Éxito');
            } catch (error) {
                console.error("Error al enviar datos a la API:", error);
                agregarTransaccionAlHistorial(amount, 'Error');
            }
        },
        onReject: (res) => {
            console.log("Respuesta rechazada:", res);  // Mostrar en consola

            const razonCodigo = res.data.Rsn || res.data.Sts;
            const mensajeTraducido = obtenerMensajeDeRazon(razonCodigo);

            alert(`Pago rechazado: ${mensajeTraducido}`);  // Mostrar alerta con el mensaje traducido

            agregarTransaccionAlHistorial(amount, 'Rechazado');
        },
        onError: (res) => {
            console.log("Error en la transacción:", res);  // Mostrar en consola

            const razonCodigo = res.data.Rsn || res.data.Sts;
            const mensajeTraducido = obtenerMensajeDeRazon(razonCodigo);

            alert(`Error en la transacción: ${mensajeTraducido}`);  // Mostrar alerta con el mensaje traducido

            agregarTransaccionAlHistorial(amount, 'Error');
        },
    };

    if (typeof bpay !== "undefined") {
        bpay(config).render("bpay-container");
    } else {
        alert("El SDK de BPAY no se ha cargado correctamente.");
    }
} else {
    alert("Por favor, ingresa un monto válido.");
}
});

document.getElementById("logout").addEventListener("click", function() {
    document.getElementById("pos-container").style.transform = "translateX(100%)";
    setTimeout(() => {
        document.getElementById("pos-container").style.display = "none";
        document.getElementById("login-container").style.display = "block";
        document.getElementById("login-container").style.transform = "translateX(0)";
    }, 500);
});

document.getElementById("export-pdf").addEventListener("click", function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.text("Historial de Transacciones", 10, 10);
    
    let y = 20;
    const transactions = document.querySelectorAll(".transaction");
    transactions.forEach((transaction) => {
        const amount = transaction.querySelector(".amount").textContent;
        const status = transaction.querySelector(".status").textContent;
        doc.text(`${amount} - ${status}`, 10, y);
        y += 10;
    });
    
    doc.save("historial_transacciones.pdf");
});

document.getElementById("export-txt").addEventListener("click", function() {
    let content = "Historial de Transacciones\n\n";
    const transactions = document.querySelectorAll(".transaction");
    transactions.forEach((transaction) => {
        const amount = transaction.querySelector(".amount").textContent;
        const status = transaction.querySelector(".status").textContent;
        content += `${amount} - ${status}\n`;
    });

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "historial_transacciones.txt";
    link.click();
    URL.revokeObjectURL(url);
});

function agregarTransaccionAlHistorial(amount, status) {
const transactionList = document.getElementById("transaction-list");
const transactionElement = document.createElement("div");
transactionElement.classList.add("transaction");
transactionElement.innerHTML = `<span class="amount">Bs${parseFloat(amount).toFixed(2)}</span> <span class="status">${status}</span>`;
transactionList.appendChild(transactionElement);
}