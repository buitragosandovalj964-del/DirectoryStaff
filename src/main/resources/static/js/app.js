"use strict";

const API = "/api/v1/funcionarios";

/* ---------- Referencias al DOM ---------- */
const $ = (id) => document.getElementById(id);
const tablaCuerpo = $("tablaCuerpo");
const estadoVacio = $("estadoVacio");
const resultadoInfo = $("resultadoInfo");
const form = $("formFuncionario");
const campos = { nombre: $("fNombre"), cargo: $("fCargo"), departamento: $("fDepto"), telefono: $("fTelefono") };

/* ---------- Estado ---------- */
let todos = [];            // listado completo (para estadísticas y gráfico)
let idEnEdicion = null;    // null = modo registrar
let idPorEliminar = null;

/* ---------- Utilidades ---------- */
function colorDe(texto) {
  let h = 0;
  for (const c of texto.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) % 997;
  return h % 5;
}

function iniciales(nombre) {
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] || "") + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}

function crear(tag, clase, texto) {
  const el = document.createElement(tag);
  if (clase) el.className = clase;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

/* ---------- Notificaciones ---------- */
function notificar(tipo, titulo, mensaje) {
  const t = crear("div", "toast " + tipo);
  const cuerpo = crear("div");
  cuerpo.appendChild(crear("strong", "", titulo));
  if (mensaje) cuerpo.appendChild(crear("span", "muted", mensaje));
  t.appendChild(cuerpo);
  $("toasts").appendChild(t);
  setTimeout(() => {
    t.classList.add("salida");
    setTimeout(() => t.remove(), 300);
  }, 4000);
}

/* ---------- Comunicación con la API ---------- */
async function pedir(url, opciones) {
  let resp;
  try {
    resp = await fetch(url, opciones);
  } catch (e) {
    throw { red: true, mensaje: "No se pudo conectar con el servidor." };
  }
  if (resp.redirected && resp.url.includes("login.html")) {
    window.location.href = "/login.html";
    throw { red: true, mensaje: "Sesión expirada. Redirigiendo al login..." };
  }
  if (resp.status === 401) {
    window.location.href = "/login.html";
    throw { red: true, mensaje: "Debes iniciar sesión." };
  }
  let cuerpo = null;
  if (resp.status !== 204) {
    try { cuerpo = await resp.json(); } catch (e) { cuerpo = null; }
  }
  return { status: resp.status, ok: resp.ok, cuerpo };
}

function textoError(resp) {
  if (resp.cuerpo?.detalles?.length) return resp.cuerpo.detalles.join(" · ");
  return resp.cuerpo?.mensaje || "Ocurrió un error inesperado.";
}

function errorDeRed(e) {
  notificar("error", "Error de conexión", e?.mensaje || "Ocurrió un error inesperado.");
}

/* ---------- Carga y renderizado ---------- */
async function cargarTodos() {
  try {
    const r = await pedir(API);
    todos = r.status === 200 ? r.cuerpo : [];
    actualizarEstadisticas();
    return r.ok;
  } catch (e) {
    errorDeRed(e);
    return false;
  }
}

async function mostrarListadoCompleto() {
  $("buscarNombre").value = "";
  $("buscarDepto").value = "";
  $("buscarId").value = "";
  if (await cargarTodos()) {
    pintarTabla(todos, "Listado completo", "El directorio está vacío", "Registra al primer funcionario con el botón «Nuevo funcionario».");
  }
}

async function refrescarVistaActual(vista) {
  // Tras guardar/eliminar: se vuelve al listado completo, que refleja el cambio.
  await mostrarListadoCompleto();
}

function actualizarEstadisticas() {
  const deptos = new Map();
  let conTel = 0;
  todos.forEach((f) => {
    const clave = f.departamento.toLowerCase();
    const actual = deptos.get(clave) || { nombre: f.departamento, n: 0 };
    actual.n++;
    deptos.set(clave, actual);
    if (f.telefono) conTel++;
  });
  $("statTotal").textContent = todos.length;
  $("statDeptos").textContent = deptos.size;
  $("statConTel").textContent = conTel;
  $("statSinTel").textContent = todos.length - conTel;

  // datalist de departamentos existentes
  const lista = $("listaDeptos");
  lista.replaceChildren();
  [...deptos.values()].sort((a, b) => a.nombre.localeCompare(b.nombre)).forEach((d) => {
    const o = document.createElement("option");
    o.value = d.nombre;
    lista.appendChild(o);
  });

  pintarGrafico([...deptos.values()].sort((a, b) => b.n - a.n));
}

function pintarGrafico(items) {
  const cont = $("graficoDeptos");
  cont.replaceChildren();
  $("graficoVacio").hidden = items.length > 0;
  const max = Math.max(1, ...items.map((i) => i.n));
  const colores = ["var(--azul)", "var(--menta)", "var(--amarillo)", "var(--coral)", "var(--noche)"];
  items.forEach((d) => {
    const fila = crear("div", "bar-item");
    fila.title = "Filtrar por " + d.nombre;
    const top = crear("div", "bar-top");
    top.append(crear("span", "", d.nombre), crear("span", "", String(d.n)));
    const pista = crear("div", "bar-track");
    const relleno = crear("div", "bar-fill");
    relleno.style.width = (d.n / max) * 100 + "%";
    relleno.style.background = colores[colorDe(d.nombre)];
    pista.appendChild(relleno);
    fila.append(top, pista);
    fila.addEventListener("click", () => {
      $("buscarDepto").value = d.nombre;
      buscarPorDepartamento();
    });
    cont.appendChild(fila);
  });
}

function pintarTabla(lista, descripcion, tituloVacio, textoVacio) {
  tablaCuerpo.replaceChildren();
  const hay = lista.length > 0;
  estadoVacio.hidden = hay;
  $("vacioTitulo").textContent = tituloVacio;
  $("vacioTexto").textContent = textoVacio;
  resultadoInfo.textContent = hay ? `${descripcion} · ${lista.length} resultado${lista.length === 1 ? "" : "s"}` : descripcion;

  lista.forEach((f) => {
    const tr = document.createElement("tr");

    const tdId = crear("td", "td-id", "#" + f.id);
    tdId.dataset.label = "ID";

    const tdNombre = document.createElement("td");
    tdNombre.dataset.label = "Nombre";
    const persona = crear("div", "persona");
    persona.append(crear("span", "avatar av-" + colorDe(f.nombre), iniciales(f.nombre)), crear("span", "", f.nombre));
    tdNombre.appendChild(persona);

    const tdCargo = crear("td", "", f.cargo);
    tdCargo.dataset.label = "Cargo";

    const tdDepto = document.createElement("td");
    tdDepto.dataset.label = "Departamento";
    tdDepto.appendChild(crear("span", "tag tag-" + colorDe(f.departamento), f.departamento));

    const tdTel = crear("td", f.telefono ? "" : "sin-dato", f.telefono || "—");
    tdTel.dataset.label = "Teléfono";

    const tdAcc = document.createElement("td");
    tdAcc.dataset.label = "Acciones";
    const acc = crear("div", "acciones");
    const bEditar = crear("button", "icon-btn editar");
    bEditar.type = "button";
    bEditar.title = "Editar";
    bEditar.setAttribute("aria-label", "Editar " + f.nombre);
    bEditar.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
    bEditar.addEventListener("click", () => abrirFormulario(f));
    const bEliminar = crear("button", "icon-btn eliminar");
    bEliminar.type = "button";
    bEliminar.title = "Eliminar";
    bEliminar.setAttribute("aria-label", "Eliminar " + f.nombre);
    bEliminar.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>';
    bEliminar.addEventListener("click", () => pedirConfirmacion(f));
    acc.append(bEditar, bEliminar);
    tdAcc.appendChild(acc);

    tr.append(tdId, tdNombre, tdCargo, tdDepto, tdTel, tdAcc);
    tablaCuerpo.appendChild(tr);
  });
}

/* ---------- Búsquedas ---------- */
async function buscarPorNombre() {
  const valor = $("buscarNombre").value.trim();
  if (!valor) return mostrarListadoCompleto();
  $("buscarDepto").value = "";
  $("buscarId").value = "";
  try {
    const r = await pedir(`${API}?nombre=${encodeURIComponent(valor)}`);
    if (r.status === 200) {
      pintarTabla(r.cuerpo, `Nombre que contiene «${valor}»`, "", "");
    } else if (r.status === 204) {
      pintarTabla([], `Nombre que contiene «${valor}»`, "Sin resultados", `No hay funcionarios cuyo nombre contenga «${valor}».`);
      notificar("info", "Sin resultados", `Ningún nombre contiene «${valor}».`);
    } else {
      notificar("error", "No se pudo buscar", textoError(r));
    }
  } catch (e) { errorDeRed(e); }
}

async function buscarPorDepartamento() {
  const valor = $("buscarDepto").value.trim();
  if (!valor) return mostrarListadoCompleto();
  $("buscarNombre").value = "";
  $("buscarId").value = "";
  try {
    const r = await pedir(`${API}?departamento=${encodeURIComponent(valor)}`);
    if (r.status === 200) {
      pintarTabla(r.cuerpo, `Departamento «${valor}»`, "", "");
    } else if (r.status === 204) {
      pintarTabla([], `Departamento «${valor}»`, "Sin resultados", `No hay funcionarios en el departamento «${valor}». Escribe el nombre completo del área.`);
      notificar("info", "Sin resultados", `Ningún funcionario en «${valor}».`);
    } else {
      notificar("error", "No se pudo filtrar", textoError(r));
    }
  } catch (e) { errorDeRed(e); }
}

async function buscarPorId() {
  const valor = $("buscarId").value.trim();
  if (!valor) return mostrarListadoCompleto();
  $("buscarNombre").value = "";
  $("buscarDepto").value = "";
  try {
    const r = await pedir(`${API}/${encodeURIComponent(valor)}`);
    if (r.status === 200) {
      pintarTabla([r.cuerpo], `Funcionario con ID ${valor}`, "", "");
    } else if (r.status === 404) {
      pintarTabla([], `Funcionario con ID ${valor}`, "Sin resultados", `No existe un funcionario con el ID ${valor}.`);
      notificar("info", "No encontrado", `No existe un funcionario con ID ${valor}.`);
    } else {
      notificar("error", "No se pudo consultar", textoError(r));
    }
  } catch (e) { errorDeRed(e); }
}

/* ---------- Formulario (registrar / editar) ---------- */
function limpiarErrores() {
  Object.values(campos).forEach((c) => c.classList.remove("invalid", "valid"));
  document.querySelectorAll(".error-msg").forEach((s) => (s.textContent = ""));
}

function marcarError(campo, mensaje) {
  campo.classList.add("invalid");
  campo.classList.remove("valid");
  document.querySelector(`.error-msg[data-for="${campo.id}"]`).textContent = mensaje;
}

function validarFormulario() {
  limpiarErrores();
  let valido = true;
  const reglas = [
    [campos.nombre, "El nombre es obligatorio", true],
    [campos.cargo, "El cargo es obligatorio", true],
    [campos.departamento, "El departamento es obligatorio", true],
  ];
  reglas.forEach(([campo, msg]) => {
    if (!campo.value.trim()) { marcarError(campo, msg); valido = false; }
    else campo.classList.add("valid");
  });
  // Teléfono: opcional, pero si se escribe solo admite números, espacios y + - ( )
  if (campos.telefono.value && !/^[0-9+()\-\s]*$/.test(campos.telefono.value)) {
    marcarError(campos.telefono, "Solo números, espacios y los símbolos + - ( )");
    valido = false;
  }
  return valido;
}

function abrirFormulario(funcionario) {
  limpiarErrores();
  form.reset();
  if (funcionario) {
    idEnEdicion = funcionario.id;
    $("formTitulo").textContent = "Editar funcionario";
    $("formSubtitulo").textContent = "Modifica los datos. El ID no puede cambiar.";
    $("campoId").hidden = false;
    $("fId").value = funcionario.id;
    campos.nombre.value = funcionario.nombre;
    campos.cargo.value = funcionario.cargo;
    campos.departamento.value = funcionario.departamento;
    campos.telefono.value = funcionario.telefono || "";
  } else {
    idEnEdicion = null;
    $("formTitulo").textContent = "Nuevo funcionario";
    $("formSubtitulo").textContent = "Completa los datos. Los campos con * son obligatorios.";
    $("campoId").hidden = true;
  }
  $("modalForm").hidden = false;
  campos.nombre.focus();
}

function cerrarFormulario() {
  $("modalForm").hidden = true;
  idEnEdicion = null;
}

function limpiarFormulario() {
  // Deja el formulario listo para un registro nuevo (también sale del modo edición).
  form.reset();
  limpiarErrores();
  idEnEdicion = null;
  $("campoId").hidden = true;
  $("formTitulo").textContent = "Nuevo funcionario";
  $("formSubtitulo").textContent = "Completa los datos. Los campos con * son obligatorios.";
  campos.nombre.focus();
}

async function guardar(e) {
  e.preventDefault();
  if (!validarFormulario()) return;

  const datos = {
    nombre: campos.nombre.value.trim(),
    cargo: campos.cargo.value.trim(),
    departamento: campos.departamento.value.trim(),
    telefono: campos.telefono.value.trim() || null,
  };
  const editando = idEnEdicion !== null;
  const btn = $("btnGuardar");
  btn.disabled = true;
  btn.textContent = "Guardando…";

  try {
    const r = await pedir(editando ? `${API}/${idEnEdicion}` : API, {
      method: editando ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    if (r.status === 201 || r.status === 200) {
      cerrarFormulario();
      notificar("exito", editando ? "Actualización exitosa" : "Registro exitoso",
        `${r.cuerpo.nombre} (ID ${r.cuerpo.id})`);
      await refrescarVistaActual();
    } else if (r.status === 404) {
      cerrarFormulario();
      notificar("error", "Funcionario no encontrado", "Ya no existe en el directorio.");
      await refrescarVistaActual();
    } else if (r.status === 400) {
      notificar("error", "Datos inválidos", textoError(r));
    } else {
      notificar("error", "No se pudo guardar", textoError(r));
    }
  } catch (err) {
    errorDeRed(err);
  } finally {
    btn.disabled = false;
    btn.textContent = "Guardar";
  }
}

/* ---------- Eliminación con confirmación ---------- */
function pedirConfirmacion(f) {
  idPorEliminar = f.id;
  $("confirmTexto").textContent = `Se eliminará a ${f.nombre} (ID ${f.id}). Esta acción no se puede deshacer.`;
  $("modalConfirm").hidden = false;
  $("btnConfirmNo").focus();
}

function cancelarEliminacion() {
  idPorEliminar = null;           // cancelar: no se ejecuta ningún DELETE
  $("modalConfirm").hidden = true;
}

async function confirmarEliminacion() {
  const id = idPorEliminar;
  $("modalConfirm").hidden = true;
  idPorEliminar = null;
  if (id === null) return;
  try {
    const r = await pedir(`${API}/${id}`, { method: "DELETE" });
    if (r.status === 204) {
      notificar("exito", "Eliminación exitosa", `El funcionario con ID ${id} fue eliminado.`);
    } else if (r.status === 404) {
      notificar("error", "No encontrado", `El funcionario con ID ${id} ya no existe.`);
    } else {
      notificar("error", "No se pudo eliminar", textoError(r));
    }
    await refrescarVistaActual();
  } catch (e) { errorDeRed(e); }
}

/* ---------- Menú móvil ---------- */
function alternarMenu(abrir) {
  $("sidebar").classList.toggle("abierto", abrir);
  $("overlayMenu").hidden = !abrir;
}

/* ---------- Eventos ---------- */
$("formNombre").addEventListener("submit", (e) => { e.preventDefault(); buscarPorNombre(); });
$("formDepto").addEventListener("submit", (e) => { e.preventDefault(); buscarPorDepartamento(); });
$("formId").addEventListener("submit", (e) => { e.preventDefault(); buscarPorId(); });
$("btnTodos").addEventListener("click", mostrarListadoCompleto);
$("btnRecargar").addEventListener("click", mostrarListadoCompleto);
$("btnNuevo").addEventListener("click", () => abrirFormulario(null));
$("btnCerrarForm").addEventListener("click", cerrarFormulario);
$("btnCancelarForm").addEventListener("click", cerrarFormulario);
$("btnLimpiar").addEventListener("click", limpiarFormulario);
form.addEventListener("submit", guardar);
$("btnConfirmNo").addEventListener("click", cancelarEliminacion);
$("btnConfirmSi").addEventListener("click", confirmarEliminacion);
$("btnMenu").addEventListener("click", () => alternarMenu(true));
$("overlayMenu").addEventListener("click", () => alternarMenu(false));
document.querySelectorAll(".nav-item[href]").forEach((a) => a.addEventListener("click", (e) => {
  e.preventDefault();
  document.querySelectorAll(".nav-item[href]").forEach((x) => x.classList.remove("active"));
  a.classList.add("active");
  alternarMenu(false);
  const destino = a.getAttribute("href");
  if (destino === "#resumen") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    mostrarListadoCompleto();
  } else if (destino === "#funcionarios") {
    $("funcionarios").scrollIntoView({ behavior: "smooth", block: "start" });
    destacar($("funcionarios"));
    $("buscarNombre").focus({ preventScroll: true });
  } else if (destino === "#departamentos") {
    $("departamentos").scrollIntoView({ behavior: "smooth", block: "center" });
    destacar($("departamentos"));
  }
}));

/* Resalta un panel un instante para que se note a dónde llevó el menú. */
function destacar(el) {
  el.classList.remove("destacado");
  void el.offsetWidth; // reinicia la animación
  el.classList.add("destacado");
}
Object.values(campos).forEach((c) => c.addEventListener("input", () => {
  c.classList.remove("invalid");
  const msg = document.querySelector(`.error-msg[data-for="${c.id}"]`);
  if (msg) msg.textContent = "";
}));
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!$("modalConfirm").hidden) cancelarEliminacion();
  else if (!$("modalForm").hidden) cerrarFormulario();
});

/* ---------- Inicio ---------- */
async function cargarUsuarioActual() {
  try {
    const r = await pedir("/api/v1/auth/usuario");
    if (r.ok && r.cuerpo?.username) {
      $("usuarioActual").textContent = r.cuerpo.username;
    }
  } catch (e) { /* si expiró, pedir() ya redirige */ }
}

cargarUsuarioActual();
mostrarListadoCompleto();
