import { useState, useEffect, useRef } from "react";

const AT_KEY = process.env.REACT_APP_AIRTABLE_KEY;
const AT_BASE = process.env.REACT_APP_AIRTABLE_BASE;
const TBL_RETAIL = "tblKBJOQMOoskSVdx";
const TBL_PRODUCTS = "tblQkdtqAA9kC0n1w";
const TBL_SLOTS = "tblpLTlKSizL7y3W6";

// ── i18n ─────────────────────────────────────────────────────────────────────
const T = {
  en: {
    tagline: "K-Beauty · Curated Salons · Paris",
    hero_title_1: "Where Korean beauty",
    hero_title_2: "meets your salon",
    hero_sub: "We place carefully selected K-beauty products in handpicked Paris salons — discover them during your next visit.",
    search_placeholder: "Search salon or address…",
    all: "All",
    list: "List",
    map: "Map",
    all_salons: "All Salons",
    salons: "salons",
    no_salons: "No salons found",
    loading: "Loading salons…",
    loading_sub: "Fetching from Airtable",
    address: "Address",
    contact: "Contact",
    tier: "Tier",
    bio: "About",
    services: "Services",
    kbeauty: "K-Beauty available here",
    kbeauty_sub: "These K-beauty products are available at this salon — ask during your visit to discover them.",
    book: "Book an appointment",
    via: "via",
    footer: "Curating K-Beauty across Paris · @thebeautypause",
    new_in: "New In",
    popular: "Popular",
    new: "New",
    top: "Top",
    pick: "pick",
  },
  fr: {
    tagline: "K-Beauty · Salons Sélectionnés · Paris",
    hero_title_1: "Là où la beauté coréenne",
    hero_title_2: "rencontre votre salon",
    hero_sub: "Nous plaçons des produits K-beauty soigneusement sélectionnés dans des salons parisiens — découvrez-les lors de votre prochaine visite.",
    search_placeholder: "Rechercher un salon ou une adresse…",
    all: "Tous",
    list: "Liste",
    map: "Carte",
    all_salons: "Tous les salons",
    salons: "salons",
    no_salons: "Aucun salon trouvé",
    loading: "Chargement des salons…",
    loading_sub: "Récupération depuis Airtable",
    address: "Adresse",
    contact: "Contact",
    tier: "Niveau",
    bio: "À propos",
    services: "Services",
    kbeauty: "K-Beauty disponible ici",
    kbeauty_sub: "Ces produits K-beauty sont disponibles dans ce salon — demandez à votre styliste de les découvrir.",
    book: "Prendre rendez-vous",
    via: "via",
    footer: "Curation K-Beauty à Paris · @thebeautypause",
    new_in: "Nouveau",
    popular: "Populaire",
    new: "New",
    top: "Top",
    pick: "choix",
  },
};

