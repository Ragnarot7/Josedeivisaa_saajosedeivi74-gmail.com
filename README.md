# Inventario Web (React + Vite + PHP + MySQL)

Este proyecto es una app de inventario con CRUD de productos.  
Separa frontend y backend para que cada parte tenga una responsabilidad clara:

- `frontend`: interfaz en React (formularios, tabla, busqueda, mensajes).
- `backend`: API REST en PHP que habla con MySQL.
- `database`: script SQL para crear la base y cargar datos iniciales.

Tambien se consume la API publica [REST Countries](https://restcountries.com/) para mostrar la bandera del pais de origen de cada producto.

## Estructura del proyecto

```text
inventoryapp/
  frontend/
  backend/
  database/
  README.md
  NOTAS_ENTREVISTA.md
  ERRORES_COMUNES.md
```

## Requisitos previos

- Node.js 18 o superior (incluye `npm`)
- PHP 8.1 o superior (con `pdo_mysql`)
- MySQL 8+ o MariaDB equivalente

Si tienes dudas de instalacion o PATH, revisa `ERRORES_COMUNES.md`.

## Dependencias principales

- **Frontend** (`frontend/package.json`): `react`, `react-dom` (ejecucion); `vite` y `@vitejs/plugin-react` (desarrollo y build).
- **Backend:** PHP solo, sin Composer; necesitas extension **pdo_mysql** para PDO.
- **HTTP en el navegador:** `fetch` nativo (no Axios). La API externa es RestCountries por HTTPS.

Ejecutar `npm install` dentro de `frontend/` descarga todas las dependencias de Node listadas ahí.

## 1) Base de datos

Importa el archivo:

- `database/inventory.sql`

Este script crea:

- base de datos `inventory_app`
- tabla `products`
- registros de prueba

## 2) Levantar backend (PHP)

Abre una terminal:

```bash
cd backend
php -S localhost:8000
```

API base:

- `http://localhost:8000/api`

Configuracion de conexion a MySQL (variables disponibles en `backend/.env.example`):

- `DB_HOST` (default `127.0.0.1`)
- `DB_PORT` (default `3306`)
- `DB_NAME` (default `inventory_app`)
- `DB_USER` (default `root`)
- `DB_PASS` (default vacio)

## 3) Levantar frontend (React + Vite)

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite mostrara una URL local (normalmente `http://localhost:5173`).

Si quieres fijar la URL del backend desde el frontend, crea `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## ¿Por que se levantan por separado?

- React + Vite es la capa visual (cliente).
- PHP es la capa de negocio y datos (servidor).
- El frontend consume el backend por HTTP; por eso normalmente corren en puertos distintos.

Esta separacion hace mas facil escalar, mantener y probar el proyecto.

## Endpoints disponibles

- `GET /api/products` -> listar
- `GET /api/products/search?q=texto` -> buscar por nombre/codigo
- `GET /api/products/{id}` -> detalle
- `POST /api/products` -> crear
- `PUT /api/products/{id}` -> actualizar
- `DELETE /api/products/{id}` -> eliminar

Ejemplo de payload (`POST`/`PUT`):

```json
{
  "code": "P-100",
  "name": "Producto demo",
  "price": 120.5,
  "stock": 8,
  "country_of_origin": "Peru"
}
```

## Funcionalidades que ya incluye

- CRUD completo de productos
- Busqueda por nombre o codigo
- Consumo de RestCountries para banderas
- Manejo basico de errores
- Estados de carga
- Notificaciones animadas al crear/editar/eliminar
