import React, { useState, useMemo, useEffect } from "react";
import "./App.css";
import "./mobile.css";
import LanguagePicker, { translations } from "./LanguagePicker";
import { supabase } from "./supabase";

// Swiper
// eslint-disable-next-line 
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Zoom } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/zoom";

import AdminPortal from "./components/routes/AdminPortal";
import Services from "./components/routes/Services";
import ChatWidget from "./components/ChatWidget";
import SeoRadius from "./components/SeoRadius";
import { notifyOwner} from "./components/InvoiceNotify";


function App() {
  // ==============================
  // BASIC STATE
  // ==============================
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showAllProducts, setShowAllProducts] = useState(false);

  // ==============================
  // ADMIN THEME (ONLY)
  // ==============================
  const [themeImageUrl, setThemeImageUrl] = useState("");
  const [themeEnabled, setThemeEnabled] = useState(false);
  const [bannerMessage, setBannerMessage] = useState("");

  // ==============================
  // OTHER STATES
  // ==============================
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewImages, setReviewImages] = useState([]);

  const [cart, setCart] = useState([]);
  const [view, setView] = useState(() => {
    if (typeof window !== "undefined") {
      if (window.location.hash === "#/admin-9980") return "admin-9980";
      if (window.location.pathname.endsWith("/about")) return "about";
    }
    return "shop";
  });

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  const [invoiceData, setInvoiceData] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productModalOpen, setProductModalOpen] = useState(false);

  const [wishlist, setWishlist] = useState([]);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [language, setLanguage] = useState("English");

  const [homeSettings, setHomeSettings] = useState({
    heroEnabled: true,
    top10Enabled: true,
  });

  // ==============================
  // TRANSLATIONS HELPER
  // ==============================
  function t(key, fallback) {
    const langPack = translations?.[language] || {};
    return langPack[key] || fallback;
  }

  // ==============================
  // AUTO ADJUST OVERLAY BASED ON IMAGE BRIGHTNESS
  // ==============================
  useEffect(() => {
    if (!themeImageUrl) return;

    async function checkBrightness() {
      const img = document.createElement("img");
      img.crossOrigin = "anonymous";
      img.src = themeImageUrl;

      img.onload = function () {
        const canvas = document.createElement("canvas");
        canvas.width = this.width;
        canvas.height = this.height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(this, 0, 0);

        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

        let avg = 0;
        for (let i = 0; i < data.length; i += 4) {
          avg += (data[i] + data[i + 1] + data[i + 2]) / 3;
        }
        avg = avg / (data.length / 4);

        if (avg > 150) {
          document.documentElement.style.setProperty(
            "--festival-overlay-color",
            "rgba(0,0,0,0.40)"
          );
        } else {
          document.documentElement.style.setProperty(
            "--festival-overlay-color",
            "rgba(255,215,0,0.28)"
          );
        }
      };
    }

    checkBrightness();
  }, [themeImageUrl]);

  // ======================================
  // LOAD THEME CONFIG FROM SUPABASE
  // ======================================
  useEffect(() => {
    async function loadTheme() {
      const { data } = await supabase
        .from("site_theme")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setThemeImageUrl(data[0].theme_image_url || "");
        setBannerMessage(data[0].banner_message || "");
        setThemeEnabled(!!data[0].is_enabled);
      }
    }

    loadTheme();
  }, []);

  // ======================================
  // ROUTING
  // ======================================
  useEffect(() => {
    function handleHash() {
      if (window.location.hash === "#/admin-9980") setView("admin-9980");
      else setView("shop");
    }
    function handlePop() {
      if (window.location.hash === "#/admin-9980") setView("admin-9980");
      else if (window.location.pathname.endsWith("/about")) setView("about");
      else setView("shop");
    }

    window.addEventListener("hashchange", handleHash);
    window.addEventListener("popstate", handlePop);

    return () => {
      window.removeEventListener("hashchange", handleHash);
      window.removeEventListener("popstate", handlePop);
    };
  }, []);

  // ======================================
  // LOAD PRODUCTS
  // ======================================
  useEffect(() => {
    async function loadProducts() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Product load error:", error);
        return;
      }

      const safe = (data || []).map((p) => ({
        ...p,
        images: Array.isArray(p.images) ? p.images : [],
        stock:
          typeof p.stock === "number"
            ? p.stock
            : p.stock === null || p.stock === undefined
            ? 0
            : Number(p.stock) || 0,
      }));

      setProducts(safe);
    }

    loadProducts();
  }, []);

  // ==================================================
  // HOMEPAGE SAVED SETTINGS (LOCALSTORAGE)
  // ==================================================
  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = window.localStorage.getItem("homeSettings");
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      setHomeSettings({
        heroEnabled: parsed.heroEnabled ?? true,
        top10Enabled: parsed.top10Enabled ?? true,
      });
    } catch (e) {
      console.warn("Invalid homeSettings in localStorage");
    }
  }, [view]);

  // ==============================
  // DERIVED LISTS
  // ==============================
  const heroProducts = useMemo(
    () => products.filter((p) => p.is_featured).slice(0, 5),
    [products]
  );

  const top10Products = useMemo(
    () => products.filter((p) => p.is_top10).slice(0, 10),
    [products]
  );

  const { categoryOptions, categoryCounts } = useMemo(() => {
    const counts = {};

    products.forEach((p) => {
      const key = p.category || "Misc";
      counts[key] = (counts[key] || 0) + 1;
    });

    return {
      categoryOptions: ["All", ...Object.keys(counts).sort()],
      categoryCounts: counts,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const searchLower = search.toLowerCase();

    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(searchLower);
      const matchCategory =
        category === "All" ? true : p.category === category;

      return matchSearch && matchCategory;
    });
  }, [products, search, category]);

  const homepageProducts = showAllProducts
    ? filteredProducts
    : filteredProducts.slice(0, 10);

  const cartTotal = cart.reduce(
    (sum, c) => sum + (c.product.price || 0) * c.qty,
    0
  );

  // ============================
  // NAVIGATION HELPERS
  // ============================
  function goToShop() {
    if (window.location.hash === "#/admin-9980") {
      window.location.hash = "";
    }
    if (window.location.pathname.endsWith("/about")) {
      window.history.pushState({}, "", "/");
    }
    setView("shop");
    window.scrollTo(0, 0);
  }

  function goToAbout() {
    if (window.location.hash === "#/admin-9980") {
      window.location.hash = "";
    }
    window.history.pushState({}, "", "/about");
    setView("about");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goHome() {
    setShowAllProducts(false);
    setCategory("All");
    setSearch("");
    setView("shop");
    window.scrollTo(0, 0);
  }
  // ============================
  // CART
  // ============================
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

  // ============================
  // WISHLIST
  // ============================
  function toggleWishlist(productId) {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  }

  // ============================
  // STOCK HELPER
  // ============================
  function getStockLabel(p) {
    if ((p.stock || 0) <= 0)
      return t("outOfStockLabel", "Out of Stock");
    if (p.stock < 5)
      return t("onlyXLeft", `Only ${p.stock} left`);
    return t("inStockLabel", `${p.stock} in stock`);
  }

  function isLowStock(p) {
    return p.stock > 0 && p.stock < 5;
  }

  // ============================
  // PRODUCT MODAL
  // ============================
  function openProductModal(product) {
    if (!product) return;
    setSelectedProduct(product);
    setProductModalOpen(true);
  }

  function closeProductModal() {
    setProductModalOpen(false);
    setSelectedProduct(null);
  }

  // ============================
  // ABOUT CONTENT
  // ============================
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
            "Mekha CCTV Solutions & Services is a security & IT solutions store in Davangere, Karnataka."
          )}
        </p>

        <div className="about-grid">
          <div className="about-col">
            <h3>{t("whatWeDoTitle", "What We Do")}</h3>
            <ul>
              <li>{t("aboutBullet1", "✅ CCTV camera setup & maintenance")}</li>
              <li>{t("aboutBullet2", "✅ NVR / DVR, hard disks & racks")}</li>
              <li>{t("aboutBullet3", "✅ Wi-Fi routers, network devices & cabling")}</li>
              <li>{t("aboutBullet4", "✅ Smart doorbells & wireless cameras")}</li>
              <li>{t("aboutBullet5", "✅ System PCs, monitors & power solutions")}</li>
            </ul>
          </div>

          <div className="about-col">
            <h3>{t("whyCustomersLikeUsTitle", "Why Customers Like Us")}</h3>
            <ul>
              <li>{t("aboutBullet6", "🧑‍🔧 On-site installation & neat wiring")}</li>
              <li>{t("aboutBullet7", "📱 Mobile view setup & training")}</li>
              <li>{t("aboutBullet8", "♻ Upgrade existing CCTV hardware")}</li>
              <li>{t("aboutBullet9", "💬 Direct WhatsApp support")}</li>
              <li>{t("aboutBullet10", "📍 Near Shamanur Road, Davangere")}</li>
            </ul>
          </div>
        </div>

        <div className="about-highlight">
          <p>
            {t(
              "aboutHighlightText",
              "This website helps manage stock, pricing, invoices & quotation workflow."
            )}
          </p>
        </div>

        <div className="about-cta">
          <p>
            {t(
              "aboutContactLine",
              "📞 8050426215 | 📧 mekhasolutions@gmail.com"
            )}
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

  // ============================
  // ADMIN ROUTE
  // ============================
  if (view === "admin-9980") {
    return <AdminPortal />;
  }

  // ============================
