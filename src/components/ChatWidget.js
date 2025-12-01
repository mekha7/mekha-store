import React, { useState } from "react";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([]);

  const adminNumber = "+918050426215"; // ← your WhatsApp number

  function sendToWhatsApp() {
    if (!msg.trim()) return;

    const whatsappUrl = `https://wa.me/${adminNumber}?text=${encodeURIComponent(
      msg
    )}`;

    window.open(whatsappUrl, "_blank");

    // AI reply on site
    const aiReply = generateAIResponse(msg);

    setChat([...chat, { from: "user", text: msg }, { from: "ai", text: aiReply }]);
    setMsg("");
  }

  function generateAIResponse(text) {
    text = text.toLowerCase();

    // Simple rules (we can make advanced later)
    if (text.includes("price") || text.includes("cost")) return "Our team will send you the exact price on WhatsApp 📩";
    if (text.includes("cctv")) return "We recommend Full HD 1080p cameras for home & shop security.";
    if (text.includes("install")) return "Yes, installation support is available in Davangere 📍";
    if (text.includes("location")) return "We are located at #536/10, 4B Cross, Davangere – 577004";
    if (text.includes("offer") || text.includes("discount")) return "🔥 Current Offer: Get up to 20% OFF on selected CCTV combos.";

    return "Thank you for your message! Our team will reply shortly 😊";
  }

  return (
    <>
      {/* Floating Button */}
     <div
  onClick={() => setOpen(true)}
  style={{
    position: "fixed",
    bottom: 80,
    right: 20,
    background: "#25D366",
    width: 60,
    height: 60,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 9999,
    boxShadow: "0 3px 6px rgba(0,0,0,0.2)",
  }}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="34"
    height="34"
    fill="#ffffff"
    viewBox="0 0 24 24"
  >
    <path d="M12 .5C5.73.5.5 5.73.5 12c0 2.1.55 4.1 1.6 5.9L.5 23.5l5.8-1.6c1.8 1 3.8 1.6 5.9 1.6 6.27 0 11.5-5.23 11.5-11.5S18.27.5 12 .5zm0 20.5c-1.9 0-3.7-.5-5.3-1.5l-.4-.2-3.4.9.9-3.3-.2-.4C3.5 15.8 3 14 3 12 3 6.48 7.48 2 12 2s9 4.48 9 10-4.48 9-9 9zm4.4-6.2c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12s-.62.78-.76.94c-.14.16-.28.18-.52.06-.24-.12-1-.37-1.9-1.18-.7-.62-1.18-1.38-1.32-1.62-.14-.24-.02-.37.1-.49.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.48-.4-.42-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.14 3.64.58.25 1.04.4 1.4.52.58.18 1.1.16 1.52.1.46-.06 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z" />
  </svg>
</div>


      {/* Chat Box */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 90,
            right: 20,
            width: 300,
            background: "white",
            borderRadius: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 9999,
            padding: 10,
          }}
        >
          <div
            style={{
              textAlign: "right",
              marginBottom: 8,
            }}
          >
            <button
              style={{
                background: "transparent",
                border: "none",
                fontSize: 16,
                cursor: "pointer",
              }}
              onClick={() => setOpen(false)}
            >
              ✖
            </button>
          </div>

          <h4 style={{ margin: 0, marginBottom: 10 }}>Chat with us</h4>

          <div
            style={{
              maxHeight: 200,
              overflowY: "auto",
              padding: "5px 0",
              marginBottom: 10,
            }}
          >
            {chat.map((msg, index) => (
  <div
    key={index}
    style={{
      display: "flex",
      justifyContent: msg.from === "user" ? "flex-end" : "flex-start",
      marginBottom: 8,
    }}
  >
    <div
      style={{
        maxWidth: "75%",
        padding: "8px 12px",
        borderRadius: "14px",
        fontSize: "14px",
        lineHeight: "1.4",
        background:
          msg.from === "user" ? "#dcf8c6" : "#ffffff", // WhatsApp colors
        color: "#000",
        border:
          msg.from === "user"
            ? "1px solid #b2e59c"
            : "1px solid #e6e6e6",
        boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
      }}
    >
      {msg.text}
      <div
        style={{
          textAlign: "right",
          fontSize: "10px",
          marginTop: 4,
          opacity: 0.6,
        }}
      >
        {new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    </div>
  </div>
))}
 </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="text"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Type message…"
              style={{
                flex: 1,
                padding: 8,
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            />
            <button
              onClick={sendToWhatsApp}
              style={{
                background: "#25D366",
                color: "white",
                padding: "8px 12px",
                borderRadius: 6,
                cursor: "pointer",
                border: "none",
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
