package com.campuslands.directorio.dto;

import com.campuslands.directorio.model.Funcionario;

/** Datos de salida: lo que la API devuelve al cliente. */
public record FuncionarioResponse(
        Long id,
        String nombre,
        String cargo,
        String departamento,
        String telefono) {

    public static FuncionarioResponse desde(Funcionario f) {
        return new FuncionarioResponse(f.getId(), f.getNombre(), f.getCargo(),
                f.getDepartamento(), f.getTelefono());
    }
}
