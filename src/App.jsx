import { useState, useEffect, useRef } from "react";

// ── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_PRODUCTS = [
  { id: "p1", brand: "COSRX", name: "Advanced Snail 96 Mucin Power Essence", category: "Essence", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80", description: "달팽이 분비물 96% 함유 에센스. 피부 재생과 보습에 탁월합니다.", tags: ["보습", "재생", "민감성 피부"], badge: "popular" },
  { id: "p2", brand: "Sulwhasoo", name: "First Care Activating Serum", category: "Serum", image: "https://images.unsplash.com/photo-1601049541271-f9e02082c7b6?w=400&q=80", description: "한방 성분 기반의 퍼스트 케어 세럼. 피부 흡수력을 높여줍니다.", tags: ["한방", "탄력", "명품"], badge: "new" },
  { id: "p3", brand: "Laneige", name: "Water Sleeping Mask", category: "Mask", image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80", description: "수분 가득한 슬리핑 마스크. 자는 동안 깊은 보습을 제공합니다.", tags: ["수분", "슬리핑", "광채"], badge: "new" },
  { id: "p4", brand: "Some By Mi", name: "AHA BHA PHA 30 Days Miracle Toner", category: "Toner", image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80", description: "AHA/BHA/PHA 복합 성분 토너. 각질 케어와 모공 관리에 효과적.", tags: ["각질케어", "모공", "클리어"], badge: "popular" },
  { id: "p5", brand: "Innisfree", name: "Green Tea Seed Serum", category: "Serum", image: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=400&q=80", description: "제주 녹차 씨앗 성분의 가볍고 촉촉한 세럼.", tags: ["그린티", "가벼운", "산뜻"], badge: "popular" },
  { id: "p6", brand: "Dr.Jart+", name: "Cicapair Tiger Grass Cream", category: "Cream", image: "https://images.unsplash.com/photo-1570194065650-d99fb4b38b17?w=400&q=80", description: "병풀 성분의 진정 크림. 민감하고 붉은 피부를 케어합니다.", tags: ["진정", "병풀", "붉음증"], badge: "new" },
];

// products: 최대 2개 (없으면 빈배열, 1개도 ok)
// badge per product: "new" | "popular"
// bookingUrl: planity or treatwell link
// lat/lng: 실제 좌표로 교체
const MOCK_SALONS = [
  { id: "s1", name: "Maison Blanc", city: "Paris", district: "Le Marais", category: "헤어", rating: 4.9, reviewCount: 312, image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80", description: "파리 마레 지구의 프리미엄 헤어살롱. 한국 트리트먼트 기술과 유럽 스타일링의 완벽한 조화를 경험하세요.", hours: "Tue–Sat 10:00–19:00", address: "12 Rue des Francs-Bourgeois, 75003 Paris", instagram: "@maisonblanc_paris", bookingUrl: "https://www.planity.com", bookingPlatform: "Planity", products: ["p1", "p3"], lat: 48.8579, lng: 2.3576 },
  { id: "s2", name: "Ongles Studio", city: "Paris", district: "Saint-Germain", category: "네일", rating: 4.8, reviewCount: 187, image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80", description: "생제르맹 감성 네일 아뜰리에. K-뷰티 네일 케어 제품으로 건강하고 예쁜 손을 완성합니다.", hours: "Mon–Sat 11:00–20:00", address: "45 Rue de Rennes, 75006 Paris", instagram: "@ongles_studio", bookingUrl: "https://www.treatwell.fr", bookingPlatform: "Treatwell", products: ["p4"], lat: 48.8499, lng: 2.3280 },
  { id: "s3", name: "Lumière Spa", city: "Paris", district: "8ème", category: "스파", rating: 4.9, reviewCount: 95, image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80", description: "샹젤리제 근처 프라이빗 웰니스 스파. 한국 최고급 스킨케어로 완성하는 깊은 휴식을 경험하세요.", hours: "Daily 09:00–21:00", address: "8 Avenue Montaigne, 75008 Paris", instagram: "@lumierespa", bookingUrl: "https://www.planity.com", bookingPlatform: "Planity", products: ["p2", "p6"], lat: 48.8651, lng: 2.3030 },
  { id: "s4", name: "Peau Douce", city: "Paris", district: "Bastille", category: "피부", rating: 4.7, reviewCount: 241, image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80", description: "바스티유의 피부 전문 클리닉. K-뷰티 루틴을 바탕으로 한 맞춤 피부 솔루션을 제공합니다.", hours: "Tue–Sat 10:00–18:30", address: "23 Boulevard de la Bastille, 75012 Paris", instagram: "@peaudouce_paris", bookingUrl: "https://www.treatwell.fr", bookingPlatform: "Treatwell", products: ["p5", "p1"], lat: 48.8533, lng: 2.3692 },
  { id: "s5", name: "Brow Atelier", city: "Paris", district: "Montmartre", category: "눈썹", rating: 5.0, reviewCount: 78, image: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&q=80", description: "몽마르트르 감성 눈썹 아뜰리에. 한국식 눈썹 아트와 섬세한 케어를 파리에서 만나보세요.", hours: "Wed–Sun 11:00–19:00", address: "7 Rue Lepic, 75018 Paris", instagram: "@browatelier_paris", bookingUrl: "https://www.planity.com", bookingPlatform: "Planity", products: ["p3", "p4"], lat: 48.8844, lng: 2.3340 },
  { id: "s6", name: "Racine Hair Lab", city: "Paris", district: "Oberkampf", category: "헤어", rating: 4.6, reviewCount: 430, image: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&q=80", description: "오베르캄프 트렌디 헤어랩. 한국 두피 케어와 트리트먼트로 건강하고 빛나는 모발을 완성합니다.", hours: "Mon–Sat 12:00–21:00", address: "55 Rue Oberkampf, 75011 Paris", instagram: "@racine_lab", bookingUrl: "https://www.treatwell.fr", bookingPlatform: "Treatwell", products: ["p2"], lat: 48.8651, lng: 2.3770 },
];

const CATEGORIES = ["All", "헤어", "네일", "스파", "피부", "눈썹"];

const AT = { key: "YOUR_AIRTABLE_API_KEY", base: "YOUR_BASE_ID" };
async function fetchAirtable(table) {
  if (AT.key === "YOUR_AIRTABLE_API_KEY") return null;
  const res = await fetch(`https://api.airtable.com/v0/${AT.base}/${table}`, { headers: { Authorization: `Bearer ${AT.key}` } });
  const data = await res.json();
  return data.records.map(r => ({ id: r.id, ...r.fields }));
}

// ── LEAFLET MAP COMPONENT ─────────────────────────────────────────────────────
function LeafletMap({ salons, onSalonClick, focusSalon, mini }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const id = useRef(`map-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    if (mapInstance.current) return;
    const L = window.L;
    if (!L) return;

    const center = focusSalon ? [focusSalon.lat, focusSalon.lng] : [48.8566, 2.3522];
    const zoom = focusSalon ? 15 : 13;

    const map = L.map(id.current, { zoomControl: !mini, scrollWheelZoom: !mini, dragging: !mini || true }).setView(center, zoom);
    mapInstance.current = map;

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: "© OpenStreetMap © CARTO", maxZoom: 19,
    }).addTo(map);

    const makeIcon = (isHighlighted) => L.divIcon({
      className: "",
      html: `<div style="width:${isHighlighted ? 36 : 28}px;height:${isHighlighted ? 36 : 28}px;border-radius:50%;background:${isHighlighted ? "#b85c5c" : "#0d0d0d"};border:3px solid #fff;box-shadow:0 3px 12px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s">
        <div style="width:6px;height:6px;border-radius:50%;background:#fff;opacity:0.9"></div>
      </div>`,
      iconSize: [isHighlighted ? 36 : 28, isHighlighted ? 36 : 28],
      iconAnchor: [isHighlighted ? 18 : 14, isHighlighted ? 18 : 14],
    });

    (focusSalon ? [focusSalon] : salons).forEach(salon => {
      const isHL = focusSalon && salon.id === focusSalon.id;
      const marker = L.marker([salon.lat, salon.lng], { icon: makeIcon(isHL) }).addTo(map);
      if (!mini) {
        marker.bindTooltip(`<div style="font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;color:#1a1a1a;padding:2px 4px">${salon.name}</div>`, { permanent: false, direction: "top", offset: [0, -10] });
        marker.on("click", () => onSalonClick && onSalonClick(salon));
      }
      markersRef.current.push(marker);
    });

    return () => { map.remove(); mapInstance.current = null; markersRef.current = []; };
  }, []);

  return <div id={id.current} ref={mapRef} style={{ width: "100%", height: mini ? 200 : "100%", borderRadius: mini ? "0" : "0", zIndex: 1 }} />;
}

// ── PRODUCT BADGE CIRCLE ──────────────────────────────────────────────────────
function ProductBadge({ product, index }) {
  const isNew = product.badge === "new";
  const color = isNew ? "#c9a96e" : "#b85c5c";
  const label = isNew ? "New In" : "Popular";
  const [hov, setHov] = useState(false);
  return (
    <div style={{ position: "relative" }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {/* tooltip */}
      {hov && (
        <div style={{ position: "absolute", bottom: 62, right: 0, background: "#1a1a1a", color: "#f5f0eb", fontFamily: "'DM Sans',sans-serif", fontSize: "10px", padding: "5px 10px", whiteSpace: "nowrap", pointerEvents: "none", zIndex: 20 }}>
          {product.brand}
        </div>
      )}
      <div style={{ position: "relative", width: 56, height: 56, borderRadius: "50%", overflow: "hidden", border: `3px solid ${color}`, boxShadow: "0 4px 16px rgba(0,0,0,0.2)", transform: hov ? "scale(1.1)" : "scale(1)", transition: "transform 0.2s" }}>
        <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.38)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "7px", color: color, letterSpacing: "1px", textTransform: "uppercase", fontWeight: 800, lineHeight: 1 }}>{isNew ? "New" : "Top"}</span>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "7px", color: "#fff", letterSpacing: "0.5px", textTransform: "uppercase", lineHeight: 1 }}>{isNew ? "in" : "pick"}</span>
        </div>
      </div>
    </div>
  );
}

// ── PRODUCT CARD (in modal) ───────────────────────────────────────────────────
function ProductCard({ product }) {
  const isNew = product.badge === "new";
  const color = isNew ? "#c9a96e" : "#b85c5c";
  const bg = isNew ? "#fdf8ee" : "#fdf0f0";
  const border = isNew ? "#e8d9b8" : "#f0d0d0";
  return (
    <div style={{ background: "#fff", border: `1px solid ${border}`, overflow: "hidden", flex: 1, minWidth: 0 }}>
      <div style={{ position: "relative", paddingBottom: "75%", overflow: "hidden" }}>
        <img src={product.image} alt={product.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", top: 8, left: 8, background: color, color: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: "8px", fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", padding: "3px 9px" }}>
          {isNew ? "New In" : "Popular"}
        </div>
      </div>
      <div style={{ padding: "11px 13px 13px" }}>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "9px", color, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", margin: "0 0 3px" }}>{product.brand}</p>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: "#2a2a2a", margin: "0 0 6px", lineHeight: 1.4 }}>{product.name}</p>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "11px", color: "#999", margin: 0, lineHeight: 1.5 }}>{product.description}</p>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
          {product.tags.map(t => (
            <span key={t} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "9px", color, background: bg, padding: "2px 8px", borderRadius: "20px" }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── SALON MODAL ───────────────────────────────────────────────────────────────
function SalonModal({ salon, products, onClose }) {
  if (!salon) return null;
  const salonProducts = (salon.products || []).map(pid => products.find(p => p.id === pid)).filter(Boolean);
  const isPlanity = salon.bookingPlatform === "Planity";

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1500, background: "rgba(8,6,4,0.8)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, overflowY: "auto" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#faf7f4", maxWidth: 680, width: "100%", maxHeight: "92vh", overflow: "auto", boxShadow: "0 48px 120px rgba(0,0,0,0.35)" }}>

        {/* Hero image */}
        <div style={{ position: "relative", paddingBottom: "40%", overflow: "hidden", flexShrink: 0 }}>
          <img src={salon.image} alt={salon.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.68) 0%, transparent 55%)" }} />
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(0,0,0,0.4)", color: "#fff", border: "none", width: 34, height: 34, borderRadius: "50%", cursor: "pointer", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          <div style={{ position: "absolute", bottom: 22, left: 26 }}>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "10px", color: "#c9a96e", letterSpacing: "2.5px", textTransform: "uppercase", margin: "0 0 4px" }}>{salon.category} · {salon.district}</p>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "32px", fontWeight: 600, color: "#fff", margin: 0 }}>{salon.name}</h2>
          </div>
        </div>

        <div style={{ padding: "24px 28px 32px" }}>

          {/* ① 살롱 소개 */}
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "14px", color: "#666", lineHeight: 1.85, margin: "0 0 20px" }}>{salon.description}</p>

          {/* Info grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
            {[
              { icon: "📍", label: "Address", value: salon.address },
              { icon: "🕐", label: "Hours", value: salon.hours },
              { icon: "📸", label: "Instagram", value: salon.instagram },
              { icon: "⭐", label: "Rating", value: `${salon.rating} · ${salon.reviewCount} reviews` },
            ].map(item => (
              <div key={item.label} style={{ background: "#fff", border: "1px solid #ede8e2", padding: "11px 14px" }}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "9px", color: "#c0bbb5", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: "#444" }}>{item.icon} {item.value}</div>
              </div>
            ))}
          </div>

          {/* ② K-뷰티 제품 */}
          {salonProducts.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ height: 1, flex: 1, background: "#ede8e2" }} />
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "9px", color: "#b85c5c", letterSpacing: "2.5px", textTransform: "uppercase", fontWeight: 700, margin: 0, whiteSpace: "nowrap" }}>K-Beauty you can discover here</p>
                <div style={{ height: 1, flex: 1, background: "#ede8e2" }} />
              </div>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: "#aaa", margin: "0 0 14px", lineHeight: 1.6 }}>
                These products are available at {salon.name} — ask your stylist to try them during your visit.
              </p>
              <div style={{ display: "flex", gap: 12 }}>
                {salonProducts.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          )}

          {/* ③ 예약 버튼 */}
          <div style={{ borderTop: "1px solid #ede8e2", paddingTop: 22 }}>
            <a href={salon.bookingUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, background: "#1a1a1a", color: "#f5f0eb", textDecoration: "none", padding: "16px 28px", fontFamily: "'DM Sans',sans-serif", fontSize: "12px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", transition: "background 0.2s", width: "100%" }}
              onMouseEnter={e => e.currentTarget.style.background = "#b85c5c"}
              onMouseLeave={e => e.currentTarget.style.background = "#1a1a1a"}
            >
              <span>Book at {salon.name}</span>
              <span style={{ fontSize: "10px", color: "#888", fontWeight: 400, letterSpacing: "1px" }}>via {salon.bookingPlatform}</span>
              <span style={{ marginLeft: "auto", fontSize: "16px" }}>→</span>
            </a>
          </div>

          {/* ④ 미니 지도 */}
          <div style={{ marginTop: 20, overflow: "hidden", border: "1px solid #ede8e2" }}>
            <div style={{ background: "#fff", padding: "10px 14px", borderBottom: "1px solid #ede8e2", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: "12px" }}>📍</span>
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "11px", color: "#888" }}>{salon.address}</span>
            </div>
            <LeafletMap salons={[salon]} focusSalon={salon} mini={true} />
          </div>

        </div>
      </div>
    </div>
  );
}

// ── SALON CARD ────────────────────────────────────────────────────────────────
function SalonCard({ salon, products, onClick }) {
  const [hov, setHov] = useState(false);
  const salonProducts = (salon.products || []).map(pid => products.find(p => p.id === pid)).filter(Boolean);

  return (
    <div onClick={() => onClick(salon)}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ cursor: "pointer", background: "#fff", overflow: "visible", transition: "transform 0.28s, box-shadow 0.28s", transform: hov ? "translateY(-5px)" : "none", boxShadow: hov ? "0 20px 60px rgba(0,0,0,0.12)" : "0 2px 18px rgba(0,0,0,0.06)", position: "relative", marginBottom: 0 }}>

      {/* image */}
      <div style={{ position: "relative", paddingBottom: "58%", overflow: "hidden" }}>
        <img src={salon.image} alt={salon.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s", transform: hov ? "scale(1.04)" : "scale(1)" }} />
        {/* category pill */}
        <div style={{ position: "absolute", top: 12, left: 12, background: "#1a1a1a", color: "#f5f0eb", fontSize: "10px", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", padding: "4px 10px" }}>
          {salon.category}
        </div>
        {/* district */}
        <div style={{ position: "absolute", bottom: 12, left: 12, fontSize: "11px", fontFamily: "'DM Sans',sans-serif", color: "#fff", background: "rgba(0,0,0,0.38)", padding: "3px 10px", borderRadius: "20px" }}>
          📍 {salon.district}
        </div>
        {/* product badges — bottom right, spill below image */}
        {salonProducts.length > 0 && (
          <div style={{ position: "absolute", bottom: -20, right: 12, display: "flex", gap: 6 }}
            onClick={e => e.stopPropagation()}>
            {salonProducts.map((p, i) => <ProductBadge key={p.id} product={p} index={i} />)}
          </div>
        )}
      </div>

      {/* body */}
      <div style={{ padding: "28px 18px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
          <h3 style={{ margin: 0, fontFamily: "'Cormorant Garamond',serif", fontSize: "20px", fontWeight: 600, color: "#1a1a1a", lineHeight: 1.2 }}>{salon.name}</h3>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: "#c9a96e", fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>★ {salon.rating}</span>
        </div>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: "#999", lineHeight: 1.6, margin: "0 0 12px" }}>{salon.description}</p>

        {/* brand chips */}
        {salonProducts.length > 0 && (
          <div style={{ display: "flex", gap: 6, borderTop: "1px solid #f0ebe5", paddingTop: 11, flexWrap: "wrap" }}>
            {salonProducts.map(p => {
              const isNew = p.badge === "new";
              return (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 5, background: isNew ? "#fdf8ee" : "#fdf0f0", padding: "3px 10px", borderRadius: "20px", border: `1px solid ${isNew ? "#e8d9b8" : "#f0d0d0"}` }}>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "9px", color: isNew ? "#a07832" : "#b85c5c", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>{isNew ? "New In" : "Popular"}</span>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "10px", color: "#666" }}>{p.brand}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── FULL MAP VIEW ─────────────────────────────────────────────────────────────
function MapView({ salons, products, onSalonClick }) {
  return (
    <div style={{ height: "calc(100vh - 120px)", position: "relative" }}>
      <LeafletMap salons={salons} onSalonClick={onSalonClick} mini={false} />
      {/* floating legend */}
      <div style={{ position: "absolute", bottom: 24, left: 24, background: "#fff", padding: "12px 16px", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", zIndex: 999, fontFamily: "'DM Sans',sans-serif" }}>
        <p style={{ fontSize: "9px", color: "#b85c5c", letterSpacing: "2px", textTransform: "uppercase", fontWeight: 700, margin: "0 0 8px" }}>K-Beauty Salons</p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#0d0d0d", border: "2px solid #fff", boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }} />
          <span style={{ fontSize: "11px", color: "#888" }}>Salon</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#b85c5c", border: "2px solid #fff", boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }} />
          <span style={{ fontSize: "11px", color: "#888" }}>Selected</span>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [salons, setSalons] = useState(MOCK_SALONS);
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [filtered, setFiltered] = useState(MOCK_SALONS);
  const [activeCat, setActiveCat] = useState("All");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("list"); // "list" | "map"
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [leafletReady, setLeafletReady] = useState(false);

  // load Leaflet
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
      const [s, p] = await Promise.all([fetchAirtable("Salons"), fetchAirtable("Products")]);
      if (s) setSalons(s);
      if (p) setProducts(p);
    })();
  }, []);

  useEffect(() => {
    let r = salons;
    if (activeCat !== "All") r = r.filter(s => s.category === activeCat);
    if (search) r = r.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.district.toLowerCase().includes(search.toLowerCase())
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
        .leaflet-container{font-family:'DM Sans',sans-serif}
        .leaflet-tooltip{background:#fff;border:1px solid #ede8e2;box-shadow:0 4px 16px rgba(0,0,0,0.1);border-radius:0;padding:6px 10px}
        .leaflet-tooltip-top:before{border-top-color:#ede8e2}
      `}</style>

      {/* NAV */}
      <nav style={{ background: "#0d0d0d", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", position: "sticky", top: 0, zIndex: 500 }}>
        <div>
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "17px", color: "#f5f0eb", letterSpacing: "3px", fontWeight: 300 }}>THE</span>
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "17px", color: "#c9a96e", letterSpacing: "3px", fontWeight: 600, marginLeft: 7 }}>BEAUTY PAUSE</span>
        </div>
        <div style={{ display: "flex", gap: 28 }}>
          {["Salons", "K-Beauty", "About"].map(l => (
            <a key={l} href="#" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "11px", color: "#777", textDecoration: "none", letterSpacing: "1.5px", textTransform: "uppercase", transition: "color 0.2s" }}
              onMouseEnter={e => e.target.style.color = "#f5f0eb"}
              onMouseLeave={e => e.target.style.color = "#777"}>{l}</a>
          ))}
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: "#0d0d0d", padding: "64px 40px 72px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -100, right: -60, width: 420, height: 420, borderRadius: "50%", border: "1px solid rgba(201,169,110,0.12)" }} />
        <div style={{ maxWidth: 580, animation: "fadeUp 0.8s ease both" }}>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "10px", color: "#c9a96e", letterSpacing: "4px", textTransform: "uppercase", marginBottom: 16 }}>K-Beauty · Curated Salons · Paris</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(40px,5vw,62px)", fontWeight: 300, color: "#f5f0eb", lineHeight: 1.08, marginBottom: 18 }}>
            Where Korean beauty<br /><em style={{ fontStyle: "italic", color: "#c9a96e" }}>meets your salon</em>
          </h1>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "14px", color: "#777", lineHeight: 1.8, marginBottom: 30, maxWidth: 400 }}>
            We place carefully selected K-beauty products in handpicked Paris salons — so you can discover them during your next visit.
          </p>
          <div style={{ display: "flex", maxWidth: 460 }}>
            <input placeholder="Search salon or neighbourhood…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, padding: "14px 18px", fontFamily: "'DM Sans',sans-serif", fontSize: "13px", border: "none", background: "#1a1a1a", color: "#f5f0eb", outline: "none", caretColor: "#c9a96e" }} />
            <div style={{ padding: "14px 20px", background: "#c9a96e", display: "flex", alignItems: "center" }}>→</div>
          </div>
        </div>
      </section>

      {/* FILTER + VIEW TOGGLE */}
      <div style={{ background: "#fff", borderBottom: "1px solid #ede8e2", padding: "0 40px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 60, zIndex: 400 }}>
        <div style={{ display: "flex" }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCat(cat)}
              style={{ padding: "14px 18px", border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: "11px", fontWeight: activeCat === cat ? 600 : 400, color: activeCat === cat ? "#b85c5c" : "#999", background: "transparent", borderBottom: activeCat === cat ? "2px solid #b85c5c" : "2px solid transparent", letterSpacing: "0.5px", transition: "all 0.2s", whiteSpace: "nowrap" }}>
              {cat}
            </button>
          ))}
        </div>
        {/* List / Map toggle */}
        <div style={{ display: "flex", gap: 0, border: "1px solid #ede8e2" }}>
          {[{ id: "list", label: "☰ List" }, { id: "map", label: "◎ Map" }].map(v => (
            <button key={v.id} onClick={() => setView(v.id)}
              style={{ padding: "8px 16px", border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: "11px", fontWeight: view === v.id ? 600 : 400, color: view === v.id ? "#fff" : "#999", background: view === v.id ? "#1a1a1a" : "transparent", transition: "all 0.2s", letterSpacing: "0.5px" }}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      {view === "list" ? (
        <main style={{ maxWidth: 1200, margin: "0 auto", padding: "50px 40px 90px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 34 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "24px", fontWeight: 400, color: "#1a1a1a" }}>
              {activeCat === "All" ? "All Salons" : activeCat}
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: "#ccc", marginLeft: 10, fontWeight: 400 }}>{filtered.length} salons</span>
            </h2>
          </div>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0", fontFamily: "'Cormorant Garamond',serif", fontSize: "22px", color: "#ccc" }}>No salons found</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "40px 28px" }}>
              {filtered.map((salon, i) => (
                <div key={salon.id} style={{ animation: `fadeUp 0.45s ease ${i * 0.06}s both` }}>
                  <SalonCard salon={salon} products={products} onClick={setSelectedSalon} />
                </div>
              ))}
            </div>
          )}
        </main>
      ) : (
        leafletReady
          ? <MapView salons={filtered} products={products} onSalonClick={setSelectedSalon} />
          : <div style={{ textAlign: "center", padding: "80px 0", fontFamily: "'DM Sans',sans-serif", color: "#aaa" }}>Loading map…</div>
      )}

      {/* FOOTER */}
      <footer style={{ background: "#0d0d0d", padding: "36px 40px", textAlign: "center" }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "15px", color: "#f5f0eb", letterSpacing: "4px", marginBottom: 8 }}>THE BEAUTY PAUSE</div>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "11px", color: "#555" }}>Curating K-Beauty across Paris · @thebeautypause</p>
      </footer>

      {/* SALON MODAL */}
      {selectedSalon && (
        <SalonModal salon={selectedSalon} products={products} onClose={() => setSelectedSalon(null)} />
      )}
    </>
  );
}
