package com.campuslands.directorio.controller;

import com.campuslands.directorio.dto.RegistroRequest;
import com.campuslands.directorio.exception.SolicitudInvalidaException;
import com.campuslands.directorio.model.Usuario;
import com.campuslands.directorio.repository.UsuarioRepository;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Endpoints de autenticación: registro de usuarios y consulta de sesión actual. */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/registro")
    public ResponseEntity<Map<String, String>> registrar(@Valid @RequestBody RegistroRequest datos) {
        String username = datos.username().trim();
        if (usuarioRepository.existsByUsername(username)) {
            throw new SolicitudInvalidaException("El nombre de usuario ya está registrado");
        }
        Usuario nuevo = new Usuario();
        nuevo.setUsername(username);
        nuevo.setPassword(passwordEncoder.encode(datos.password()));
        nuevo.setRol("ROLE_USER");
        nuevo.setActivo(true);
        usuarioRepository.save(nuevo);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("mensaje", "Usuario registrado correctamente", "username", username));
    }

    @GetMapping("/usuario")
    public ResponseEntity<Map<String, String>> usuarioActual(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String rol = auth.getAuthorities().stream()
                .findFirst()
                .map(Object::toString)
                .orElse("ROLE_USER");
        return ResponseEntity.ok(Map.of("username", auth.getName(), "rol", rol));
    }
}
