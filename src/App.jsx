import { useState, useEffect, useRef } from "react";

const AT_KEY = process.env.REACT_APP_AIRTABLE_KEY;
const AT_BASE = process.env.REACT_APP_AIRTABLE_BASE;
const TBL_RETAIL = "tblKBJOQMOoskSVdx";
const TBL_PRODUCTS = "tblQkdtqAA9kC0n1w";
const TBL_SLOTS = "tblpLTlKSizL7y3W6";

async function fetchAll(tableId, filterFormula = "") {
  let records = [];
  let offset = null;
  do {
    let url = `https://api.airtable.com/v0/${AT_BASE}/${tableId}?pageSize=100`;
    if (filterFormula) url += `&filterByFormula=${encodeURIComponent(filterFormula)}`;
    if (offset) url += `&offset=${offset}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${AT_KEY}` } });
    const data = await res.json();
    records = records.concat((data.records || []).map(r => ({ id: r.id, ...r.fields })));
    offset = data.offset || null;
  } while (offset);
  return records;
}

// ── LEAFLET MAP ───────────────────────────────────────────────────────────────
function LeafletMap({ salons, onSalonClick, focusSalon, mini }) {
  const uid = useRef(`map-${Math.random().toString(36).slice(2)}`);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (mapInstance.current) return;
    const L = window.L;
    if (!L) return;
    const center = focusSalon
      ? [parseFloat(focusSalon.latitude), parseFloat(focusSalon.longitude)]
      : [48.8566, 2.3522];
    const map = L.map(uid.current, { zoomControl: !mini, scrollWheelZoom: !mini }).setView(center, focusSalon ? 15 : 13);
    mapInstance.current = map;
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: "© OpenStreetMap © CARTO", maxZoom: 19,
    }).addTo(map);
    const icon = (hl) => L.divIcon({
      className: "",
      html: `<div style="width:${hl?36:28}px;height:${hl?36:28}px;border-radius:50%;background:${hl?"#b85c5c":"#0d0d0d"};border:3px solid #fff;box-shadow:0 3px 12px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;cursor:pointer"><div style="width:6px;height:6px;border-radius:50%;background:#fff"></div></div>`,
      iconSize: [hl?36:28,hl?36:28], iconAnchor: [hl?18:14,hl?18:14],
    });
    (focusSalon ? [focusSalon] : salons).forEach(s => {
      const lat = parseFloat(s.latitude), lng = parseFloat(s.longitude);
      if (!lat || !lng) return;
      const isHL = focusSalon?.id === s.id;
      const m = L.marker([lat, lng], { icon: icon(isHL) }).addTo(map);
      if (!mini) {
        m.bindTooltip(`<div style="font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;color:#1a1a1a">${s.name}</div>`, { direction:"top", offset:[0,-10] });
        m.on("click", () => onSalonClick?.(s));
      }
    });
    return () => { map.remove(); mapInstance.current = null; };
  }, []);

  return <div id={uid.current} style={{ width:"100%", height: mini ? 200 : "100%", zIndex:1 }} />;
}

// ── PRODUCT BADGE (card overlay) ──────────────────────────────────────────────
function ProductBadge({ product }) {
  const isNew = product._badge === "new";
  const color = isNew ? "#c9a96e" : "#b85c5c";
  const [hov, setHov] = useState(false);
  const img = Array.isArray(product.Image) ? product.Image[0]?.url : null;
  return (
    <div style={{ position:"relative" }} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {hov && (
        <div style={{ position:"absolute", bottom:62, right:0, background:"#1a1a1a", color:"#f5f0eb", fontFamily:"'DM Sans',sans-serif", fontSize:"10px", padding:"5px 10px", whiteSpace:"nowrap", pointerEvents:"none", zIndex:20 }}>
          {product.brand}
        </div>
      )}
      <div style={{ width:54, height:54, borderRadius:"50%", overflow:"hidden", border:`3px solid ${color}`, boxShadow:"0 4px 16px rgba(0,0,0,0.2)", transform:hov?"scale(1.1)":"scale(1)", transition:"transform 0.2s", position:"relative" }}>
        {img
          ? <img src={img} alt={product.product_name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          : <div style={{ width:"100%", height:"100%", background:"#f0ebe5", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px" }}>✨</div>
        }
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.38)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:1 }}>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"7px", color, letterSpacing:"1px", textTransform:"uppercase", fontWeight:800, lineHeight:1 }}>{isNew?"New":"Top"}</span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"7px", color:"#fff", textTransform:"uppercase", lineHeight:1 }}>{isNew?"in":"pick"}</span>
        </div>
      </div>
    </div>
  );
}

