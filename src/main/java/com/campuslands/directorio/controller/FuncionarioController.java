package com.campuslands.directorio.controller;

import com.campuslands.directorio.dto.FuncionarioRequest;
import com.campuslands.directorio.dto.FuncionarioResponse;
import com.campuslands.directorio.service.FuncionarioService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Endpoints REST de /api/v1/funcionarios. Solo gestiona HTTP; la lógica vive en el service. */
@RestController
@RequestMapping("/api/v1/funcionarios")
@RequiredArgsConstructor
public class FuncionarioController {

    private final FuncionarioService service;

    @GetMapping
    public ResponseEntity<List<FuncionarioResponse>> listar(
            @RequestParam(required = false) String nombre,
            @RequestParam(required = false) String departamento) {
        List<FuncionarioResponse> lista = service.listar(nombre, departamento);
        return lista.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(lista);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FuncionarioResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(service.obtener(id));
    }

    @PostMapping
    public ResponseEntity<FuncionarioResponse> crear(@Valid @RequestBody FuncionarioRequest datos) {
        FuncionarioResponse creado = service.crear(datos);
        return ResponseEntity.created(URI.create("/api/v1/funcionarios/" + creado.id())).body(creado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FuncionarioResponse> actualizar(@PathVariable Long id,
            @Valid @RequestBody FuncionarioRequest datos) {
        return ResponseEntity.ok(service.actualizar(id, datos));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
