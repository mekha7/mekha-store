// src/components/routes/Services.js
import React, { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import "../../App.css";

export default function Services({ t }) {
  const [services, setServices] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);

    const { data: s1 } = await supabase
      .from("services")
      .select("*")
      .order("created_at", { ascending: true });

    const { data: s2 } = await supabase
      .from("service_columns")
      .select("*")
      .order("created_at", { ascending: true });

    setServices(s1 || []);
    setColumns(s2 || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="services-page">
      <h2 className="section-title" style={{ marginTop: "20px" }}>
        ⚙️ {t?.("servicesTitle", "Our Services")}
      </h2>

      {loading && <p>Loading services…</p>}

      {!loading && services.length === 0 && (
        <p className="empty-text">
          {t?.("noServices", "No services available right now.")}
        </p>
      )}

      {services.length > 0 && (
        <div className="services-table-wrapper">
          <table className="services-table">
            <thead>
              <tr>
                <th>{t?.("serviceName", "Service")}</th>
                <th>{t?.("servicePrice", "Price (₹)")}</th>

                {columns.map((col) => (
                  <th key={col.id}>{col.column_name}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {services.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>
                    {s.price ? `₹${s.price}` : t?.("askPrice", "Ask Price")}
                  </td>

                  {columns.map((col) => {
                    const val = s.custom_fields?.[col.column_name] ?? "-";
                    return <td key={col.id}>{val || "-"}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
