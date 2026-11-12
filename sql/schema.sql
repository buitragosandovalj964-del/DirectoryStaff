-- Script de creación de la base de datos: Directorio de Funcionarios
CREATE DATABASE IF NOT EXISTS directorio_funcionarios
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE directorio_funcionarios;

CREATE TABLE IF NOT EXISTS funcionarios (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    nombre       VARCHAR(100) NOT NULL,
    cargo        VARCHAR(100) NOT NULL,
    departamento VARCHAR(100) NOT NULL,
    telefono     VARCHAR(20)  NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuarios (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    username          VARCHAR(50)  NOT NULL UNIQUE,
    password          VARCHAR(255) NOT NULL,
    rol               VARCHAR(30)  NOT NULL DEFAULT 'ROLE_USER',
    activo            BOOLEAN      NOT NULL DEFAULT TRUE,
    intentos_fallidos INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
