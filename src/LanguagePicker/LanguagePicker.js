// src/components/LanguagePicker/LanguagePicker.js
import React from "react";
import "./LanguagePicker.css";

export const translations = {
  English: {},
  Kannada: {},
  Hindi: {},
  Telugu: {},
  // fill as needed
};

function LanguagePicker({ language, setLanguage }) {
  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
      className="language-picker"
    >
      <option value="English">English</option>
      <option value="Kannada">Kannada</option>
      <option value="Hindi">Hindi</option>
      <option value="Telugu">Telugu</option>
    </select>
  );
}

export default LanguagePicker;
