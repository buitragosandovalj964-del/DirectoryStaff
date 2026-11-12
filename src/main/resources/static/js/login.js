"use strict";

const alertBox = document.getElementById("authAlert");

function mostrarAlerta(tipo, texto) {
  alertBox.className = "auth-alert " + tipo;
  alertBox.textContent = texto;
  alertBox.hidden = false;
}

/* Lee parámetros enviados por Spring Security (?error=true&restantes=X, ?bloqueado=true, ?logout=true) */
const params = new URLSearchParams(window.location.search);
if (params.has("bloqueado")) {
  mostrarAlerta("error", "Has superado el límite de 3 intentos fallidos. Acceso bloqueado.");
} else if (params.has("error")) {
  const restantes = params.get("restantes");
  const texto = restantes
    ? `Usuario o contraseña incorrectos. Te queda${restantes === "1" ? "" : "n"} ${restantes} intento${restantes === "1" ? "" : "s"}.`
    : "Usuario o contraseña incorrectos.";
  mostrarAlerta("error", texto);
} else if (params.has("logout")) {
  mostrarAlerta("exito", "Sesión cerrada correctamente.");
}
