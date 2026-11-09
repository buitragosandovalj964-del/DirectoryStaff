package com.campuslands.directorio.exception;

/** Se lanza cuando la solicitud incumple una regla de negocio (HTTP 400). */
public class SolicitudInvalidaException extends RuntimeException {

    public SolicitudInvalidaException(String mensaje) {
        super(mensaje);
    }
}
