<?php

require_once __DIR__ . '/controllers/ProductController.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function jsonResponse(int $statusCode, bool $success, $data = null, ?string $message = null): void
{
    http_response_code($statusCode);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data,
    ]);
    exit;
}

function parseJsonBody(): array
{
    $rawBody = file_get_contents('php://input');
    if (!$rawBody) {
        return [];
    }
    $decoded = json_decode($rawBody, true);
    return is_array($decoded) ? $decoded : [];
}

function validateProduct(array $input): ?string
{
    $labels = [
        'code' => 'Codigo',
        'name' => 'Nombre',
        'price' => 'Precio',
        'stock' => 'Stock',
        'country_of_origin' => 'Pais de origen',
    ];

    foreach (array_keys($labels) as $field) {
        if (!isset($input[$field]) || trim((string)$input[$field]) === '') {
            $friendly = $labels[$field];
            return "Completa {$friendly}.";
        }
    }

    if (!is_numeric($input['price']) || (float)$input['price'] < 0) {
        return "Precio debe ser un numero mayor o igual a 0.";
    }

    if (!is_numeric($input['stock']) || (int)$input['stock'] < 0) {
        return "Stock debe ser un numero entero mayor o igual a 0 (unidades disponibles).";
    }

    return null;
}

try {
    $controller = new ProductController();
    $method = $_SERVER['REQUEST_METHOD'];
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $segments = array_values(array_filter(explode('/', trim($uri, '/'))));

    $apiIndex = array_search('api', $segments, true);
    if ($apiIndex === false) {
        jsonResponse(404, false, null, 'Ruta no encontrada.');
    }

    $resource = $segments[$apiIndex + 1] ?? null;
    $id = isset($segments[$apiIndex + 2]) ? (int)$segments[$apiIndex + 2] : null;

    if ($resource !== 'products') {
        jsonResponse(404, false, null, 'Recurso no encontrado.');
    }

    if ($method === 'GET' && ($segments[$apiIndex + 2] ?? null) === 'search') {
        $query = $_GET['q'] ?? '';
        $data = $controller->searchProducts($query);
        jsonResponse(200, true, $data, null);
    }

    if ($method === 'GET' && $id) {
        $product = $controller->getProductById($id);
        if (!$product) {
            jsonResponse(404, false, null, 'Producto no encontrado.');
        }
        jsonResponse(200, true, $product, null);
    }

    if ($method === 'GET') {
        $data = $controller->listProducts();
        jsonResponse(200, true, $data, null);
    }

    if ($method === 'POST') {
        $payload = parseJsonBody();
        $validationError = validateProduct($payload);
        if ($validationError) {
            jsonResponse(422, false, null, $validationError);
        }

        $newId = $controller->createProduct($payload);
        $product = $controller->getProductById($newId);
        jsonResponse(201, true, $product, 'Producto creado correctamente.');
    }

    if ($method === 'PUT' && $id) {
        $payload = parseJsonBody();
        $validationError = validateProduct($payload);
        if ($validationError) {
            jsonResponse(422, false, null, $validationError);
        }

        $existing = $controller->getProductById($id);
        if (!$existing) {
            jsonResponse(404, false, null, 'Producto no encontrado.');
        }

        $controller->updateProduct($id, $payload);
        $product = $controller->getProductById($id);
        jsonResponse(200, true, $product, 'Producto actualizado correctamente.');
    }

    if ($method === 'DELETE' && $id) {
        $existing = $controller->getProductById($id);
        if (!$existing) {
            jsonResponse(404, false, null, 'Producto no encontrado.');
        }

        $controller->deleteProduct($id);
        jsonResponse(200, true, null, 'Producto eliminado correctamente.');
    }

    jsonResponse(405, false, null, 'Metodo no permitido para esta ruta.');
} catch (PDOException $exception) {
    jsonResponse(500, false, null, 'Error de base de datos: ' . $exception->getMessage());
} catch (Throwable $throwable) {
    jsonResponse(500, false, null, 'Error interno del servidor: ' . $throwable->getMessage());
}