// SERVICES PAGE (FULL LAYOUT)
// ============================
if (view === "services") {
  return (
    <div
      className={`app ${themeEnabled ? "festival-theme" : ""}`}
      style={{
        backgroundImage:
          themeEnabled && themeImageUrl ? `url(${themeImageUrl})` : "none",
      }}
    >
      <SeoRadius />
      {/* ================= HEADER (SAME AS HOME) ================= */}
      <header className="header">
        <div
          className="header-left"
          onClick={goHome}
          style={{ cursor: "pointer" }}
        >
          <img src="public/logo.jpg" alt="logo" className="logo" />

          <div>
            <h1 className="title">
              {t("storeName", "Mekha CCTV Solutions & Services")}
            </h1>
            <p className="subtitle">
              {t(
                "storeSubtitle",
                "CCTV • Digital Boards • Electrical & IT Solutions"
              )}
            </p>
          </div>
        </div>

        <div className="header-actions">
          <button className="header-link" onClick={goHome}>
            {t("home", "Home")}
          </button>

          <button className="header-link" onClick={() => setView("services")}>
            {t("services", "Services")}
          </button>

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

      {/* ================= MAIN CONTENT ================= */}
      <main className="services-page" style={{ paddingTop: "120px", paddingBottom: "200px" }}>
        <Services t={t} />
      </main>

      {/* ================= FOOTER (EXACT SAME AS HOME) ================= */}
      <footer className="footer footer-static">
        <div className="footer-row">
          {/* LEFT — WHATSAPP + ABOUT */}
          <div className="footer-col">
            <a
              href="https://wa.me/918050426215"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "#25D366",
                fontWeight: "600",
                textDecoration: "none",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="#25D366"
                viewBox="0 0 24 24"
              >
                <path d="M12 .5C5.73.5.5 5.73.5 12c0 2.1.55 4.1 1.6 5.9L.5 23.5l5.8-1.6c1.8 1 3.8 1.6 5.9 1.6 6.27 0 11.5-5.23 11.5-11.5S18.27.5 12 .5zm0 20.5c-1.9 0-3.7-.5-5.3-1.5l-.4-.2-3.4.9.9-3.3-.2-.4C3.5 15.8 3 14 3 12 3 6.48 7.48 2 12 2s9 4.48 9 10-4.48 9-9 9zm4.4-6.2c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12s-.62.78-.76.94c-.14.16-.28.18-.52.06-.24-.12-1-.37-1.9-1.18-.7-.62-1.18-1.38-1.32-1.62-.14-.24-.02-.37.1-.49.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.48-.4-.42-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.14 3.64.58.25 1.04.4 1.4.52.58.18 1.1.16 1.52.1.46-.06 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z" />
              </svg>
              {t("chatOnWhatsApp", "Chat on WhatsApp")}
            </a>

            <div
              onClick={() => setAboutModalOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "white",
                cursor: "pointer",
                fontWeight: "500",
                marginTop: "8px",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                fill="#ffffff"
                viewBox="0 0 24 24"
              >
                <path d="M16 11c1.66 0 3-1.57 3-3.5S17.66 4 16 4s-3 1.57-3 3.5 1.34 3.5 3 3.5zm-8 0c1.66 0 3-1.57 3-3.5S9.66 4 8 4 5 5.57 5 7.5 6.34 11 8 11zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-3.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 2.04 1.97 3.45V20h6v-3.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
              {t("aboutUsShort", "About Us")}
            </div>
          </div>

          {/* CENTER — ADDRESS */}
          <div className="footer-col footer-center">
            <a
              href="https://www.google.com/maps/place/Mekha+CCTV+Solutions+%26+Services/"
              target="_blank"
              rel="noreferrer"
              className="footer-link"
            >
              {t(
                "footerAddress",
                "📍#536/10, No.4B Cross, Dollars Colony, Shamanur Road, Davangere – 577004"
              )}
            </a>

            <span className="footer-year">
              © {new Date().getFullYear()}{" "}
              {t(
                "storeNameShort",
                "Mekha CCTV Solutions & Services"
              )}
            </span>
          </div>

          {/* RIGHT — CONTACT */}
          <div className="footer-col footer-right">
            <a href="tel:+918050426215" className="footer-link">
              {t("footerPhone", "📞 +918050426215")}
            </a>

            <a
              href="mailto:mekhasolutions@gmail.com"
              className="footer-link"
            >
              {t("footerEmail", "📧 mekhasolutions@gmail.com")}
            </a>
          </div>
        </div>
      </footer>

      {/* CHAT */}
      <ChatWidget />
    </div>
  );
}


  // ============================
  // REVIEW IMAGE UPLOAD
  // ============================
  function handleReviewImageUpload(e) {
    const files = Array.from(e.target.files || []);
    const previews = files.map((file) => URL.createObjectURL(file));
    setReviewImages((prev) => [...prev, ...previews]);
  }

  // ============================
  // GENERATE INVOICE
  // ============================
  function handleGenerateInvoice() {
    if (!customerName || !customerPhone || !customerAddress) {
      alert(
        t(
          "fillCustomerDetailsAlert",
          "Please fill all customer details."
        )
      );
      return;
    }
    if (cart.length === 0) {
      alert(t("cartEmptyAlert", "Cart is empty."));
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

notifyOwner(invoiceNumber, customerName, cartTotal, cart);



    // reduce stock in UI only (does not write to DB)
    setProducts((prev) =>
      prev.map((p) => {
        const item = cart.find((c) => c.product.id === p.id);
        if (!item) return p;
        const newStock = Math.max(0, p.stock - item.qty);
        return { ...p, stock: newStock };
      })
    );

    setCart([]);
    setView("invoice");
  }

  // ============================
  // PRINT / DOWNLOAD INVOICE
  // ============================
  function handlePrintInvoice() {
    window.print();
  }

  // ============================
  // MAIN RENDER
  // ============================
  return (
    <div
      className={`app ${themeEnabled ? "festival-theme" : ""}`}
      style={{
        backgroundImage:
          themeEnabled && themeImageUrl ? `url(${themeImageUrl})` : "none",
      }}
    >
      {/* ================= HEADER ================= */}
      <header className="header">
        <div
          className="header-left"
          onClick={goToShop}
          style={{ cursor: "pointer" }}
        >
          <img src="public/logo.jpg" alt="logo" className="logo" />

          <div>
            <h1
              className="title"
              onClick={goHome}
              style={{ cursor: "pointer" }}
            >
              {t("storeName", "Mekha CCTV Solutions & Services")}
            </h1>
            <p className="subtitle">
              {t(
                "storeSubtitle",
                "CCTV • Digital Boards • Electrical & IT Solutions"
              )}
            </p>
          </div>
        </div>

        <div className="header-actions">
          <button className="header-link" onClick={goHome}>
            {t("home", "Home")}
          </button>

          <button className="header-link" onClick={() => setView("services")}>
            {t("services", "Services")}
          </button>

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
      {/* ============ SHOP VIEW ============ */}
      {view === "shop" && (
        <main className="content">
          {/* ===== STICKY SEARCH BAR (ABOVE BANNER) ===== */}
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
                    ? `${t("allCategory", "All")} (${products.length})`
                    : `${c} (${categoryCounts[c] || 0})`}
                </option>
              ))}
            </select>
          </div>

          {/* ===== FESTIVAL / ADMIN SLIDING BANNER ===== */}
          {bannerMessage && (
            <div className="sliding-banner-wrapper">
              <div className="sliding-banner">
                <span>{bannerMessage}</span>
                <span>{bannerMessage}</span>
                <span>{bannerMessage}</span>
                <span>{bannerMessage}</span>
              </div>
            </div>
          )}

          {/* ===== HERO SECTION ===== */}
          {homeSettings.heroEnabled && heroProducts.length > 0 && (
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
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="hero-image"
                          />
                        ) : (
                          <div className="hero-image-placeholder">
                            {t("noImage", "No image")}
                          </div>
                        )}

                        {p.mrp && p.price && p.mrp > p.price && (
                          <div className="hero-badge hero-badge-offer">
                            {t("offerLabel", "Offer")}
                          </div>
                        )}

                        {index === 0 && (
                          <div className="hero-badge hero-badge-top">
                            {t("topSellerBadge", "Top Seller")}
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
                            {p.price
                              ? `₹${p.price}`
                              : p.mrp
                              ? `₹${p.mrp}`
                              : t("askPrice", "Ask price")}
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
                            {t("buyNow", "Buy Now")}
                          </button>

                          <button
                            className="btn-outline hero-btn-secondary"
                            onClick={() => openProductModal(p)}
                          >
                            {t("viewDetails", "View Details")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </section>
          )}

          {/* ===== TOP 10 SECTION ===== */}
          {homeSettings.top10Enabled && top10Products.length > 0 && (
            <section className="top10-section">
              <h2 className="section-title">
                {t(
                  "top10Title",
                  "🔥 Top Selling Combos"
                )}
              </h2>

              <Swiper
                modules={[Navigation, Pagination]}
                navigation
                pagination={{ clickable: true }}
                loop={top10Products.length > 1}
                spaceBetween={16}
                slidesPerView={1}
                breakpoints={{
                  640: { slidesPerView: 2 },
                  1024: { slidesPerView: 3 },
                }}
                className="top10-swiper"
              >
                {top10Products.map((p) => (
                  <SwiperSlide key={p.id}>
                    <div
                      className="top10-card"
                      onClick={() => openProductModal(p)}
                    >
                      <div className="top10-image-wrapper">
                        {p.images?.length > 0 ? (
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="top10-image"
                          />
                        ) : (
                          <div className="product-image-placeholder">
                            {t("noImage", "No image")}
                          </div>
                        )}
                        <span className="top10-tag">
                          {t("top10Tag", "Top 10")}
                        </span>
                      </div>

                      <div className="top10-info">
                        <h3>{p.name}</h3>

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

                        <button
                          type="button"
                          className="btn-primary btn-block"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(p);
                            setView("checkout");
                          }}
                        >
                          {t("buyThisCombo", "Buy This Combo")}
                        </button>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </section>
          )}

          {/* ===== PRODUCT GRID ===== */}
          <div className="product-grid">
            {homepageProducts.map((p) => (
              <div
                key={p.id}
                className="product-card product-card-hover"
                onClick={() => openProductModal(p)}
              >
                <div className="product-image-wrapper">
                  {p.images?.length > 0 ? (
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="product-image"
                    />
                  ) : (
                    <div className="product-image-placeholder">
                      {t("noImage", "No image")}
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
                    <span className="product-category">{p.category}</span>
                  </div>

                  {isLowStock(p) && (
                    <p className="stock-warning">
                      {t(
                        "lowStockWarning",
                        "⚠ Low stock – hurry up!"
                      )}
                    </p>
                  )}

                  {/* Wishlist + Stock beside each other */}
                  <div className="card-actions-row">
                    <button
                      type="button"
                      className={`btn-chip ${
                        wishlist.includes(p.id) ? "active" : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(p.id);
                      }}
                    >
                      {wishlist.includes(p.id)
                        ? t("wishlisted", "♥ Wishlisted")
                        : t("wishlist", "♡ Wishlist")}
                    </button>

                    <span
                      className={`stock-badge ${
                        p.stock <= 0 ? "out" : "in"
                      }`}
                      style={{ marginLeft: "auto" }}
                    >
                      {getStockLabel(p)}
                    </span>
                  </div>

                  <button
                    className="btn-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(p);
                    }}
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
                  "No products found. Try another search or category."
                )}
              </p>
            )}
          </div>

          {/* VIEW ALL BUTTON */}
          {filteredProducts.length > 10 && !showAllProducts && (
            <div style={{ textAlign: "center", marginTop: "10px" }}>
              <button
                className="btn-primary"
                onClick={() => {
                  setCategory("All");
                  setShowAllProducts(true);
                }}
              >
                {t(
                  "viewAllProductsButton",
                  "View All Products"
                )}{" "}
                ({filteredProducts.length})
              </button>
            </div>
          )}

          {/* ===== REVIEWS SECTION ===== */}
          <section
            className="google-reviews-section"
            style={{ marginTop: "35px" }}
          >
            <h2 style={{ textAlign: "center", marginBottom: "12px" }}>
              {t(
                "reviewsTitle",
                "⭐ Customer Reviews & Ratings"
              )}
            </h2>

            <iframe
              title="google-reviews-widget"
              src="https://widgets.sociablekit.com/google-reviews/iframe/25625435"
              width="100%"
              height="450"
              style={{ border: "none", borderRadius: "8px" }}
            ></iframe>

            <section className="write-review-section">
              <h2>{t("writeReviewTitle", "Write a Review")}</h2>

              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={
                      reviewRating >= star ? "star filled" : "star"
                    }
                    onClick={() => setReviewRating(star)}
                  >
                    ★
                  </span>
                ))}
              </div>

              <textarea
                placeholder={t(
                  "reviewPlaceholder",
                  "Share your experience..."
                )}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="review-textarea"
              />

              <div className="upload-wrapper">
                <label className="upload-btn">
                  {t("uploadImages", "📸 Upload Images")}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleReviewImageUpload}
                    style={{ display: "none" }}
                  />
                </label>
              </div>

              <div className="review-image-preview">
                {reviewImages.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    className="preview-img"
                    alt=""
                  />
                ))}
              </div>

              <button className="submit-review-btn">
                {t("submitReview", "Submit Review")}
              </button>
            </section>
          </section>
        </main>
      )}

      {/* ================== CHECKOUT VIEW ================== */}
      {view === "checkout" && (
        <main className="checkout">
          <button className="back-btn" onClick={goToShop}>
            {t("backToShop", "← Back to shop")}
          </button>

          <h2>{t("yourCart", "Your Cart")}</h2>

          {cart.length === 0 && (
            <p>{t("cartEmptyText", "Cart is empty.")}</p>
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
              <strong>₹{(c.product.price || 0) * c.qty}</strong>
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
              placeholder={t("fullName", "Full name")}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />

            <input
              className="input-text"
              placeholder={t("phoneNumber", "Phone number")}
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />

            <textarea
              className="input-text"
              placeholder={t(
                "fullAddress",
                "Full address"
              )}
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
            />

            <button
              className="btn-primary"
              onClick={handleGenerateInvoice}
            >
              {t(
                "generateInvoice",
                "Generate Invoice"
              )}
            </button>
          </section>
        </main>
      )}
      {/* ================== INVOICE VIEW ================== */}
      {view === "invoice" && invoiceData && (
        <main className="invoice">
          <button className="back-btn" onClick={goToShop}>
            {t("backToShop", "← Back to shop")}
          </button>

          <div className="invoice-card">
            <header className="invoice-header">
              <div>
                <h2>
                  {t(
                    "storeNameInvoice",
                    "Mekha CCTV Solutions & Services"
                  )}
                </h2>
                <p>
                  {t(
                    "invoiceAddress",
                    "Dollars Colony, Shamanur Road, Davangere – 577004"
                  )}
                  <br />
                  {t(
                    "invoiceContact",
                    "📞 8050426215 | 📧 mekhasolutions@gmail.com"
                  )}
                </p>
              </div>

              <div className="invoice-meta">
                <p>
                  <strong>
                    {t("invoiceNumberLabel", "Invoice #:")}
                  </strong>{" "}
                  {invoiceData.invoiceNumber}
                </p>
                <p>
                  <strong>
                    {t("invoiceDateLabel", "Date:")}
                  </strong>{" "}
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
                    <th>{t("itemColumn", "Item")}</th>
                    <th>{t("qtyColumn", "Qty")}</th>
                    <th>{t("priceColumn", "Price (₹)")}</th>
                    <th>{t("totalColumn", "Total (₹)")}</th>
                  </tr>
                </thead>

                <tbody>
                  {invoiceData.items.map((item) => (
                    <tr key={item.product.id}>
                      <td>{item.product.name}</td>
                      <td>{item.qty}</td>
                      <td>{item.product.price}</td>
                      <td>
                        {(item.product.price || 0) * item.qty}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="invoice-total">
                <strong>
                  {t("grandTotalLabel", "Grand Total")}: ₹
                  {invoiceData.total}
                </strong>
              </div>
            </section>

            <footer className="invoice-footer-text">
              <p>
                {t(
                  "thankYou",
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

      {/* ================== ABOUT PAGE ================== */}
      {view === "about" && (
        <main className="about-page">
          <div className="about-card">{renderAboutContent()}</div>
        </main>
      )}

      {/* ================== PRODUCT DETAILS MODAL ================== */}
      {productModalOpen && selectedProduct && (
        <div className="modal-backdrop" onClick={closeProductModal}>
          <div
            className="product-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="product-modal-header">
              <h3>{selectedProduct.name}</h3>
              <button
                className="modal-close-btn"
                onClick={closeProductModal}
              >
                ✖
              </button>
            </div>

            <div className="product-modal-body">
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

              <div className="product-modal-info">
                <div className="product-modal-price-block">
                  <span className="product-modal-price">
                    {selectedProduct.price
                      ? `₹${selectedProduct.price}`
                      : selectedProduct.mrp
                      ? `₹${selectedProduct.mrp}`
                      : t("askPrice", "Ask price")}
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
                  {selectedProduct.description ||
                    t(
                      "noDescription",
                      "No description available."
                    )}
                </p>

                <button
                  className="btn-primary"
                  onClick={() => {
                    addToCart(selectedProduct);
                    setView("checkout");
                    closeProductModal();
                  }}
                >
                  {t("buyNow", "Buy Now")}
                </button>

                <button
                  className="btn-secondary"
                  onClick={() => {
                    addToCart(selectedProduct);
                    closeProductModal();
                  }}
                >
                  {t("addToCart", "Add to Cart")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================== ABOUT MODAL (FOOTER SHORTCUT) ================== */}
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
                className="btn-primary"
                onClick={() => setAboutModalOpen(false)}
              >
                {t("close", "Close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================== FOOTER ================== */}
      <footer className="footer footer-static">
        <div className="footer-row">
          {/* LEFT — WHATSAPP + ABOUT */}
          <div className="footer-col">
            {/* WHATSAPP */}
            <a
              href="https://wa.me/918050426215"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "#25D366",
                fontWeight: "600",
                textDecoration: "none",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="#25D366"
                viewBox="0 0 24 24"
              >
                <path d="M12 .5C5.73.5.5 5.73.5 12c0 2.1.55 4.1 1.6 5.9L.5 23.5l5.8-1.6c1.8 1 3.8 1.6 5.9 1.6 6.27 0 11.5-5.23 11.5-11.5S18.27.5 12 .5zm0 20.5c-1.9 0-3.7-.5-5.3-1.5l-.4-.2-3.4.9.9-3.3-.2-.4C3.5 15.8 3 14 3 12 3 6.48 7.48 2 12 2s9 4.48 9 10-4.48 9-9 9zm4.4-6.2c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12s-.62.78-.76.94c-.14.16-.28.18-.52.06-.24-.12-1-.37-1.9-1.18-.7-.62-1.18-1.38-1.32-1.62-.14-.24-.02-.37.1-.49.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.48-.4-.42-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.14 3.64.58.25 1.04.4 1.4.52.58.18 1.1.16 1.52.1.46-.06 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z" />
              </svg>
              {t("chatOnWhatsApp", "Chat on WhatsApp")}
            </a>

            {/* ABOUT SHORT LINK */}
            <div
              onClick={() => setAboutModalOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "white",
                cursor: "pointer",
                fontWeight: "500",
                marginTop: "8px",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                fill="#ffffff"
                viewBox="0 0 24 24"
              >
                <path d="M16 11c1.66 0 3-1.57 3-3.5S17.66 4 16 4s-3 1.57-3 3.5 1.34 3.5 3 3.5zm-8 0c1.66 0 3-1.57 3-3.5S9.66 4 8 4 5 5.57 5 7.5 6.34 11 8 11zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-3.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 2.04 1.97 3.45V20h6v-3.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
              {t("aboutUsShort", "About Us")}
            </div>
          </div>

          {/* CENTER — ADDRESS */}
          <div className="footer-col footer-center">
            <a
              href="https://www.google.com/maps/place/Mekha+CCTV+Solutions+%26+Services/"
              target="_blank"
              rel="noreferrer"
              className="footer-link"
            >
              {t(
                "footerAddress",
                "📍#536/10, No.4B Cross, Dollars Colony, Shamanur Road, Davangere – 577004"
              )}
            </a>

            <span className="footer-year">
              © {new Date().getFullYear()}{" "}
              {t(
                "storeNameShort",
                "Mekha CCTV Solutions & Services"
              )}
            </span>
          </div>

          {/* RIGHT — CONTACT */}
          <div className="footer-col footer-right">
            <a href="tel:+918050426215" className="footer-link">
              {t("footerPhone", "📞 +918050426215")}
            </a>

            <a
              href="mailto:mekhasolutions@gmail.com"
              className="footer-link"
            >
              {t(
                "footerEmail",
                "📧 mekhasolutions@gmail.com"
              )}
            </a>
          </div>
        </div>
      </footer>

      {/* ================== CHAT WIDGET ================== */}
      <ChatWidget />
    </div>
  );
}

export default App;
