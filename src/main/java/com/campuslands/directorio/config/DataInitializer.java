package com.campuslands.directorio.config;

import com.campuslands.directorio.model.Usuario;
import com.campuslands.directorio.repository.UsuarioRepository;
import java.util.Scanner;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Si la tabla "usuarios" está vacía, solicita por consola el usuario y la
 * contraseña (con confirmación) para guardarlos encriptados en MySQL.
 */
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.consola-registro:true}")
    private boolean consolaRegistro;

    @Override
    public void run(String... args) {
        if (!consolaRegistro || usuarioRepository.count() > 0) {
            return;
        }

        Scanner scanner = new Scanner(System.in);
        System.out.println("\n==================================================");
        System.out.println(" CONFIGURACIÓN INICIAL DE ACCESO (SPRING SECURITY)");
        System.out.println("==================================================");

        String username = "";
        while (username.length() < 3) {
            System.out.print("Ingresa el nombre de usuario (mín. 3 caracteres): ");
            if (!scanner.hasNextLine()) {
                return;
            }
            username = scanner.nextLine().trim();
            if (username.length() < 3) {
                System.out.println("El usuario debe tener al menos 3 caracteres.");
            }
        }

        String password = "";
        while (true) {
            System.out.print("Ingresa la contraseña (mín. 6 caracteres): ");
            if (!scanner.hasNextLine()) {
                return;
            }
            password = scanner.nextLine();
            if (password.length() < 6) {
                System.out.println("La contraseña debe tener al menos 6 caracteres.");
                continue;
            }

            System.out.print("Confirma la contraseña: ");
            if (!scanner.hasNextLine()) {
                return;
            }
            String confirmacion = scanner.nextLine();
            if (!password.equals(confirmacion)) {
                System.out.println("Las contraseñas no coinciden. Inténtalo de nuevo.");
                continue;
            }
            break;
        }

        Usuario nuevo = new Usuario();
        nuevo.setUsername(username);
        nuevo.setPassword(passwordEncoder.encode(password));
        nuevo.setRol("ROLE_ADMIN");
        nuevo.setActivo(true);
        nuevo.setIntentosFallidos(0);
        usuarioRepository.save(nuevo);

        System.out.println("Usuario '" + username + "' guardado correctamente en MySQL.");
        System.out.println("==================================================\n");
    }
}
