CREATE DATABASE IF NOT EXISTS inventory_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE inventory_app;

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0,
    country_of_origin VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO products (code, name, price, stock, country_of_origin) VALUES
('P-001', 'Teclado Mecanico', 79.99, 20, 'Colombia'),
('P-002', 'Mouse Gamer', 45.50, 35, 'Argentina'),
('P-003', 'Monitor 24"', 199.00, 12, 'Mexico');