// ── PRODUCT CARD (modal) ──────────────────────────────────────────────────────
function ProductCard({ product }) {
  const isNew = product._badge === "new";
  const color = isNew ? "#c9a96e" : "#b85c5c";
  const border = isNew ? "#e8d9b8" : "#f0d0d0";
  const bg = isNew ? "#fdf8ee" : "#fdf0f0";
  const img = Array.isArray(product.Image) ? product.Image[0]?.url : null;
  return (
    <div style={{ background:"#fff", border:`1px solid ${border}`, overflow:"hidden", flex:1, minWidth:0 }}>
      <div style={{ position:"relative", paddingBottom:"72%", overflow:"hidden" }}>
        {img
          ? <img src={img} alt={product.product_name} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
          : <div style={{ position:"absolute", inset:0, background:"#f5f0eb", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"36px" }}>✨</div>
        }
        <div style={{ position:"absolute", top:8, left:8, background:color, color:"#fff", fontFamily:"'DM Sans',sans-serif", fontSize:"8px", fontWeight:800, letterSpacing:"1.5px", textTransform:"uppercase", padding:"3px 9px" }}>
          {isNew ? "New In" : "Popular"}
        </div>
      </div>
      <div style={{ padding:"12px 14px 14px" }}>
        <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"9px", color, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", margin:"0 0 3px" }}>{product.brand}</p>
        <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"12px", color:"#2a2a2a", margin:"0 0 5px", lineHeight:1.4 }}>{product.product_name}</p>
        {product.description && <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"11px", color:"#999", margin:0, lineHeight:1.5 }}>{product.description}</p>}
        {product.category && (
          <span style={{ display:"inline-block", marginTop:8, fontFamily:"'DM Sans',sans-serif", fontSize:"9px", color, background:bg, padding:"2px 8px", borderRadius:"20px" }}>{product.category}</span>
        )}
      </div>
    </div>
  );
}

