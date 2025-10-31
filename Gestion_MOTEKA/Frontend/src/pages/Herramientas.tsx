import { useEffect, useState } from "react";
import api from "@/lib/api";
import { hasRole } from "@/lib/auth";

type Herramienta = {
    id: number;
    nombre: string;
    descripcion: string;
    cantidad: number;
    estado: string;
    ubicacion: string;
    marca_modelo: string;
    creado_en: string;
    actualizado_en: string;
};

    export default function Herramientas() {
    const [lista, setLista] = useState<Herramienta[]>([]);
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(true);

    // formulario crear (solo gerente/encargado)
    const [form, setForm] = useState({
        nombre: "",
        descripcion: "",
        cantidad: 1,
        estado: "OPERATIVA",
        ubicacion: "",
        marca_modelo: "",
    });

    const puedeEditar = hasRole("gerente", "encargado");

    async function cargar() {
        try {
        const resp = await api.get("/api/herramientas");
        setLista(resp.data || []);
        } catch (err: any) {
        setError(err.response?.data?.error || "Error cargando inventario");
        } finally {
        setCargando(false);
        }
    }

    async function crearHerramienta(e: React.FormEvent) {
        e.preventDefault();
        try {
        await api.post("/api/herramientas", form);

        // limpiar form
        setForm({
            nombre: "",
            descripcion: "",
            cantidad: 1,
            estado: "OPERATIVA",
            ubicacion: "",
            marca_modelo: "",
        });

        cargar();
        } catch (err: any) {
        alert(err.response?.data?.error || "No se pudo guardar");
        }
    }

    async function eliminarHerramienta(id: number) {
        if (!confirm("¿Eliminar esta herramienta?")) return;
        try {
        await api.delete(`/api/herramientas/${id}`);
        cargar();
        } catch (err: any) {
        alert(err.response?.data?.error || "No se pudo eliminar");
        }
    }

    useEffect(() => {
        cargar();
    }, []);

    if (cargando) {
        return <div style={{ color: "#000" }}>Cargando inventario...</div>;
    }

    if (error) {
        return <div style={{ color: "crimson" }}>{error}</div>;
    }

    return (
        <div
        style={{
            backgroundColor: "#f1f5f9",
            color: "#000",
            padding: "1.5rem",
            minHeight: "100vh",
            borderRadius: "8px",
        }}
        >
        <h1
            style={{
            color: "#181818ff",
            marginBottom: "1rem",
            fontWeight: 600,
            }}
        >
            Inventario de Herramientas
        </h1>

        {/* FORMULARIO (solo gerente / encargado) */}
        {puedeEditar && (
            <section
            style={{
                background: "#fff",
                border: "1px solid #ffffffff",
                borderRadius: "8px",
                padding: "1rem 1rem 1.25rem",
                marginBottom: "2rem",
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0)",
            }}
            >
            <h2
                style={{
                marginTop: 0,
                color: "#000",
                fontSize: "1rem",
                fontWeight: 600,
                marginBottom: "0.75rem",
                }}
            >
                Agregar herramienta
            </h2>

            <form
                onSubmit={crearHerramienta}
                style={{
                display: "grid",
                gap: "0.75rem",
                gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                fontSize: "0.9rem",
                color: "#000",
                }}
            >
                <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={labelStyle}>Nombre *</label>
                <input
                    required
                    value={form.nombre}
                    onChange={(e) =>
                    setForm({ ...form, nombre: e.target.value })
                    }
                    style={inputStyleLight}
                    placeholder="Gato hidráulico 2T"
                />
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={labelStyle}>Marca / Modelo</label>
                <input
                    value={form.marca_modelo}
                    onChange={(e) =>
                    setForm({ ...form, marca_modelo: e.target.value })
                    }
                    style={inputStyleLight}
                    placeholder="Truper / Makita..."
                />
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={labelStyle}>Cantidad</label>
                <input
                    type="number"
                    min={1}
                    value={form.cantidad}
                    onChange={(e) =>
                    setForm({ ...form, cantidad: Number(e.target.value) })
                    }
                    style={inputStyleLight}
                />
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={labelStyle}>Ubicación</label>
                <input
                    value={form.ubicacion}
                    onChange={(e) =>
                    setForm({ ...form, ubicacion: e.target.value })
                    }
                    style={inputStyleLight}
                    placeholder="Bahía 2 / Estante rojo / etc."
                />
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={labelStyle}>Estado</label>
                <select
                    value={form.estado}
                    onChange={(e) =>
                    setForm({ ...form, estado: e.target.value })
                    }
                    style={inputStyleLight}
                >
                    <option value="OPERATIVA">OPERATIVA</option>
                    <option value="EN_REPARACION">EN_REPARACION</option>
                    <option value="FUERA_DE_SERVICIO">FUERA_DE_SERVICIO</option>
                </select>
                </div>

                <div
                style={{
                    gridColumn: "1 / -1",
                    display: "flex",
                    flexDirection: "column",
                }}
                >
                <label style={labelStyle}>Descripción</label>
                <textarea
                    value={form.descripcion}
                    onChange={(e) =>
                    setForm({ ...form, descripcion: e.target.value })
                    }
                    style={{
                    ...inputStyleLight,
                    minHeight: "60px",
                    resize: "vertical",
                    }}
                    placeholder="Notas, daños, etc."
                />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                <button
                    type="submit"
                    style={{
                    backgroundColor: "#e90000ff",
                    border: "none",
                    color: "#f9f9f9ff",
                    fontWeight: 600,
                    padding: "0.6rem 1rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    }}
                >
                    Guardar herramienta
                </button>
                </div>
            </form>
            </section>
        )}

        {/* LISTA */}
        <section
            style={{
            background: "#fff",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            padding: "1rem",
            boxShadow: "0 2px 6px rgba(255, 0, 0, 0.07)",
            }}
        >
            <h2
            style={{
                color: "#000",
                margin: 0,
                marginBottom: "0.75rem",
                fontSize: "1rem",
                fontWeight: 600,
            }}
            >
            Herramientas registradas
            </h2>

            <div style={{ overflowX: "auto" }}>
            <table
                style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "800px",
                color: "#000",
                fontSize: "0.8rem",
                }}
            >
                <thead>
                <tr style={{ background: "#afadc15f", color: "#000" }}>
                    <th style={thStyleLight}>ID</th>
                    <th style={thStyleLight}>Nombre</th>
                    <th style={thStyleLight}>Marca/Modelo</th>
                    <th style={thStyleLight}>Cant.</th>
                    <th style={thStyleLight}>Estado</th>
                    <th style={thStyleLight}>Ubicación</th>
                    <th style={thStyleLight}>Notas</th>
                    {puedeEditar && <th style={thStyleLight}>Acciones</th>}
                </tr>
                </thead>

                <tbody>
                {lista.length === 0 && (
                    <tr>
                    <td
                        style={tdStyleLight}
                        colSpan={puedeEditar ? 8 : 7}
                    >
                        Sin herramientas registradas
                    </td>
                    </tr>
                )}

                {lista.map((h) => (
                    <tr
                    key={h.id}
                    style={{
                        borderBottom: "1px solid #e5e7eb",
                        backgroundColor: "#fff",
                    }}
                    >
                    <td style={tdStyleLight}>{h.id}</td>
                    <td style={tdStyleLight}>{h.nombre}</td>
                    <td style={tdStyleLight}>{h.marca_modelo || "—"}</td>
                    <td style={tdStyleLight}>{h.cantidad}</td>
                    <td style={tdStyleLight}>{h.estado}</td>
                    <td style={tdStyleLight}>{h.ubicacion || "—"}</td>
                    <td style={tdStyleLight}>{h.descripcion || "—"}</td>

                    {puedeEditar && (
                        <td style={tdStyleLight}>
                        <button
                            onClick={() => eliminarHerramienta(h.id)}
                            style={{
                            backgroundColor: "#dc2626",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            fontSize: "0.7rem",
                            padding: "0.4rem 0.6rem",
                            cursor: "pointer",
                            }}
                        >
                            Eliminar
                        </button>
                        </td>
                    )}
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </section>
        </div>
    );
    }

/* estilos reutilizables */

const labelStyle: React.CSSProperties = {
    color: "#000",
    fontWeight: 500,
    marginBottom: "0.25rem",
};

const inputStyleLight: React.CSSProperties = {
    backgroundColor: "#fff",
    color: "#000",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    padding: "0.5rem 0.6rem",
    fontSize: "0.9rem",
    outline: "none",
    boxShadow: "0 0 0 rgba(0,0,0,0)",
};

const thStyleLight: React.CSSProperties = {
    textAlign: "left",
    padding: "0.5rem 0.75rem",
    fontWeight: 600,
    borderBottom: "1px solid #000",
};

const tdStyleLight: React.CSSProperties = {
    padding: "0.5rem 0.75rem",
    color: "#000",
    verticalAlign: "top",
    backgroundColor: "#fff",
};