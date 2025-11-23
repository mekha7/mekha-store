import React, { useState, useMemo, useEffect } from "react";
import "./App.css";
import productsData from "./products.json";
import LanguagePicker, { translations } from "./components/LanguagePicker";
// --- SWIPER IMPORTS ---
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination,Zoom } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/zoom";

function App() {

  const goHome = () => {
  setShowAllProducts(false);    // Top 10 only
  setCategory("All");           // Reset category
  setSearch("");                // Clear search
  setView("shop");            // Switch to home page
  window.scrollTo(0, 0);        // Jump to top
};

  // Shop filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  // Review stars
const [reviewRating, setReviewRating] = useState(0);

// Review text
const [reviewText, setReviewText] = useState("");

// Uploaded images
const [reviewImages, setReviewImages] = useState([]);

const [showAllProducts, setShowAllProducts] = useState(false);



  // Cart & checkout
  const [cart, setCart] = useState([]);

  const [view, setView] = useState(() => {
    // Initial view: admin via hash, about via path, else shop
    if (typeof window !== "undefined") {
      if (window.location.hash === "#/admin-9980") return "admin";
      if (window.location.pathname.endsWith("/about")) return "about";
    }
    return "shop";
  }); // shop | checkout | admin | invoice | about

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [invoiceData, setInvoiceData] = useState(null);


  // Wishlist & Compare
  const [wishlist, setWishlist] = useState([]);
  // Product Modal state
const [selectedProduct, setSelectedProduct] = useState(null);
const [productModalOpen, setProductModalOpen] = useState(false);


  const [compareList, setCompareList] = useState([]);

  // Sales + price history
  const [salesHistory, setSalesHistory] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);

  // Admin auth
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [adminError, setAdminError] = useState("");
  

  // Admin product form (Add Product ONLY)
    const [products, setProducts] = useState([]);
  const [featuredIds, setFeaturedIds] = useState([]);

 const [top10Ids, setTop10Ids] = useState(() => {
 const saved = localStorage.getItem("top10");
  return saved ? JSON.parse(saved) : [];
 });

 const handleReviewImageUpload = (e) => {
  const files = Array.from(e.target.files);
  const previews = files.map((file) => URL.createObjectURL(file));
  setReviewImages((prev) => [...prev, ...previews]);
};


 useEffect(() => {
  localStorage.setItem("featuredIds", JSON.stringify(featuredIds));
}, [featuredIds]);

 useEffect(() => {
  localStorage.setItem("top10", JSON.stringify(top10Ids));
 }, [top10Ids]);



  // HERO PRODUCTS — admin selected
  const heroProducts = useMemo(() => {
    const selected = products.filter(p => featuredIds.includes(p.id));
    return selected.slice(0, 5);
  }, [products, featuredIds]);


  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    mrp: "",
    price: "",
    stock: "",
    description: "",
    images: [], // base64 array
  });

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // About modal
  const [aboutModalOpen, setAboutModalOpen] = useState(false);

  // Language
  const [language, setLanguage] = useState("English");

  // Simple translation helper with fallback
  function t(key, fallback) {
    const langPack = translations?.[language] || {};
    return langPack[key] || fallback;
  }

  // Watch hash + back/forward for admin/about
  useEffect(() => {
    function handleHashChange() {
      const isAdminRoute = window.location.hash === "#/admin-9980";
      setView(isAdminRoute ? "admin" : "shop");
    }

    function handlePopState() {
      if (window.location.hash === "#/admin-9980") {
        setView("admin");
      } else if (window.location.pathname.endsWith("/about")) {
        setView("about");
      } else {
        setView("shop");
      }
    }

    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // ✅ Load products from products.json on first render
  useEffect(() => {
    const mapped = productsData.map((p, index) => {
      const category =
        p.category && p.category.toString().trim()
          ? p.category.toString().trim()
          : "Misc";

      const stockCount =
        typeof p.stockCount === "number"
          ? p.stockCount
          : p.stockStatus === "Out of stock"
          ? 0
          : typeof p.stock === "number"
          ? p.stock
          : 10;

      // Multi-image support (fallback to single imageBase64)
      const images = Array.isArray(p.images)
        ? p.images
        : p.imageBase64
        ? [p.imageBase64]
        : [];

      return {
        id: p.id ?? index + 1,
        name: p.name || "Unnamed product",
        category,
        mrp:
          typeof p.mrp === "number"
            ? p.mrp
            : typeof p.price === "number"
            ? p.price
            : null,
        price: typeof p.price === "number" ? p.price : null,
        stock: stockCount,
        description: p.description || "",
        images,
      };
    });

    setProducts(mapped);
  }, []);

  // ✅ Category options + counts generated from JSON
  const { categoryOptions, categoryCounts, lowStockItems } = useMemo(() => {
    const counts = {};
    const lows = [];
    // Top slider products (take first 5)


    products.forEach((p) => {
      const key = p.category || "Misc";
      counts[key] = (counts[key] || 0) + 1;
      if (p.stock > 0 && p.stock < 5) {
        lows.push(p);
      }
    });

    const options = ["All", ...Object.keys(counts).sort()];

    return {
      categoryOptions: options,
      categoryCounts: counts,
      lowStockItems: lows,
    };
  }, [products]);

// Filter products for shop view
const filteredProducts = useMemo(() => {
  const searchLower = search.toLowerCase();

  return products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchLower);
    const cat = p.category || "Misc";
    const matchCategory = category === "All" ? true : cat === category;
    return matchSearch && matchCategory;
  });
}, [products, search, category]);

 // ⭐ Homepage — show only first 10 products
 const homepageProducts = showAllProducts
  ? filteredProducts
  : filteredProducts.slice(0, 10);


  const cartTotal = cart.reduce(
    (sum, c) => sum + (c.product.price || 0) * c.qty,
    0
  );

  const totalRevenue = salesHistory.reduce(
    (sum, s) => sum + (s.total || 0),
    0
  );

  const recentSales = salesHistory.slice(-7);
  const recentMax = recentSales.reduce(
    (max, s) => (s.total > max ? s.total : max),
    0
  );

  // NAV HELPERS
  function goToShop() {
    // From admin or about back to main shop
    if (window.location.hash === "#/admin-9980") {
      window.location.hash = "";
    }
    if (window.location.pathname.endsWith("/about")) {
      window.history.pushState({}, "", "/");
    }
    setView("shop");
  }

  function goToAbout() {
    if (window.location.hash === "#/admin-9980") {
      window.location.hash = "";
    }
    window.history.pushState({}, "", "/about");
    setView("about");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // CART LOGIC
  function addToCart(product) {
    if (product.stock <= 0) return;

    const exists = cart.find((c) => c.product.id === product.id);
    if (exists) {
      setCart(
        cart.map((c) =>
          c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c
        )
      );
    } else {
      setCart([...cart, { product, qty: 1 }]);
    }
  }

  function updateQty(id, qty) {
    const value = Number(qty);
    if (value <= 0) {
      setCart(cart.filter((c) => c.product.id !== id));
    } else {
      setCart(
        cart.map((c) =>
          c.product.id === id ? { ...c, qty: value } : c
        )
      );
    }
  }

  // WISHLIST / COMPARE
  function toggleWishlist(productId) {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  }
  // CHECKOUT / INVOICE
  function handleGenerateInvoice() {
    if (!customerName || !customerPhone || !customerAddress) {
      alert(
        t(
          "customerDetailsValidation",
          "Please fill customer details."
        )
      );
      return;
    }
    if (cart.length === 0) {
      alert(t("cartEmptyMsg", "Cart is empty."));
      return;
    }

    const now = new Date();
    const invoiceNumber = "MSS-" + now.getTime().toString().slice(-6);

    const invoice = {
      invoiceNumber,
      date: now.toLocaleString(),
      customerName,
      customerPhone,
      customerAddress,
      items: cart,
      total: cartTotal,
    };

    setInvoiceData(invoice);

    // Record sales history
    setSalesHistory((prev) => [
      ...prev,
      {
        id: now.getTime(),
        date: invoice.date,
        total: cartTotal,
        items: cart.map((c) => ({
          productId: c.product.id,
          name: c.product.name,
          qty: c.qty,
          price: c.product.price || 0,
        })),
      },
    ]);

    // Auto stock decrease
    setProducts((prev) =>
      prev.map((p) => {
        const line = cart.find((c) => c.product.id === p.id);
        if (!line) return p;
        const newStock = Math.max(0, (p.stock || 0) - line.qty);
        return { ...p, stock: newStock };
      })
    );

    // Clear cart after invoice
    setCart([]);
    setView("invoice");
  }

  function handlePrintInvoice() {
    window.print();
  }

  // ADMIN AUTH
  function handleAdminLogin(e) {
    e.preventDefault();
    if (adminUser === "Mekha" && adminPass === "12345678") {
      setIsAdminLoggedIn(true);
      setAdminError("");
      setAdminPass("");
    } else {
      setAdminError(
        t("adminInvalidCreds", "Invalid username or password")
      );
    }
  }

  function handleAdminLogout() {
    setIsAdminLoggedIn(false);
    setAdminUser("");
    setAdminPass("");
    setAdminError("");
    goToShop();
  }

  // ADMIN ADD PRODUCT FORM (multi-image append)
  function handleNewProductImagesChange(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const readers = files.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        })
    );

    Promise.all(readers).then((base64Images) => {
      setNewProduct((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...base64Images],
      }));
    });
  }

  function handleAddProduct(e) {
    e.preventDefault();

    if (!newProduct.name || !newProduct.category) {
      alert(
        t(
          "addProductValidation",
          "Name and category are required."
        )
      );
      return;
    }

    const stockNum = newProduct.stock ? Number(newProduct.stock) : 0;

    const payload = {
      id: Date.now(),
      name: newProduct.name.trim(),
      category: newProduct.category.trim() || "Misc",
      mrp: newProduct.mrp ? Number(newProduct.mrp) : null,
      price: newProduct.price ? Number(newProduct.price) : null,
      stock: isNaN(stockNum) ? 0 : stockNum,
      description: newProduct.description.trim(),
      images: Array.isArray(newProduct.images)
        ? newProduct.images
        : [],
    };

    setProducts((prev) => [...prev, payload]);

    setNewProduct({
      name: "",
      category: "",
      mrp: "",
      price: "",
      stock: "",
      description: "",
      images: [],
    });
  }

  // ADMIN EDIT MODAL (multi-image append)
  function openEditModal(p) {
    setEditingProduct({
      ...p,
      mrp: p.mrp ?? "",
      price: p.price ?? "",
      stock: p.stock ?? "",
      description: p.description ?? "",
      images: Array.isArray(p.images) ? p.images : [],
    });
    setEditModalOpen(true);
  }

  function closeEditModal() {
    setEditModalOpen(false);
    setEditingProduct(null);
  }

  function handleEditFieldChange(field, value) {
    setEditingProduct((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleEditImagesChange(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const readers = files.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        })
    );

    Promise.all(readers).then((base64Images) => {
      setEditingProduct((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...base64Images],
      }));
    });
  }

  function saveEditProduct() {
    if (!editingProduct) return;

    const updated = {
      ...editingProduct,
      name: editingProduct.name.trim(),
      category: editingProduct.category.trim() || "Misc",
      mrp: editingProduct.mrp
        ? Number(editingProduct.mrp)
        : null,
      price: editingProduct.price
        ? Number(editingProduct.price)
        : null,
      stock: editingProduct.stock
        ? Number(editingProduct.stock)
        : 0,
      description: editingProduct.description.trim(),
      images: Array.isArray(editingProduct.images)
        ? editingProduct.images
        : [],
    };

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== editingProduct.id) return p;

        const oldPrice = p.price ?? null;
        const newPrice = updated.price ?? null;

        if (
          oldPrice !== null &&
          newPrice !== null &&
          oldPrice !== newPrice
        ) {
          setPriceHistory((ph) => [
            ...ph,
            {
              productId: p.id,
              name: p.name,
              oldPrice,
              newPrice,
              date: new Date().toLocaleString(),
            },
          ]);
        }

        return updated;
      })
    );

    closeEditModal();
  }

  function handleDeleteProduct(id) {
    setProducts(products.filter((p) => p.id !== id));
    setCart(cart.filter((c) => c.product.id !== id));
    setWishlist((prev) => prev.filter((pid) => pid !== id));
    setCompareList((prev) => prev.filter((pid) => pid !== id));
  }

  // EXPORTS
  function exportCSV() {
    const header = [
      t("nameHeader", "Name"),
      t("categoryHeader", "Category"),
      "MRP",
      t("priceHeader", "Price"),
      t("stockHeader", "Stock"),
      t("descriptionHeader", "Description"),
    ];
    const rows = products.map((p) => [
      p.name,
      p.category,
      p.mrp ?? "",
      p.price ?? "",
      p.stock ?? "",
      (p.description || "").replace(/\n/g, " "),
    ]);

    const csv = [header, ...rows]
      .map((r) =>
        r
          .map((field) =>
            `"${String(field ?? "")
              .replace(/"/g, '""')
              .trim()}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "mekha_products.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function exportExcelLike() {
    // Simple Excel-friendly CSV with .xls extension
    const header = [
      t("nameHeader", "Name"),
      t("categoryHeader", "Category"),
      "MRP",
      t("priceHeader", "Price"),
      t("stockHeader", "Stock"),
      t("descriptionHeader", "Description"),
    ];
    const rows = products.map((p) => [
      p.name,
      p.category,
      p.mrp ?? "",
      p.price ?? "",
      p.stock ?? "",
      (p.description || "").replace(/\n/g, " "),
    ]);

    const csv = [header, ...rows]
      .map((r) => r.join("\t"))
      .join("\n");

    const blob = new Blob([csv], {
      type: "application/vnd.ms-excel",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "mekha_products.xls");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function exportPdfSimple() {
    // Open a new window with table and let user print to PDF
    const win = window.open("", "_blank");
    if (!win) return;
    const html = `
      <html>
      <head>
        <title>Mekha Products PDF</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 16px; }
          table { border-collapse: collapse; width: 100%; font-size: 12px; }
          th, td { border: 1px solid #e5e7eb; padding: 4px; text-align: left; }
          th { background: #f3f4f6; }
        </style>
      </head>
      <body>
        <h2>Mekha CCTV Solutions &amp; Services - ${t(
          "productListTitle",
          "Product List"
        )}</h2>
        <table>
          <thead>
            <tr>
              <th>${t("nameHeader", "Name")}</th>
              <th>${t("categoryHeader", "Category")}</th>
              <th>MRP</th>
              <th>${t("priceHeader", "Price")}</th>
              <th>${t("stockHeader", "Stock")}</th>
            </tr>
          </thead>
          <tbody>
            ${products
              .map(
                (p) => `
              <tr>
                <td>${p.name}</td>
                <td>${p.category}</td>
                <td>${p.mrp ?? ""}</td>
                <td>${p.price ?? ""}</td>
                <td>${p.stock ?? ""}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.print();
  }

  // BULK UPLOAD (CSV only)
  function handleBulkUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const nameLower = file.name.toLowerCase();
    if (!nameLower.endsWith(".csv")) {
      alert(
        t(
          "bulkUploadCsvMsg",
          "Currently bulk upload supports CSV. Please export your Excel file as CSV and upload."
        )
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      if (typeof text !== "string") return;

      const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
      if (lines.length < 2) {
        alert(t("csvLooksEmpty", "CSV looks empty."));
        return;
      }

      // Expect header: name,category,mrp,price,stock,description
      const header = lines[0].split(",");
      const nameIndex = header.findIndex((h) =>
        /name/i.test(h)
      );
      const catIndex = header.findIndex((h) =>
        /category/i.test(h)
      );
      const mrpIndex = header.findIndex((h) =>
        /mrp/i.test(h)
      );
      const priceIndex = header.findIndex((h) =>
        /price/i.test(h)
      );
      const stockIndex = header.findIndex((h) =>
        /stock/i.test(h)
      );
      const descIndex = header.findIndex((h) =>
        /desc/i.test(h)
      );

      const newItems = [];

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(",");
        if (!row[nameIndex]) continue;

        const name = row[nameIndex].replace(/^"|"$/g, "").trim();
        const category =
          catIndex >= 0
            ? row[catIndex].replace(/^"|"$/g, "").trim()
            : "Misc";
        const mrpVal =
          mrpIndex >= 0
            ? Number(row[mrpIndex].replace(/"/g, ""))
            : null;
        const priceVal =
          priceIndex >= 0
            ? Number(row[priceIndex].replace(/"/g, ""))
            : null;
        const stockVal =
          stockIndex >= 0
            ? Number(row[stockIndex].replace(/"/g, ""))
            : 0;
        const descVal =
          descIndex >= 0
            ? row[descIndex].replace(/^"|"$/g, "")
            : "";

        newItems.push({
          id: Date.now() + i,
          name,
          category: category || "Misc",
          mrp: isNaN(mrpVal) ? null : mrpVal,
          price: isNaN(priceVal) ? null : priceVal,
          stock: isNaN(stockVal) ? 0 : stockVal,
          description: descVal,
          images: [],
        });
      }

      if (!newItems.length) {
        alert(
          t("noValidRowsMsg", "No valid rows found in CSV.")
        );
        return;
      }

      setProducts((prev) => [...prev, ...newItems]);
      alert(
        t(
          "bulkUploadComplete",
          `Bulk upload complete: added ${newItems.length} products.`
        )
      );
    };
    reader.readAsText(file);
  }

  // UI HELPERS
  function getStockLabel(p) {
    if (p.stock <= 0) return t("outOfStockLabel", "Out of stock");
    if (p.stock < 5)
      return t("onlyXLeft", `Only ${p.stock} left`);
    return t("inStockLabel", `${p.stock} in stock`);
  }
  // PRODUCT MODAL HELPERS
function openProductModal(product) {
  if (!product) return;
  setSelectedProduct(product);
  setProductModalOpen(true);
}

function closeProductModal() {
  setProductModalOpen(false);
  setSelectedProduct(null);
}


  function isLowStock(p) {
    return p.stock > 0 && p.stock < 5;
  }

  // Reusable About content (used in page + modal)
  function renderAboutContent() {
    return (
      <>
        <h2 className="about-title">
          {t(
            "aboutTitle",
            "About Mekha CCTV Solutions & Services"
          )}
        </h2>
        <p className="about-subtitle">
          {t(
            "aboutSubtitle",
            "Mekha CCTV Solutions & Services is a security & IT solutions store in Davangere, Karnataka, run by Naresh Mekha. We help homes, shops, schools, hospitals and small businesses stay secure and connected."
          )}
        </p>

        <div className="about-grid">
          <div className="about-col">
            <h3>{t("whatWeDoTitle", "What we do")}</h3>
            <ul>
              <li>
                {t(
                  "whatWeDo1",
                  "✅ CCTV camera setup & maintenance"
                )}
              </li>
              <li>
                {t(
                  "whatWeDo2",
                  "✅ NVR / DVR, hard disks & racks"
                )}
              </li>
              <li>
                {t(
                  "whatWeDo3",
                  "✅ Wi-Fi routers, network devices & cabling"
                )}
              </li>
              <li>
                {t(
                  "whatWeDo4",
                  "✅ Smart door bells & wireless cameras"
                )}
              </li>
              <li>
                {t(
                  "whatWeDo5",
                  "✅ System PCs, monitors & power solutions (SMPS, UPS)"
                )}
              </li>
            </ul>
          </div>

          <div className="about-col">
            <h3>
              {t("whyCustomersLikeUsTitle", "Why customers like us")}
            </h3>
            <ul>
              <li>
                {t(
                  "whyCustomers1",
                  "🧑‍🔧 On-site visit, installation & neat wiring"
                )}
              </li>
              <li>
                {t(
                  "whyCustomers2",
                  "📱 Mobile view setup & training"
                )}
              </li>
              <li>
                {t(
                  "whyCustomers3",
                  "♻ Upgrade existing CCTV / reuse hardware where possible"
                )}
              </li>
              <li>
                {t(
                  "whyCustomers4",
                  "💬 Direct WhatsApp support with photos & videos"
                )}
              </li>
              <li>
                {t(
                  "whyCustomers5",
                  "📍 Store located near Shamanur Road, Davangere – easy access"
                )}
              </li>
            </ul>
          </div>
        </div>

        <div className="about-highlight">
          <p>
            {t(
              "aboutHighlightText",
              "This website is built to make it easier for Naresh Mekha to manage stock, pricing, and invoices – while customers can quickly browse products, compare options and raise enquiries without any login or signup."
            )}
          </p>
        </div>

        <div className="about-cta">
          <p>
            {t(
              "aboutCtaText",
              "For demo, quotation or site visit in & around Davangere:"
            )}
          </p>
          <p>
            📞 <strong>8050426215</strong> &nbsp;|&nbsp; 📧{" "}
            <strong>mekhasolutions@gmail.com</strong>
          </p>
          <p>
            {t(
              "aboutAddressLine",
              "📍 Dollars Colony, Shamanur Road, Davangere – 577004"
            )}
          </p>
        </div>
      </>
    );
  }

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div
          className="header-left"
          onClick={goToShop}
          style={{ cursor: "pointer" }}
        >
          <img src="/logo.png" alt="Mekha logo" className="logo" />
          <div>
            <h1 className="title" onClick={goHome}
  style={{ cursor: "pointer" }}>Mekha CCTV Solutions &amp; Services</h1>
            <p className="subtitle">
              {t(
                "headerSubtitle",
                "CCTV • Digital Boards • Electrical & IT Solutions"
              )}
            </p>
          </div>
        </div>

        <div className="header-actions">
          <button className="header-link" onClick={goHome}>home</button>
          <button className="header-link" onClick={goToAbout}>
            {t("about", "About")}
          </button>
          <button
            className="cart-btn"
            onClick={() => setView("checkout")}
          >
            {t("cart", "Cart")} ({cart.length}) — ₹{cartTotal}
          </button>
         <div className="lang-wrapper">
  <LanguagePicker language={language} setLanguage={setLanguage} />
</div>

        </div>
      </header>

      {/* SHOP VIEW */}
      {view === "shop" && (
        <main className="content">
          {/* ================== HERO TOP SLIDER ================== */}
{heroProducts.length > 0 && (
  <section className="hero-section">
    <Swiper
      modules={[Navigation, Pagination, Zoom]}
      navigation
      pagination={{ clickable: true }}
      loop={heroProducts.length > 1}
      className="hero-swiper"
    >
      {heroProducts.map((p, index) => (
        <SwiperSlide key={p.id}>
          <div className="hero-slide">
            <div
              className="hero-image-wrapper"
              onClick={() => openProductModal(p)}
            >
              {p.images?.length > 0 ? (
                <img src={p.images[0]} alt={p.name} className="hero-image" />
              ) : (
                <div className="hero-image-placeholder">No image</div>
              )}

              {/* Badges */}
              {p.mrp && p.price && p.mrp > p.price && (
                <div className="hero-badge hero-badge-offer">
                  Offer
                </div>
              )}
              {index === 0 && (
                <div className="hero-badge hero-badge-top">
                  Top Seller
                </div>
              )}
            </div>

            <div className="hero-content">
              <h2 className="hero-title">{p.name}</h2>
              {p.description && (
                <p className="hero-desc">
                  {p.description.length > 140
                    ? p.description.slice(0, 140) + "…"
                    : p.description}
                </p>
              )}

              <div className="hero-price-row">
                <span className="hero-price">
                  {p.price ? `₹${p.price}` : p.mrp ? `₹${p.mrp}` : "Ask price"}
                </span>
                {p.mrp && p.price && p.mrp > p.price && (
                  <span className="hero-mrp">₹{p.mrp}</span>
                )}
              </div>

              <div className="hero-cta-row">
                <button
                  className="btn-primary hero-btn"
                  onClick={() => {
                    addToCart(p);
                    setView("checkout");
                  }}
                >
                  Buy Now
                </button>

                <button
                  className="btn-outline hero-btn-secondary"
                  onClick={() => openProductModal(p)}
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  </section>
)}



          {/* Search + Category */}
          <div className="search-row">
            <input
              type="text"
              className="search-box"
              placeholder={t(
                "searchPlaceholder",
                "Search products…"
              )}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c === "All"
                    ? `${t("allLabel", "All")} (${products.length})`
                    : `${c} (${categoryCounts[c] || 0})`}
                </option>
              ))}
            </select>
          </div>

          {/* Products */}
          <div className="product-grid">
           {homepageProducts.map((p) => (
              
<div
  key={p.id}
  className="product-card product-card-hover"
  onClick={() => openProductModal(p)}
>
                <div className="product-image-wrapper">
                  {p.images && p.images.length > 0 ? (
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="product-image"
                    />
                  ) : (
                    <div className="product-image-placeholder">
                      <span>{t("noImage", "No image")}</span>
                    </div>
                  )}
                </div>

                <div className="product-info">
                  <h3>{p.name}</h3>
                  {p.description && <p>{p.description}</p>}

                  <div className="price-row">
                    <span className="price">
                      {p.price
                        ? `₹${p.price}`
                        : p.mrp
                        ? `₹${p.mrp}`
                        : t("askPrice", "Ask price")}
                    </span>
                    {p.mrp && p.price && p.mrp > p.price && (
                      <span className="mrp">₹{p.mrp}</span>
                    )}
                  </div>

                  <div className="meta-row">
                    <span className="product-category">
                      {p.category}
                    </span>
                    <span
                      className={
                        p.stock <= 0
                          ? "stock-badge out"
                          : "stock-badge in"
                      }
                    >
                      {getStockLabel(p)}
                    </span>
                  </div>

                  {isLowStock(p) && (
                    <p className="stock-warning">
                      {t(
                        "lowStockWarning",
                        "⚠ Low stock – hurry up!"
                      )}
                    </p>
                  )}

                  <div className="card-actions-row">
  <button
    type="button"
    className={`btn-chip ${wishlist.includes(p.id) ? "active" : ""}`}
    onClick={() => toggleWishlist(p.id)}
  >
    {wishlist.includes(p.id)
      ? t("wishlisted", "♥ Wishlisted")
      : t("wishlist", "♡ Wishlist")}
  </button>
</div>
                  <button
                    className="btn-primary"
                    onClick={() => addToCart(p)}
                    disabled={p.stock <= 0}
                  >
                    {p.stock <= 0
                      ? t("outOfStock", "Out of stock")
                      : t("addToCart", "Add to Cart")}
                  </button>
                </div>
              </div>
            ))}

            {filteredProducts.length === 0 && (
              <p className="empty-text">
                {t(
                  "noProductsFound",
                  "No products found. Try another search or category, or add products in Admin."
                )}
              </p>
            )}
          </div>
 {/* Update your View All button: */}
  {filteredProducts.length > 10 && !showAllProducts && (
  <div style={{ textAlign: "center", marginTop: "10px" }}>
    <button
      className="btn-primary"
      onClick={() => {
        setCategory("All");
        setShowAllProducts(true);   // ← IMPORTANT
      }}
    >
      View All Products ({filteredProducts.length})
    </button>
  </div>
)}

          {/* ⭐ GOOGLE REVIEWS SECTION (Google + User Review Form) */}
<section className="google-reviews-section" style={{ marginTop: "35px" }}>
  <h2 style={{ textAlign: "center", marginBottom: "12px" }}>
    ⭐ Customer Reviews & Ratings
  </h2>

  {/* Google Reviews Iframe */}
  <iframe
  title="google-reviews-widget"
    src="https://widgets.sociablekit.com/google-reviews/iframe/25625435"
    width="100%"
    height="450"
    style={{ border: "none", borderRadius: "8px" }}
  ></iframe>
{/* ⭐⭐⭐⭐⭐ REVIEW INPUT BELOW GOOGLE REVIEWS */}
  <section className="write-review-section">
  <h2>Write a Review</h2>

  {/* ⭐ Star Rating */}
  <div className="star-rating">
    {[1,2,3,4,5].map((star) => (
      <span
        key={star}
        className={reviewRating >= star ? "star filled" : "star"}
        onClick={() => setReviewRating(star)}
      >
        ★
      </span>
    ))}
  </div>

  {/* Review Text */}
  <textarea
    placeholder="Share your experience..."
    value={reviewText}
    onChange={(e) => setReviewText(e.target.value)}
    className="review-textarea"
  />

  {/* Image Upload */}
  <div className="upload-wrapper">
  <label className="upload-btn">
    📸 Upload Images
    <input
      type="file"
      accept="image/*"
      multiple
      onChange={handleReviewImageUpload}
      style={{ display: "none" }}
    />
  </label>
  </div>
  {/* Preview Selected Images */}
  <div className="review-image-preview">
    {reviewImages.map((img, index) => (
      <img key={index} src={img} className="preview-img" alt="review upload" />
    ))}
  </div>

  <button className="submit-review-btn">
    Submit Review
  </button>
</section>
</section>


          {/* Compare panel */}
          {compareList.length > 0 && (
            <section className="compare-panel">
              <h3>
                {t("compareTitle", "Compare")} (
                {compareList.length})
              </h3>
              <div className="compare-scroll">
                {products
                  .filter((p) => compareList.includes(p.id))
                  .map((p) => (
                    <div key={p.id} className="compare-card">
                      <h4>{p.name}</h4>
                      <p className="compare-category">
                        {p.category}
                      </p>
                      <p className="compare-price">
                        {p.price
                          ? `₹${p.price}`
                          : p.mrp
                          ? `₹${p.mrp}`
                          : t("askLabel", "Ask")}
                      </p>
                      <p className="compare-stock">
                        {getStockLabel(p)}
                      </p>
                    </div>
                  ))}
              </div>
              <button
                type="button"
                className="btn-small btn-outline"
                onClick={() => setCompareList([])}
              >
                {t("clearCompare", "Clear compare")}
              </button>
            </section>
          )}
        </main>
      )}

      {/* CHECKOUT VIEW */}
      {view === "checkout" && (
        <main className="checkout">
          <button className="back-btn" onClick={goToShop}>
            {t("backToShop", "← Back to shop")}
          </button>

          <h2>{t("yourCart", "Your Cart")}</h2>

          {cart.length === 0 && (
            <p>{t("cartEmptyMsg", "Cart is empty.")}</p>
          )}

          {cart.map((c) => (
            <div key={c.product.id} className="checkout-item">
              <span>{c.product.name}</span>
              <input
                type="number"
                min="1"
                value={c.qty}
                onChange={(e) =>
                  updateQty(c.product.id, e.target.value)
                }
              />
              <strong>
                ₹{(c.product.price || 0) * c.qty}
              </strong>
            </div>
          ))}

          <h3>
            {t("totalLabel", "Total")}: ₹{cartTotal}
          </h3>

          <section className="checkout-details">
            <h3>
              {t("customerDetails", "Customer Details")}
            </h3>
            <input
              className="input-text"
              placeholder={t(
                "fullNamePlaceholder",
                "Full name"
              )}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            <input
              className="input-text"
              placeholder={t(
                "phonePlaceholder",
                "Phone number"
              )}
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
            <textarea
              className="input-text"
              placeholder={t(
                "addressPlaceholder",
                "Full address"
              )}
              value={customerAddress}
              onChange={(e) =>
                setCustomerAddress(e.target.value)
              }
            />
            <button
              className="btn-primary"
              onClick={handleGenerateInvoice}
            >
              {t("generateInvoice", "Generate Invoice")}
            </button>
          </section>
        </main>
      )}

      {/* INVOICE VIEW */}
      {view === "invoice" && invoiceData && (
        <main className="invoice">
          <button className="back-btn" onClick={goToShop}>
            {t("backToShop", "← Back to shop")}
          </button>

          <div className="invoice-card">
            <header className="invoice-header">
              <div>
                <h2>Mekha Solutions &amp; Services</h2>
                <p>
                  {t(
                    "invoiceAddressLine",
                    "Dollars Colony, Shamanur Road, Davangere – 577004"
                  )}
                  <br />
                  📞 8050426215 | 📧 mekhasolutions@gmail.com
                </p>
              </div>
              <div className="invoice-meta">
                <p>
                  <strong>
                    {t("invoiceNumberLabel", "Invoice #")}
                  </strong>{" "}
                  {invoiceData.invoiceNumber}
                </p>
                <p>
                  <strong>{t("dateLabel", "Date")}</strong>{" "}
                  {invoiceData.date}
                </p>
              </div>
            </header>

            <section className="invoice-section">
              <h3>{t("billTo", "Bill To")}</h3>
              <p>
                {invoiceData.customerName} <br />
                {invoiceData.customerPhone} <br />
                {invoiceData.customerAddress}
              </p>
            </section>

            <section className="invoice-section">
              <h3>{t("itemsLabel", "Items")}</h3>
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>{t("itemHeader", "Item")}</th>
                    <th>{t("qtyHeader", "Qty")}</th>
                    <th>
                      {t("pricePerHeader", "Price (₹)")}
                    </th>
                    <th>
                      {t("totalRowHeader", "Total (₹)")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.items.map((item) => (
                    <tr key={item.product.id}>
                      <td>{item.product.name}</td>
                      <td>{item.qty}</td>
                      <td>{item.product.price || 0}</td>
                      <td>
                        {(item.product.price || 0) * item.qty}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="invoice-total">
                <strong>
                  {t("grandTotal", "Grand Total")}: ₹
                  {invoiceData.total}
                </strong>
              </div>
            </section>

            <footer className="invoice-footer-text">
              <p>
                {t(
                  "invoiceThanks",
                  "Thank you for your business!"
                )}
              </p>
            </footer>
          </div>

          <button
            className="btn-primary"
            onClick={handlePrintInvoice}
          >
            {t(
              "printDownloadInvoice",
              "Print / Download Invoice"
            )}
          </button>
        </main>
      )}

      {/* ABOUT PAGE VIEW (route /about) */}
      {view === "about" && (
        <main className="about-page">
          <div className="about-card">
            {renderAboutContent()}
          </div>
        </main>
      )}

      {/* ADMIN VIEW (secret: #/admin-9980) */}
      {view === "admin" && (
        <main className="admin">
          <button className="back-btn" onClick={goToShop}>
            {t("backToShop", "← Back to shop")}
          </button>



          {!isAdminLoggedIn ? (
            <section className="admin-login-card">
              <h2>{t("adminLoginTitle", "Admin Login")}</h2>
              <p className="admin-login-hint">
                {t(
                  "adminLoginHint",
                  "(Open URL with #/admin-9980 to access this page)"
                )}
              </p>
              <form
                onSubmit={handleAdminLogin}
                className="admin-login-form"
              >
                <input
                  className="input-text"
                  placeholder={t(
                    "adminUsernamePlaceholder",
                    "Username"
                  )}
                  value={adminUser}
                  onChange={(e) =>
                    setAdminUser(e.target.value)
                  }
                />
                <input
                  className="input-text"
                  type="password"
                  placeholder={t(
                    "adminPasswordPlaceholder",
                    "Password"
                  )}
                  value={adminPass}
                  onChange={(e) =>
                    setAdminPass(e.target.value)
                  }
                />
                {adminError && (
                  <p className="admin-error">
                    {adminError}
                  </p>
                )}
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {t("loginButton", "Login")}
                </button>
              </form>
            </section>
          ) : (
            <>
            
              <div className="admin-top-row">
                <h2>
                  {t(
                    "adminManageProductsTitle",
                    "Admin – Manage Products"
                  )}
                </h2>
                <button
                  className="header-link"
                  onClick={handleAdminLogout}
                >
                  {t("logoutButton", "Logout")}
                </button>
              </div>

              {/* Dashboard */}
              <section className="admin-dashboard">
                <h3>
                  {t("storeOverview", "Store Overview")}
                </h3>
                <div className="dashboard-cards">
                  <div className="dash-card">
                    <div className="dash-card-label">
                      {t(
                        "dashTotalProducts",
                        "Total Products"
                      )}
                    </div>
                    <div className="dash-card-value">
                      {products.length}
                    </div>
                  </div>
                  <div className="dash-card">
                    <div className="dash-card-label">
                      {t(
                        "dashTotalSales",
                        "Total Sales (Invoices)"
                      )}
                    </div>
                    <div className="dash-card-value">
                      {salesHistory.length}
                    </div>
                  </div>
                  <div className="dash-card">
                    <div className="dash-card-label">
                      {t(
                        "dashRevenueApprox",
                        "Revenue (Approx)"
                      )}
                    </div>
                    <div className="dash-card-value">
                      ₹{totalRevenue}
                    </div>
                  </div>
                  <div className="dash-card">
                    <div className="dash-card-label">
                      {t(
                        "dashLowStockItems",
                        "Low Stock Items"
                      )}
                    </div>
                    <div className="dash-card-value">
                      {lowStockItems.length}
                    </div>
                  </div>
                </div>

                {recentSales.length > 0 && (
                  <div className="sales-chart">
                    {recentSales.map((s) => {
                      const height =
                        recentMax > 0
                          ? Math.max(
                              10,
                              (s.total / recentMax) * 100
                            )
                          : 0;
                      return (
                        <div
                          key={s.id}
                          className="sales-bar-wrapper"
                        >
                          <div
                            className="sales-bar"
                            style={{ height: `${height}%` }}
                          />
                          <span className="sales-bar-label">
                            ₹{s.total}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {lowStockItems.length > 0 && (
                  <div className="low-stock-list">
                    <h4>
                      {t(
                        "lowStockAlertsTitle",
                        "Low Stock Alerts"
                      )}
                    </h4>
                    <ul>
                      {lowStockItems.map((p) => (
                        <li key={p.id}>
                          {p.name} – {getStockLabel(p)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {priceHistory.length > 0 && (
                  <div className="price-history">
                    <h4>
                      {t(
                        "recentPriceChangesTitle",
                        "Recent Price Changes"
                      )}
                    </h4>
                    <ul>
                      {priceHistory
                        .slice(-5)
                        .reverse()
                        .map((h, idx) => (
                          <li key={idx}>
                            {h.name}: ₹{h.oldPrice} → ₹
                            {h.newPrice} ({h.date})
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </section>


              {/* Export & bulk upload */}
              <section className="admin-tools-row">
                <div className="admin-export">
                  <span>
                    {t(
                      "exportProductsLabel",
                      "Export Products:"
                    )}
                  </span>
                  <button
                    type="button"
                    className="btn-small btn-outline"
                    onClick={exportCSV}
                  >
                    CSV
                  </button>
                  <button
                    type="button"
                    className="btn-small btn-outline"
                    onClick={exportExcelLike}
                  >
                    {t("excelLabel", "Excel")}
                  </button>
                  <button
                    type="button"
                    className="btn-small btn-outline"
                    onClick={exportPdfSimple}
                  >
                    PDF
                  </button>
                </div>
                <div className="admin-bulk">
                  <span>
                    {t(
                      "bulkUploadLabel",
                      "Bulk Upload (.csv):"
                    )}
                  </span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleBulkUpload}
                  />
                </div>
              </section>

              {/* Add Product */}
              <section className="admin-form">
                <h3>{t("addProductTitle", "Add Product")}</h3>
                <form onSubmit={handleAddProduct}>
                  <input
                    className="input-text"
                    placeholder={t(
                      "productNamePlaceholder",
                      "Product name"
                    )}
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        name: e.target.value,
                      })
                    }
                  />

                  {/* Category: allow new + suggestions */}
                  <div className="category-input-wrapper">
                    <input
                      className="input-text"
                      list="category-list"
                      placeholder={t(
                        "categoryPlaceholder",
                        "Category (type or choose)"
                      )}
                      value={newProduct.category}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          category: e.target.value,
                        })
                      }
                    />
                    <datalist id="category-list">
                      {categoryOptions
                        .filter((c) => c !== "All")
                        .map((c) => (
                          <option key={c} value={c} />
                        ))}
                    </datalist>
                  </div>

                  <input
                    className="input-text"
                    placeholder={t(
                      "mrpPlaceholder",
                      "MRP (₹, optional)"
                    )}
                    type="number"
                    value={newProduct.mrp}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        mrp: e.target.value,
                      })
                    }
                  />
                  <input
                    className="input-text"
                    placeholder={t(
                      "sellingPricePlaceholder",
                      "Selling price (₹, optional)"
                    )}
                    type="number"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        price: e.target.value,
                      })
                    }
                  />
                  <input
                    className="input-text"
                    placeholder={t(
                      "stockCountPlaceholder",
                      "Stock count"
                    )}
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        stock: e.target.value,
                      })
                    }
                  />

                  <textarea
                    className="input-text"
                    placeholder={t(
                      "descriptionPlaceholder",
                      "Description (optional)"
                    )}
                    value={newProduct.description}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        description: e.target.value,
                      })
                    }
                  />

                  <div className="file-input-row">
                    <label className="file-label">
                      {t(
                        "uploadImagesLabel",
                        "Upload images"
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleNewProductImagesChange}
                      />
                    </label>
                    {newProduct.images &&
                      newProduct.images.length > 0 && (
                        <div className="admin-image-preview-row">
                          {newProduct.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt="Preview"
                              className="admin-image-preview"
                            />
                          ))}
                        </div>
                      )}
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    {t(
                      "saveProductButton",
                      "Save Product"
                    )}
                  </button>
                </form>
              </section>

              {/* Products table */}
              <section className="admin-list">
                <h3>
                  {t(
                    "currentProductsTitle",
                    "Current Products"
                  )}{" "}
                  ({products.length})
                </h3>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>{t("imageHeader", "Image")}</th>
                      <th>{t("nameHeader", "Name")}</th>
                      <th>{t("categoryHeader", "Category")}</th>
                      <th>MRP</th>
                      <th>{t("priceHeader", "Price")}</th>
                      <th>{t("stockHeader", "Stock")}</th>
                      <th>{t("actionsHeader", "Actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td>
                          {p.images && p.images.length > 0 ? (
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="admin-table-image"
                            />
                          ) : (
                            <button
                              type="button"
                              className="btn-small btn-outline"
                              onClick={() => openEditModal(p)}
                            >
                              {t(
                                "addImageButton",
                                "+ Add Image"
                              )}
                            </button>
                          )}
                        </td>
                        <td>{p.name}</td>
                        <td>{p.category}</td>
                        <td>{p.mrp ?? "-"}</td>
                        <td>{p.price ?? "-"}</td>
                        <td>
                          {getStockLabel(p)}
                          {isLowStock(p) && (
                            <span className="stock-warning-inline">
                              {" "}
                              ({t("lowLabel", "Low")})
                            </span>
                          )}
                        </td>
                        <td>
  {/* ADD / REMOVE FROM DASHBOARD */}
  {!featuredIds.includes(p.id) ? (
    <button
      className="btn-small btn-outline"
      onClick={() => {
        if (featuredIds.length >= 5) {
          alert("Max 5 dashboard products allowed.");
          return;
        }
        setFeaturedIds([...featuredIds, p.id]);
      }}
    >
      + Add to Dashboard
    </button>
  ) : (
    <button
      className="btn-small btn-danger"
      onClick={() =>
        setFeaturedIds(featuredIds.filter(id => id !== p.id))
      }
    >
      Remove
    </button>
  )}
   {!top10Ids.includes(p.id) ? (
  <button
     className="btn-small btn-outline"
     onClick={() => {
     if (top10Ids.length >= 10) {
       alert("You can select max 10 top-selling products.");
       return;
      }
       setTop10Ids([...top10Ids, p.id]);
    }}
  >
     Add to Top 10
  </button>
) : (
  <button
    className="btn-small btn-danger"
  onClick={() => setTop10Ids(top10Ids.filter(id => id !== p.id))}
  >
    Remove Top 10
  </button>
 )}

  <button
    className="btn-small"
    onClick={() => openEditModal(p)}
  >
    {t("editButton", "Edit")}
  </button>

  <button
    className="btn-danger"
    onClick={() => handleDeleteProduct(p.id)}
  >
    {t("deleteButton", "Delete")}
  </button>
</td>

                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan="7">
                          {t(
                            "noProductsYetMsg",
                            "No products yet. Add items using the form above."
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <p className="admin-note">
                  {t(
                    "productsLoadedFromJson",
                    "Products are loaded from products.json. Any new items you add here stay in memory until you connect a backend or save manually."
                  )}
                </p>
              </section>
            </>
          )}
        </main>
      )}
{/* ================= PRODUCT DETAILS MODAL ================= */}
{productModalOpen && selectedProduct && (
  <div className="modal-backdrop" onClick={closeProductModal}>
    <div className="product-modal" onClick={(e) => e.stopPropagation()}>
      
      <div className="product-modal-header">
        <h3>{selectedProduct.name}</h3>
        <button className="modal-close-btn" onClick={closeProductModal}>✖</button>
      </div>

      <div className="product-modal-body">

        {/* IMAGE SLIDER */}
        <div className="product-modal-gallery">
          <Swiper
            modules={[Navigation, Pagination, Zoom]}
            navigation
            pagination={{ clickable: true }}
            zoom
            loop={selectedProduct.images?.length > 1}
            className="product-swiper"
          >
            {(selectedProduct.images || []).map((img, i) => (
              <SwiperSlide key={i}>
                <div className="swiper-zoom-container">
                  <img src={img} alt="" />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* DETAILS */}
        <div className="product-modal-info">

          <div className="product-modal-price-block">
            <span className="product-modal-price">
              {selectedProduct.price
                ? `₹${selectedProduct.price}`
                : selectedProduct.mrp
                ? `₹${selectedProduct.mrp}`
                : "Ask price"}
            </span>

            {selectedProduct.mrp &&
              selectedProduct.price &&
              selectedProduct.mrp > selectedProduct.price && (
                <span className="product-modal-mrp">
                  ₹{selectedProduct.mrp}
                </span>
              )}
          </div>

          <p className="product-modal-desc">
            {selectedProduct.description || "No description available."}
          </p>

          <button
            className="btn-primary"
            onClick={() => {
              addToCart(selectedProduct);
              setView("checkout");
              closeProductModal();
            }}
          >
            Buy Now
          </button>

          <button
            className="btn-secondary"
            onClick={() => {
              addToCart(selectedProduct);
              closeProductModal();
            }}
          >
            Add to Cart
          </button>

        </div>
      </div>
    </div>
  </div>
)}
      {/* EDIT MODAL */}
      {editModalOpen && editingProduct && (
        <div
          className="modal-backdrop"
          onClick={closeEditModal}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{t("editProductTitle", "Edit Product")}</h3>
            <div className="modal-body">
              <input
                className="input-text"
                placeholder={t(
                  "productNamePlaceholder",
                  "Product name"
                )}
                value={editingProduct.name}
                onChange={(e) =>
                  handleEditFieldChange("name", e.target.value)
                }
              />
              <input
                className="input-text"
                list="category-list-modal"
                placeholder={t(
                  "categoryPlaceholder",
                  "Category (type or choose)"
                )}
                value={editingProduct.category}
                onChange={(e) =>
                  handleEditFieldChange(
                    "category",
                    e.target.value
                  )
                }
              />
              <datalist id="category-list-modal">
                {categoryOptions
                  .filter((c) => c !== "All")
                  .map((c) => (
                    <option key={c} value={c} />
                  ))}
              </datalist>

              <input
                className="input-text"
                placeholder={t(
                  "mrpPlaceholder",
                  "MRP (₹, optional)"
                )}
                type="number"
                value={editingProduct.mrp}
                onChange={(e) =>
                  handleEditFieldChange("mrp", e.target.value)
                }
              />
              <input
                className="input-text"
                placeholder={t(
                  "sellingPricePlaceholder",
                  "Selling price (₹, optional)"
                )}
                type="number"
                value={editingProduct.price}
                onChange={(e) =>
                  handleEditFieldChange(
                    "price",
                    e.target.value
                  )
                }
              />
              <input
                className="input-text"
                placeholder={t(
                  "stockCountPlaceholder",
                  "Stock count"
                )}
                type="number"
                value={editingProduct.stock}
                onChange={(e) =>
                  handleEditFieldChange(
                    "stock",
                    e.target.value
                  )
                }
              />

              <textarea
                className="input-text"
                placeholder={t(
                  "descriptionPlaceholder",
                  "Description (optional)"
                )}
                value={editingProduct.description}
                onChange={(e) =>
                  handleEditFieldChange(
                    "description",
                    e.target.value
                  )
                }
              />

              <div className="file-input-row">
                <label className="file-label">
                  {t(
                    "uploadImagesLabel",
                    "Upload images"
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleEditImagesChange}
                  />
                </label>
                {editingProduct.images &&
                  editingProduct.images.length > 0 && (
                    <div className="admin-image-preview-row">
                      {editingProduct.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt="Preview"
                          className="admin-image-preview"
                        />
                      ))}
                    </div>
                  )}
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={saveEditProduct}
              >
                {t("saveButton", "Save")}
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={closeEditModal}
              >
                {t("cancelButton", "Cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      
{/* ABOUT MODAL (footer + floating button) */}
      {aboutModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setAboutModalOpen(false)}
        >
          <div
            className="modal about-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {renderAboutContent()}
            <div className="modal-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={() => setAboutModalOpen(false)}
              >
                {t("closeButton", "Close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}

     <footer className="footer footer-static">
  <div className="footer-row">

    {/* LEFT — WHATSAPP FIRST */}
    <div className="footer-col">
      <a
        href="https://wa.me/+918050426215"
        target="_blank"
        rel="noreferrer"
        className="footer-whatsapp-link"
      >
        <img src="/whatsapp.png" alt="WhatsApp" className="footer-whatsapp-icon" />
        Chat on WhatsApp: +918050426215
      </a>

      <a href="#/about"
        className="footer-link"
        onClick={(e) => {
          e.preventDefault();
          setAboutModalOpen(true);
        }}
      >
        About Us.
      </a>
    </div>

    {/* MIDDLE — ADDRESS + YEAR */}
    <div className="footer-col footer-center">
      <a
        href="https://www.google.com/maps/place/Mekha+CCTV+Solutions+%26+Services/"
        target="_blank"
        rel="noreferrer"
        className="footer-link"
      >
        📍#536/10, No.4B Cross, Dollars Colony, Shamanur Road, Davangere – 577004
      </a>
      <span className="footer-year">
        © {new Date().getFullYear()} Mekha CCTV Solutions & Services
      </span>
    </div>

    {/* RIGHT — PHONE + EMAIL */}
    <div className="footer-col footer-right">
      <a href="tel:+918050426215" className="footer-link">
        📞 +918050426215
      </a>

      <a href="mailto:mekhasolutions@gmail.com" className="footer-link">
        📧 mekhasolutions@gmail.com
      </a>
    </div>

  </div>
</footer>
    </div>
  );
}

export default App;