// ── SALON MODAL ───────────────────────────────────────────────────────────────
function SalonModal({ salon, onClose, leafletReady }) {
  if (!salon) return null;
  const prods = salon._products || [];
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:1500, background:"rgba(8,6,4,0.8)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20, overflowY:"auto" }}>
      <div onClick={e => e.stopPropagation()} style={{ background:"#faf7f4", maxWidth:680, width:"100%", maxHeight:"92vh", overflow:"auto", boxShadow:"0 48px 120px rgba(0,0,0,0.35)" }}>

        {/* Hero */}
        <div style={{ position:"relative", paddingBottom:"38%", overflow:"hidden", background:"#1a1a1a", minHeight:160 }}>
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg,#1a1a1a 0%,#2d2420 100%)" }} />
          <div style={{ position:"absolute", top:-60, right:-60, width:280, height:280, borderRadius:"50%", border:"1px solid rgba(201,169,110,0.15)" }} />
          <button onClick={onClose} style={{ position:"absolute", top:16, right:16, background:"rgba(255,255,255,0.12)", color:"#fff", border:"none", width:34, height:34, borderRadius:"50%", cursor:"pointer", fontSize:"18px", display:"flex", alignItems:"center", justifyContent:"center", zIndex:10 }}>×</button>
          <div style={{ position:"absolute", bottom:22, left:26 }}>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"10px", color:"#c9a96e", letterSpacing:"2.5px", textTransform:"uppercase", margin:"0 0 6px" }}>{salon.category} · Paris</p>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"32px", fontWeight:600, color:"#fff", margin:0 }}>{salon.name}</h2>
          </div>
        </div>

        <div style={{ padding:"24px 28px 32px" }}>
          {/* 살롱 정보 */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:24 }}>
            {[
              { icon:"📍", label:"Address", value: salon.address },
              { icon:"🗂", label:"Category", value: salon.category || "—" },
            ].map(item => (
              <div key={item.label} style={{ background:"#fff", border:"1px solid #ede8e2", padding:"12px 14px" }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"9px", color:"#c0bbb5", letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:3 }}>{item.label}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"12px", color:"#444" }}>{item.icon} {item.value}</div>
              </div>
            ))}
          </div>

          {/* K-Beauty 제품 */}
          {prods.length > 0 && (
            <div style={{ marginBottom:26 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                <div style={{ height:1, flex:1, background:"#ede8e2" }} />
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"9px", color:"#b85c5c", letterSpacing:"2.5px", textTransform:"uppercase", fontWeight:700, margin:0, whiteSpace:"nowrap" }}>K-Beauty available here</p>
                <div style={{ height:1, flex:1, background:"#ede8e2" }} />
              </div>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"12px", color:"#aaa", margin:"0 0 14px", lineHeight:1.6 }}>
                These K-beauty products are available at {salon.name} — ask during your visit to discover them.
              </p>
              <div style={{ display:"flex", gap:12 }}>
                {prods.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          )}

          {/* 예약 버튼 */}
          {salon.bookingUrl && (
            <div style={{ borderTop:"1px solid #ede8e2", paddingTop:20, marginBottom:20 }}>
              <a href={salon.bookingUrl} target="_blank" rel="noopener noreferrer"
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, background:"#1a1a1a", color:"#f5f0eb", textDecoration:"none", padding:"16px 28px", fontFamily:"'DM Sans',sans-serif", fontSize:"12px", fontWeight:600, letterSpacing:"2px", textTransform:"uppercase", width:"100%", transition:"background 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background="#b85c5c"}
                onMouseLeave={e => e.currentTarget.style.background="#1a1a1a"}
              >
                <span>Book at {salon.name}</span>
                {salon.bookingPlatform && <span style={{ fontSize:"10px", color:"#888", fontWeight:400 }}>via {salon.bookingPlatform}</span>}
                <span style={{ marginLeft:"auto" }}>→</span>
              </a>
            </div>
          )}

          {/* 미니 지도 */}
          {leafletReady && salon.latitude && salon.longitude && (
            <div style={{ overflow:"hidden", border:"1px solid #ede8e2" }}>
              <div style={{ background:"#fff", padding:"10px 14px", borderBottom:"1px solid #ede8e2", display:"flex", alignItems:"center", gap:6 }}>
                <span>📍</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"11px", color:"#888" }}>{salon.address}</span>
              </div>
              <LeafletMap salons={[salon]} focusSalon={salon} mini={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── SALON CARD ────────────────────────────────────────────────────────────────
function SalonCard({ salon, onClick }) {
  const [hov, setHov] = useState(false);
  const prods = salon._products || [];
  return (
    <div onClick={() => onClick(salon)}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ cursor:"pointer", background:"#fff", overflow:"visible", transition:"transform 0.28s, box-shadow 0.28s", transform:hov?"translateY(-5px)":"none", boxShadow:hov?"0 20px 60px rgba(0,0,0,0.12)":"0 2px 18px rgba(0,0,0,0.06)" }}>
      <div style={{ position:"relative", paddingBottom:"56%", overflow:"hidden", background:"#1a1a1a" }}>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg,#2a2a2a,#1a1a1a)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"48px", color:"rgba(201,169,110,0.2)", fontWeight:300 }}>{salon.name?.[0]}</span>
        </div>
        <div style={{ position:"absolute", top:12, left:12, background:"rgba(0,0,0,0.6)", color:"#f5f0eb", fontSize:"10px", fontFamily:"'DM Sans',sans-serif", fontWeight:600, letterSpacing:"1.5px", textTransform:"uppercase", padding:"4px 10px" }}>
          {salon.category}
        </div>
        <div style={{ position:"absolute", bottom:12, left:12, fontSize:"11px", fontFamily:"'DM Sans',sans-serif", color:"#fff", background:"rgba(0,0,0,0.4)", padding:"3px 10px", borderRadius:"20px" }}>
          📍 {salon.area || "Paris"}
        </div>
        {prods.length > 0 && (
          <div style={{ position:"absolute", bottom:-20, right:12, display:"flex", gap:6 }} onClick={e => e.stopPropagation()}>
            {prods.map(p => <ProductBadge key={p.id} product={p} />)}
          </div>
        )}
      </div>
      <div style={{ padding:"28px 18px 16px" }}>
        <h3 style={{ margin:"0 0 6px", fontFamily:"'Cormorant Garamond',serif", fontSize:"20px", fontWeight:600, color:"#1a1a1a" }}>{salon.name}</h3>
        <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"12px", color:"#aaa", lineHeight:1.5, margin:"0 0 12px" }}>{salon.address}</p>
        {prods.length > 0 && (
          <div style={{ display:"flex", gap:6, borderTop:"1px solid #f0ebe5", paddingTop:11, flexWrap:"wrap" }}>
            {prods.map((p, i) => {
              const isNew = p._badge === "new";
              return (
                <div key={p.id} style={{ display:"flex", alignItems:"center", gap:5, background:isNew?"#fdf8ee":"#fdf0f0", padding:"3px 10px", borderRadius:"20px", border:`1px solid ${isNew?"#e8d9b8":"#f0d0d0"}` }}>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"9px", color:isNew?"#a07832":"#b85c5c", fontWeight:700, letterSpacing:"1px", textTransform:"uppercase" }}>{isNew?"New In":"Popular"}</span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"10px", color:"#666" }}>{p.brand}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
const CATEGORIES = ["All", "Nail", "Beauty", "Hair", "Spa"];

export default function App() {
  const [salons, setSalons] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [activeCat, setActiveCat] = useState("All");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("list");
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (window.L) { setLeafletReady(true); return; }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLeafletReady(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [retailRecords, productRecords, slotRecords] = await Promise.all([
          fetchAll(TBL_RETAIL, "{current_status}='YES'"),
          fetchAll(TBL_PRODUCTS, ""),
          fetchAll(TBL_SLOTS, "{stage}='ACTIVE'"),
        ]);

        // 제품 id → 제품 객체
        const productById = {};
        productRecords.forEach(p => { productById[p.id] = p; });

        // 살롱 이름 → active 제품 목록 (최대 2개)
        const salonProds = {};
        slotRecords.forEach(slot => {
          const salonName = Array.isArray(slot.retail_name) ? slot.retail_name[0] : slot.retail_name;
          if (!salonName) return;
          if (!salonProds[salonName]) salonProds[salonName] = [];
          if (salonProds[salonName].length >= 2) return;

          // linked record 방식
          const linkedIds = Array.isArray(slot.product) ? slot.product : [];
          for (const pid of linkedIds) {
            if (productById[pid] && salonProds[salonName].length < 2) {
              const prod = { ...productById[pid] };
              prod._badge = salonProds[salonName].length === 0 ? "new" : "popular";
              salonProds[salonName].push(prod);
            }
          }
          // 텍스트 lookup 방식 (linked가 없을 때)
          if (linkedIds.length === 0) {
            const name = Array.isArray(slot.product) ? slot.product[0] : slot.product;
            const match = productRecords.find(p => p.product_name === name);
            if (match && salonProds[salonName].length < 2) {
              const prod = { ...match };
              prod._badge = salonProds[salonName].length === 0 ? "new" : "popular";
              salonProds[salonName].push(prod);
            }
          }
        });

        const enriched = retailRecords.map(s => ({
          ...s,
          _products: salonProds[s.name] || [],
        }));

        setSalons(enriched);
        setFiltered(enriched);
      } catch(e) {
        console.error(e);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    let r = salons;
    if (activeCat !== "All") r = r.filter(s => (s.category || "").toLowerCase() === activeCat.toLowerCase());
    if (search) r = r.filter(s =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.address?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(r);
  }, [activeCat, search, salons]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{background:#faf7f4}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-thumb{background:#c9a96e;border-radius:3px}
        .leaflet-tooltip{background:#fff;border:1px solid #ede8e2;box-shadow:0 4px 16px rgba(0,0,0,0.1);border-radius:0;padding:6px 10px}
      `}</style>

      {/* NAV */}
      <nav style={{ background:"#0d0d0d", height:60, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 40px", position:"sticky", top:0, zIndex:500 }}>
        <div>
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"17px", color:"#f5f0eb", letterSpacing:"3px", fontWeight:300 }}>THE</span>
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"17px", color:"#c9a96e", letterSpacing:"3px", fontWeight:600, marginLeft:7 }}>BEAUTY PAUSE</span>
        </div>
        <div style={{ display:"flex", gap:28 }}>
          {["Salons","K-Beauty","About"].map(l => (
            <a key={l} href="#" style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"11px", color:"#777", textDecoration:"none", letterSpacing:"1.5px", textTransform:"uppercase", transition:"color 0.2s" }}
              onMouseEnter={e=>e.target.style.color="#f5f0eb"} onMouseLeave={e=>e.target.style.color="#777"}>{l}</a>
          ))}
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background:"#0d0d0d", padding:"64px 40px 72px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-100, right:-60, width:420, height:420, borderRadius:"50%", border:"1px solid rgba(201,169,110,0.12)" }} />
        <div style={{ maxWidth:580, animation:"fadeUp 0.8s ease both" }}>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"10px", color:"#c9a96e", letterSpacing:"4px", textTransform:"uppercase", marginBottom:16 }}>K-Beauty · Curated Salons · Paris</p>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(40px,5vw,62px)", fontWeight:300, color:"#f5f0eb", lineHeight:1.08, marginBottom:18 }}>
            Where Korean beauty<br/><em style={{ fontStyle:"italic", color:"#c9a96e" }}>meets your salon</em>
          </h1>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"14px", color:"#777", lineHeight:1.8, marginBottom:30, maxWidth:400 }}>
            We place carefully selected K-beauty products in handpicked Paris salons — discover them during your next visit.
          </p>
          <div style={{ display:"flex", maxWidth:460 }}>
            <input placeholder="Search salon or address…" value={search} onChange={e=>setSearch(e.target.value)}
              style={{ flex:1, padding:"14px 18px", fontFamily:"'DM Sans',sans-serif", fontSize:"13px", border:"none", background:"#1a1a1a", color:"#f5f0eb", outline:"none", caretColor:"#c9a96e" }} />
            <div style={{ padding:"14px 20px", background:"#c9a96e", display:"flex", alignItems:"center" }}>→</div>
          </div>
        </div>
      </section>

      {/* FILTER + VIEW TOGGLE */}
      <div style={{ background:"#fff", borderBottom:"1px solid #ede8e2", padding:"0 40px", display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:60, zIndex:400 }}>
        <div style={{ display:"flex" }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCat(cat)}
              style={{ padding:"14px 18px", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:"11px", fontWeight:activeCat===cat?600:400, color:activeCat===cat?"#b85c5c":"#999", background:"transparent", borderBottom:activeCat===cat?"2px solid #b85c5c":"2px solid transparent", letterSpacing:"0.5px", transition:"all 0.2s", whiteSpace:"nowrap" }}>
              {cat}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", border:"1px solid #ede8e2" }}>
          {[{id:"list",label:"☰ List"},{id:"map",label:"◎ Map"}].map(v => (
            <button key={v.id} onClick={() => setView(v.id)}
              style={{ padding:"8px 16px", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:"11px", fontWeight:view===v.id?600:400, color:view===v.id?"#fff":"#999", background:view===v.id?"#1a1a1a":"transparent", transition:"all 0.2s" }}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      {view === "list" ? (
        <main style={{ maxWidth:1200, margin:"0 auto", padding:"50px 40px 90px" }}>
          {loading ? (
            <div style={{ textAlign:"center", padding:"80px 0" }}>
              <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"24px", color:"#ccc", marginBottom:8 }}>Loading salons…</p>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"12px", color:"#ddd" }}>Fetching from Airtable</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom:34 }}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"24px", fontWeight:400, color:"#1a1a1a" }}>
                  {activeCat === "All" ? "All Salons" : activeCat}
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"12px", color:"#ccc", marginLeft:10, fontWeight:400 }}>{filtered.length} salons</span>
                </h2>
              </div>
              {filtered.length === 0 ? (
                <div style={{ textAlign:"center", padding:"80px 0", fontFamily:"'Cormorant Garamond',serif", fontSize:"22px", color:"#ccc" }}>No salons found</div>
              ) : (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))", gap:"40px 28px" }}>
                  {filtered.map((salon, i) => (
                    <div key={salon.id} style={{ animation:`fadeUp 0.45s ease ${i*0.06}s both` }}>
                      <SalonCard salon={salon} onClick={setSelectedSalon} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      ) : (
        leafletReady
          ? <div style={{ height:"calc(100vh - 120px)" }}><LeafletMap salons={filtered} onSalonClick={setSelectedSalon} mini={false} /></div>
          : <div style={{ textAlign:"center", padding:"80px 0", fontFamily:"'DM Sans',sans-serif", color:"#aaa" }}>Loading map…</div>
      )}

      {/* FOOTER */}
      <footer style={{ background:"#0d0d0d", padding:"36px 40px", textAlign:"center" }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"15px", color:"#f5f0eb", letterSpacing:"4px", marginBottom:8 }}>THE BEAUTY PAUSE</div>
        <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"11px", color:"#555" }}>Curating K-Beauty across Paris · @thebeautypause</p>
      </footer>

      {selectedSalon && <SalonModal salon={selectedSalon} onClose={() => setSelectedSalon(null)} leafletReady={leafletReady} />}
    </>
  );
}