async function fetchAll(tableId, filterFormula = "") {
  let records = [], offset = null;
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

const TIER_CONFIG = {
  Gold:   { label: "✦ Gold",   bg: "#fdf8ee", color: "#a07832", border: "#e8d9b8" },
  Silver: { label: "↑ Silver", bg: "#f5f5f5", color: "#666",    border: "#ddd" },
  Bronze: { label: "◎ Bronze", bg: "#fdf0e8", color: "#a05a32", border: "#e8d0b8" },
};

// ── LEAFLET MAP ───────────────────────────────────────────────────────────────
function LeafletMap({ salons, onSalonClick, focusSalon, mini }) {
  const uid = useRef(`map-${Math.random().toString(36).slice(2)}`);
  const mapInstance = useRef(null);
  useEffect(() => {
    if (mapInstance.current) return;
    const L = window.L; if (!L) return;
    const center = focusSalon ? [parseFloat(focusSalon.latitude), parseFloat(focusSalon.longitude)] : [48.8566, 2.3522];
    const map = L.map(uid.current, { zoomControl: !mini, scrollWheelZoom: !mini }).setView(center, focusSalon ? 15 : 13);
    mapInstance.current = map;
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { attribution: "© OpenStreetMap © CARTO", maxZoom: 19 }).addTo(map);
    const icon = (hl) => L.divIcon({ className: "", html: `<div style="width:${hl?36:28}px;height:${hl?36:28}px;border-radius:50%;background:${hl?"#b85c5c":"#0d0d0d"};border:3px solid #fff;box-shadow:0 3px 12px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;cursor:pointer"><div style="width:6px;height:6px;border-radius:50%;background:#fff"></div></div>`, iconSize:[hl?36:28,hl?36:28], iconAnchor:[hl?18:14,hl?18:14] });
    (focusSalon ? [focusSalon] : salons).forEach(s => {
      const lat = parseFloat(s.latitude), lng = parseFloat(s.longitude);
      if (!lat || !lng) return;
      const m = L.marker([lat, lng], { icon: icon(focusSalon?.id === s.id) }).addTo(map);
      if (!mini) { m.bindTooltip(`<div style="font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600">${s.name}</div>`, { direction:"top", offset:[0,-10] }); m.on("click", () => onSalonClick?.(s)); }
    });
    return () => { map.remove(); mapInstance.current = null; };
  }, []);
  return <div id={uid.current} style={{ width:"100%", height: mini ? 200 : "100%", zIndex:1 }} />;
}

// ── PRODUCT BADGE ─────────────────────────────────────────────────────────────
function ProductBadge({ product, lang }) {
  const t = T[lang];
  const isNew = product._badge === "new";
  const color = isNew ? "#c9a96e" : "#b85c5c";
  const [hov, setHov] = useState(false);
  const img = Array.isArray(product.Image) ? product.Image[0]?.url : null;
  return (
    <div style={{ position:"relative" }} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {hov && <div style={{ position:"absolute", bottom:62, right:0, background:"#1a1a1a", color:"#f5f0eb", fontFamily:"'DM Sans',sans-serif", fontSize:"10px", padding:"5px 10px", whiteSpace:"nowrap", pointerEvents:"none", zIndex:20 }}>{product.brand}</div>}
      <div style={{ width:54, height:54, borderRadius:"50%", overflow:"hidden", border:`3px solid ${color}`, boxShadow:"0 4px 16px rgba(0,0,0,0.2)", transform:hov?"scale(1.1)":"scale(1)", transition:"transform 0.2s", position:"relative" }}>
        {img ? <img src={img} alt={product.product_name} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <div style={{ width:"100%", height:"100%", background:"#f0ebe5", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px" }}>✨</div>}
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.38)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:1 }}>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"7px", color, letterSpacing:"1px", textTransform:"uppercase", fontWeight:800, lineHeight:1 }}>{isNew ? t.new : t.top}</span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"7px", color:"#fff", textTransform:"uppercase", lineHeight:1 }}>{isNew ? "in" : t.pick}</span>
        </div>
      </div>
    </div>
  );
}

