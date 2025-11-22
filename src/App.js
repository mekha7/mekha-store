import React, {
  useState,
  useMemo,
  useEffect,
} from "react";
import "./App.css";
import productsData from "./products.json"; // uses your 268 products

function App() {
  // Products (loaded from products.json)
  const [products, setProducts] = useState([]);

  // Shop filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

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

  // Feedback
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [feedbackList, setFeedbackList] = useState([]);

  // Chatbox
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);

  // Wishlist & Compare
  const [wishlist, setWishlist] = useState([]);
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

  function toggleCompare(productId) {
    setCompareList((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= 4) {
        alert("You can compare up to 4 products at a time.");
        return prev;
      }
      return [...prev, productId];
    });
  }

  function downloadBrochure(product) {
    const content = `
Mekha Solutions & Services

Product: ${product.name}
Category: ${product.category}
Price: ${
      product.price ?? product.mrp ?? "Contact for price"
    }

Description:
${product.description || "—"}

For enquiries:
Phone: 8050426215
Email: mekhasolutions@gmail.com
`;
    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute(
      "download",
      `${product.name.replace(/[^a-z0-9]/gi, "_")}_brochure.txt`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // FEEDBACK
  function submitFeedback() {
    if (!rating || !comment.trim()) {
      alert("Please select rating and write a comment.");
      return;
    }
    setFeedbackList([...feedbackList, { rating, comment }]);
    setRating(0);
    setComment("");
  }

  // CHAT
  function toggleChat() {
    setChatOpen((prev) => {
      const next = !prev;
      if (next && chatHistory.length === 0) {
        setChatHistory([
          {
            sender: "bot",
            text:
              "Hi, welcome to Mekha Solutions & Services chatbox. If you have any question, drop here.",
          },
        ]);
      }
      return next;
    });
  }

  function sendChat() {
    if (!chatMessage.trim()) return;

    const userMsg = { sender: "user", text: chatMessage };
    const botMsg = {
      sender: "bot",
      text:
        "Thank you! Please drop your contact number and details — we will reach you back soon.",
    };

    setChatHistory((prev) => [...prev, userMsg, botMsg]);
    setChatMessage("");
  }

  // CHECKOUT / INVOICE
  function handleGenerateInvoice() {
    if (!customerName || !customerPhone || !customerAddress) {
      alert("Please fill customer details.");
      return;
    }
    if (cart.length === 0) {
      alert("Cart is empty.");
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
      setAdminError("Invalid username or password");
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
      alert("Name and category are required.");
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
      "Name",
      "Category",
      "MRP",
      "Price",
      "Stock",
      "Description",
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
      "Name",
      "Category",
      "MRP",
      "Price",
      "Stock",
      "Description",
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
        <h2>Mekha Solutions & Services - Product List</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Category</th><th>MRP</th><th>Price</th><th>Stock</th>
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
        "Currently bulk upload supports CSV. Please export your Excel file as CSV and upload."
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      if (typeof text !== "string") return;

      const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
      if (lines.length < 2) {
        alert("CSV looks empty.");
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
        alert("No valid rows found in CSV.");
        return;
      }

      setProducts((prev) => [...prev, ...newItems]);
      alert(`Bulk upload complete: added ${newItems.length} products.`);
    };
    reader.readAsText(file);
  }

  // UI HELPERS
  function getStockLabel(p) {
    if (p.stock <= 0) return "Out of stock";
    if (p.stock < 5) return `Only ${p.stock} left`;
    return `${p.stock} in stock`;
  }

  function isLowStock(p) {
    return p.stock > 0 && p.stock < 5;
  }

  // Reusable About content (used in page + modal)
  function renderAboutContent() {
    return (
      <>
        <h2 className="about-title">About Mekha Solutions &amp; Services</h2>
        <p className="about-subtitle">
          Mekha Solutions &amp; Services is a{" "}
          <strong>security &amp; IT solutions store in Davangere, Karnataka</strong>, run
          by <strong>Naresh Mekha</strong>. We help homes, shops, schools, hospitals and
          small businesses stay secure and connected.
        </p>

        <div className="about-grid">
          <div className="about-col">
            <h3>What we do</h3>
            <ul>
              <li>✅ CCTV camera setup &amp; maintenance</li>
              <li>✅ NVR / DVR, hard disks &amp; racks</li>
              <li>✅ Wi-Fi routers, network devices &amp; cabling</li>
              <li>✅ Smart door bells &amp; wireless cameras</li>
              <li>✅ System PCs, monitors &amp; power solutions (SMPS, UPS)</li>
            </ul>
          </div>

          <div className="about-col">
            <h3>Why customers like us</h3>
            <ul>
              <li>🧑‍🔧 On-site visit, installation &amp; neat wiring</li>
              <li>📱 Mobile view setup &amp; training</li>
              <li>♻ Upgrade existing CCTV / reuse hardware where possible</li>
              <li>💬 Direct WhatsApp support with photos &amp; videos</li>
              <li>📍 Store located near Shamanur Road, Davangere – easy access</li>
            </ul>
          </div>
        </div>

        <div className="about-highlight">
          <p>
            This website is built to make it easier for{" "}
            <strong>Naresh Mekha</strong> to manage stock, pricing, and
            invoices – while customers can quickly browse products, compare
            options and raise enquiries without any login or signup.
          </p>
        </div>

        <div className="about-cta">
          <p>
            For demo, quotation or site visit in &amp; around Davangere:
          </p>
          <p>
            📞 <strong>8050426215</strong> &nbsp;|&nbsp; 📧{" "}
            <strong>mekhasolutions@gmail.com</strong>
          </p>
          <p>📍 Dollars Colony, Shamanur Road, Davangere – 577004</p>
        </div>
      </>
    );
  }

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div className="header-left" onClick={goToShop} style={{ cursor: "pointer" }}>
          <img src="/logo.jpg" alt="Mekha logo" className="logo" />
          <div>
            <h1 className="title">Mekha Solutions &amp; Services</h1>
            <p className="subtitle">
              CCTV • Digital Boards • Electrical &amp; IT Solutions
            </p>
          </div>
        </div>

        <div className="header-actions">
          <button className="header-link" onClick={goToShop}>
            Home
          </button>
          <button className="header-link" onClick={goToAbout}>
            About
          </button>
          <button
            className="cart-btn"
            onClick={() => setView("checkout")}
          >
            Cart ({cart.length}) — ₹{cartTotal}
          </button>
        </div>
      </header>

      {/* SHOP VIEW */}
      {view === "shop" && (
        <main className="content">
          {/* Search + Category */}
          <div className="search-row">
            <input
              type="text"
              className="search-box"
              placeholder="Search products…"
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
                    ? `All (${products.length})`
                    : `${c} (${categoryCounts[c] || 0})`}
                </option>
              ))}
            </select>
          </div>

          {/* Products */}
          <div className="product-grid">
            {filteredProducts.map((p) => (
              <div key={p.id} className="product-card">
                <div className="product-image-wrapper">
                  {p.images && p.images.length > 0 ? (
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="product-image"
                    />
                  ) : (
                    <div className="product-image-placeholder">
                      <span>No image</span>
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
                        : "Ask price"}
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
                      ⚠ Low stock – hurry up!
                    </p>
                  )}

                  <div className="card-actions-row">
                    <button
                      type="button"
                      className={`btn-chip ${
                        wishlist.includes(p.id) ? "active" : ""
                      }`}
                      onClick={() => toggleWishlist(p.id)}
                    >
                      {wishlist.includes(p.id)
                        ? "♥ Wishlisted"
                        : "♡ Wishlist"}
                    </button>
                    <button
                      type="button"
                      className={`btn-chip ${
                        compareList.includes(p.id) ? "active" : ""
                      }`}
                      onClick={() => toggleCompare(p.id)}
                    >
                      ⇄ Compare
                    </button>
                    <button
                      type="button"
                      className="btn-chip"
                      onClick={() => downloadBrochure(p)}
                    >
                      ⬇ Brochure
                    </button>
                  </div>

                  <button
                    className="btn-primary"
                    onClick={() => addToCart(p)}
                    disabled={p.stock <= 0}
                  >
                    {p.stock <= 0 ? "Out of stock" : "Add to Cart"}
                  </button>
                </div>
              </div>
            ))}

            {filteredProducts.length === 0 && (
              <p className="empty-text">
                No products found. Try another search or category, or add
                products in Admin.
              </p>
            )}
          </div>

          {/* Compare panel */}
          {compareList.length > 0 && (
            <section className="compare-panel">
              <h3>Compare ({compareList.length})</h3>
              <div className="compare-scroll">
                {products
                  .filter((p) => compareList.includes(p.id))
                  .map((p) => (
                    <div key={p.id} className="compare-card">
                      <h4>{p.name}</h4>
                      <p className="compare-category">{p.category}</p>
                      <p className="compare-price">
                        {p.price
                          ? `₹${p.price}`
                          : p.mrp
                          ? `₹${p.mrp}`
                          : "Ask"}
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
                Clear compare
              </button>
            </section>
          )}

          {/* Feedback */}
          <section className="feedback-card">
            <h2>Rate Your Experience</h2>
            <div className="star-row">
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className={`star ${rating >= n ? "active" : ""}`}
                  onClick={() => setRating(n)}
                >
                  ★
                </span>
              ))}
            </div>
            <textarea
              className="input-text"
              placeholder="Write feedback…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button className="btn-primary" onClick={submitFeedback}>
              Submit
            </button>

            {feedbackList.map((f, i) => (
              <div key={i} className="feedback-item">
                <div className="stars">
                  {"★".repeat(f.rating)}
                  {"☆".repeat(5 - f.rating)}
                </div>
                <p>{f.comment}</p>
              </div>
            ))}
          </section>
        </main>
      )}

      {/* CHECKOUT VIEW */}
      {view === "checkout" && (
        <main className="checkout">
          <button className="back-btn" onClick={goToShop}>
            ← Back to shop
          </button>

          <h2>Your Cart</h2>

          {cart.length === 0 && <p>Cart is empty.</p>}

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
              <strong>₹{(c.product.price || 0) * c.qty}</strong>
            </div>
          ))}

          <h3>Total: ₹{cartTotal}</h3>

          <section className="checkout-details">
            <h3>Customer Details</h3>
            <input
              className="input-text"
              placeholder="Full name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            <input
              className="input-text"
              placeholder="Phone number"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
            <textarea
              className="input-text"
              placeholder="Full address"
              value={customerAddress}
              onChange={(e) =>
                setCustomerAddress(e.target.value)
              }
            />
            <button
              className="btn-primary"
              onClick={handleGenerateInvoice}
            >
              Generate Invoice
            </button>
          </section>
        </main>
      )}

      {/* INVOICE VIEW */}
      {view === "invoice" && invoiceData && (
        <main className="invoice">
          <button className="back-btn" onClick={goToShop}>
            ← Back to shop
          </button>

          <div className="invoice-card">
            <header className="invoice-header">
              <div>
                <h2>Mekha Solutions &amp; Services</h2>
                <p>
                  Dollars Colony, Shamanur Road, Davangere – 577004
                  <br />
                  📞 8050426215 | 📧 mekhasolutions@gmail.com
                </p>
              </div>
              <div className="invoice-meta">
                <p>
                  <strong>Invoice #</strong> {invoiceData.invoiceNumber}
                </p>
                <p>
                  <strong>Date</strong> {invoiceData.date}
                </p>
              </div>
            </header>

            <section className="invoice-section">
              <h3>Bill To</h3>
              <p>
                {invoiceData.customerName} <br />
                {invoiceData.customerPhone} <br />
                {invoiceData.customerAddress}
              </p>
            </section>

            <section className="invoice-section">
              <h3>Items</h3>
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price (₹)</th>
                    <th>Total (₹)</th>
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
                <strong>Grand Total: ₹{invoiceData.total}</strong>
              </div>
            </section>

            <footer className="invoice-footer-text">
              <p>Thank you for your business!</p>
            </footer>
          </div>

          <button className="btn-primary" onClick={handlePrintInvoice}>
            Print / Download Invoice
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
            ← Back to shop
          </button>

          {!isAdminLoggedIn ? (
            <section className="admin-login-card">
              <h2>Admin Login</h2>
              <p className="admin-login-hint">
                (Open URL with <code>#/admin-9980</code> to access
                this page)
              </p>
              <form
                onSubmit={handleAdminLogin}
                className="admin-login-form"
              >
                <input
                  className="input-text"
                  placeholder="Username"
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
                {adminError && (
                  <p className="admin-error">{adminError}</p>
                )}
                <button type="submit" className="btn-primary">
                  Login
                </button>
              </form>
            </section>
          ) : (
            <>
              <div className="admin-top-row">
                <h2>Admin – Manage Products</h2>
                <button
                  className="header-link"
                  onClick={handleAdminLogout}
                >
                  Logout
                </button>
              </div>

              {/* Dashboard */}
              <section className="admin-dashboard">
                <h3>Store Overview</h3>
                <div className="dashboard-cards">
                  <div className="dash-card">
                    <div className="dash-card-label">
                      Total Products
                    </div>
                    <div className="dash-card-value">
                      {products.length}
                    </div>
                  </div>
                  <div className="dash-card">
                    <div className="dash-card-label">
                      Total Sales (Invoices)
                    </div>
                    <div className="dash-card-value">
                      {salesHistory.length}
                    </div>
                  </div>
                  <div className="dash-card">
                    <div className="dash-card-label">
                      Revenue (Approx)
                    </div>
                    <div className="dash-card-value">
                      ₹{totalRevenue}
                    </div>
                  </div>
                  <div className="dash-card">
                    <div className="dash-card-label">
                      Low Stock Items
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
                    <h4>Low Stock Alerts</h4>
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
                    <h4>Recent Price Changes</h4>
                    <ul>
                      {priceHistory
                        .slice(-5)
                        .reverse()
                        .map((h, idx) => (
                          <li key={idx}>
                            {h.name}: ₹{h.oldPrice} → ₹{h.newPrice} (
                            {h.date})
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </section>

              {/* Export & bulk upload */}
              <section className="admin-tools-row">
                <div className="admin-export">
                  <span>Export Products:</span>
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
                    Excel
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
                  <span>Bulk Upload (.csv):</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleBulkUpload}
                  />
                </div>
              </section>

              {/* Add Product */}
              <section className="admin-form">
                <h3>Add Product</h3>
                <form onSubmit={handleAddProduct}>
                  <input
                    className="input-text"
                    placeholder="Product name"
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
                      placeholder="Category (type or choose)"
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
                    placeholder="MRP (₹, optional)"
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
                    placeholder="Selling price (₹, optional)"
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
                    placeholder="Stock count"
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
                    placeholder="Description (optional)"
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
                      Upload images
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

                  <button type="submit" className="btn-primary">
                    Save Product
                  </button>
                </form>
              </section>

              {/* Products table */}
              <section className="admin-list">
                <h3>Current Products ({products.length})</h3>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>MRP</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Actions</th>
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
                              + Add Image
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
                              (Low)
                            </span>
                          )}
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
                        <td colSpan="7">
                          No products yet. Add items using the form
                          above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <p className="admin-note">
                  Products are loaded from <code>products.json</code>. Any
                  new items you add here stay in memory until you connect
                  a backend or save manually.
                </p>
              </section>
            </>
          )}
        </main>
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
            <h3>Edit Product</h3>
            <div className="modal-body">
              <input
                className="input-text"
                placeholder="Product name"
                value={editingProduct.name}
                onChange={(e) =>
                  handleEditFieldChange("name", e.target.value)
                }
              />

              <input
                className="input-text"
                list="category-list-modal"
                placeholder="Category (type or choose)"
                value={editingProduct.category}
                onChange={(e) =>
                  handleEditFieldChange("category", e.target.value)
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
                placeholder="MRP (₹, optional)"
                type="number"
                value={editingProduct.mrp}
                onChange={(e) =>
                  handleEditFieldChange("mrp", e.target.value)
                }
              />
              <input
                className="input-text"
                placeholder="Selling price (₹, optional)"
                type="number"
                value={editingProduct.price}
                onChange={(e) =>
                  handleEditFieldChange("price", e.target.value)
                }
              />
              <input
                className="input-text"
                placeholder="Stock count"
                type="number"
                value={editingProduct.stock}
                onChange={(e) =>
                  handleEditFieldChange("stock", e.target.value)
                }
              />

              <textarea
                className="input-text"
                placeholder="Description (optional)"
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
                  Upload images
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
                Save
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={closeEditModal}
              >
                Cancel
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
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="footer">
        <p>Dollars Colony, Shamanur Road, Davangere – 577004</p>
        <p>📞 8050426215 | 📧 mekhasolutions@gmail.com</p>
        <p className="footer-whatsapp">
          <a
            href="https://wa.me/918050426215"
            target="_blank"
            rel="noreferrer"
          >
            <span className="whatsapp-icon">🟢</span>
            <span className="whatsapp-text">
              Chat on WhatsApp: 8050426215
            </span>
          </a>
        </p>
        <button
          type="button"
          className="footer-about-btn"
          onClick={() => setAboutModalOpen(true)}
        >
          About this store
        </button>
        <p className="copyright">
          © {new Date().getFullYear()} Mekha Solutions &amp; Services
        </p>
      </footer>

      {/* CHAT FLOAT BUTTON */}
      <button className="chat-btn" onClick={toggleChat}>
        💬
      </button>

      {/* ABOUT FLOAT BUTTON */}
      <button
        className="about-fab"
        onClick={() => setAboutModalOpen(true)}
      >
        ℹ️
      </button>

      {/* CHATBOX */}
      {chatOpen && (
        <div className="chatbox">
          <div className="chatbox-header">
            Chat with Us
            <button
              className="close-chat"
              onClick={() => setChatOpen(false)}
            >
              ✖
            </button>
          </div>

          <div className="chatbox-messages">
            {chatHistory.map((m, i) => (
              <div key={i} className={`msg ${m.sender}`}>
                {m.text}
              </div>
            ))}
          </div>

          <div className="chatbox-input">
            <input
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Ask a question…"
            />
            <button onClick={sendChat}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
