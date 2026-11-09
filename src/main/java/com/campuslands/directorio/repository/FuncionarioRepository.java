package com.campuslands.directorio.repository;

import com.campuslands.directorio.model.Funcionario;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FuncionarioRepository extends JpaRepository<Funcionario, Long> {

    /** Coincidencia parcial del nombre, sin distinguir mayúsculas/minúsculas. */
    List<Funcionario> findByNombreContainingIgnoreCase(String nombre);

    /** Nombre completo del departamento, sin distinguir mayúsculas/minúsculas. */
    List<Funcionario> findByDepartamentoIgnoreCase(String departamento);
}