// ── SALON MODAL ───────────────────────────────────────────────────────────────
function SalonModal({ salon, onClose, leafletReady, lang }) {
  const t = T[lang];
  if (!salon) return null;
  const prods = salon._products || [];
  const tier = TIER_CONFIG[salon.salon_tier];
  const services = salon.main_services ? salon.main_services.split(",").map(s => s.trim()).filter(Boolean) : [];
  const contactUrl = salon.instagram || salon.google_maps_url;
  const contactLabel = salon.instagram ? salon.instagram : "Google Maps →";

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

        <div style={{ padding:"22px 26px 32px" }}>

          {/* ① Info grid: address, contact, tier, bio */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
            <div style={{ background:"#fff", border:"1px solid #ede8e2", padding:"11px 14px" }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"9px", color:"#c0bbb5", letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:3 }}>{t.address}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"12px", color:"#444" }}>📍 {salon.address}</div>
            </div>
            <div style={{ background:"#fff", border:"1px solid #ede8e2", padding:"11px 14px" }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"9px", color:"#c0bbb5", letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:3 }}>{t.contact}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"12px", color:"#444" }}>
                {contactUrl
                  ? <a href={contactUrl.startsWith("http") ? contactUrl : `https://instagram.com/${contactUrl.replace("@","")}`} target="_blank" rel="noopener noreferrer" style={{ color:"#b85c5c", textDecoration:"none" }}>📸 {contactLabel}</a>
                  : "—"
                }
              </div>
            </div>
            {tier && (
              <div style={{ background:"#fff", border:"1px solid #ede8e2", padding:"11px 14px" }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"9px", color:"#c0bbb5", letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:5 }}>{t.tier}</div>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"11px", fontWeight:700, color:tier.color, background:tier.bg, border:`1px solid ${tier.border}`, padding:"3px 10px", borderRadius:"20px" }}>{tier.label}</span>
              </div>
            )}
            {salon.salon_bio && (
              <div style={{ background:"#fff", border:"1px solid #ede8e2", padding:"11px 14px", gridColumn: tier ? "auto" : "1 / -1" }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"9px", color:"#c0bbb5", letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:3 }}>{t.bio}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"12px", color:"#555", lineHeight:1.5 }}>✦ {salon.salon_bio}</div>
              </div>
            )}
          </div>

          {/* ② Services tags */}
          {services.length > 0 && (
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:22 }}>
              {services.map(s => (
                <span key={s} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"11px", color:"#555", background:"#fff", border:"1px solid #ede8e2", padding:"4px 12px", borderRadius:"20px" }}>{s}</span>
              ))}
            </div>
          )}

          {/* ③ K-Beauty products — horizontal scroll */}
          {prods.length > 0 && (
            <div style={{ marginBottom:24 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <div style={{ height:1, flex:1, background:"#ede8e2" }} />
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"9px", color:"#b85c5c", letterSpacing:"2.5px", textTransform:"uppercase", fontWeight:700, margin:0, whiteSpace:"nowrap" }}>{t.kbeauty}</p>
                <div style={{ height:1, flex:1, background:"#ede8e2" }} />
              </div>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"12px", color:"#aaa", margin:"0 0 14px", lineHeight:1.6 }}>{t.kbeauty_sub}</p>
              {/* horizontal scroll container */}
              <div style={{ display:"flex", gap:12, overflowX:"auto", paddingBottom:8, scrollSnapType:"x mandatory" }}
                onWheel={e => { e.currentTarget.scrollLeft += e.deltaY; }}>
                {prods.map(p => {
                  const isNew = p._badge === "new";
                  const color = isNew ? "#c9a96e" : "#b85c5c";
                  const border = isNew ? "#e8d9b8" : "#f0d0d0";
                  const bg = isNew ? "#fdf8ee" : "#fdf0f0";
                  const img = Array.isArray(p.Image) ? p.Image[0]?.url : null;
                  return (
                    <div key={p.id} style={{ background:"#fff", border:`1px solid ${border}`, overflow:"hidden", flexShrink:0, width:190, scrollSnapAlign:"start" }}>
                      <div style={{ position:"relative", paddingBottom:"80%", overflow:"hidden" }}>
                        {img ? <img src={img} alt={p.product_name} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
                          : <div style={{ position:"absolute", inset:0, background:"#f5f0eb", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"36px" }}>✨</div>}
                        <div style={{ position:"absolute", top:8, left:8, background:color, color:"#fff", fontFamily:"'DM Sans',sans-serif", fontSize:"8px", fontWeight:800, letterSpacing:"1.5px", textTransform:"uppercase", padding:"3px 9px" }}>
                          {isNew ? t.new_in : t.popular}
                        </div>
                      </div>
                      <div style={{ padding:"11px 13px 14px" }}>
                        <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"9px", color, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", margin:"0 0 3px" }}>{p.brand}</p>
                        <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"12px", color:"#2a2a2a", margin:"0 0 5px", lineHeight:1.4 }}>{p.product_name}</p>
                        {p.description && <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"11px", color:"#999", margin:0, lineHeight:1.5 }}>{p.description}</p>}
                        {p.category && <span style={{ display:"inline-block", marginTop:7, fontFamily:"'DM Sans',sans-serif", fontSize:"9px", color, background:bg, padding:"2px 8px", borderRadius:"20px" }}>{p.category}</span>}
                      </div>
                    </div>
                  );
                })}
                {/* scroll hint if more than 2 */}
                {prods.length > 2 && (
                  <div style={{ flexShrink:0, width:40, display:"flex", alignItems:"center", justifyContent:"center", color:"#ccc", fontSize:"20px" }}>→</div>
                )}
              </div>
            </div>
          )}

          {/* ④ Booking button */}
          {salon.bookingUrl && (
            <div style={{ borderTop:"1px solid #ede8e2", paddingTop:20, marginBottom:20 }}>
              <a href={salon.bookingUrl} target="_blank" rel="noopener noreferrer"
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, background:"#1a1a1a", color:"#f5f0eb", textDecoration:"none", padding:"16px 28px", fontFamily:"'DM Sans',sans-serif", fontSize:"12px", fontWeight:600, letterSpacing:"2px", textTransform:"uppercase", width:"100%", transition:"background 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background="#b85c5c"}
                onMouseLeave={e => e.currentTarget.style.background="#1a1a1a"}
              >
                <span>{t.book}</span>
                {salon.bookingPlatform && <span style={{ fontSize:"10px", color:"#888", fontWeight:400 }}>{t.via} {salon.bookingPlatform}</span>}
                <span style={{ marginLeft:"auto" }}>→</span>
              </a>
            </div>
          )}

          {/* ⑤ Mini map */}
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
function SalonCard({ salon, onClick, lang }) {
  const t = T[lang];
  const [hov, setHov] = useState(false);
  const prods = salon._products || [];
  const tier = TIER_CONFIG[salon.salon_tier];
  return (
    <div onClick={() => onClick(salon)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ cursor:"pointer", background:"#fff", overflow:"visible", transition:"transform 0.28s, box-shadow 0.28s", transform:hov?"translateY(-5px)":"none", boxShadow:hov?"0 20px 60px rgba(0,0,0,0.12)":"0 2px 18px rgba(0,0,0,0.06)" }}>
      <div style={{ position:"relative", paddingBottom:"56%", overflow:"hidden", background:"#1a1a1a" }}>
        {salon.salon_image
          ? <img src={salon.salon_image} alt={salon.name} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", transition:"transform 0.5s", transform:hov?"scale(1.04)":"scale(1)" }} />
          : <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg,#2a2a2a,#1a1a1a)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"48px", color:"rgba(201,169,110,0.2)", fontWeight:300 }}>{salon.name?.[0]}</span>
            </div>
        }
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 60%)" }} />
        {/* category */}
        <div style={{ position:"absolute", top:12, left:12, background:"rgba(0,0,0,0.6)", color:"#f5f0eb", fontSize:"10px", fontFamily:"'DM Sans',sans-serif", fontWeight:600, letterSpacing:"1.5px", textTransform:"uppercase", padding:"4px 10px" }}>{salon.category}</div>
        {/* tier badge */}
        {tier && <div style={{ position:"absolute", top:12, right:12, background:tier.bg, color:tier.color, border:`1px solid ${tier.border}`, fontFamily:"'DM Sans',sans-serif", fontSize:"9px", fontWeight:700, letterSpacing:"1px", padding:"3px 10px", borderRadius:"20px" }}>{tier.label}</div>}
        {/* area */}
        <div style={{ position:"absolute", bottom:12, left:12, fontSize:"11px", fontFamily:"'DM Sans',sans-serif", color:"#fff", background:"rgba(0,0,0,0.4)", padding:"3px 10px", borderRadius:"20px" }}>📍 {salon.area || "Paris"}</div>
        {/* product badges */}
        {prods.length > 0 && (
          <div style={{ position:"absolute", bottom:-20, right:12, display:"flex", gap:6 }} onClick={e => e.stopPropagation()}>
            {prods.slice(0,2).map(p => <ProductBadge key={p.id} product={p} lang={lang} />)}
          </div>
        )}
      </div>
      <div style={{ padding:"28px 18px 16px" }}>
        <h3 style={{ margin:"0 0 5px", fontFamily:"'Cormorant Garamond',serif", fontSize:"20px", fontWeight:600, color:"#1a1a1a" }}>{salon.name}</h3>
        <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"12px", color:"#aaa", margin:"0 0 6px" }}>{salon.address}</p>
        {salon.salon_bio && <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"12px", color:"#888", lineHeight:1.5, margin:"0 0 12px", fontStyle:"italic" }}>"{salon.salon_bio}"</p>}
        {prods.length > 0 && (
          <div style={{ display:"flex", gap:6, borderTop:"1px solid #f0ebe5", paddingTop:11, flexWrap:"wrap" }}>
            {prods.slice(0,2).map(p => {
              const isNew = p._badge === "new";
              return (
                <div key={p.id} style={{ display:"flex", alignItems:"center", gap:5, background:isNew?"#fdf8ee":"#fdf0f0", padding:"3px 10px", borderRadius:"20px", border:`1px solid ${isNew?"#e8d9b8":"#f0d0d0"}` }}>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"9px", color:isNew?"#a07832":"#b85c5c", fontWeight:700, letterSpacing:"1px", textTransform:"uppercase" }}>{isNew ? t.new_in : t.popular}</span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"10px", color:"#666" }}>{p.brand}</span>
                </div>
              );
            })}
            {prods.length > 2 && <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"10px", color:"#bbb", padding:"3px 6px" }}>+{prods.length - 2}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
