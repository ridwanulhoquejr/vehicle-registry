import { useState, useEffect, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════
// 🔧 SUPABASE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";

// ─── Lightweight Supabase REST client (no SDK needed) ───
const supabase = {
  headers: {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  },
  async getAll() {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/vehicles?order=created_at.desc`,
      { headers: this.headers }
    );
    if (!res.ok) throw new Error("Failed to fetch vehicles");
    return res.json();
  },
  async insert(vehicle) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/vehicles`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(vehicle),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      const msg = err?.message || "";
      if (msg.includes("vehicles_reg_no_key")) throw new Error("DUPLICATE_REG");
      if (msg.includes("vehicles_licence_no_key"))
        throw new Error("DUPLICATE_LICENCE");
      if (
        res.status === 409 ||
        msg.includes("duplicate") ||
        msg.includes("unique")
      )
        throw new Error("DUPLICATE_UNKNOWN");
      throw new Error("Failed to insert vehicle");
    }
    return res.json();
  },
  async remove(id) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/vehicles?id=eq.${id}`,
      { method: "DELETE", headers: this.headers }
    );
    if (!res.ok) throw new Error("Failed to delete vehicle");
    return true;
  },
};

// ─── Constants ───
const VEHICLE_TYPES = ["Car", "Bike", "Micro Bus", "Unregistered Vehicle", "Agriculture", "Emergency Services"];
const SIMPLE_TYPES = ["Agriculture", "Emergency Services", "Unregistered Vehicle"];
const VEHICLE_ICONS = { Car: "🚗", Bike: "🏍️", "Micro Bus": "🚐", Agriculture: "🚜", "Emergency Services": "🚑", "Unregistered Vehicle": "🚫" };
const VEHICLE_COLORS = {
  Car: { bg: "#E8F5E9", border: "#43A047", text: "#2E7D32" },
  Bike: { bg: "#FFF3E0", border: "#FB8C00", text: "#E65100" },
  "Micro Bus": { bg: "#E3F2FD", border: "#1E88E5", text: "#0D47A1" },
  Agriculture: { bg: "#F1F8E9", border: "#7CB342", text: "#33691E" },
  "Emergency Services": { bg: "#FCE4EC", border: "#E53935", text: "#B71C1C" },
  "Unregistered Vehicle": { bg: "#F3E5F5", border: "#8E24AA", text: "#4A148C" },
};
const EMPTY_FORM = {
  name: "",
  card_no: "",
  reg_no: "",
  licence_no: "",
  address: "",
  vehicle_type: "Car",
  type: "",
  engine_no: "",
};

// ─── Badge ───
function Badge({ type }) {
  const c = VEHICLE_COLORS[type] || VEHICLE_COLORS.Car;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "6px 16px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        background: c.bg,
        color: c.text,
        border: `1.5px solid ${c.border}`,
        letterSpacing: 0.3,
      }}
    >
      {type}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ADMIN LOGIN
// ═══════════════════════════════════════════════════════════════════
function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      sessionStorage.setItem("admin_auth", "true");
      onLogin();
    } else {
      setError("Invalid username or password");
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: "1.5px solid #E5E7EB",
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    transition: "border-color 0.2s",
  };

  return (
    <div
      style={{
        animation: "fadeSlide 0.4s ease",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 40,
      }}
    >
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
      `}</style>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: "linear-gradient(135deg, #1E88E5, #0D47A1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: 24,
          marginBottom: 16,
        }}
      >
        🔒
      </div>
      <h2
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 22,
          color: "#1B2A4A",
          marginBottom: 4,
        }}
      >
        Admin Login
      </h2>
      <p
        style={{
          fontSize: 13,
          color: "#667085",
          marginBottom: 28,
        }}
      >
        Enter your credentials to access the admin panel
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 380,
          animation: shaking ? "shake 0.4s ease" : "none",
        }}
      >
        {error && (
          <div
            style={{
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 13,
              color: "#DC2626",
              marginBottom: 16,
              textAlign: "center",
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#344054",
              marginBottom: 6,
              display: "block",
            }}
          >
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError("");
            }}
            placeholder="Enter username"
            style={inputStyle}
            autoFocus
          />
        </div>

        <div style={{ marginBottom: 22 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#344054",
              marginBottom: 6,
              display: "block",
            }}
          >
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            placeholder="Enter password"
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg, #1E88E5, #0D47A1)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer",
            transition: "opacity 0.2s",
          }}
        >
          Sign In
        </button>
      </form>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ADMIN PANEL
