// src/components/routes/AdminPortal.js
import React, { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import "../../App.css";
import "./AdminPortal.css";
import ServicesManager from "./ServicesManager";

function AdminPortal() {
  // --------------------
  // AUTH STATE
  // --------------------
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [adminError, setAdminError] = useState("");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // --------------------
  // CATEGORY AUTOCOMPLETE STATE
  // --------------------
  const [showCatList, setShowCatList] = useState(false);
  const [allCategories, setAllCategories] = useState([]);

  // =======================
  // FESTIVAL THEME STATE
  // =======================
  const [themeConfig, setThemeConfig] = useState({
    banner_message: "",
    banner_enabled: true, // local toggle only
    theme_image_url: "",
    is_enabled: false,
    _imageFile: null,
  });
  const [themeLoading, setThemeLoading] = useState(false);

  // --------------------
  // PRODUCT STATE
  // --------------------
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [saving, setSaving] = useState(false);
  // eslint-disable-next-line
  const [pageError, setPageError] = useState("");

  // ADD PRODUCT FORM
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    mrp: "",
    price: "",
    stock: "",
    description: "",
  });
  const [newProductFiles, setNewProductFiles] = useState([]);

  // EDIT PRODUCT MODAL
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editFiles, setEditFiles] = useState([]);

  // ===========================================================
  // LOGIN USING SUPABASE AUTH + CHECK PROFILE ROLE = ADMIN
  // ===========================================================
  async function handleAdminLogin(e) {
    e.preventDefault();
    setAdminError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: adminUser,
      password: adminPass,
    });

    if (error) {
      setAdminError("Invalid email or password.");
      return;
    }

    const { data: profile, error: roleErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (roleErr || !profile) {
      setAdminError("Profile not found.");
      await supabase.auth.signOut();
      return;
    }

    if (profile.role !== "admin") {
      setAdminError("Access denied — only admin allowed.");
      await supabase.auth.signOut();
      return;
    }

    setIsAdminLoggedIn(true);
    setAdminPass("");
  }

  // LOGOUT
  async function handleAdminLogout() {
    await supabase.auth.signOut();
    setIsAdminLoggedIn(false);
    setAdminUser("");
    setAdminPass("");
    setAdminError("");
  }

  // ===========================================================
  // LOAD PRODUCTS
  // ===========================================================
  useEffect(() => {
    async function loadProducts() {
      setLoadingProducts(true);
      setPageError("");

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setPageError("Failed to load products.");
        setProducts([]);
      } else {
        const normalized = (data || []).map((p) => ({
          ...p,
          images: Array.isArray(p.images) ? p.images : [],
          is_featured: !!p.is_featured,
          is_top10: !!p.is_top10,
        }));
        setProducts(normalized);
      }

      setLoadingProducts(false);
    }

    loadProducts();
  }, []);

  // After products load/change, build unique category list
  useEffect(() => {
    const unique = [
      ...new Set(products.map((p) => p.category).filter(Boolean)),
    ];
    setAllCategories(unique);
  }, [products]);

  // ===========================================================
  // LOAD CURRENT THEME FROM SUPABASE (SINGLE ROW)
  // ===========================================================
  useEffect(() => {
    async function loadTheme() {
      const { data, error } = await supabase
        .from("site_theme")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        const row = data[0];
        setThemeConfig((prev) => ({
          ...prev,
          banner_message: row.banner_message || "",
          banner_enabled:
            typeof row.banner_enabled === "boolean"
              ? row.banner_enabled
              : true,
          theme_image_url: row.theme_image_url || "",
          is_enabled: !!row.is_enabled,
          _imageFile: null,
        }));
      }
    }

    loadTheme();
  }, []);

  // ===========================================================
  // FILE UPLOAD — SUPABASE STORAGE
  // ===========================================================
  async function uploadImageFiles(files) {
    if (!files || files.length === 0) return [];

    const uploadedUrls = [];

    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `products/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(path);

      if (data?.publicUrl) uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls;
  }

  // ===========================================================
  // ADD PRODUCT
  // ===========================================================
  async function handleAddProduct(e) {
    e.preventDefault();
    setPageError("");

    if (!newProduct.name || !newProduct.category) {
      alert("Name and category are required.");
      return;
    }

    setSaving(true);
    try {
      const imageUrls = await uploadImageFiles(newProductFiles);

      const { data, error } = await supabase
        .from("products")
        .insert([
          {
            ...newProduct,
            mrp: newProduct.mrp ? Number(newProduct.mrp) : null,
            price: newProduct.price ? Number(newProduct.price) : null,
            stock: newProduct.stock ? Number(newProduct.stock) : 0,
            images: imageUrls,
            is_featured: false,
            is_top10: false,
          },
        ])
        .select("*")
        .single();

      if (error) {
        setPageError("Failed to save product.");
      } else {
        setProducts((prev) => [data, ...prev]);
      }

      setNewProduct({
        name: "",
        category: "",
        mrp: "",
        price: "",
        stock: "",
        description: "",
      });
      setNewProductFiles([]);
      setShowCatList(false);
    } catch (err) {
      setPageError("Image upload failed.");
    } finally {
      setSaving(false);
    }
  }

  // ===========================================================
  // EDIT PRODUCT
  // ===========================================================
  function openEditModal(product) {
    setEditingProduct(product);
    setEditFiles([]);
    setEditModalOpen(true);
  }

  function closeEditModal() {
    setEditingProduct(null);
    setEditModalOpen(false);
    setEditFiles([]);
  }

  async function saveEditProduct() {
    if (!editingProduct) return;

    setSaving(true);

    try {
      const newUrls = await uploadImageFiles(editFiles);

      const updated = {
        ...editingProduct,
        mrp: editingProduct.mrp ? Number(editingProduct.mrp) : null,
        price: editingProduct.price ? Number(editingProduct.price) : null,
        stock: editingProduct.stock ? Number(editingProduct.stock) : 0,
        images: [...(editingProduct.images || []), ...newUrls],
      };

      const { data, error } = await supabase
        .from("products")
        .update(updated)
        .eq("id", editingProduct.id)
        .select("*")
        .single();

      if (error) {
        setPageError("Update failed.");
      } else {
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? data : p))
        );
      }

      closeEditModal();
    } catch (err) {
      setPageError("Image upload failed.");
    } finally {
      setSaving(false);
    }
  }

  // ===========================================================
  // DELETE PRODUCT
  // ===========================================================
  async function handleDeleteProduct(id) {
    if (!window.confirm("Delete this product?")) return;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (!error) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  }

  // ===========================================================
  // FEATURED & TOP10 TOGGLES
  // ===========================================================
  async function toggleFeatured(product) {
    const { data, error } = await supabase
      .from("products")
      .update({ is_featured: !product.is_featured })
      .eq("id", product.id)
      .select("*")
      .single();

    if (!error) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? data : p))
      );
    }
  }

  async function toggleTop10(product) {
    const { data, error } = await supabase
      .from("products")
      .update({ is_top10: !product.is_top10 })
      .eq("id", product.id)
      .select("*")
      .single();

    if (!error) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? data : p))
      );
    }
  }

  // ===========================================================
  // SAVE SLIDING BANNER CONFIG (MESSAGE + ON/OFF)
  // ===========================================================
  async function saveBannerConfig() {
    try {
      const { error } = await supabase
        .from("site_theme")
        .upsert(
          {
            id: 1,
            banner_message: themeConfig.banner_message,
            banner_enabled: themeConfig.banner_enabled,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (error) {
        alert("Failed to save banner settings.");
        return;
      }

      alert("Sliding banner updated!");
    } catch (err) {
      console.error(err);
      alert("Unexpected error while saving banner.");
    }
  }

  // ===========================================================
  // SAVE THEME CONFIGURATION (BACKGROUND + ENABLE)
  // ===========================================================
  async function saveThemeConfig() {
    setThemeLoading(true);

    try {
      let imageUrl = themeConfig.theme_image_url;

      if (themeConfig._imageFile) {
        const file = themeConfig._imageFile;
        const ext = file.name.split(".").pop();
        const path = `theme/${Date.now()}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("theme-images")
          .upload(path, file);

        if (uploadErr) {
          alert("Failed to upload theme image.");
          setThemeLoading(false);
          return;
        }

        const { data } = supabase.storage
          .from("theme-images")
          .getPublicUrl(path);

        imageUrl = data?.publicUrl || "";
      }

      const { error: upsertErr } = await supabase.from("site_theme").upsert(
        {
          id: 1,
          banner_message: themeConfig.banner_message,
          banner_enabled: themeConfig.banner_enabled,
          theme_image_url: imageUrl,
          is_enabled: themeConfig.is_enabled,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      if (upsertErr) {
        console.log(upsertErr);
        alert("Theme save failed.");
        setThemeLoading(false);
        return;
      }

      alert("Theme updated!");
      setThemeConfig((prev) => ({
        ...prev,
        theme_image_url: imageUrl,
        _imageFile: null,
      }));
    } catch (err) {
      console.log(err);
      alert("Unexpected error.");
    }

    setThemeLoading(false);
  }

  // ===========================================================
  // LOGIN SCREEN
  // ===========================================================
  if (!isAdminLoggedIn) {
    return (
      <main className="admin">
        <section className="admin-login-card">
          <h2>Admin Login</h2>
          <p className="admin-login-hint">(Only for Mekha store owner)</p>

          <form onSubmit={handleAdminLogin} className="admin-login-form">
            <input
              className="input-text"
              placeholder="Admin Email"
              value={adminUser}
              onChange={(e) => setAdminUser(e.target.value)}
            />
            <input
              className="input-text"
              type="password"
              placeholder="Password"
              value={adminPass}
              onChange={(e) => setAdminPass(e.target.value)}
            />

            {adminError && <p className="admin-error">{adminError}</p>}

            <button className="btn-primary" type="submit">
              Login
            </button>
          </form>
        </section>
      </main>
    );
  }

  // ===========================================================
  // MAIN ADMIN DASHBOARD
  // ===========================================================
  return (
    <main className="admin">
      <div className="admin-top-row">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            width: "100%",
          }}
        >
          <h2 style={{ margin: 0 }}>Admin – Product Control Panel</h2>

          <button
            onClick={() => (window.location.href = "/")}
            style={{
              background: "#111",
              color: "white",
              padding: "6px 14px",
              border: "none",
              borderRadius: "20px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Go to Shop
          </button>
        </div>

        <button className="header-link" onClick={handleAdminLogout}>
          Logout
        </button>
      </div>

      {/* Dashboard */}
      <section className="admin-dashboard">
        <h3>Store Overview</h3>
        <div className="dashboard-cards">
          <div className="dash-card">
            <div className="dash-card-label">Total Products</div>
            <div className="dash-card-value">{products.length}</div>
          </div>

          <div className="dash-card">
            <div className="dash-card-label">Featured Products</div>
            <div className="dash-card-value">
              {products.filter((p) => p.is_featured).length}
            </div>
          </div>

          <div className="dash-card">
            <div className="dash-card-label">Top10 Items</div>
            <div className="dash-card-value">
              {products.filter((p) => p.is_top10).length}
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------
           ADD PRODUCT FORM (GRID)
      --------------------------- */}
      <section className="admin-form">
        <h3>Add Product</h3>

        <form onSubmit={handleAddProduct} className="add-product-grid">
          {/* PRODUCT NAME */}
          <div className="form-item">
            <label>Product Name</label>
            <input
              className="input-text"
              placeholder="Product Name"
              value={newProduct.name}
              onChange={(e) =>
                setNewProduct({ ...newProduct, name: e.target.value })
              }
            />
          </div>

          {/* CATEGORY WITH AUTOCOMPLETE */}
          <div className="form-item category-autocomplete">
            <label>Category</label>
            <input
              className="input-text"
              placeholder="Category"
              value={newProduct.category}
              onChange={(e) => {
                const value = e.target.value;
                setNewProduct((prev) => ({ ...prev, category: value }));
                setShowCatList(true);
              }}
              onFocus={() => setShowCatList(true)}
              onBlur={() => setTimeout(() => setShowCatList(false), 150)}
            />

            {showCatList && (
              <div className="category-dropdown">
                {allCategories
                  .filter((c) =>
                    c
                      .toLowerCase()
                      .includes((newProduct.category || "").toLowerCase())
                  )
                  .map((c) => (
                    <div
                      key={c}
                      className="category-option"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setNewProduct((prev) => ({ ...prev, category: c }));
                        setShowCatList(false);
                      }}
                    >
                      {c}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* MRP */}
          <div className="form-item">
            <label>MRP (₹)</label>
            <input
              className="input-text"
              type="number"
              placeholder="MRP"
              value={newProduct.mrp}
              onChange={(e) =>
                setNewProduct({ ...newProduct, mrp: e.target.value })
              }
            />
          </div>

          {/* PRICE */}
          <div className="form-item">
            <label>Price (₹)</label>
            <input
              className="input-text"
              type="number"
              placeholder="Price"
              value={newProduct.price}
              onChange={(e) =>
                setNewProduct({ ...newProduct, price: e.target.value })
              }
            />
          </div>

          {/* STOCK */}
          <div className="form-item">
            <label>Stock</label>
            <input
              className="input-text"
              type="number"
              placeholder="Stock"
              value={newProduct.stock}
              onChange={(e) =>
                setNewProduct({ ...newProduct, stock: e.target.value })
              }
            />
          </div>

          {/* DESCRIPTION */}
          <div className="form-item full-row">
            <label>Description</label>
            <textarea
              className="input-text"
              placeholder="Description"
              value={newProduct.description}
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  description: e.target.value,
                })
              }
            />
          </div>

          {/* UPLOAD IMAGES */}
          <div className="form-item full-row">
            <label className="file-label">
              Upload Images
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setNewProductFiles(e.target.files)}
              />
            </label>
          </div>

          {/* SAVE BUTTON */}
          <div className="form-item full-row" style={{ textAlign: "center" }}>
            <button className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save Product"}
            </button>
          </div>
        </form>
      </section>

      {/* ===========================
          PRODUCT TABLE
      ============================= */}
      <section className="admin-list">
        <h3>Current Products</h3>

        {loadingProducts ? (
          <p>Loading…</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Cat</th>
                <th>MRP</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Featured</th>
                <th>Top10</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.images.length ? (
                      <img
                        src={p.images[0]}
                        alt=""
                        className="admin-table-image"
                      />
                    ) : (
                      <span>No image</span>
                    )}
                  </td>

                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td>{p.mrp || "-"}</td>
                  <td>{p.price || "-"}</td>
                  <td>{p.stock}</td>

                  <td>
                    <button
                      className={
                        p.is_featured
                          ? "btn-small btn-primary"
                          : "btn-small btn-outline"
                      }
                      onClick={() => toggleFeatured(p)}
                    >
                      {p.is_featured ? "Yes" : "No"}
                    </button>
                  </td>

                  <td>
                    <button
                      className={
                        p.is_top10
                          ? "btn-small btn-primary"
                          : "btn-small btn-outline"
                      }
                      onClick={() => toggleTop10(p)}
                    >
                      {p.is_top10 ? "Top10" : "Set"}
                    </button>
                  </td>

                  <td>
                    <button
                      className="btn-small"
                      onClick={() => openEditModal(p)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => handleDeleteProduct(p.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {products.length === 0 && (
                <tr>
                  <td colSpan="9">No products.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>

      {/* ======================================================
           EDIT PRODUCT MODAL
      ====================================================== */}
      {editModalOpen && editingProduct && (
        <div className="modal-backdrop" onClick={closeEditModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Product</h3>

            <input
              className="input-text"
              value={editingProduct.name}
              onChange={(e) =>
                setEditingProduct({ ...editingProduct, name: e.target.value })
              }
            />

            <input
              className="input-text"
              value={editingProduct.category}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  category: e.target.value,
                })
              }
            />

            <input
              className="input-text"
              value={editingProduct.mrp}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  mrp: e.target.value,
                })
              }
            />

            <input
              className="input-text"
              value={editingProduct.price}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  price: e.target.value,
                })
              }
            />

            <input
              className="input-text"
              value={editingProduct.stock}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  stock: e.target.value,
                })
              }
            />

            <textarea
              className="input-text"
              value={editingProduct.description}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  description: e.target.value,
                })
              }
            />

            <div className="admin-image-preview-row">
              {editingProduct.images?.map((img, i) => (
                <img key={i} src={img} className="admin-image-preview" alt="" />
              ))}
            </div>

            <label className="file-label">
              Add More Images
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setEditFiles(e.target.files)}
              />
            </label>

            <div className="modal-actions">
              <button className="btn-primary" onClick={saveEditProduct}>
                Save
              </button>
              <button className="btn-danger" onClick={closeEditModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
           FESTIVAL / THEME MANAGER
      ====================================================== */}
      <section className="admin-form" style={{ marginTop: 40 }}>
        <h3>Festival Theme Manager</h3>

        <label style={{ display: "block", marginTop: 12, marginBottom: 6 }}>
          Sliding Banner Message:
        </label>

        <input
          className="input-text"
          placeholder="Example: Happy Deepavali!"
          value={themeConfig.banner_message}
          onChange={(e) =>
            setThemeConfig((prev) => ({
              ...prev,
              banner_message: e.target.value,
            }))
          }
        />

        <label style={{ marginTop: 12, display: "block" }}>
          Enable Sliding Banner:
        </label>
        <select
          className="input-text"
          value={themeConfig.banner_enabled ? "on" : "off"}
          onChange={(e) =>
            setThemeConfig((prev) => ({
              ...prev,
              banner_enabled: e.target.value === "on",
            }))
          }
        >
          <option value="off">OFF</option>
          <option value="on">ON</option>
        </select>

        <button
          className="btn-primary"
          style={{ marginTop: 12 }}
          onClick={saveBannerConfig}
        >
          Save Banner
        </button>

        <hr style={{ margin: "20px 0" }} />

        <label style={{ display: "block", marginBottom: 6 }}>
          Theme Background Image:
        </label>

        <label style={{ marginTop: 12, display: "block" }}>Enable Theme:</label>
        <select
          className="input-text"
          value={themeConfig.is_enabled ? "on" : "off"}
          onChange={(e) =>
            setThemeConfig((prev) => ({
              ...prev,
              is_enabled: e.target.value === "on",
            }))
          }
        >
          <option value="off">OFF</option>
          <option value="on">ON</option>
        </select>

        <input
          type="file"
          accept="image/*"
          style={{ marginTop: 10 }}
          onChange={(e) =>
            setThemeConfig((prev) => ({
              ...prev,
              _imageFile: e.target.files[0],
            }))
          }
        />

        {themeConfig.theme_image_url && (
          <img
            src={themeConfig.theme_image_url}
            alt="theme preview"
            style={{
              width: 160,
              marginTop: 12,
              borderRadius: 6,
              border: "1px solid #ccc",
            }}
          />
        )}

        <button
          className="btn-primary"
          style={{ marginTop: 16 }}
          onClick={saveThemeConfig}
          disabled={themeLoading}
        >
          {themeLoading ? "Saving..." : "Save Theme"}
        </button>
      </section>

      {/* -------------------------
           SERVICES MANAGEMENT
      --------------------------- */}
      <section className="admin-services">
        <h3>Manage Services</h3>
        <ServicesManager />
      </section>
    </main>
  );
}

export default AdminPortal;
