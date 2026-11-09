package com.campuslands.directorio.service;

import com.campuslands.directorio.dto.FuncionarioRequest;
import com.campuslands.directorio.dto.FuncionarioResponse;
import com.campuslands.directorio.exception.RecursoNoEncontradoException;
import com.campuslands.directorio.exception.SolicitudInvalidaException;
import com.campuslands.directorio.model.Funcionario;
import com.campuslands.directorio.repository.FuncionarioRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/** Lógica de negocio del directorio. */
@Service
@RequiredArgsConstructor
public class FuncionarioService {

    private final FuncionarioRepository repository;

    /**
     * Lista todos o filtra. Los filtros en blanco se consideran ausentes y,
     * si llegan ambos, se aplica el de nombre.
     */
    @Transactional(readOnly = true)
    public List<FuncionarioResponse> listar(String nombre, String departamento) {
        List<Funcionario> resultado;
        if (StringUtils.hasText(nombre)) {
            resultado = repository.findByNombreContainingIgnoreCase(nombre.trim());
        } else if (StringUtils.hasText(departamento)) {
            resultado = repository.findByDepartamentoIgnoreCase(departamento.trim());
        } else {
            resultado = repository.findAll();
        }
        return resultado.stream().map(FuncionarioResponse::desde).toList();
    }

    @Transactional(readOnly = true)
    public FuncionarioResponse obtener(Long id) {
        return FuncionarioResponse.desde(buscarOFallar(id));
    }

    @Transactional
    public FuncionarioResponse crear(FuncionarioRequest datos) {
        if (datos.id() != null) {
            throw new SolicitudInvalidaException("No se debe enviar el id al registrar un funcionario");
        }
        Funcionario nuevo = new Funcionario();
        copiar(datos, nuevo);
        return FuncionarioResponse.desde(repository.save(nuevo));
    }

    @Transactional
    public FuncionarioResponse actualizar(Long id, FuncionarioRequest datos) {
        Funcionario existente = buscarOFallar(id); // el id de la ruta manda; el del cuerpo se ignora
        copiar(datos, existente);
        return FuncionarioResponse.desde(repository.save(existente));
    }

    @Transactional
    public void eliminar(Long id) {
        repository.delete(buscarOFallar(id));
    }

    private Funcionario buscarOFallar(Long id) {
        return repository.findById(id).orElseThrow(
                () -> new RecursoNoEncontradoException("No existe un funcionario con id " + id));
    }

    /** Copia los datos limpiando espacios; un teléfono vacío se guarda como null. */
    private void copiar(FuncionarioRequest origen, Funcionario destino) {
        destino.setNombre(origen.nombre().trim());
        destino.setCargo(origen.cargo().trim());
        destino.setDepartamento(origen.departamento().trim());
        destino.setTelefono(StringUtils.hasText(origen.telefono()) ? origen.telefono().trim() : null);
    }
}
