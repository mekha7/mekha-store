import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabase";

export default function ServicesManager() {
  const [services, setServices] = useState([]);
  const [columns, setColumns] = useState([]);

  const [newService, setNewService] = useState({ name: "", price: "" });
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnType, setNewColumnType] = useState("text");

  // Rename column UI
  const [renameColId, setRenameColId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  // Show Column Manager block
  const [showColumnManager, setShowColumnManager] = useState(false);

  // ORDER columns by sort_order
  const orderedColumns = useMemo(() => {
    const copy = [...columns];
    copy.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    return copy;
  }, [columns]);

  // ------------------------------
  // LOAD ALL
  // ------------------------------
  async function loadAll() {
    const { data: s1 } = await supabase.from("services").select("*");
    const { data: s2 } = await supabase
      .from("service_columns")
      .select("*")
      .order("sort_order", { ascending: true });

    setServices(s1 || []);
    setColumns(s2 || []);
  }

  useEffect(() => {
    loadAll();
  }, []);

  // ------------------------------
  // ADD SERVICE
  // ------------------------------
  async function addService(e) {
    e.preventDefault();
    if (!newService.name.trim()) return;

    const { error } = await supabase.from("services").insert({
      name: newService.name,
      price: newService.price ? Number(newService.price) : null,
      custom_fields: {},
    });

    if (error) return alert(error.message);

    setNewService({ name: "", price: "" });
    loadAll();
  }

  // ------------------------------
  // DELETE SERVICE
  // ------------------------------
  async function deleteService(id) {
    if (!window.confirm("Delete this service?")) return;
    await supabase.from("services").delete().eq("id", id);
    loadAll();
  }

  // ------------------------------
  // ADD COLUMN
  // ------------------------------
  async function addColumn(e) {
    e.preventDefault();
    if (!newColumnName.trim()) return;

    const { error } = await supabase.from("service_columns").insert({
      column_name: newColumnName,
      data_type: newColumnType,
      sort_order: columns.length,
      visible: true,
      options: null,
    });

    if (error) return alert(error.message);

    setNewColumnName("");
    setNewColumnType("text");
    loadAll();
  }

  // ------------------------------
  // UPDATE COLUMN
  // ------------------------------
  async function updateColumn(colId, patch) {
    const { error } = await supabase
      .from("service_columns")
      .update(patch)
      .eq("id", colId);

    if (error) alert(error.message);
    else loadAll();
  }

  // ------------------------------
  // DELETE COLUMN
  // ------------------------------
  async function deleteColumn(col) {
    if (!window.confirm("Delete column?")) return;

    await supabase.from("service_columns").delete().eq("id", col.id);

    const { data: rows } = await supabase.from("services").select("id, custom_fields");

    for (const r of rows || []) {
      const cf = r.custom_fields || {};
      if (cf[col.column_name] !== undefined) {
        delete cf[col.column_name];
        await supabase
          .from("services")
          .update({ custom_fields: cf })
          .eq("id", r.id);
      }
    }

    loadAll();
  }

  // ------------------------------
  // RENAME COLUMN
  // ------------------------------
  async function renameColumn(col, newName) {
    const trimmed = newName.trim();
    if (!trimmed) return;

    const oldName = col.column_name;

    // update column table
    await supabase
      .from("service_columns")
      .update({ column_name: trimmed })
      .eq("id", col.id);

    // update all service custom_fields keys
    const { data: rows } = await supabase.from("services").select("id, custom_fields");

    for (const r of rows || []) {
      const cf = r.custom_fields || {};
      if (cf[oldName] !== undefined) {
        cf[trimmed] = cf[oldName];
        delete cf[oldName];
        await supabase
          .from("services")
          .update({ custom_fields: cf })
          .eq("id", r.id);
      }
    }

    setRenameColId(null);
    setRenameValue("");
    loadAll();
  }

  // ------------------------------
  // DRAG & DROP (PURE REACT)
  // ------------------------------
  async function handleManualReorder(from, to) {
    const newCols = [...orderedColumns];
    const moved = newCols.splice(from, 1)[0];
    newCols.splice(to, 0, moved);

    // update DB order
    await Promise.all(
      newCols.map((c, idx) =>
        supabase
          .from("service_columns")
          .update({ sort_order: idx })
          .eq("id", c.id)
      )
    );

    setColumns(newCols);
  }

  // ------------------------------
  // OPTIONS HANDLER
  // ------------------------------
  function handleOptionsChange(colId, text) {
    const arr = text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    updateColumn(colId, { options: arr });
  }

  // ------------------------------
  // UPDATE FIELD VALUES
  // ------------------------------
  async function updateField(service, col, rawValue) {
    let value = rawValue;

    switch (col.data_type) {
      case "number":
      case "currency":
        value = rawValue === "" ? null : Number(rawValue);
        break;
      case "boolean":
      case "yesno":
        value = rawValue === "true";
        break;
      case "multiselect":
        value = rawValue
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        break;
      case "date":
        value = rawValue || null;
        break;
      default:
        break;
    }

    const updated = {
      ...(service.custom_fields || {}),
      [col.column_name]: value,
    };

    await supabase
      .from("services")
      .update({ custom_fields: updated })
      .eq("id", service.id);

    loadAll();
  }

  // ------------------------------
  // RENDER FIELD INPUT PER TYPE
  // ------------------------------
  function renderFieldInput(service, col) {
    const cf = service.custom_fields || {};
    const rawVal = cf[col.column_name];

    const commonProps = {
      className: "input-text",
      style: { width: col.width || 120 },
    };

    if (col.data_type === "formula") {
      return <input {...commonProps} value={rawVal ?? ""} readOnly />;
    }

    if (col.data_type === "number" || col.data_type === "currency") {
      return (
        <input
          {...commonProps}
          type="number"
          value={rawVal ?? ""}
          onChange={(e) => updateField(service, col, e.target.value)}
        />
      );
    }

    if (col.data_type === "boolean") {
      return (
        <select
          {...commonProps}
          value={rawVal === true ? "true" : rawVal === false ? "false" : ""}
          onChange={(e) => updateField(service, col, e.target.value)}
        >
          <option value="">-</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      );
    }

    if (col.data_type === "dropdown") {
      return (
        <select
          {...commonProps}
          value={rawVal ?? ""}
          onChange={(e) => updateField(service, col, e.target.value)}
        >
          <option value="">-</option>
          {(col.options || []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    }

    if (col.data_type === "multiselect") {
      const text = Array.isArray(rawVal) ? rawVal.join(", ") : "";
      return (
        <input
          {...commonProps}
          value={text}
          onChange={(e) => updateField(service, col, e.target.value)}
          placeholder="a, b, c"
        />
      );
    }

    if (col.data_type === "date") {
      return (
        <input
          {...commonProps}
          type="date"
          value={rawVal ?? ""}
          onChange={(e) => updateField(service, col, e.target.value)}
        />
      );
    }

    return (
      <input
        {...commonProps}
        value={rawVal ?? ""}
        onChange={(e) => updateField(service, col, e.target.value)}
      />
    );
  }

  // ----------------------------------------------------------
  // RENDER START
  // ----------------------------------------------------------
  return (
    <section className="admin-form">
      <div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
}}>
  <h3>Services Manager</h3>


</div>


      {/* ADD SERVICE */}
      <form onSubmit={addService} className="admin-form">
        <input
          className="input-text"
          placeholder="Service Name"
          value={newService.name}
          onChange={(e) =>
            setNewService({ ...newService, name: e.target.value })
          }
        />

        <input
          className="input-text"
          placeholder="Price"
          type="number"
          value={newService.price}
          onChange={(e) =>
            setNewService({ ...newService, price: e.target.value })
          }
        />

        <button className="btn-primary">Add Service</button>
      </form>

      {/* ADD COLUMN */}
      <form onSubmit={addColumn} className="admin-form" style={{ marginTop: 20 }}>
        <input
          className="input-text"
          placeholder="New Column Name"
          value={newColumnName}
          onChange={(e) => setNewColumnName(e.target.value)}
        />
        <select
          className="input-text"
          value={newColumnType}
          onChange={(e) => setNewColumnType(e.target.value)}
        >
          <option value="text">Text</option>
          <option value="number">Number</option>
          <option value="boolean">Yes/No</option>
          <option value="dropdown">Dropdown</option>
          <option value="multiselect">Multi-select</option>
          <option value="date">Date</option>
          <option value="currency">Currency</option>
          <option value="formula">Formula</option>
        </select>
        <button className="btn-primary">Add Column</button>
      </form>

      {/* TOGGLE ADVANCED MANAGER */}
      <button
        className="btn-secondary"
        style={{ marginTop: 15 }}
        onClick={() => setShowColumnManager(!showColumnManager)}
      >
        {showColumnManager ? "Hide Column Manager" : "Advanced Column Manager"}
      </button>

      {/* --------------------------------------------- */}
      {/* ADVANCED COLUMN MANAGER */}
      {/* --------------------------------------------- */}
      {showColumnManager && (
        <div
          className="services-card"
          style={{
            marginTop: 15,
            padding: 15,
            borderRadius: 12,
            background: "#fafafa",
          }}
        >
          <h4 style={{ marginBottom: 10 }}>Columns</h4>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {orderedColumns.map((c, index) => (
              <div
                key={c.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("colIndex", index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const from = Number(e.dataTransfer.getData("colIndex"));
                  const to = index;
                  if (from !== to) handleManualReorder(from, to);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: 10,
                  borderRadius: 8,
                  background: "white",
                  cursor: "grab",
                  border: "1px solid #e0e0e0",
                }}
              >
                {/* drag */}
                <span style={{ cursor: "grab", fontSize: 18 }}>☰</span>

                {/* Name */}
                <input
                  className="input-text"
                  style={{ width: 140 }}
                  value={c.column_name}
                  onChange={(e) =>
                    updateColumn(c.id, { column_name: e.target.value })
                  }
                />

                {/* Type */}
                <select
                  className="input-text"
                  style={{ width: 130 }}
                  value={c.data_type}
                  onChange={(e) =>
                    updateColumn(c.id, { data_type: e.target.value })
                  }
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="boolean">Yes/No</option>
                  <option value="dropdown">Dropdown</option>
                  <option value="multiselect">Multi-select</option>
                  <option value="date">Date</option>
                  <option value="currency">Currency</option>
                  <option value="formula">Formula</option>
                </select>

                {/* Options */}
                {(c.data_type === "dropdown" ||
                  c.data_type === "multiselect") && (
                  <input
                    className="input-text"
                    style={{ flex: 1 }}
                    placeholder="Options: a,b,c"
                    value={(c.options || []).join(", ")}
                    onChange={(e) =>
                      handleOptionsChange(c.id, e.target.value)
                    }
                  />
                )}

                {/* Visibility */}
                <label style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <input
                    type="checkbox"
                    checked={c.visible !== false}
                    onChange={(e) =>
                      updateColumn(c.id, { visible: e.target.checked })
                    }
                  />
                  Show
                </label>

                {/* Width */}
                <input
                  className="input-text"
                  style={{ width: 80 }}
                  type="number"
                  placeholder="Width"
                  value={c.width ?? ""}
                  onChange={(e) =>
                    updateColumn(c.id, {
                      width:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />

                <button
                  className="btn-danger"
                  onClick={() => deleteColumn(c)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --------------------------------------------- */}
      {/* TABLE */}
      {/* --------------------------------------------- */}
      <table className="admin-table" style={{ marginTop: 25 }}>
        <thead>
          <tr>
            <th>Service</th>
            <th>Price</th>

            {orderedColumns
              .filter((c) => c.visible !== false)
              .map((c) => (
                <th key={c.id} style={{ whiteSpace: "nowrap" }}>
                  {renameColId === c.id ? (
                    <div style={{ display: "flex", gap: 5 }}>
                      <input
                        className="input-text"
                        style={{ width: 100 }}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                      />
                      <button
                        className="btn-primary"
                        onClick={() => renameColumn(c, renameValue)}
                        style={{ padding: "2px 8px" }}
                      >
                        ✔
                      </button>
                    </div>
                  ) : (
                    <>
                      {c.column_name}

                      {/* rename */}
                      <span
                        style={{
                          marginLeft: 8,
                          cursor: "pointer",
                          color: "#ff8c00",
                        }}
                        onClick={() => {
                          setRenameColId(c.id);
                          setRenameValue(c.column_name);
                        }}
                      >
                        ✏️
                      </span>

                      {/* delete */}
                      <span
                        style={{
                          marginLeft: 6,
                          cursor: "pointer",
                          color: "red",
                        }}
                        onClick={() => deleteColumn(c)}
                      >
                        🗑
                      </span>
                    </>
                  )}
                </th>
              ))}

            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {services.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>₹{s.price}</td>

              {orderedColumns
                .filter((c) => c.visible !== false)
                .map((col) => (
                  <td key={col.id}>{renderFieldInput(s, col)}</td>
                ))}

              <td>
                <button
                  className="btn-danger"
                  onClick={() => deleteService(s.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {services.length === 0 && (
            <tr>
              <td colSpan={orderedColumns.length + 2}>No services yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
