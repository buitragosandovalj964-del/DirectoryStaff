package com.campuslands.directorio.config;

import com.campuslands.directorio.model.Usuario;
import com.campuslands.directorio.repository.UsuarioRepository;
import jakarta.servlet.http.HttpSession;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;

/**
 * Configuración de Spring Security con login conectado a MySQL y límite de 3 intentos fallidos.
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private static final int MAX_INTENTOS = 3;
    private final UsuarioRepository usuarioRepository;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Deshabilitado para que las peticiones fetch() del frontend a /api/** funcionen sin token CSRF
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/login.html", "/login", "/api/v1/auth/registro", "/css/**", "/js/**")
                        .permitAll()
                        .anyRequest().authenticated())
                .formLogin(form -> form
                        .loginPage("/login.html")
                        .loginProcessingUrl("/login")
                        .successHandler(manejadorExito())
                        .failureHandler(manejadorFallo())
                        .permitAll())
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl("/login.html?logout=true")
                        .permitAll());

        return http.build();
    }

    private AuthenticationSuccessHandler manejadorExito() {
        return (request, response, authentication) -> {
            usuarioRepository.findByUsername(authentication.getName()).ifPresent(u -> {
                if (u.getIntentosFallidos() > 0) {
                    u.setIntentosFallidos(0);
                    usuarioRepository.save(u);
                }
            });
            HttpSession session = request.getSession(false);
            if (session != null) {
                session.removeAttribute("intentosFallidos");
            }
            response.sendRedirect("/");
        };
    }

    private AuthenticationFailureHandler manejadorFallo() {
        return (request, response, exception) -> {
            String username = request.getParameter("username");
            Optional<Usuario> opt = (username != null)
                    ? usuarioRepository.findByUsername(username.trim())
                    : Optional.empty();

            if (opt.isPresent()) {
                Usuario u = opt.get();
                if (!u.isActivo()) {
                    response.sendRedirect("/login.html?bloqueado=true");
                    return;
                }
                int intentos = u.getIntentosFallidos() + 1;
                u.setIntentosFallidos(intentos);
                if (intentos >= MAX_INTENTOS) {
                    u.setActivo(false);
                    usuarioRepository.save(u);
                    response.sendRedirect("/login.html?bloqueado=true");
                    return;
                }
                usuarioRepository.save(u);
                response.sendRedirect("/login.html?error=true&restantes=" + (MAX_INTENTOS - intentos));
                return;
            }

            // Si el username no existe, también contamos hasta 3 intentos en la sesión
            HttpSession session = request.getSession(true);
            Integer previos = (Integer) session.getAttribute("intentosFallidos");
            int intentos = (previos == null ? 0 : previos) + 1;
            session.setAttribute("intentosFallidos", intentos);
            if (intentos >= MAX_INTENTOS) {
                response.sendRedirect("/login.html?bloqueado=true");
            } else {
                response.sendRedirect("/login.html?error=true&restantes=" + (MAX_INTENTOS - intentos));
            }
        };
    }
}
