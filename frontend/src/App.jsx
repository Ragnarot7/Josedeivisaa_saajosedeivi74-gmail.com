import { useEffect, useMemo, useRef, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const emptyForm = {
  code: "",
  name: "",
  price: "",
  stock: "",
  country_of_origin: ""
};

function App() {
  const [products, setProducts] = useState([]);
  const [flags, setFlags] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ show: false, type: "success", message: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [countriesIndex, setCountriesIndex] = useState([]);
  const [countriesLoadError, setCountriesLoadError] = useState("");
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [countrySuggestionsOpen, setCountrySuggestionsOpen] = useState(false);
  const toastTimerRef = useRef(null);
  const countryBlurTimerRef = useRef(null);

  const title = useMemo(
    () => (editingProduct ? "Editar producto" : "Crear producto"),
    [editingProduct]
  );

  async function fetchProducts(query = "") {
    setLoading(true);
    setError("");
    try {
      const endpoint = query
        ? `${API_BASE_URL}/products/search?q=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/products`;
      const response = await fetch(endpoint);
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "No se pudieron obtener los productos");
      }
      setProducts(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchFlag(countryName) {
    const countryKey = countryName.toLowerCase().trim();
    if (!countryKey || flags[countryKey]) return;

    try {
      const response = await fetch(
        `https://restcountries.com/v3.1/name/${encodeURIComponent(
          countryName
        )}?fields=name,flags`
      );
      const data = await response.json();
      if (!response.ok || !Array.isArray(data) || data.length === 0) {
        setFlags((prev) => ({ ...prev, [countryKey]: null }));
        return;
      }
      setFlags((prev) => ({ ...prev, [countryKey]: data[0]?.flags?.png || null }));
    } catch (err) {
      setFlags((prev) => ({ ...prev, [countryKey]: null }));
    }
  }

  async function loadFlags(items) {
    await Promise.all(items.map((item) => fetchFlag(item.country_of_origin)));
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    loadFlags(products);
  }, [products]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      if (countryBlurTimerRef.current) {
        clearTimeout(countryBlurTimerRef.current);
      }
    };
  }, []);

  const countryQuery = formData.country_of_origin.trim().toLowerCase();

  const filteredCountrySuggestions = useMemo(() => {
    if (!countryQuery || countriesIndex.length === 0) return [];
    return countriesIndex
      .filter((label) => label.toLowerCase().includes(countryQuery))
      .slice(0, 40);
  }, [countriesIndex, countryQuery]);

  async function ensureCountriesLoaded() {
    if (countriesIndex.length > 0 || countriesLoading) return;

    setCountriesLoading(true);
    setCountriesLoadError("");
    try {
      const response = await fetch("https://restcountries.com/v3.1/all?fields=name");
      const data = await response.json();
      if (!response.ok || !Array.isArray(data)) {
        throw new Error("No se pudo cargar la lista de paises.");
      }

      const labels = [...new Set(
        data
          .map((c) => (c?.name?.common ?? c?.name?.official ?? "").trim())
          .filter(Boolean)
      )];

      labels.sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
      setCountriesIndex(labels);
    } catch (err) {
      setCountriesLoadError(err.message || "Error al cargar paises.");
    } finally {
      setCountriesLoading(false);
    }
  }

  function showToast(message, type = "success") {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    setToast({ show: true, type, message });
    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 2800);
  }

  function openCreateModal() {
    setEditingProduct(null);
    setFormData(emptyForm);
    setCountrySuggestionsOpen(false);
    setModalOpen(true);
    setError("");
  }

  function openEditModal(product) {
    setEditingProduct(product);
    setFormData({
      code: product.code,
      name: product.name,
      price: String(product.price),
      stock: String(product.stock),
      country_of_origin: product.country_of_origin
    });
    setCountrySuggestionsOpen(false);
    setModalOpen(true);
    setError("");
  }

  function closeModal() {
    setModalOpen(false);
    setEditingProduct(null);
    setFormData(emptyForm);
    setCountrySuggestionsOpen(false);
  }

  function handleInputChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "country_of_origin") {
      setCountrySuggestionsOpen(true);
    }
  }

  function selectSuggestedCountry(countryLabel) {
    setFormData((prev) => ({ ...prev, country_of_origin: countryLabel }));
    setCountrySuggestionsOpen(false);
  }

  function handleCountryFocus() {
    if (countryBlurTimerRef.current) {
      clearTimeout(countryBlurTimerRef.current);
    }
    ensureCountriesLoaded();
    setCountrySuggestionsOpen(true);
  }

  function handleCountryBlur() {
    countryBlurTimerRef.current = setTimeout(() => {
      setCountrySuggestionsOpen(false);
    }, 200);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...formData,
      price: Number(formData.price),
      stock: Number(formData.stock)
    };

    const isEdit = Boolean(editingProduct);
    const endpoint = isEdit
      ? `${API_BASE_URL}/products/${editingProduct.id}`
      : `${API_BASE_URL}/products`;
    const method = isEdit ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "No se pudo guardar el producto");
      }
      closeModal();
      fetchProducts(search.trim());
      showToast(isEdit ? "Producto actualizado correctamente." : "Producto creado correctamente.");
    } catch (err) {
      setError(err.message);
      showToast(err.message || "No se pudo guardar el producto.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("¿Deseas eliminar este producto?");
    if (!confirmed) return;

    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: "DELETE"
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "No se pudo eliminar el producto");
      }
      fetchProducts(search.trim());
      showToast("Producto eliminado correctamente.");
    } catch (err) {
      setError(err.message);
      showToast(err.message || "No se pudo eliminar el producto.", "error");
    }
  }

  function handleSearch(event) {
    event.preventDefault();
    fetchProducts(search.trim());
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Inventario de Productos</h1>
        <button className="button" onClick={openCreateModal}>
          Nuevo producto
        </button>
      </header>

      <form className="search-form" onSubmit={handleSearch}>
        <input
          className="input"
          placeholder="Buscar por nombre o codigo"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button className="button secondary" type="submit">
          Buscar
        </button>
        <button
          className="button tertiary"
          type="button"
          onClick={() => {
            setSearch("");
            fetchProducts();
          }}
        >
          Limpiar
        </button>
      </form>

      {error && <p className="error">{error}</p>}
      <div className={`toast ${toast.type} ${toast.show ? "show" : ""}`} aria-live="polite">
        {toast.message}
      </div>
      {loading ? (
        <p className="status">Cargando productos...</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Nombre</th>
                <th>Precio</th>
                <th scope="col" title="Unidades disponibles (stock)">
                  Stock
                </th>
                <th>Pais de origen</th>
                <th>Bandera</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="status">
                    Sin resultados
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const flagUrl = flags[product.country_of_origin.toLowerCase().trim()];
                  return (
                    <tr key={product.id}>
                      <td>{product.code}</td>
                      <td>{product.name}</td>
                      <td>${Number(product.price).toFixed(2)}</td>
                      <td>{product.stock}</td>
                      <td>{product.country_of_origin}</td>
                      <td>
                        {flagUrl ? (
                          <img className="flag" src={flagUrl} alt={`Bandera de ${product.country_of_origin}`} />
                        ) : (
                          <span className="muted">No disponible</span>
                        )}
                      </td>
                      <td className="actions">
                        <button className="small-button" onClick={() => openEditModal(product)}>
                          Editar
                        </button>
                        <button className="small-button danger" onClick={() => handleDelete(product.id)}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{title}</h2>
            <form className="form-grid" onSubmit={handleSubmit}>
              <label>
                Codigo
                <input
                  className="input"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <label>
                Nombre
                <input
                  className="input"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <label>
                Precio
                <input
                  className="input"
                  name="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <label>
                Stock{" "}
                <span className="field-hint">(cantidad disponible)</span>
                <input
                  className="input"
                  name="stock"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  aria-label="Stock, unidades disponibles"
                  placeholder="Ej. 25"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <label className="country-field">
                Pais de origen
                <div className="combobox-root">
                  <input
                    className="input"
                    name="country_of_origin"
                    value={formData.country_of_origin}
                    onChange={handleInputChange}
                    onFocus={handleCountryFocus}
                    onBlur={handleCountryBlur}
                    autoComplete="off"
                    placeholder="Escribe para buscar ej. Colombia, Peru..."
                    required
                  />
                  {countrySuggestionsOpen && (
                    <div className="country-suggestions-panel" role="listbox">
                      {countriesLoading && (
                        <p className="country-suggestions-hint">Cargando lista de paises...</p>
                      )}
                      {!countriesLoading && countriesLoadError && (
                        <p className="country-suggestions-error">{countriesLoadError}</p>
                      )}
                      {!countriesLoading &&
                        !countriesLoadError &&
                        countryQuery &&
                        filteredCountrySuggestions.length === 0 && (
                          <p className="country-suggestions-hint">
                            Sin coincidencias. Puedes escribir el pais manualmente.
                          </p>
                        )}
                      {!countriesLoading &&
                        !countriesLoadError &&
                        !countryQuery && (
                          <p className="country-suggestions-hint">
                            Escribe letras para filtrar paises.
                          </p>
                        )}
                      <ul className="country-suggestions-list">
                        {filteredCountrySuggestions.map((name) => (
                          <li key={name}>
                            <button
                              type="button"
                              className="country-suggestion-item"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => selectSuggestedCountry(name)}
                            >
                              {name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </label>
              <div className="modal-actions">
                <button className="button" type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar"}
                </button>
                <button className="button tertiary" type="button" onClick={closeModal}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
