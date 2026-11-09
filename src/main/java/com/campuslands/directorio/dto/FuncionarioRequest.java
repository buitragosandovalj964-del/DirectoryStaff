package com.campuslands.directorio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Datos de entrada para registrar o actualizar. El id se acepta solo para poder
 * rechazarlo (400) al crear; al actualizar se ignora y manda el id de la ruta.
 */
public record FuncionarioRequest(
        Long id,
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 100, message = "El nombre no puede superar 100 caracteres")
        String nombre,
        @NotBlank(message = "El cargo es obligatorio")
        @Size(max = 100, message = "El cargo no puede superar 100 caracteres")
        String cargo,
        @NotBlank(message = "El departamento es obligatorio")
        @Size(max = 100, message = "El departamento no puede superar 100 caracteres")
        String departamento,
        @Size(max = 20, message = "El teléfono no puede superar 20 caracteres")
        @Pattern(regexp = "[0-9+()\\-\\s]*", message = "El teléfono solo puede contener números, espacios y los símbolos + - ( )")
        String telefono) {
}
