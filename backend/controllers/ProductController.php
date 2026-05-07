<?php

require_once __DIR__ . '/../config/database.php';

class ProductController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = getDbConnection();
    }

    public function listProducts(): array
    {
        $sql = "SELECT id, code, name, price, stock, country_of_origin, created_at, updated_at
                FROM products
                ORDER BY id DESC";
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }

    public function searchProducts(string $query): array
    {
        $sql = "SELECT id, code, name, price, stock, country_of_origin, created_at, updated_at
                FROM products
                WHERE name LIKE :query OR code LIKE :query
                ORDER BY id DESC";
        $stmt = $this->db->prepare($sql);
        $value = '%' . $query . '%';
        $stmt->bindValue(':query', $value);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getProductById(int $id): ?array
    {
        $sql = "SELECT id, code, name, price, stock, country_of_origin, created_at, updated_at
                FROM products
                WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $product = $stmt->fetch();
        return $product ?: null;
    }

    public function createProduct(array $data): int
    {
        $sql = "INSERT INTO products (code, name, price, stock, country_of_origin)
                VALUES (:code, :name, :price, :stock, :country)";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':code', $data['code']);
        $stmt->bindValue(':name', $data['name']);
        $stmt->bindValue(':price', $data['price']);
        $stmt->bindValue(':stock', $data['stock'], PDO::PARAM_INT);
        $stmt->bindValue(':country', $data['country_of_origin']);
        $stmt->execute();

        return (int)$this->db->lastInsertId();
    }

    public function updateProduct(int $id, array $data): bool
    {
        $sql = "UPDATE products
                SET code = :code,
                    name = :name,
                    price = :price,
                    stock = :stock,
                    country_of_origin = :country
                WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':code', $data['code']);
        $stmt->bindValue(':name', $data['name']);
        $stmt->bindValue(':price', $data['price']);
        $stmt->bindValue(':stock', $data['stock'], PDO::PARAM_INT);
        $stmt->bindValue(':country', $data['country_of_origin']);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);

        return $stmt->execute();
    }

    public function deleteProduct(int $id): bool
    {
        $sql = "DELETE FROM products WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }
}
