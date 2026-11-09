package com.campuslands.directorio.exception;

import java.util.List;

/** Cuerpo JSON uniforme para los errores, sin información técnica. */
public record ErrorResponse(int status, String mensaje, List<String> detalles) {
}
