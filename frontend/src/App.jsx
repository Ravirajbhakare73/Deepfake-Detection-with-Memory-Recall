import { useState, useRef, useCallback } from "react";

const API = "http://localhost:8000";

// ── Helpers ────────────────────────────────────────────────────────────────────

function ConfidenceBar({ value, label }) {
  const isFake = label === "FAKE";
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, letterSpacing: "0.12em", color: "var(--muted)", textTransform: "uppercase" }}>
          Confidence
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: isFake ? "var(--fake)" : "var(--real)" }}>
          {value}%
        </span>
      </div>
      <div style={{ height: 6, background: "var(--track)", borderRadius: 99, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${value}%`,
            background: isFake
              ? "linear-gradient(90deg, #ff4d4d, #ff9900)"
              : "linear-gradient(90deg, #00e676, #00bcd4)",
            borderRadius: 99,
            transition: "width 1.2s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </div>
    </div>
  );
}

function RegionBadge({ region }) {
  const strength = Math.round(region.activation * 100);
  return (
    <div className="region-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {region.zone}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", marginTop: 2 }}>
            {region.artifact}
          </div>
        </div>
        <div style={{
          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
          background: `rgba(255,77,77,${0.1 + region.activation * 0.5})`,
          color: `hsl(${20 - region.activation * 20}, 100%, 65%)`,
          border: `1px solid rgba(255,77,77,${0.2 + region.activation * 0.4})`,
          whiteSpace: "nowrap", marginLeft: 8, flexShrink: 0
        }}>
          {strength}% activation
        </div>
      </div>
      <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6, lineHeight: 1.6 }}>
        {region.detail}
      </p>
      <div style={{ fontSize: 11, color: "var(--muted2)", marginTop: 4 }}>
        Area covered: {region.area_pct}%
      </div>
    </div>
  );
}

function MemoryCard({ caseData }) {
  const isFake = caseData.label === "FAKE";
  const simPct = Math.round(caseData.similarity * 100);
  return (
    <div className="memory-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
          background: isFake ? "rgba(255,77,77,0.12)" : "rgba(0,230,118,0.1)",
          color: isFake ? "var(--fake)" : "var(--real)",
          border: `1px solid ${isFake ? "rgba(255,77,77,0.25)" : "rgba(0,230,118,0.25)"}`,
          textTransform: "uppercase", letterSpacing: "0.08em"
        }}>
          {caseData.label}
        </span>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>
          {simPct}% similar
        </span>
      </div>
      <div style={{ fontSize: 11, color: "var(--muted2)", marginTop: 4, fontFamily: "monospace" }}>
        {caseData.run_id.slice(0, 8)}…
      </div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
        Confidence: {caseData.confidence}%
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────────

export default function App() {
  const [dragOver, setDragOver]   = useState(false);
  const [preview,  setPreview]    = useState(null);
  const [loading,  setLoading]    = useState(false);
  const [result,   setResult]     = useState(null);
  const [error,    setError]      = useState(null);
  const [tab,      setTab]        = useState("gradcam");
  const fileRef = useRef();

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError(null);
    analyzeFile(file);
  }, []);

  const analyzeFile = async (file) => {
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API}/analyze`, { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Server error");
      }
      const data = await res.json();
      setResult(data);
      setTab("gradcam");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const isFake = result?.label === "FAKE";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

        :root {
          --bg:     #0a0a0f;
          --card:   #111118;
          --border: #1e1e2e;
          --fg:     #e8e8f0;
          --muted:  #7070a0;
          --muted2: #404060;
          --fake:   #ff5555;
          --real:   #50fa7b;
          --accent: #bd93f9;
          --track:  #1e1e2e;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); color: var(--fg); font-family: 'Syne', sans-serif; min-height: 100vh; }
        .mono { font-family: 'Space Mono', monospace; }

        .upload-zone {
          border: 1.5px dashed var(--border);
          border-radius: 16px;
          padding: 48px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          text-align: center;
        }
        .upload-zone.drag { border-color: var(--accent); background: rgba(189,147,249,0.04); }
        .upload-zone:hover { border-color: var(--muted2); }

        .verdict-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .tab-bar {
          display: flex;
          gap: 2px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 3px;
        }
        .tab-btn {
          flex: 1;
          background: none;
          border: none;
          color: var(--muted);
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          font-weight: 600;
          padding: 7px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
          letter-spacing: 0.04em;
        }
        .tab-btn.active { background: var(--border); color: var(--fg); }

        .region-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 14px;
          margin-bottom: 10px;
          transition: border-color 0.15s;
        }
        .region-card:hover { border-color: var(--muted2); }

        .memory-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 12px;
          flex: 1;
          min-width: 140px;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s ease forwards; }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        .pulse { animation: pulse 1.4s ease-in-out infinite; }

        .divider { height: 1px; background: var(--border); margin: 20px 0; }
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, #bd93f9, #ff5555)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16
            }}>🔍</div>
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}>DeepScan</span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
              background: "rgba(189,147,249,0.1)", color: "var(--accent)",
              border: "1px solid rgba(189,147,249,0.2)", letterSpacing: "0.1em"
            }}>RESEARCH</span>
          </div>
          <p style={{ fontSize: 13, color: "var(--muted)", maxWidth: 420 }}>
            CNN-based deepfake detection with GradCAM explainability and embedding memory recall.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: result ? "1fr 1.4fr" : "1fr", gap: 20 }}>

          {/* Left panel */}
          <div>
            {!preview && (
              <div
                className={`upload-zone ${dragOver ? "drag" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current.click()}
              >
                <div style={{ fontSize: 36 }}>⬆</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Drop image here</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>or click to browse</div>
                <div style={{ fontSize: 11, color: "var(--muted2)" }}>JPG · PNG · WEBP</div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={(e) => handleFile(e.target.files[0])} />
              </div>
            )}

            {preview && (
              <div style={{ position: "relative" }}>
                <img src={preview} alt="uploaded" style={{
                  width: "100%", borderRadius: 12, display: "block",
                  border: result
                    ? `2px solid ${isFake ? "rgba(255,85,85,0.4)" : "rgba(80,250,123,0.35)"}`
                    : "2px solid var(--border)",
                  transition: "border-color 0.4s"
                }} />
                {loading && (
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: 12,
                    background: "rgba(10,10,15,0.7)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexDirection: "column", gap: 12
                  }}>
                    <div className="pulse" style={{ fontSize: 28 }}>⚙</div>
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>Analyzing…</div>
                  </div>
                )}
                {result && (
                  <div style={{ position: "absolute", top: 10, left: 10 }}>
                    <div className="verdict-badge" style={{
                      background: isFake ? "rgba(255,85,85,0.15)" : "rgba(80,250,123,0.12)",
                      color: isFake ? "var(--fake)" : "var(--real)",
                      border: `1px solid ${isFake ? "rgba(255,85,85,0.35)" : "rgba(80,250,123,0.3)"}`
                    }}>
                      <span>{isFake ? "⚠" : "✓"}</span>
                      {result.label}
                    </div>
                  </div>
                )}
                <button onClick={() => { setPreview(null); setResult(null); setError(null); }}
                  style={{
                    position: "absolute", top: 10, right: 10,
                    background: "rgba(10,10,15,0.75)", border: "1px solid var(--border)",
                    color: "var(--muted)", borderRadius: 6, padding: "4px 10px",
                    cursor: "pointer", fontSize: 11, fontFamily: "inherit"
                  }}>
                  ✕ Clear
                </button>
              </div>
            )}

            {error && (
              <div style={{
                marginTop: 12, padding: "12px 14px", borderRadius: 10,
                background: "rgba(255,85,85,0.08)", border: "1px solid rgba(255,85,85,0.2)",
                color: "var(--fake)", fontSize: 12
              }}>{error}</div>
            )}

            {/* Verdict + confidence card */}
            {result && (
              <div className="fade-up" style={{
                marginTop: 14, padding: "18px",
                background: "var(--card)", border: `1px solid ${isFake ? "rgba(255,85,85,0.2)" : "rgba(80,250,123,0.18)"}`,
                borderRadius: 12
              }}>
                {/* Decision label */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: isFake ? "var(--fake)" : "var(--real)",
                    boxShadow: `0 0 8px ${isFake ? "#ff5555" : "#50fa7b"}`
                  }} />
                  <span style={{ fontSize: 20, fontWeight: 800, color: isFake ? "var(--fake)" : "var(--real)", letterSpacing: "0.05em" }}>
                    {result.label}
                  </span>
                </div>

                {/* Confidence bar */}
                <ConfidenceBar value={result.confidence} label={result.label} />

                {/* Plain language note */}
                <div style={{ marginTop: 12, fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
                  {result.explanation.confidence_note}
                </div>
              </div>
            )}
          </div>

          {/* Right panel — results */}
          {result && (
            <div className="fade-up">
              <div className="tab-bar" style={{ marginBottom: 16 }}>
                {[
                  { key: "gradcam", label: "GradCAM" },
                  { key: "details", label: "Analysis" },
                  { key: "memory",  label: `Memory (${result.explanation.memory_context?.matched_cases ?? 0})` },
                ].map(t => (
                  <button key={t.key} className={`tab-btn ${tab === t.key ? "active" : ""}`}
                    onClick={() => setTab(t.key)}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* GradCAM tab */}
              {tab === "gradcam" && (
                <div>
                  <img
                    src={`${API}/${result.paths.gradcam_overlay}`}
                    alt="GradCAM overlay"
                    style={{ width: "100%", borderRadius: 12, border: "1px solid var(--border)", display: "block" }}
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                  <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 10, lineHeight: 1.6 }}>
                    Heatmap shows which regions influenced the model's decision most.{" "}
                    <span style={{ color: "#ff5555" }}>Red/warm</span> areas had the highest influence.{" "}
                    <span style={{ color: "#4fc3f7" }}>Cool</span> areas were largely ignored.
                  </p>
                  <div className="divider" />
                  <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                    Top Activated Regions
                  </div>
                  {result.regions.slice(0, 3).map((r, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "8px 0", borderBottom: "1px solid var(--border)"
                    }}>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{r.zone}</span>
                        <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 8 }}>{r.area_pct}% of image</span>
                      </div>
                      <div className="mono" style={{ fontSize: 12, color: "var(--fake)" }}>
                        {Math.round(r.activation * 100)}%
                      </div>
                    </div>
                  ))}
                  {result.regions.length === 0 && (
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                      No dominant activation regions detected — signal is globally distributed.
                    </div>
                  )}
                </div>
              )}

              {/* Analysis tab */}
              {tab === "details" && (
                <div>
                  <div style={{
                    padding: "14px", borderRadius: 10, marginBottom: 16,
                    background: isFake ? "rgba(255,85,85,0.06)" : "rgba(80,250,123,0.05)",
                    border: `1px solid ${isFake ? "rgba(255,85,85,0.2)" : "rgba(80,250,123,0.18)"}`,
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.6 }}>
                      {result.explanation.verdict_summary}
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.7, marginBottom: 16 }}>
                    {result.explanation.technical_summary}
                  </div>

                  {result.explanation.region_details.length > 0 && (
                    <>
                      <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase",
                        letterSpacing: "0.1em", marginBottom: 10 }}>
                        Artifact Regions Detected
                      </div>
                      {result.explanation.region_details.map((r, i) => (
                        <RegionBadge key={i} region={r} />
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* Memory tab */}
              {tab === "memory" && (
                <div>
                  {result.explanation.memory_context ? (
                    <>
                      <div style={{
                        padding: "14px", borderRadius: 10, marginBottom: 16,
                        background: "rgba(189,147,249,0.06)",
                        border: "1px solid rgba(189,147,249,0.18)"
                      }}>
                        <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                          {result.explanation.memory_context.summary}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {result.explanation.memory_context.cases.map((c, i) => (
                          <MemoryCard key={i} caseData={c} />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                      <div style={{ fontSize: 28, marginBottom: 10 }}>🧠</div>
                      No previous analyses in memory yet.
                      <br />
                      <span style={{ fontSize: 12, color: "var(--muted2)" }}>Memory builds after each inference.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