// ═══════════════════════════════════════════════════════════════════
function AdminPanel({ vehicles, onAdd, onDelete }) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isSimple = SIMPLE_TYPES.includes(form.vehicle_type);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.card_no.trim()) e.card_no = "Required";
    else if (!/^\d+$/.test(form.card_no.trim())) e.card_no = "Card No must contain only numbers";
    if (!isSimple) {
      if (!form.reg_no.trim()) e.reg_no = "Required";
    }
    if (!isSimple || form.vehicle_type === "Unregistered Vehicle") {
      if (!form.licence_no.trim()) e.licence_no = "Required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.address?.trim()) payload.address = null;
      const isAgriOrEms = ["Agriculture", "Emergency Services"].includes(form.vehicle_type);
      payload.type = isAgriOrEms && payload.type?.trim() ? payload.type.trim() : null;
      payload.engine_no = form.vehicle_type === "Unregistered Vehicle" && payload.engine_no?.trim() ? payload.engine_no.trim() : null;
      if (isSimple) {
        const prefix = form.vehicle_type === "Agriculture" ? "AGR" : form.vehicle_type === "Unregistered Vehicle" ? "URV" : "EMS";
        const uid = Date.now().toString(36).toUpperCase();
        payload.reg_no = `${prefix}-${uid}`;
        if (form.vehicle_type !== "Unregistered Vehicle") {
          payload.licence_no = `${prefix}-L-${uid}`;
        }
      }
      await onAdd(payload);
      setForm({ ...EMPTY_FORM });
      setErrors({});
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      if (err.message === "DUPLICATE_REG") {
        setErrors((e) => ({
          ...e,
          reg_no: "This Registration No already exists!",
        }));
      } else if (err.message === "DUPLICATE_LICENCE") {
        setErrors((e) => ({
          ...e,
          licence_no: "This Licence No already exists!",
        }));
      } else if (err.message === "DUPLICATE_UNKNOWN") {
        setErrors((e) => ({
          ...e,
          reg_no: "Duplicate entry detected",
          licence_no: "Duplicate entry detected",
        }));
      } else {
        alert("Error: " + err.message);
      }
    }
    setSubmitting(false);
  };

  const inputStyle = (field) => ({
    width: "100%",
    padding: "11px 14px",
    borderRadius: 10,
    border: errors[field] ? "2px solid #E53935" : "1.5px solid #D0D5DD",
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    background: "#FAFBFC",
    outline: "none",
    transition: "border 0.2s",
    boxSizing: "border-box",
  });

  return (
    <div>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #1B2A4A 0%, #0F1C33 100%)",
          borderRadius: 18,
          padding: "28px 30px 24px",
          marginBottom: 28,
          color: "#fff",
        }}
      >
        <div
          style={{
            fontSize: 13,
            opacity: 0.6,
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          Admin Panel
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            fontFamily: "'Playfair Display', serif",
          }}
        >
          Register New Vehicle
        </div>
        <div style={{ fontSize: 12, opacity: 0.5, marginTop: 4 }}>
          Data stored in PostgreSQL
        </div>
      </div>

      {/* Success */}
      {success && (
        <div
          style={{
            background: "#E8F5E9",
            border: "1.5px solid #43A047",
            borderRadius: 12,
            padding: "12px 18px",
            marginBottom: 18,
            color: "#2E7D32",
            fontWeight: 600,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
            animation: "fadeIn 0.3s ease",
          }}
        >
          ✓ Vehicle registered and saved to database!
        </div>
      )}

      {/* Form */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        {[
          {
            key: "name",
            label: "Name",
            placeholder: "e.g. Rafiq Ahmed",
            required: true,
          },
          {
            key: "card_no",
            label: "Card No",
            placeholder: "e.g. 1234",
            required: true,
          },
          ...(["Agriculture", "Emergency Services"].includes(form.vehicle_type)
            ? [
              {
                key: "type",
                label: "Type (Optional)",
                placeholder: form.vehicle_type === "Agriculture" ? "e.g. Tractor, Harvester" : "e.g. Ambulance, Fire Truck",
              },
            ]
            : []),
          ...(form.vehicle_type === "Unregistered Vehicle"
            ? [
              {
                key: "engine_no",
                label: "Engine No. (Optional)",
                placeholder: "e.g. ENG-123456",
              },
            ]
            : []),
          ...(!isSimple
            ? [
              {
                key: "reg_no",
                label: "Registration No",
                placeholder: "e.g. REG-2026-001",
                required: true,
              },
            ]
            : []),
          ...(!isSimple || form.vehicle_type === "Unregistered Vehicle"
            ? [
              {
                key: "licence_no",
                label: "Licence No",
                placeholder: "e.g. DHA-1234",
                required: true,
              },
            ]
            : []),
          {
            key: "address",
            label: "Address (Optional)",
            placeholder: "e.g. 45 Station Road, Chattogram",
          },
        ].map(({ key, label, placeholder, required }) => (
          <div
            key={key}
            style={key === "address" ? { gridColumn: "1 / -1" } : {}}
          >
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#475467",
                marginBottom: 5,
                display: "block",
                letterSpacing: 0.3,
              }}
            >
              {label}
              {required && <span style={{ color: "#E53935", marginLeft: 2 }}>*</span>}
            </label>
            <input
              style={inputStyle(key)}
              value={form[key]}
              placeholder={placeholder}
              onChange={(e) => {
                setForm((f) => ({ ...f, [key]: e.target.value }));
                if (errors[key])
                  setErrors((er) => {
                    const n = { ...er };
                    delete n[key];
                    return n;
                  });
              }}
            />
            {errors[key] && (
              <span
                style={{
                  fontSize: 11,
                  color: "#E53935",
                  marginTop: 2,
                  display: "block",
                }}
              >
                {errors[key]}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Vehicle Type */}
      <div style={{ marginBottom: 22 }}>
        <label
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#475467",
            marginBottom: 8,
            display: "block",
            letterSpacing: 0.3,
          }}
        >
          Vehicle Type<span style={{ color: "#E53935", marginLeft: 2 }}>*</span>
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {VEHICLE_TYPES.map((t) => {
            const active = form.vehicle_type === t;
            const c = VEHICLE_COLORS[t];
            return (
              <button
                key={t}
                onClick={() => setForm((f) => ({ ...f, vehicle_type: t }))}
                style={{
                  padding: "12px 8px",
                  borderRadius: 12,
                  border: active
                    ? `2.5px solid ${c.border}`
                    : "1.5px solid #D0D5DD",
                  background: active ? c.bg : "#FAFBFC",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  transition: "all 0.2s",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <span style={{ fontSize: 24 }}>{VEHICLE_ICONS[t]}</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: active ? 700 : 500,
                    color: active ? c.text : "#475467",
                  }}
                >
                  {t}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{
          width: "100%",
          padding: "13px",
          borderRadius: 12,
          border: "none",
          background: submitting
            ? "#93C5FD"
            : "linear-gradient(135deg, #1E88E5, #1565C0)",
          color: "#fff",
          fontSize: 15,
          fontWeight: 700,
          cursor: submitting ? "wait" : "pointer",
          fontFamily: "'DM Sans', sans-serif",
          letterSpacing: 0.4,
          boxShadow: "0 4px 14px rgba(30,136,229,0.3)",
          transition: "all 0.15s",
        }}
      >
        {submitting ? "Saving to database…" : "+ Register Vehicle"}
      </button>

      {/* Admin List */}
      {vehicles.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#475467",
              marginBottom: 12,
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            Registered Entries ({vehicles.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {vehicles.map((v) => (
              <div
                key={v.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#FAFBFC",
                  border: "1px solid #E5E7EB",
                  borderRadius: 12,
                  padding: "12px 16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 22 }}>
                    {VEHICLE_ICONS[v.vehicle_type]}
                  </span>
                  <div>
                    <div
                      style={{ fontWeight: 600, fontSize: 14, color: "#1B2A4A" }}
                    >
                      {v.name}
                    </div>
                    <div style={{ fontSize: 11, color: "#98A2B3" }}>
                      {[v.reg_no, v.licence_no].filter(x => x && !/^(AGR|EMS|URV)-/.test(x)).join(" · ") || v.address || "—"}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onDelete(v.id)}
                  style={{
                    background: "none",
                    border: "1.5px solid #FECACA",
                    borderRadius: 8,
                    padding: "6px 12px",
                    cursor: "pointer",
                    fontSize: 12,
                    color: "#DC2626",
                    fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.target.style.background = "#FEF2F2")}
                  onMouseLeave={(e) => (e.target.style.background = "none")}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PUBLIC VIEW
// ═══════════════════════════════════════════════════════════════════
function PublicView({ vehicles, loading }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filtered = vehicles.filter((v) => {
    const matchType = filter === "All" || v.vehicle_type === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      String(v.id).includes(q) ||
      v.name.toLowerCase().includes(q) ||
      (v.card_no && v.card_no.toLowerCase().includes(q)) ||
      (v.reg_no && v.reg_no.toLowerCase().includes(q)) ||
      (v.licence_no && v.licence_no.toLowerCase().includes(q)) ||
      (v.address && v.address.toLowerCase().includes(q));
    return matchType && matchSearch;
  });

  const counts = { All: vehicles.length };
  VEHICLE_TYPES.forEach(
    (t) => (counts[t] = vehicles.filter((v) => v.vehicle_type === t).length)
  );

  return (
    <div>
      {/* Header */}
      <div
        style={{
          background:
            "linear-gradient(135deg, #0D47A1 0%, #1565C0 50%, #1E88E5 100%)",
          borderRadius: 18,
          padding: "28px 30px 24px",
          marginBottom: 24,
          color: "#fff",
        }}
      >
        <div
          style={{
            fontSize: 13,
            opacity: 0.6,
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          Public Directory
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            fontFamily: "'Playfair Display', serif",
          }}
        >
          Registered Vehicles
        </div>
        <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
          {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} on record
        </div>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <span
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 16,
            opacity: 0.4,
          }}
        >
          🔍
        </span>
        <input
          placeholder="Search by serial no, name, registration, licence…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 14px 12px 40px",
            borderRadius: 12,
            border: "1.5px solid #D0D5DD",
            fontSize: 14,
            fontFamily: "'DM Sans', sans-serif",
            background: "#FAFBFC",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Filter Pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {["All", ...VEHICLE_TYPES].map((t) => {
          const active = filter === t;
          return (
            <button
              key={t}
              onClick={() => setFilter(t)}
              style={{
                padding: "7px 16px",
                borderRadius: 20,
                border: active ? "2px solid #1E88E5" : "1.5px solid #D0D5DD",
                background: active ? "#E3F2FD" : "#fff",
                color: active ? "#0D47A1" : "#475467",
                fontWeight: active ? 700 : 500,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.15s",
              }}
            >
              {t !== "All" && VEHICLE_ICONS[t] + " "}
              {t} ({counts[t]})
            </button>
          );
        })}
      </div>

      {/* Vehicle Cards */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "#98A2B3" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
          Loading from database…
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px 20px",
            color: "#98A2B3",
            background: "#FAFBFC",
            borderRadius: 16,
            border: "1.5px dashed #D0D5DD",
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
          <div style={{ fontWeight: 600, color: "#667085" }}>
            No vehicles found
          </div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            {search || filter !== "All"
              ? "Try adjusting your search or filter"
              : "No vehicles registered yet. Ask admin to add some!"}
          </div>
        </div>
      ) : (
        <div
          className="vehicle-grid"
        >
          {filtered.map((v, i) => {
            const c = VEHICLE_COLORS[v.vehicle_type];
            return (
              <div
                key={v.id}
                className="vehicle-card"
                style={{
                  background: "#fff",
                  border: "1.5px solid #E5E7EB",
                  borderRadius: 16,
                  transition: "transform 0.2s, box-shadow 0.2s",
                  animation: `fadeSlide 0.35s ease ${i * 0.04}s both`,
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 24px rgba(0,0,0,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: c.bg,
                      border: `1.5px solid ${c.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    {VEHICLE_ICONS[v.vehicle_type]}
                  </div>
                  <Badge type={v.vehicle_type} />
                </div>
                <div
                  className="card-name"
                  style={{
                    fontWeight: 700,
                    fontSize: 16,
                    color: "#1B2A4A",
                    marginBottom: 6,
                    fontFamily: "'Playfair Display', serif",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {v.name}
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  {[
                    { label: "Card No", val: v.card_no },
                    { label: "Reg No", val: v.reg_no },
                    { label: "Licence", val: v.licence_no },
                    { label: "Type", val: v.type },
                    { label: "Engine No", val: v.engine_no },
                    { label: "Address", val: v.address },
                  ]
                    .filter(({ val, label }) => {
                      if (!val) return false;
                      if ((label === "Reg No" || label === "Licence") && /^(AGR|EMS|URV)-/.test(val)) return false;
                      return true;
                    })
                    .map(({ label, val }) => (
                      <div key={label} className="card-detail" style={{ fontSize: 12, color: "#667085", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <span style={{ fontWeight: 600, color: "#475467" }}>
                          {label}:
                        </span>{" "}
                        {val}
                      </div>
                    ))}
                </div>
                <div
                  style={{ fontSize: 10, color: "#C4C4C4", marginTop: 8 }}
                >
                  Added {new Date(v.created_at).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const [view, setView] = useState("public");
  const [adminAuth, setAdminAuth] = useState(
    () => sessionStorage.getItem("admin_auth") === "true"
  );
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVehicles = useCallback(async () => {
    try {
      const data = await supabase.getAll();
      setVehicles(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleAdd = async (vehicle) => {
    const [created] = await supabase.insert(vehicle);
    setVehicles((prev) => [created, ...prev]);
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this vehicle from the database?")) return;
    await supabase.remove(id);
    setVehicles((prev) => prev.filter((v) => v.id !== id));
  };

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fff; }
        input::placeholder { color: #C4C4C4; opacity: 1; }
        input:focus { border-color: #1E88E5 !important; }
        .vehicle-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
        .vehicle-card { padding: 18px 20px; min-width: 0; }
        @media (max-width: 520px) {
          .vehicle-grid { gap: 8px; }
          .vehicle-card { padding: 10px 8px; }
          .vehicle-card .card-name { font-size: 13px !important; }
          .vehicle-card .card-detail { font-size: 10px !important; }
        }
        @media (max-width: 360px) {
          .vehicle-card { padding: 8px 6px; }
          .vehicle-card .card-name { font-size: 12px !important; }
          .vehicle-card .card-detail { font-size: 9px !important; }
        }
      `}</style>

      {/* ─── Navigation ─── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 24px",
          borderBottom: "1px solid #E5E7EB",
          background: "#fff",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "linear-gradient(135deg, #1E88E5, #0D47A1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 800,
              fontSize: 14,
              fontFamily: "'Playfair Display', serif",
            }}
          >
            LOD
          </div>
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 16,
                color: "#1B2A4A",
                fontFamily: "'Playfair Display', serif",
                lineHeight: 1.2,
              }}
            >
              Lohagara UP Oil Distribution
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            background: "#F3F4F6",
            borderRadius: 12,
            padding: 3,
          }}
        >
          {[
            { key: "public", label: "🌐 Public" },
            { key: "admin", label: "🔒 Admin" },
          ].map(({ key, label }) => {
            const active = view === key;
            return (
              <button
                key={key}
                onClick={() => setView(key)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 10,
                  border: "none",
                  background: active ? "#fff" : "transparent",
                  boxShadow: active ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.2s",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    color: active ? "#1B2A4A" : "#667085",
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Error Banner ─── */}
      {error && (
        <div
          style={{
            background: "#FEF2F2",
            borderBottom: "1px solid #FECACA",
            padding: "10px 24px",
            fontSize: 13,
            color: "#DC2626",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          ⚠️ Database error: {error}
          <button
            onClick={fetchVehicles}
            style={{
              background: "#DC2626",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "4px 12px",
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 600,
              marginLeft: 8,
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ─── Content ─── */}
      <div style={{ maxWidth: 720, margin: "28px auto", padding: "0 12px" }}>
        {view === "admin" ? (
          adminAuth ? (
            <AdminPanel
              vehicles={vehicles}
              onAdd={handleAdd}
              onDelete={handleDelete}
            />
          ) : (
            <AdminLogin onLogin={() => setAdminAuth(true)} />
          )
        ) : (
          <PublicView vehicles={vehicles} loading={loading} />
        )}
      </div>

      {/* ─── Footer ─── */}
      <div
        style={{
          textAlign: "center",
          padding: "16px 20px",
          fontSize: 13,
          color: "#9CA3AF",
          borderTop: "1px solid #F3F4F6",
          marginTop: 20,
        }}
      >
        Lohagara UP Oil Distribution • Built by{" "}
        <a
          href="https://cifarx.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#1E88E5", textDecoration: "none", fontWeight: 600 }}
        >
          CifarX
        </a>
      </div>
    </div>
  );
}