const CATEGORIES = ["All", "Nail", "Beauty", "Hair", "Spa"];

export default function App() {
  const [lang, setLang] = useState("en");
  const t = T[lang];
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
    const link = document.createElement("link"); link.rel = "stylesheet"; link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(link);
    const script = document.createElement("script"); script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; script.onload = () => setLeafletReady(true); document.head.appendChild(script);
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
        const productById = {};
        productRecords.forEach(p => { productById[p.id] = p; });
        const salonProds = {};
        slotRecords.forEach((slot, idx) => {
          const salonName = Array.isArray(slot.retail_name) ? slot.retail_name[0] : slot.retail_name;
          if (!salonName) return;
          if (!salonProds[salonName]) salonProds[salonName] = [];
          const linkedIds = Array.isArray(slot.product) ? slot.product : [];
          for (const pid of linkedIds) {
            if (productById[pid]) {
              const prod = { ...productById[pid] };
              prod._badge = salonProds[salonName].length === 0 ? "new" : "popular";
              salonProds[salonName].push(prod);
            }
          }
          if (linkedIds.length === 0) {
            const name = Array.isArray(slot.product) ? slot.product[0] : slot.product;
            const match = productRecords.find(p => p.product_name === name);
            if (match) {
              const prod = { ...match };
              prod._badge = salonProds[salonName].length === 0 ? "new" : "popular";
              salonProds[salonName].push(prod);
            }
          }
        });
        const enriched = retailRecords.map(s => ({ ...s, _products: salonProds[s.name] || [] }));
        setSalons(enriched); setFiltered(enriched);
      } catch(e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    let r = salons;
    if (activeCat !== "All") r = r.filter(s => (s.category||"").toLowerCase() === activeCat.toLowerCase());
    if (search) r = r.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()) || s.address?.toLowerCase().includes(search.toLowerCase()));
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
        .leaflet-tooltip{background:#fff;border:1px solid #ede8e2;border-radius:0;padding:6px 10px}
        .prod-scroll::-webkit-scrollbar{height:3px}
        .prod-scroll::-webkit-scrollbar-thumb{background:#e8d9b8;border-radius:3px}
      `}</style>

      {/* NAV */}
      <nav style={{ background:"#0d0d0d", height:60, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 40px", position:"sticky", top:0, zIndex:500 }}>
        <div>
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"17px", color:"#f5f0eb", letterSpacing:"3px", fontWeight:300 }}>THE</span>
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"17px", color:"#c9a96e", letterSpacing:"3px", fontWeight:600, marginLeft:7 }}>BEAUTY PAUSE</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:28 }}>
          {["Salons","K-Beauty","About"].map(l => (
            <a key={l} href="#" style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"11px", color:"#777", textDecoration:"none", letterSpacing:"1.5px", textTransform:"uppercase", transition:"color 0.2s" }}
              onMouseEnter={e=>e.target.style.color="#f5f0eb"} onMouseLeave={e=>e.target.style.color="#777"}>{l}</a>
          ))}
          {/* Language toggle */}
          <div style={{ display:"flex", border:"1px solid #333", borderRadius:"2px", overflow:"hidden" }}>
            {["en","fr"].map(l => (
              <button key={l} onClick={() => setLang(l)}
                style={{ padding:"5px 12px", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:"11px", fontWeight:600, letterSpacing:"1px", color: lang===l?"#0d0d0d":"#777", background: lang===l?"#c9a96e":"transparent", transition:"all 0.2s", textTransform:"uppercase" }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background:"#0d0d0d", padding:"64px 40px 72px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-100, right:-60, width:420, height:420, borderRadius:"50%", border:"1px solid rgba(201,169,110,0.12)" }} />
        <div style={{ maxWidth:580, animation:"fadeUp 0.8s ease both" }}>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"10px", color:"#c9a96e", letterSpacing:"4px", textTransform:"uppercase", marginBottom:16 }}>{t.tagline}</p>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(40px,5vw,62px)", fontWeight:300, color:"#f5f0eb", lineHeight:1.08, marginBottom:18 }}>
            {t.hero_title_1}<br/><em style={{ fontStyle:"italic", color:"#c9a96e" }}>{t.hero_title_2}</em>
          </h1>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"14px", color:"#777", lineHeight:1.8, marginBottom:30, maxWidth:400 }}>{t.hero_sub}</p>
          <div style={{ display:"flex", maxWidth:460 }}>
            <input placeholder={t.search_placeholder} value={search} onChange={e=>setSearch(e.target.value)}
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
              {cat === "All" ? t.all : cat}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", border:"1px solid #ede8e2" }}>
          {[{id:"list",label:`☰ ${t.list}`},{id:"map",label:`◎ ${t.map}`}].map(v => (
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
              <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"24px", color:"#ccc", marginBottom:8 }}>{t.loading}</p>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"12px", color:"#ddd" }}>{t.loading_sub}</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom:34 }}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"24px", fontWeight:400, color:"#1a1a1a" }}>
                  {activeCat === "All" ? t.all_salons : activeCat}
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"12px", color:"#ccc", marginLeft:10, fontWeight:400 }}>{filtered.length} {t.salons}</span>
                </h2>
              </div>
              {filtered.length === 0
                ? <div style={{ textAlign:"center", padding:"80px 0", fontFamily:"'Cormorant Garamond',serif", fontSize:"22px", color:"#ccc" }}>{t.no_salons}</div>
                : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))", gap:"40px 28px" }}>
                    {filtered.map((salon, i) => (
                      <div key={salon.id} style={{ animation:`fadeUp 0.45s ease ${i*0.06}s both` }}>
                        <SalonCard salon={salon} onClick={setSelectedSalon} lang={lang} />
                      </div>
                    ))}
                  </div>
              }
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
        <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"11px", color:"#555" }}>{t.footer}</p>
      </footer>

      {selectedSalon && <SalonModal salon={selectedSalon} onClose={() => setSelectedSalon(null)} leafletReady={leafletReady} lang={lang} />}
    </>
  );
}
