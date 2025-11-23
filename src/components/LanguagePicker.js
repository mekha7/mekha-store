import React from "react";

export const LANGUAGES = ["English", "Kannada", "Telugu", "Hindi"];

export const translations = {
  English: {
    home: "Home",
    about: "About",
    cart: "Cart",
    searchPlaceholder: "Search products…",
    addToCart: "Add to Cart",
    outOfStock: "Out of stock",
    lowStock: "Low stock – hurry up!",
    feedbackTitle: "Rate Your Experience",
    submit: "Submit",
    yourCart: "Your Cart",
    customerDetails: "Customer Details",
    invoice: "Invoice",
  },

  Kannada: {
    home: "ಮುಖಪುಟ",
    about: "ಬಗ್ಗೆ",
    cart: "ಕಾರ್ಟ್",
    searchPlaceholder: "ಉತ್ಪನ್ನಗಳನ್ನು ಹುಡುಕಿ…",
    addToCart: "ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ",
    outOfStock: "ಸ್ಟಾಕ್ ಇಲ್ಲ",
    lowStock: "ಸ್ಟಾಕ್ ಕಡಿಮೆ – ಬೇಗ ಖರೀದಿಸಿ!",
    feedbackTitle: "ನಿಮ್ಮ ಅನುಭವಕ್ಕೆ ರೇಟಿಂಗ್ ನೀಡಿ",
    submit: "ಸಲ್ಲಿಸು",
    yourCart: "ನಿಮ್ಮ ಕಾರ್ಟ್",
    customerDetails: "ಗ್ರಾಹಕ ವಿವರಗಳು",
    invoice: "ಬಿಲ್",
  },

  Telugu: {
    home: "హోమ్",
    about: "గురించి",
    cart: "కార్ట్",
    searchPlaceholder: "ఉత్పత్తులు వెతకండి…",
    addToCart: "కార్ట్‌లో జోడించండి",
    outOfStock: "స్టాక్ లేదు",
    lowStock: "స్టాక్ తక్కువ – త్వరగా కొనండి!",
    feedbackTitle: "మీ అనుభవాన్ని రేట్ చేయండి",
    submit: "సబ్మిట్",
    yourCart: "మీ కార్ట్",
    customerDetails: "కస్టమర్ వివరాలు",
    invoice: "ఇన్వాయిస్",
  },

  Hindi: {
    home: "होम",
    about: "हमारे बारे में",
    cart: "कार्ट",
    searchPlaceholder: "उत्पाद खोजें…",
    addToCart: "कार्ट में जोड़ें",
    outOfStock: "स्टॉक खत्म",
    lowStock: "स्टॉक कम है – जल्दी खरीदें!",
    feedbackTitle: "अपने अनुभव को रेट करें",
    submit: "सबमिट",
    yourCart: "आपकी कार्ट",
    customerDetails: "ग्राहक विवरण",
    invoice: "चालान",
  },
};

export default function LanguagePicker({ language, setLanguage }) {
  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
      style={{
        padding: "6px 10px",
        borderRadius: "12px",
        border: "1px solid #ddd",
        background: "#fff",
        marginLeft: "10px",
        cursor: "pointer",
      }}
    >
      {LANGUAGES.map((lang) => (
        <option key={lang} value={lang}>
          {lang}
        </option>
      ))}
    </select>
  );
}
