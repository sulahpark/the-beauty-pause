import { useState, useEffect, useRef, useCallback } from "react";

const AT_KEY = process.env.REACT_APP_AIRTABLE_KEY;
const AT_BASE = process.env.REACT_APP_AIRTABLE_BASE;
const TBL_RETAIL   = "tblKBJOQMOoskSVdx";
const TBL_PRODUCTS = "tblQkdtqAA9kC0n1w";
const TBL_SLOTS    = "tblpLTlKSizL7y3W6";
const TBL_MEMBERS  = "tbl6qPdK6BcW6t4ji";

// ── i18n ──────────────────────────────────────────────────────────────────────
const T = {
  en: {
    tagline:"K-Beauty · Curated Salons · Paris",
    hero_title_1:"Where Korean beauty", hero_title_2:"meets your salon",
    hero_sub:"We place carefully selected K-beauty products in handpicked Paris salons — discover them during your next visit.",
    search_placeholder:"Search salon or neighbourhood…",
    all:"All", list:"List", map:"Map",
    all_salons:"All Salons", salons:"salons", no_salons:"No salons found",
    loading:"Loading salons…", loading_sub:"Fetching from Airtable",
    address:"Address", contact:"Contact", tier:"Tier", bio:"About", services:"Services",
    kbeauty:"K-Beauty available here",
    kbeauty_sub:"These products are available at this salon — ask during your visit to discover them.",
    book:"Book an appointment", via:"via",
    footer:"Curating K-Beauty across Paris · @thebeautypause",
    new_in:"New In", popular:"Popular",
    join:"Join", join_title:"Join The Beauty Pause",
    join_sub:"Be the first to know about exclusive K-beauty events and free product giveaways.",
    join_name:"First name", join_email:"Email address",
    join_salon:"Your favourite salon (optional)", join_salon_ph:"Select a salon…",
    join_submit:"Join the community", join_success_title:"You're in! ✦",
    join_success_sub:"We'll be in touch when something special comes your way.",
    join_error:"Something went wrong. Please try again.", joining:"Joining…",
    filter:"Filters", clear:"Clear all",
    filter_kbeauty:"K-Beauty only", filter_tier:"Tier", filter_area:"Area", filter_brand:"Brand",
    sort_az:"Name A–Z", sort_tier:"Tier first", sort_area:"By area",
    by_product:"Products", products_view:"K-Beauty Products", available_at:"Available at",
    quick_nail:"Nail", quick_beauty:"Beauty", quick_hair:"Hair", quick_spa:"Spa",
    quick_kbeauty:"Has K-Beauty",
    map_move_filter:"Showing salons in map view",
    salons_in_view:"salons in view",
  },
  fr: {
    tagline:"K-Beauty · Salons Sélectionnés · Paris",
    hero_title_1:"Là où la beauté coréenne", hero_title_2:"rencontre votre salon",
    hero_sub:"Nous plaçons des produits K-beauty dans des salons parisiens sélectionnés — découvrez-les lors de votre prochaine visite.",
    search_placeholder:"Rechercher un salon ou un quartier…",
    all:"Tous", list:"Liste", map:"Carte",
    all_salons:"Tous les salons", salons:"salons", no_salons:"Aucun salon trouvé",
    loading:"Chargement…", loading_sub:"Récupération depuis Airtable",
    address:"Adresse", contact:"Contact", tier:"Niveau", bio:"À propos", services:"Services",
    kbeauty:"K-Beauty disponible ici",
    kbeauty_sub:"Ces produits sont disponibles dans ce salon — demandez lors de votre visite.",
    book:"Prendre rendez-vous", via:"via",
    footer:"Curation K-Beauty à Paris · @thebeautypause",
    new_in:"Nouveau", popular:"Populaire",
    join:"Rejoindre", join_title:"Rejoindre The Beauty Pause",
    join_sub:"Soyez les premiers informés des événements K-beauty exclusifs et cadeaux de produits gratuits.",
    join_name:"Prénom", join_email:"Adresse email",
    join_salon:"Votre salon préféré (optionnel)", join_salon_ph:"Sélectionner un salon…",
    join_submit:"Rejoindre la communauté", join_success_title:"Vous êtes inscrit·e ! ✦",
    join_success_sub:"Nous vous contacterons dès qu'une offre spéciale vous attend.",
    join_error:"Une erreur s'est produite. Veuillez réessayer.", joining:"Inscription…",
    filter:"Filtres", clear:"Effacer",
    filter_kbeauty:"K-Beauty uniquement", filter_tier:"Tier", filter_area:"Quartier", filter_brand:"Marque",
    sort_az:"Nom A–Z", sort_tier:"Tier d'abord", sort_area:"Par quartier",
    by_product:"Produits", products_view:"Produits K-Beauty", available_at:"Disponible chez",
    quick_nail:"Nail", quick_beauty:"Beauté", quick_hair:"Hair", quick_spa:"Spa",
    quick_kbeauty:"A K-Beauty",
    map_move_filter:"Salons visibles sur la carte",
    salons_in_view:"salons visibles",
  },
};

// ── TIER CONFIG ───────────────────────────────────────────────────────────────
const TIER = {
  Platinum: { crown:"👑", gradient:"linear-gradient(90deg,#e040fb,#7c4dff,#00bcd4,#00e676,#ffeb3b,#ff5722)", label:"Platinum", shadow:"0 0 12px rgba(180,120,255,0.5)" },
  Gold:     { crown:"👑", color:"#c9a96e", label:"Gold", shadow:"0 0 8px rgba(201,169,110,0.4)" },
  Silver:   { crown:"👑", color:"#aaa", label:"Silver", shadow:"none" },
};

async function fetchAll(tableId, filterFormula="") {
  let records=[], offset=null;
  do {
    let url=`https://api.airtable.com/v0/${AT_BASE}/${tableId}?pageSize=100`;
    if (filterFormula) url+=`&filterByFormula=${encodeURIComponent(filterFormula)}`;
    if (offset) url+=`&offset=${offset}`;
    const res=await fetch(url,{headers:{Authorization:`Bearer ${AT_KEY}`}});
    const data=await res.json();
    records=records.concat((data.records||[]).map(r=>({id:r.id,...r.fields})));
    offset=data.offset||null;
  } while(offset);
  return records;
}

// ── LEAFLET MAP ───────────────────────────────────────────────────────────────
function SplitMap({ salons, onSalonClick, onBoundsChange }) {
  const uid = useRef(`map-${Math.random().toString(36).slice(2)}`);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const salonsRef = useRef(salons);
  salonsRef.current = salons;

  useEffect(() => {
    if (mapInstance.current || !window.L) return;
    const L = window.L;
    const map = L.map(uid.current, { zoomControl:true, scrollWheelZoom:true }).setView([48.8566,2.3522], 13);
    mapInstance.current = map;
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",{attribution:"© OpenStreetMap © CARTO",maxZoom:19}).addTo(map);

    const updateBounds = () => {
      const bounds = map.getBounds();
      const visible = salonsRef.current.filter(s => {
        const lat=parseFloat(s.latitude), lng=parseFloat(s.longitude);
        if (!lat||!lng) return false;
        return bounds.contains([lat,lng]);
      });
      onBoundsChange?.(visible.map(s=>s.id));
    };
    map.on("moveend zoomend", updateBounds);

    return () => { map.remove(); mapInstance.current=null; markersRef.current=[]; };
  }, []);

  // update markers when salons change
  useEffect(() => {
    const L = window.L;
    if (!L || !mapInstance.current) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    salons.forEach(s => {
      const lat=parseFloat(s.latitude), lng=parseFloat(s.longitude);
      if (!lat||!lng) return;
      const tier = TIER[s.salon_tier];
      const color = tier?.gradient ? "#a855f7" : tier?.color || "#0d0d0d";
      const icon = L.divIcon({
        className:"",
        html:`<div style="width:32px;height:32px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 3px 12px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform 0.2s"><div style="width:6px;height:6px;border-radius:50%;background:#fff"></div></div>`,
        iconSize:[32,32],iconAnchor:[16,16],
      });
      const m = L.marker([lat,lng],{icon}).addTo(mapInstance.current);
      m.bindTooltip(`<div style="font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;color:#1a1a1a;padding:2px 4px">${s.name}</div>`,{direction:"top",offset:[0,-10]});
      m.on("click",()=>onSalonClick?.(s));
      markersRef.current.push(m);
    });
  }, [salons]);

  return <div id={uid.current} style={{width:"100%",height:"100%"}} />;
}

function MiniMap({ salon }) {
  const uid = useRef(`map-${Math.random().toString(36).slice(2)}`);
  const mapInstance = useRef(null);
  useEffect(() => {
    if (mapInstance.current || !window.L) return;
    const L=window.L;
    const lat=parseFloat(salon.latitude), lng=parseFloat(salon.longitude);
    if (!lat||!lng) return;
    const map=L.map(uid.current,{zoomControl:false,scrollWheelZoom:false,dragging:false}).setView([lat,lng],15);
    mapInstance.current=map;
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",{attribution:"© OpenStreetMap © CARTO",maxZoom:19}).addTo(map);
    L.divIcon({className:""});
    const icon=L.divIcon({className:"",html:`<div style="width:32px;height:32px;border-radius:50%;background:#b85c5c;border:3px solid #fff;box-shadow:0 3px 12px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center"><div style="width:6px;height:6px;border-radius:50%;background:#fff"></div></div>`,iconSize:[32,32],iconAnchor:[16,16]});
    L.marker([lat,lng],{icon}).addTo(map);
    return ()=>{map.remove();mapInstance.current=null;};
  },[]);
  return <div id={uid.current} style={{width:"100%",height:200}} />;
}

// ── TIER CROWN ────────────────────────────────────────────────────────────────
function TierBadge({ tier }) {
  if (!tier || !TIER[tier]) return null;
  const cfg = TIER[tier];
  if (tier === "Platinum") {
    return (
      <span style={{ fontSize:"16px", filter:"drop-shadow(0 0 4px rgba(180,120,255,0.8))", cursor:"default" }} title="Platinum">👑</span>
    );
  }
  return (
    <span style={{ fontSize:"14px", filter:`drop-shadow(0 0 3px ${cfg.color})`, cursor:"default" }} title={cfg.label}>👑</span>
  );
}

// ── SALON CARD IMAGE SLIDER ───────────────────────────────────────────────────
function CardImage({ salon, onClick }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [hov, setHov] = useState(false);

  // support both URL string and attachment array
  const imgs = (() => {
    if (!salon.salon_image) return [];
    if (Array.isArray(salon.salon_image)) return salon.salon_image.map(a=>a.url||a).filter(Boolean);
    return [salon.salon_image];
  })();

  const prev = (e) => { e.stopPropagation(); setImgIdx(i => (i-1+imgs.length)%imgs.length); };
  const next = (e) => { e.stopPropagation(); setImgIdx(i => (i+1)%imgs.length); };

  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ position:"relative", paddingBottom:"62%", overflow:"hidden", borderRadius:"12px 12px 0 0", background:"#1a1a1a", cursor:"pointer" }}>
      {imgs.length > 0
        ? <img src={imgs[imgIdx]} alt={salon.name} style={{ position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",transition:"transform 0.4s",transform:hov?"scale(1.03)":"scale(1)" }} />
        : <div style={{ position:"absolute",inset:0,background:"linear-gradient(135deg,#2a2a2a,#1a1a1a)",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <span style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"52px",color:"rgba(201,169,110,0.2)",fontWeight:300 }}>{salon.name?.[0]}</span>
          </div>
      }
      <div style={{ position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.25) 0%,transparent 50%)" }} />

      {/* category pill */}
      <div style={{ position:"absolute",top:10,left:10,background:"rgba(0,0,0,0.65)",color:"#f5f0eb",fontSize:"10px",fontFamily:"'DM Sans',sans-serif",fontWeight:600,letterSpacing:"1.2px",textTransform:"uppercase",padding:"3px 9px",borderRadius:"20px" }}>
        {salon.category}
      </div>

      {/* tier crown */}
      {salon.salon_tier && TIER[salon.salon_tier] && (
        <div style={{ position:"absolute",top:10,right:10 }}>
          <TierBadge tier={salon.salon_tier} />
        </div>
      )}

      {/* image nav arrows — show on hover if multiple images */}
      {imgs.length > 1 && hov && (
        <>
          <button onClick={prev} style={{ position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",width:28,height:28,borderRadius:"50%",background:"rgba(255,255,255,0.9)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",boxShadow:"0 2px 8px rgba(0,0,0,0.2)",transition:"all 0.2s" }}>‹</button>
          <button onClick={next} style={{ position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",width:28,height:28,borderRadius:"50%",background:"rgba(255,255,255,0.9)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",boxShadow:"0 2px 8px rgba(0,0,0,0.2)",transition:"all 0.2s" }}>›</button>
          {/* dots */}
          <div style={{ position:"absolute",bottom:8,left:"50%",transform:"translateX(-50%)",display:"flex",gap:4 }}>
            {imgs.map((_,i)=>(
              <div key={i} style={{ width:5,height:5,borderRadius:"50%",background:i===imgIdx?"#fff":"rgba(255,255,255,0.5)",transition:"all 0.2s" }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── SALON CARD ────────────────────────────────────────────────────────────────
function SalonCard({ salon, onClick, lang }) {
  const t = T[lang];
  const [hov, setHov] = useState(false);
  const prods = salon._products || [];

  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:"#fff",borderRadius:12,overflow:"hidden",transition:"transform 0.25s,box-shadow 0.25s",transform:hov?"translateY(-3px)":"none",boxShadow:hov?"0 12px 40px rgba(0,0,0,0.12)":"0 2px 12px rgba(0,0,0,0.06)",cursor:"pointer" }}>
      <CardImage salon={salon} onClick={()=>onClick(salon)} />
      <div style={{ padding:"12px 14px 14px" }} onClick={()=>onClick(salon)}>
        {/* name + area */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:3 }}>
          <h3 style={{ margin:0,fontFamily:"'Cormorant Garamond',serif",fontSize:"17px",fontWeight:600,color:"#1a1a1a",lineHeight:1.2 }}>{salon.name}</h3>
          {salon.area && <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#aaa",marginLeft:8,whiteSpace:"nowrap",flexShrink:0 }}>{salon.area}</span>}
        </div>
        {/* address */}
        <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#bbb",margin:"0 0 8px",lineHeight:1.4 }}>{salon.address}</p>
        {/* bio */}
        {salon.salon_bio && <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#888",margin:"0 0 8px",lineHeight:1.5,fontStyle:"italic" }}>"{salon.salon_bio}"</p>}
        {/* products — photo cards */}
        {prods.length > 0 && (
          <div style={{ borderTop:"1px solid #f5f0f0",paddingTop:10,marginTop:6,display:"flex",gap:6,overflowX:"auto",paddingBottom:2 }}>
            {prods.map(p => {
              const isNew = p._badge==="new";
              const color = isNew?"#c9a96e":"#b85c5c";
              const img = Array.isArray(p.Image)?p.Image[0]?.url:null;
              return (
                <div key={p.id} style={{ flexShrink:0,width:64,cursor:"default" }}>
                  {/* product image */}
                  <div style={{ width:64,height:64,borderRadius:8,overflow:"hidden",background:"#f5f0eb",marginBottom:4,position:"relative",border:`1.5px solid ${isNew?"#e8d9b8":"#f0d0d0"}` }}>
                    {img
                      ? <img src={img} alt={p.product_name} style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                      : <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px" }}>✨</div>
                    }
                    {/* badge dot */}
                    <div style={{ position:"absolute",top:3,right:3,width:8,height:8,borderRadius:"50%",background:color,border:"1.5px solid #fff" }} />
                  </div>
                  <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"9px",color:color,fontWeight:700,letterSpacing:"0.8px",textTransform:"uppercase",margin:"0 0 1px",lineHeight:1.2 }}>{isNew?"New In":"Top Pick"}</p>
                  <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"9px",color:"#888",margin:0,lineHeight:1.3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{p.brand}</p>
                  <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"9px",color:"#bbb",margin:0,lineHeight:1.3 }}>{p.category}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── FILTER MODAL ──────────────────────────────────────────────────────────────
function FilterModal({ onClose, lang, filters, setFilters, areas, brands, sortBy, setSortBy, toggleArr }) {
  const t = T[lang];
  const [local, setLocal] = useState(filters);
  const [localSort, setLocalSort] = useState(sortBy);
  const apply = () => { setFilters(local); setSortBy(localSort); onClose(); };
  const clear = () => setLocal({ tier:[], area:"All", brand:"All", categories:[], kbeautyOnly:false });
  const activeCount = [local.tier.length>0,local.area!=="All",local.brand!=="All",local.categories.length>0,local.kbeautyOnly].filter(Boolean).length;
  const tog = (key, val) => setLocal(f=>({...f,[key]:f[key].includes(val)?f[key].filter(x=>x!==val):[...f[key],val]}));

  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,zIndex:2000,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)",display:"flex",alignItems:"flex-end",justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#faf7f4",width:"100%",maxWidth:600,borderRadius:"16px 16px 0 0",maxHeight:"88vh",overflow:"auto",boxShadow:"0 -8px 40px rgba(0,0,0,0.15)" }}>
        {/* header */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 24px 14px",borderBottom:"1px solid #ede8e2",position:"sticky",top:0,background:"#faf7f4",zIndex:1 }}>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",fontSize:"20px",color:"#999",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
          <h3 style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"14px",fontWeight:600,color:"#1a1a1a",margin:0 }}>{t.filter}</h3>
          <button onClick={clear} style={{ background:"none",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#aaa",textDecoration:"underline" }}>{t.clear}</button>
        </div>
        <div style={{ padding:"20px 24px 32px" }}>

          {/* K-Beauty toggle */}
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0",borderBottom:"1px solid #ede8e2",marginBottom:22 }}>
            <div>
              <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"13px",color:"#333",fontWeight:500 }}>✦ {t.filter_kbeauty}</span>
              <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#aaa",margin:"2px 0 0" }}>Only show salons with K-beauty products</p>
            </div>
            <div onClick={()=>setLocal(f=>({...f,kbeautyOnly:!f.kbeautyOnly}))}
              style={{ width:46,height:26,borderRadius:13,background:local.kbeautyOnly?"#b85c5c":"#ddd",cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0 }}>
              <div style={{ width:22,height:22,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:local.kbeautyOnly?22:2,transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)" }} />
            </div>
          </div>

          {/* Sort */}
          <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#aaa",letterSpacing:"1.5px",textTransform:"uppercase",margin:"0 0 10px" }}>Sort by</p>
          <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginBottom:22 }}>
            {[["az",t.sort_az],["tier",t.sort_tier],["area",t.sort_area]].map(([v,l])=>(
              <button key={v} onClick={()=>setLocalSort(v)} style={{ padding:"8px 16px",border:`1.5px solid ${localSort===v?"#1a1a1a":"#ede8e2"}`,background:localSort===v?"#1a1a1a":"#fff",color:localSort===v?"#fff":"#777",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",borderRadius:20,transition:"all 0.2s" }}>{l}</button>
            ))}
          </div>

          {/* Category — multi select */}
          <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#aaa",letterSpacing:"1.5px",textTransform:"uppercase",margin:"0 0 10px" }}>Category</p>
          <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginBottom:22 }}>
            {["Nail","Beauty","Hair","Spa"].map(cat=>{
              const active = local.categories.includes(cat);
              return (
                <button key={cat} onClick={()=>tog("categories",cat)}
                  style={{ padding:"8px 16px",border:`1.5px solid ${active?"#1a1a1a":"#ede8e2"}`,background:active?"#1a1a1a":"#fff",color:active?"#fff":"#777",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",borderRadius:20,transition:"all 0.2s" }}>
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Tier — multi select */}
          <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#aaa",letterSpacing:"1.5px",textTransform:"uppercase",margin:"0 0 10px" }}>{t.filter_tier}</p>
          <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginBottom:22 }}>
            {["Platinum","Gold","Silver"].map(v=>{
              const active = local.tier.includes(v);
              return (
                <button key={v} onClick={()=>tog("tier",v)}
                  style={{ padding:"8px 16px",border:`1.5px solid ${active?"#1a1a1a":"#ede8e2"}`,background:active?"#1a1a1a":"#fff",color:active?"#fff":"#777",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",borderRadius:20,transition:"all 0.2s",display:"flex",alignItems:"center",gap:5 }}>
                  <TierBadge tier={v} />{v}
                </button>
              );
            })}
          </div>

          {/* Area */}
          <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#aaa",letterSpacing:"1.5px",textTransform:"uppercase",margin:"0 0 10px" }}>{t.filter_area}</p>
          <select value={local.area} onChange={e=>setLocal(f=>({...f,area:e.target.value}))}
            style={{ width:"100%",padding:"11px 14px",border:"1px solid #ede8e2",background:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",color:"#555",borderRadius:8,outline:"none",marginBottom:22,cursor:"pointer" }}>
            {areas.map(a=><option key={a} value={a}>{a==="All"?t.all:a}</option>)}
          </select>

          {/* Brand */}
          <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#aaa",letterSpacing:"1.5px",textTransform:"uppercase",margin:"0 0 10px" }}>{t.filter_brand}</p>
          <select value={local.brand} onChange={e=>setLocal(f=>({...f,brand:e.target.value}))}
            style={{ width:"100%",padding:"11px 14px",border:"1px solid #ede8e2",background:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",color:"#555",borderRadius:8,outline:"none",marginBottom:24,cursor:"pointer" }}>
            {brands.map(b=><option key={b} value={b}>{b==="All"?t.all:b}</option>)}
          </select>

          {/* Apply */}
          <button onClick={apply} style={{ width:"100%",padding:"15px",background:"#1a1a1a",color:"#fff",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",fontWeight:600,letterSpacing:"2px",textTransform:"uppercase",borderRadius:8 }}>
            {activeCount>0?`Apply (${activeCount} active)`:"Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SALON MODAL ───────────────────────────────────────────────────────────────
function SalonModal({ salon, onClose, leafletReady, lang }) {
  if (!salon) return null;
  const t = T[lang];
  const prods = salon._products || [];
  const services = salon.main_services ? salon.main_services.split(",").map(s=>s.trim()).filter(Boolean) : [];
  const contactUrl = salon.instagram || salon.google_maps_url;
  const contactLabel = salon.instagram ? salon.instagram : "Google Maps →";
  const salonImg = (() => {
    if (!salon.salon_image) return null;
    if (Array.isArray(salon.salon_image)) return salon.salon_image[0]?.url;
    return salon.salon_image;
  })();

  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,zIndex:1500,background:"rgba(8,6,4,0.8)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,overflowY:"auto" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#faf7f4",maxWidth:680,width:"100%",maxHeight:"92vh",overflow:"auto",borderRadius:16,boxShadow:"0 48px 120px rgba(0,0,0,0.35)" }}>
        {/* Hero */}
        <div style={{ position:"relative",paddingBottom:"40%",overflow:"hidden",background:"#1a1a1a",borderRadius:"16px 16px 0 0",minHeight:160 }}>
          {salonImg
            ? <img src={salonImg} alt={salon.name} style={{ position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover" }} />
            : <div style={{ position:"absolute",inset:0,background:"linear-gradient(135deg,#1a1a1a 0%,#2d2420 100%)" }} />
          }
          <div style={{ position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.7) 0%,rgba(0,0,0,0.1) 60%,transparent 100%)" }} />
          <button onClick={onClose} style={{ position:"absolute",top:16,right:16,background:"rgba(255,255,255,0.15)",color:"#fff",border:"none",width:34,height:34,borderRadius:"50%",cursor:"pointer",fontSize:"18px",display:"flex",alignItems:"center",justifyContent:"center",zIndex:10 }}>×</button>
          <div style={{ position:"absolute",bottom:22,left:26 }}>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4 }}>
              <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#c9a96e",letterSpacing:"2.5px",textTransform:"uppercase",margin:0 }}>{salon.category} · Paris</p>
              {salon.salon_tier && <TierBadge tier={salon.salon_tier} />}
            </div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"32px",fontWeight:600,color:"#fff",margin:0 }}>{salon.name}</h2>
          </div>
        </div>
        <div style={{ padding:"22px 26px 32px" }}>
          {/* info grid */}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16 }}>
            <div style={{ background:"#fff",border:"1px solid #ede8e2",padding:"11px 14px",borderRadius:8 }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"9px",color:"#c0bbb5",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:3 }}>{t.address}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#444" }}>📍 {salon.address}</div>
            </div>
            <div style={{ background:"#fff",border:"1px solid #ede8e2",padding:"11px 14px",borderRadius:8 }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"9px",color:"#c0bbb5",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:3 }}>{t.contact}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#444" }}>
                {contactUrl
                  ? <a href={contactUrl.startsWith("http")?contactUrl:`https://instagram.com/${contactUrl.replace("@","")}`} target="_blank" rel="noopener noreferrer" style={{ color:"#b85c5c",textDecoration:"none" }}>📸 {contactLabel}</a>
                  : "—"
                }
              </div>
            </div>
            {salon.salon_bio && (
              <div style={{ background:"#fff",border:"1px solid #ede8e2",padding:"11px 14px",borderRadius:8,gridColumn:"1/-1" }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"9px",color:"#c0bbb5",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:3 }}>{t.bio}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#555",lineHeight:1.5 }}>✦ {salon.salon_bio}</div>
              </div>
            )}
          </div>
          {/* services */}
          {services.length>0 && (
            <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:20 }}>
              {services.map(s=>(
                <span key={s} style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#666",background:"#fff",border:"1px solid #ede8e2",padding:"4px 12px",borderRadius:"20px" }}>{s}</span>
              ))}
            </div>
          )}
          {/* K-beauty products */}
          {prods.length>0 && (
            <div style={{ marginBottom:24 }}>
              <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:10 }}>
                <div style={{ height:1,flex:1,background:"#ede8e2" }} />
                <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"9px",color:"#b85c5c",letterSpacing:"2.5px",textTransform:"uppercase",fontWeight:700,margin:0,whiteSpace:"nowrap" }}>{t.kbeauty}</p>
                <div style={{ height:1,flex:1,background:"#ede8e2" }} />
              </div>
              <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#aaa",margin:"0 0 14px",lineHeight:1.6 }}>{t.kbeauty_sub}</p>
              <div style={{ display:"flex",gap:12,overflowX:"auto",paddingBottom:8 }}>
                {prods.map(p => {
                  const isNew=p._badge==="new";
                  const color=isNew?"#c9a96e":"#b85c5c";
                  const border=isNew?"#e8d9b8":"#f0d0d0";
                  const img=Array.isArray(p.Image)?p.Image[0]?.url:null;
                  return (
                    <div key={p.id} style={{ background:"#fff",border:`1px solid ${border}`,overflow:"hidden",flexShrink:0,width:180,borderRadius:8 }}>
                      <div style={{ position:"relative",paddingBottom:"80%",overflow:"hidden" }}>
                        {img?<img src={img} alt={p.product_name} style={{ position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover" }} />
                          :<div style={{ position:"absolute",inset:0,background:"#f5f0eb",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"32px" }}>✨</div>}
                        <div style={{ position:"absolute",top:8,left:8,background:color,color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:"8px",fontWeight:800,letterSpacing:"1.5px",textTransform:"uppercase",padding:"3px 9px",borderRadius:4 }}>
                          {isNew?t.new_in:t.popular}
                        </div>
                      </div>
                      <div style={{ padding:"11px 13px 14px" }}>
                        <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"9px",color,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",margin:"0 0 3px" }}>{p.brand}</p>
                        <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#2a2a2a",margin:"0 0 4px",lineHeight:1.4 }}>{p.product_name}</p>
                        {p.description&&<p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#999",margin:0,lineHeight:1.5 }}>{p.description}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* booking */}
          {salon.bookingUrl && (
            <div style={{ borderTop:"1px solid #ede8e2",paddingTop:20,marginBottom:20 }}>
              <a href={salon.bookingUrl} target="_blank" rel="noopener noreferrer"
                style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:12,background:"#1a1a1a",color:"#f5f0eb",textDecoration:"none",padding:"15px 28px",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",fontWeight:600,letterSpacing:"2px",textTransform:"uppercase",width:"100%",borderRadius:8,transition:"background 0.2s" }}
                onMouseEnter={e=>e.currentTarget.style.background="#b85c5c"}
                onMouseLeave={e=>e.currentTarget.style.background="#1a1a1a"}
              >
                <span>{t.book} — {salon.name}</span>
                {salon.bookingPlatform&&<span style={{ fontSize:"10px",color:"#888",fontWeight:400 }}>{t.via} {salon.bookingPlatform}</span>}
                <span style={{ marginLeft:"auto" }}>→</span>
              </a>
            </div>
          )}
          {/* mini map */}
          {leafletReady&&salon.latitude&&salon.longitude&&(
            <div style={{ overflow:"hidden",border:"1px solid #ede8e2",borderRadius:8 }}>
              <div style={{ background:"#fff",padding:"10px 14px",borderBottom:"1px solid #ede8e2",display:"flex",alignItems:"center",gap:6 }}>
                <span>📍</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#888" }}>{salon.address}</span>
              </div>
              <MiniMap salon={salon} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── JOIN MODAL ────────────────────────────────────────────────────────────────
function JoinModal({ onClose, lang, salons }) {
  const t = T[lang];
  const [firstName,setFirstName]=useState(""), [email,setEmail]=useState(""), [salon,setSalon]=useState("");
  const [status,setStatus]=useState("idle");
  const submit = async () => {
    if (!firstName.trim()||!email.trim()) return;
    setStatus("loading");
    try {
      const res=await fetch(`https://api.airtable.com/v0/${AT_BASE}/${TBL_MEMBERS}`,{
        method:"POST",headers:{Authorization:`Bearer ${AT_KEY}`,"Content-Type":"application/json"},
        body:JSON.stringify({records:[{fields:{first_name:firstName.trim(),email:email.trim(),favourite_salon:salon||undefined,joined_at:new Date().toISOString().split("T")[0],status:"active"}}]})
      });
      setStatus(res.ok?"success":"error");
    } catch { setStatus("error"); }
  };
  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,zIndex:3000,background:"rgba(8,6,4,0.82)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#faf7f4",maxWidth:440,width:"100%",borderRadius:16,overflow:"hidden",boxShadow:"0 48px 120px rgba(0,0,0,0.4)" }}>
        <div style={{ background:"#0d0d0d",padding:"28px 28px 24px",position:"relative",overflow:"hidden" }}>
          <div style={{ position:"absolute",top:-50,right:-50,width:180,height:180,borderRadius:"50%",border:"1px solid rgba(201,169,110,0.15)" }} />
          <button onClick={onClose} style={{ position:"absolute",top:14,right:14,background:"rgba(255,255,255,0.1)",color:"#fff",border:"none",width:28,height:28,borderRadius:"50%",cursor:"pointer",fontSize:"15px",display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
          <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#c9a96e",letterSpacing:"3px",textTransform:"uppercase",margin:"0 0 8px" }}>✦ The Beauty Pause</p>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"26px",fontWeight:400,color:"#f5f0eb",margin:"0 0 8px",lineHeight:1.2 }}>{t.join_title}</h2>
          <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#777",lineHeight:1.7,margin:0 }}>{t.join_sub}</p>
        </div>
        <div style={{ padding:"24px 28px 28px" }}>
          {status==="success" ? (
            <div style={{ textAlign:"center",padding:"16px 0" }}>
              <div style={{ fontSize:"36px",marginBottom:12 }}>✦</div>
              <h3 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"24px",fontWeight:400,color:"#1a1a1a",margin:"0 0 8px" }}>{t.join_success_title}</h3>
              <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"13px",color:"#888",lineHeight:1.7,marginBottom:20 }}>{t.join_success_sub}</p>
              <button onClick={onClose} style={{ padding:"10px 24px",background:"#1a1a1a",color:"#f5f0eb",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"11px",fontWeight:600,letterSpacing:"2px",textTransform:"uppercase",borderRadius:8 }}>Close</button>
            </div>
          ) : (
            <>
              {[{label:t.join_name,val:firstName,set:setFirstName,type:"text"},{label:t.join_email,val:email,set:setEmail,type:"email"}].map(({label,val,set,type})=>(
                <div key={label} style={{ marginBottom:14 }}>
                  <label style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#aaa",letterSpacing:"1.5px",textTransform:"uppercase",display:"block",marginBottom:5 }}>{label}</label>
                  <input type={type} value={val} onChange={e=>set(e.target.value)}
                    style={{ width:"100%",padding:"11px 14px",border:"1px solid #ede8e2",background:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",color:"#1a1a1a",outline:"none",borderRadius:8,transition:"border 0.2s" }}
                    onFocus={e=>e.target.style.borderColor="#c9a96e"} onBlur={e=>e.target.style.borderColor="#ede8e2"} />
                </div>
              ))}
              <div style={{ marginBottom:20 }}>
                <label style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#aaa",letterSpacing:"1.5px",textTransform:"uppercase",display:"block",marginBottom:5 }}>{t.join_salon}</label>
                <select value={salon} onChange={e=>setSalon(e.target.value)}
                  style={{ width:"100%",padding:"11px 14px",border:"1px solid #ede8e2",background:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",color:salon?"#1a1a1a":"#aaa",outline:"none",borderRadius:8,cursor:"pointer",transition:"border 0.2s",appearance:"none" }}
                  onFocus={e=>e.target.style.borderColor="#c9a96e"} onBlur={e=>e.target.style.borderColor="#ede8e2"}>
                  <option value="">{t.join_salon_ph}</option>
                  {salons.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              {status==="error"&&<p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#b85c5c",margin:"0 0 12px" }}>{t.join_error}</p>}
              <button onClick={submit} disabled={!firstName.trim()||!email.trim()||status==="loading"}
                style={{ width:"100%",padding:"14px",background:(!firstName.trim()||!email.trim())?"#ccc":"#1a1a1a",color:"#f5f0eb",border:"none",cursor:(!firstName.trim()||!email.trim())?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"11px",fontWeight:600,letterSpacing:"2px",textTransform:"uppercase",borderRadius:8,transition:"background 0.2s" }}
                onMouseEnter={e=>{if(firstName.trim()&&email.trim())e.target.style.background="#b85c5c";}}
                onMouseLeave={e=>{if(firstName.trim()&&email.trim())e.target.style.background="#1a1a1a";}}>
                {status==="loading"?t.joining:t.join_submit}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MOBILE MAP + BOTTOM SHEET ─────────────────────────────────────────────────
function MobileMapView({ salons, filtered, loading, onSalonClick, onBoundsChange, leafletReady, lang }) {
  const t = T[lang];
  const [sheetState, setSheetState] = useState("peek"); // "peek" | "open" | "closed"
  const [pinnedSalon, setPinnedSalon] = useState(null);
  const sheetRef = useRef(null);
  const startY = useRef(null);
  const startState = useRef(null);

  const HEIGHTS = { closed: 80, peek: 260, open: window.innerHeight * 0.75 };

  const handleMarkerClick = (salon) => {
    setPinnedSalon(salon);
    setSheetState("peek");
  };

  // drag handlers
  const onTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
    startState.current = sheetState;
  };
  const onTouchEnd = (e) => {
    const dy = startY.current - e.changedTouches[0].clientY;
    if (dy > 40) setSheetState(s => s === "closed" ? "peek" : "open");
    else if (dy < -40) setSheetState(s => s === "open" ? "peek" : "closed");
  };

  const h = HEIGHTS[sheetState];

  return (
    <div style={{ position:"relative", height:"calc(100vh - 58px - 44px)", overflow:"hidden" }}>
      {/* FULL MAP */}
      <div style={{ position:"absolute", inset:0 }}>
        {leafletReady
          ? <SplitMap salons={salons} onSalonClick={handleMarkerClick} onBoundsChange={onBoundsChange} />
          : <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", color:"#aaa" }}>Loading map…</div>
        }
      </div>

      {/* BOTTOM SHEET */}
      <div ref={sheetRef}
        style={{ position:"absolute", bottom:0, left:0, right:0, height:h, background:"#faf7f4", borderRadius:"16px 16px 0 0", boxShadow:"0 -4px 24px rgba(0,0,0,0.15)", transition:"height 0.3s cubic-bezier(0.32,0.72,0,1)", zIndex:100, display:"flex", flexDirection:"column" }}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

        {/* drag handle */}
        <div style={{ padding:"12px 0 8px", display:"flex", justifyContent:"center", flexShrink:0, cursor:"pointer" }}
          onClick={() => setSheetState(s => s === "open" ? "peek" : s === "peek" ? "closed" : "peek")}>
          <div style={{ width:36, height:4, borderRadius:2, background:"#ddd" }} />
        </div>

        {/* pinned salon preview */}
        {pinnedSalon && sheetState !== "open" && (
          <div onClick={() => onSalonClick(pinnedSalon)}
            style={{ margin:"0 14px 12px", background:"#fff", borderRadius:12, padding:"10px 12px", display:"flex", gap:12, alignItems:"center", boxShadow:"0 2px 12px rgba(0,0,0,0.08)", cursor:"pointer", flexShrink:0 }}>
            {/* thumbnail */}
            <div style={{ width:60, height:60, borderRadius:8, overflow:"hidden", flexShrink:0, background:"#1a1a1a" }}>
              {(() => {
                const img = Array.isArray(pinnedSalon.salon_image) ? pinnedSalon.salon_image[0]?.url : pinnedSalon.salon_image;
                return img ? <img src={img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"24px", color:"rgba(201,169,110,0.4)" }}>{pinnedSalon.name?.[0]}</span></div>;
              })()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"16px", fontWeight:600, color:"#1a1a1a", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{pinnedSalon.name}</h3>
                {pinnedSalon.salon_tier && <TierBadge tier={pinnedSalon.salon_tier} />}
              </div>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"11px", color:"#aaa", margin:"0 0 4px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{pinnedSalon.address}</p>
              <div style={{ display:"flex", gap:4 }}>
                {(pinnedSalon._products||[]).slice(0,2).map(p => {
                  const isNew = p._badge==="new";
                  const img = Array.isArray(p.Image)?p.Image[0]?.url:null;
                  return (
                    <div key={p.id} style={{ display:"flex", alignItems:"center", gap:3, background:isNew?"#fdf8ee":"#fdf0f0", padding:"2px 7px 2px 3px", borderRadius:20, border:`1px solid ${isNew?"#e8d9b8":"#f0d0d0"}` }}>
                      {img && <img src={img} alt="" style={{ width:14, height:14, borderRadius:"50%", objectFit:"cover" }} />}
                      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"9px", color:isNew?"#a07832":"#b85c5c", fontWeight:700 }}>{isNew?"New":"Top"}</span>
                      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"9px", color:"#777" }}>{p.brand}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <span style={{ color:"#ccc", fontSize:"18px", flexShrink:0 }}>›</span>
          </div>
        )}

        {/* count bar */}
        {sheetState !== "closed" && (
          <div style={{ padding:"0 16px 8px", flexShrink:0 }}>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"12px", color:"#aaa", margin:0 }}>
              {filtered.length} {t.salons}
            </p>
          </div>
        )}

        {/* scrollable list — only when open */}
        {sheetState === "open" && (
          <div style={{ flex:1, overflowY:"auto", padding:"0 14px 24px" }}>
            {loading
              ? <div style={{ textAlign:"center", padding:"40px 0", fontFamily:"'Cormorant Garamond',serif", fontSize:"18px", color:"#ccc" }}>{t.loading}</div>
              : filtered.length === 0
                ? <div style={{ textAlign:"center", padding:"40px 0", fontFamily:"'Cormorant Garamond',serif", fontSize:"18px", color:"#ccc" }}>{t.no_salons}</div>
                : <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    {filtered.map((salon,i) => (
                      <div key={salon.id} style={{ animation:`fadeUp 0.35s ease ${i*0.03}s both` }}>
                        <SalonCard salon={salon} onClick={onSalonClick} lang={lang} />
                      </div>
                    ))}
                  </div>
            }
          </div>
        )}

        {/* peek state — horizontal scroll */}
        {sheetState === "peek" && !pinnedSalon && (
          <div style={{ flex:1, overflowX:"auto", display:"flex", gap:12, padding:"0 14px 16px", alignItems:"flex-start" }}>
            {loading
              ? <div style={{ display:"flex", alignItems:"center", fontFamily:"'DM Sans',sans-serif", fontSize:"13px", color:"#aaa" }}>{t.loading}</div>
              : filtered.slice(0,10).map(salon => {
                  const img = Array.isArray(salon.salon_image)?salon.salon_image[0]?.url:salon.salon_image;
                  return (
                    <div key={salon.id} onClick={() => onSalonClick(salon)}
                      style={{ flexShrink:0, width:160, background:"#fff", borderRadius:10, overflow:"hidden", boxShadow:"0 2px 10px rgba(0,0,0,0.08)", cursor:"pointer" }}>
                      <div style={{ paddingBottom:"60%", position:"relative", overflow:"hidden", background:"#1a1a1a" }}>
                        {img ? <img src={img} alt={salon.name} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
                          : <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg,#2a2a2a,#1a1a1a)", display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"28px", color:"rgba(201,169,110,0.25)" }}>{salon.name?.[0]}</span></div>}
                        {salon.salon_tier && <div style={{ position:"absolute", top:6, right:6 }}><TierBadge tier={salon.salon_tier} /></div>}
                      </div>
                      <div style={{ padding:"8px 10px 10px" }}>
                        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"14px", fontWeight:600, color:"#1a1a1a", margin:"0 0 2px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{salon.name}</p>
                        <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"10px", color:"#bbb", margin:"0 0 5px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{salon.area||"Paris"}</p>
                        {(salon._products||[]).length > 0 && (
                          <div style={{ display:"flex", gap:3 }}>
                            {(salon._products||[]).slice(0,2).map(p => {
                              const isNew = p._badge==="new";
                              return <span key={p.id} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"8px", color:isNew?"#a07832":"#b85c5c", background:isNew?"#fdf8ee":"#fdf0f0", padding:"2px 6px", borderRadius:10, fontWeight:600 }}>{isNew?"New":"Top"}</span>;
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
            }
          </div>
        )}
      </div>
    </div>
  );
}
const CATEGORIES = ["All","Nail","Beauty","Hair","Spa"];
const TIER_ORDER = {Platinum:0,Gold:1,Silver:2};

export default function App() {
  const [lang,setLang]=useState("en"); const t=T[lang];
  const [salons,setSalons]=useState([]);
  const [filtered,setFiltered]=useState([]);
  const [visibleIds,setVisibleIds]=useState(null);
  const [search,setSearch]=useState("");
  const [filters,setFilters]=useState({tier:[],area:"All",brand:"All",categories:[],kbeautyOnly:true});
  const [sortBy,setSortBy]=useState("az");
  const [view,setView]=useState("split"); // split | list | products
  const [showFilter,setShowFilter]=useState(false);
  const [showJoin,setShowJoin]=useState(false);
  const [selectedSalon,setSelectedSalon]=useState(null);
  const [leafletReady,setLeafletReady]=useState(false);
  const [loading,setLoading]=useState(true);
  const [isMobile,setIsMobile]=useState(window.innerWidth < 768);

  useEffect(()=>{
    const handler=()=>setIsMobile(window.innerWidth<768);
    window.addEventListener("resize",handler);
    return ()=>window.removeEventListener("resize",handler);
  },[]);

  // load Leaflet
  useEffect(()=>{
    if (window.L){setLeafletReady(true);return;}
    const link=document.createElement("link");link.rel="stylesheet";link.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";document.head.appendChild(link);
    const s=document.createElement("script");s.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";s.onload=()=>setLeafletReady(true);document.head.appendChild(s);
  },[]);

  // fetch data
  useEffect(()=>{
    (async()=>{
      setLoading(true);
      try {
        const [retailRecords,productRecords,slotRecords]=await Promise.all([
          fetchAll(TBL_RETAIL,"{current_status}='YES'"),
          fetchAll(TBL_PRODUCTS,""),
          fetchAll(TBL_SLOTS,"{stage}='ACTIVE'"),
        ]);
        const productById={};
        productRecords.forEach(p=>{productById[p.id]=p;});
        const salonProds={};
        slotRecords.forEach(slot=>{
          const salonIds=Array.isArray(slot.retail_name)?slot.retail_name:[];
          const productIds=Array.isArray(slot.product)?slot.product:[];
          const brandVal=Array.isArray(slot.brand)?slot.brand[0]:slot.brand;
          const imageVal=slot["Image (from product)"];
          salonIds.forEach(salonId=>{
            if (!salonProds[salonId]) salonProds[salonId]=[];
            productIds.forEach(pid=>{
              if (!productById[pid]) return;
              const prod={...productById[pid]};
              if (!prod.brand||Array.isArray(prod.brand)) prod.brand=brandVal||"—";
              if ((!prod.Image||Array.isArray(prod.Image)&&prod.Image.length===0)&&imageVal) prod.Image=imageVal;
              prod._badge=salonProds[salonId].length===0?"new":"popular";
              salonProds[salonId].push(prod);
            });
          });
        });
        const enriched=retailRecords.map(s=>({...s,_products:salonProds[s.id]||[]}));
        setSalons(enriched); setFiltered(enriched);
      } catch(e){console.error(e);}
      setLoading(false);
    })();
  },[]);

  // derived filter options
  const areas=["All",...Array.from(new Set(salons.map(s=>s.area).filter(Boolean))).sort()];
  const brands=["All",...Array.from(new Set(salons.flatMap(s=>(s._products||[]).map(p=>p.brand)).filter(Boolean))).sort()];

  // toggle helper for arrays
  const toggleArr = (arr, val) => arr.includes(val) ? arr.filter(x=>x!==val) : [...arr, val];

  // apply filters
  useEffect(()=>{
    let r=[...salons];
    if (filters.categories.length>0) r=r.filter(s=>filters.categories.map(c=>c.toLowerCase()).includes((s.category||"").toLowerCase()));
    if (filters.tier.length>0) r=r.filter(s=>filters.tier.includes(s.salon_tier));
    if (filters.area!=="All") r=r.filter(s=>s.area===filters.area);
    if (filters.brand!=="All") r=r.filter(s=>(s._products||[]).some(p=>p.brand===filters.brand));
    if (filters.kbeautyOnly) r=r.filter(s=>(s._products||[]).length>0);
    if (search) r=r.filter(s=>s.name?.toLowerCase().includes(search.toLowerCase())||s.address?.toLowerCase().includes(search.toLowerCase()));
    if (sortBy==="az") r.sort((a,b)=>(a.name||"").localeCompare(b.name||""));
    if (sortBy==="tier") r.sort((a,b)=>(TIER_ORDER[a.salon_tier]??9)-(TIER_ORDER[b.salon_tier]??9));
    if (sortBy==="area") r.sort((a,b)=>(a.area||"").localeCompare(b.area||""));
    if (visibleIds&&view==="split") r=r.filter(s=>visibleIds.includes(s.id));
    setFiltered(r);
  },[search,salons,sortBy,filters,visibleIds,view]);

  const activeFilterCount=[filters.tier.length>0,filters.area!=="All",filters.brand!=="All",filters.categories.length>0,filters.kbeautyOnly].filter(Boolean).length;

  // products by category view
  const productsByCategory = (() => {
    const map={};
    filtered.forEach(salon=>{
      (salon._products||[]).forEach(p=>{
        const cat=p.category||"Other";
        if (!map[cat]) map[cat]=[];
        const existing=map[cat].find(x=>x.prod.id===p.id);
        if (existing){if(!existing.salons)existing.salons=[existing.salon];if(!existing.salons.find(s=>s.id===salon.id))existing.salons.push(salon);}
        else map[cat].push({prod:p,salon,salons:[salon]});
      });
    });
    return map;
  })();

  const [page, setPage] = useState("landing"); // "landing" | "salons"

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{background:#0d0d0d;height:100%}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:#c9a96e;border-radius:3px}
        .leaflet-tooltip{background:#fff;border:1px solid #ede8e2;border-radius:8px;padding:6px 10px;box-shadow:0 4px 12px rgba(0,0,0,0.1)}
      `}</style>

      {/* ── LANDING PAGE ── */}
      {page === "landing" && (
        <div style={{ minHeight:"100vh", background:"#0d0d0d", display:"flex", flexDirection:"column", position:"relative", overflow:"hidden" }}>

          {/* decorative circles */}
          <div style={{ position:"absolute", top:-200, right:-200, width:600, height:600, borderRadius:"50%", border:"1px solid rgba(201,169,110,0.08)", pointerEvents:"none" }} />
          <div style={{ position:"absolute", top:-100, right:-100, width:400, height:400, borderRadius:"50%", border:"1px solid rgba(201,169,110,0.05)", pointerEvents:"none" }} />
          <div style={{ position:"absolute", bottom:-150, left:-150, width:500, height:500, borderRadius:"50%", border:"1px solid rgba(201,169,110,0.06)", pointerEvents:"none" }} />

          {/* nav */}
          <nav style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 clamp(20px,5vw,48px)", height:60, flexShrink:0 }}>
            <div>
              <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"16px", color:"#f5f0eb", letterSpacing:"2px", fontWeight:300 }}>THE</span>
              <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"16px", color:"#c9a96e", letterSpacing:"2px", fontWeight:600, marginLeft:6 }}>BEAUTY PAUSE</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <button onClick={()=>setShowJoin(true)}
                style={{ padding:"7px 16px", background:"#c9a96e", color:"#0d0d0d", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:"11px", fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", borderRadius:20 }}>
                ✦ {t.join}
              </button>
              <div style={{ display:"flex", border:"1px solid #333", borderRadius:20, overflow:"hidden" }}>
                {["en","fr"].map(l=>(
                  <button key={l} onClick={()=>setLang(l)}
                    style={{ padding:"5px 10px", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:"11px", fontWeight:600, color:lang===l?"#0d0d0d":"#777", background:lang===l?"#c9a96e":"transparent", transition:"all 0.2s", textTransform:"uppercase" }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </nav>

          {/* hero content */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"0 clamp(20px,5vw,48px)", maxWidth:760, animation:"fadeUp 0.9s ease both" }}>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"11px", color:"#c9a96e", letterSpacing:"4px", textTransform:"uppercase", marginBottom:20 }}>{t.tagline}</p>
            <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(48px,7vw,88px)", fontWeight:300, color:"#f5f0eb", lineHeight:1.0, marginBottom:24 }}>
              {t.hero_title_1}<br/>
              <em style={{ fontStyle:"italic", color:"#c9a96e" }}>{t.hero_title_2}</em>
            </h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(14px,1.6vw,16px)", color:"#888", lineHeight:1.8, marginBottom:40, maxWidth:480 }}>
              {t.hero_sub}
            </p>

            {/* stats row */}
            <div style={{ display:"flex", gap:40, marginBottom:44, flexWrap:"wrap" }}>
              {[
                { num: salons.length || "18", label: lang==="en"?"curated salons":"salons sélectionnés" },
                { num: "6", label: lang==="en"?"K-beauty brands":"marques K-beauty" },
                { num: "Paris", label: lang==="en"?"city":"ville" },
              ].map(({num,label})=>(
                <div key={label}>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(28px,4vw,42px)", fontWeight:400, color:"#f5f0eb", lineHeight:1 }}>{num}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"11px", color:"#666", letterSpacing:"1px", textTransform:"uppercase", marginTop:4 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              <button onClick={()=>setPage("salons")}
                style={{ padding:"14px 32px", background:"#f5f0eb", color:"#0d0d0d", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:"12px", fontWeight:700, letterSpacing:"2px", textTransform:"uppercase", borderRadius:8, transition:"all 0.2s" }}
                onMouseEnter={e=>{e.target.style.background="#c9a96e";}}
                onMouseLeave={e=>{e.target.style.background="#f5f0eb";}}>
                {lang==="en"?"Find a salon →":"Trouver un salon →"}
              </button>
              <button onClick={()=>{setPage("salons");setTimeout(()=>setView("products"),100);}}
                style={{ padding:"14px 32px", background:"transparent", color:"#f5f0eb", border:"1px solid rgba(255,255,255,0.2)", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:"12px", fontWeight:500, letterSpacing:"2px", textTransform:"uppercase", borderRadius:8, transition:"all 0.2s" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="#c9a96e";e.currentTarget.style.color="#c9a96e";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.2)";e.currentTarget.style.color="#f5f0eb";}}>
                {lang==="en"?"✦ K-Beauty products":"✦ Produits K-Beauty"}
              </button>
            </div>
          </div>

          {/* how it works */}
          <div style={{ padding:"clamp(32px,5vw,60px) clamp(20px,5vw,48px)", borderTop:"1px solid rgba(255,255,255,0.06)", animation:"fadeUp 0.9s ease 0.2s both" }}>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"10px", color:"#555", letterSpacing:"3px", textTransform:"uppercase", marginBottom:28 }}>{lang==="en"?"How it works":"Comment ça marche"}</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:24, maxWidth:800 }}>
              {[
                { n:"01", en:"Visit a salon", fr:"Visitez un salon", sub_en:"Find a participating salon near you", sub_fr:"Trouvez un salon partenaire près de chez vous" },
                { n:"02", en:"Try K-beauty", fr:"Découvrez le K-beauty", sub_en:"Ask your stylist to try our curated products", sub_fr:"Demandez à essayer nos produits sélectionnés" },
                { n:"03", en:"Join the community", fr:"Rejoignez la communauté", sub_en:"Get exclusive events and free product drops", sub_fr:"Recevez des événements exclusifs et produits offerts" },
              ].map(step=>(
                <div key={step.n} style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
                  <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"32px", color:"rgba(201,169,110,0.3)", fontWeight:300, lineHeight:1, flexShrink:0 }}>{step.n}</span>
                  <div>
                    <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"13px", color:"#f5f0eb", fontWeight:500, margin:"4px 0 4px" }}>{lang==="en"?step.en:step.fr}</p>
                    <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"12px", color:"#666", lineHeight:1.6, margin:0 }}>{lang==="en"?step.sub_en:step.sub_fr}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SALONS PAGE ── */}
      {page === "salons" && (<>
        {/* NAV */}
        <nav style={{ background:"#0d0d0d",height:58,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",position:"sticky",top:0,zIndex:500,boxShadow:"0 1px 0 rgba(255,255,255,0.05)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button onClick={()=>setPage("landing")}
              style={{ background:"none",border:"none",cursor:"pointer",color:"#777",fontSize:"18px",display:"flex",alignItems:"center",padding:"4px 6px",transition:"color 0.2s",lineHeight:1 }}
              onMouseEnter={e=>e.currentTarget.style.color="#f5f0eb"} onMouseLeave={e=>e.currentTarget.style.color="#777"}>←</button>
            <div style={{ cursor:"pointer" }} onClick={()=>setPage("landing")}>
              <span style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"16px",color:"#f5f0eb",letterSpacing:"2px",fontWeight:300 }}>THE</span>
              <span style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"16px",color:"#c9a96e",letterSpacing:"2px",fontWeight:600,marginLeft:6 }}>BEAUTY PAUSE</span>
            </div>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <button onClick={()=>setShowJoin(true)}
              style={{ padding:"7px 16px",background:"#c9a96e",color:"#0d0d0d",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"11px",fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",borderRadius:20,flexShrink:0 }}>
              ✦ {t.join}
            </button>
            <div style={{ display:"flex",border:"1px solid #333",borderRadius:20,overflow:"hidden",flexShrink:0 }}>
              {["en","fr"].map(l=>(
                <button key={l} onClick={()=>setLang(l)}
                  style={{ padding:"5px 10px",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"11px",fontWeight:600,letterSpacing:"1px",color:lang===l?"#0d0d0d":"#777",background:lang===l?"#c9a96e":"transparent",transition:"all 0.2s",textTransform:"uppercase" }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* SEARCH BAR — slim */}
        <div style={{ background:"#0d0d0d", padding:"14px clamp(16px,3vw,32px)" }}>
          <div style={{ display:"flex", maxWidth:480 }}>
            <input placeholder={t.search_placeholder} value={search} onChange={e=>setSearch(e.target.value)}
              style={{ flex:1,padding:"11px 16px",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",border:"none",background:"#1a1a1a",color:"#f5f0eb",outline:"none",caretColor:"#c9a96e",borderRadius:"8px 0 0 8px",minWidth:0 }} />
            <div style={{ padding:"11px 16px",background:"#c9a96e",display:"flex",alignItems:"center",borderRadius:"0 8px 8px 0",flexShrink:0 }}>→</div>
          </div>
        </div>

      {/* FILTER BAR */}
      <div style={{ background:"#fff",borderBottom:"1px solid #ede8e2",padding:"10px clamp(12px,3vw,24px)",display:"flex",alignItems:"center",gap:8,overflowX:"auto",position:"sticky",top:58,zIndex:400,flexWrap:"nowrap" }}>
        {/* filter button with badge */}
        <button onClick={()=>setShowFilter(true)}
          style={{ display:"flex",alignItems:"center",gap:6,padding:"7px 14px",border:`1.5px solid ${activeFilterCount>0?"#1a1a1a":"#ede8e2"}`,background:activeFilterCount>0?"#1a1a1a":"#fff",color:activeFilterCount>0?"#fff":"#555",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",fontWeight:500,borderRadius:20,flexShrink:0,transition:"all 0.2s" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
          {t.filter}
          {activeFilterCount>0 && (
            <span style={{ background:"#c9a96e",color:"#0d0d0d",borderRadius:"50%",width:20,height:20,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:700,lineHeight:1 }}>{activeFilterCount}</span>
          )}
        </button>
        <div style={{ width:1,height:20,background:"#ede8e2",flexShrink:0 }} />
        {/* K-beauty toggle */}
        <button onClick={()=>setFilters(f=>({...f,kbeautyOnly:!f.kbeautyOnly}))}
          style={{ padding:"7px 14px",border:`1.5px solid ${filters.kbeautyOnly?"#b85c5c":"#ede8e2"}`,background:filters.kbeautyOnly?"#fdf0f0":"#fff",color:filters.kbeautyOnly?"#b85c5c":"#666",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",fontWeight:filters.kbeautyOnly?600:400,borderRadius:20,flexShrink:0,transition:"all 0.2s",whiteSpace:"nowrap" }}>
          ✦ K-Beauty
        </button>
        {/* multi-select category chips — no All */}
        {["Nail","Beauty","Hair","Spa"].map(cat=>{
          const active = filters.categories.includes(cat);
          return (
            <button key={cat} onClick={()=>setFilters(f=>({...f,categories:toggleArr(f.categories,cat)}))}
              style={{ padding:"7px 14px",border:`1.5px solid ${active?"#1a1a1a":"#ede8e2"}`,background:active?"#1a1a1a":"#fff",color:active?"#fff":"#666",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",borderRadius:20,flexShrink:0,transition:"all 0.2s",whiteSpace:"nowrap" }}>
              {cat}
            </button>
          );
        })}
        {/* view toggle — right */}
        <div style={{ marginLeft:"auto",display:"flex",border:"1px solid #ede8e2",borderRadius:20,overflow:"hidden",flexShrink:0 }}>
          {[{id:"split",label:"⊞"},{id:"list",label:"☰"},{id:"products",label:"✦"}].map(v=>(
            <button key={v.id} onClick={()=>{setView(v.id);if(v.id!=="split")setVisibleIds(null);}}
              title={v.id==="split"?"Map + List":v.id==="list"?"List":t.by_product}
              style={{ padding:"7px 12px",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",color:view===v.id?"#fff":"#999",background:view===v.id?"#1a1a1a":"transparent",transition:"all 0.2s" }}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      {view==="split" ? (
        isMobile ? (
          <MobileMapView
            salons={salons} filtered={filtered} loading={loading}
            onSalonClick={setSelectedSalon} onBoundsChange={setVisibleIds}
            leafletReady={leafletReady} lang={lang}
          />
        ) : (
        <div style={{ display:"flex",height:"calc(100vh - 58px - 110px - 44px)",overflow:"hidden" }}>
          {/* LEFT: salon list 2-col */}
          <div style={{ width:"55%",overflowY:"auto",padding:"20px 16px 40px 20px" }}>
            {loading ? (
              <div style={{ textAlign:"center",padding:"60px 0",fontFamily:"'Cormorant Garamond',serif",fontSize:"22px",color:"#ccc" }}>{t.loading}</div>
            ) : (
              <>
                <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#aaa",marginBottom:16 }}>
                  {filtered.length} {t.salons}{visibleIds?` · ${t.salons_in_view}`:""}
                </p>
                {filtered.length===0
                  ? <div style={{ textAlign:"center",padding:"60px 0",fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",color:"#ccc" }}>{t.no_salons}</div>
                  : <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:20,paddingBottom:8 }}>
                      {filtered.map((salon,i)=>(
                        <div key={salon.id} style={{ animation:`fadeUp 0.4s ease ${i*0.04}s both` }}>
                          <SalonCard salon={salon} onClick={setSelectedSalon} lang={lang} />
                        </div>
                      ))}
                    </div>
                }
              </>
            )}
          </div>
          {/* RIGHT: sticky map */}
          <div style={{ flex:1,position:"sticky",top:0,height:"100%" }}>
            {leafletReady
              ? <SplitMap salons={salons} onSalonClick={setSelectedSalon} onBoundsChange={setVisibleIds} />
              : <div style={{ height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",color:"#aaa" }}>Loading map…</div>
            }
          </div>
        </div>
        )
      ) : view==="list" ? (
        <main style={{ maxWidth:1200,margin:"0 auto",padding:"32px clamp(16px,4vw,40px) 80px" }}>
          {loading ? (
            <div style={{ textAlign:"center",padding:"60px 0",fontFamily:"'Cormorant Garamond',serif",fontSize:"22px",color:"#ccc" }}>{t.loading}</div>
          ) : (
            <>
              <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#aaa",marginBottom:24 }}>{filtered.length} {t.salons}</p>
              {filtered.length===0
                ? <div style={{ textAlign:"center",padding:"60px 0",fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",color:"#ccc" }}>{t.no_salons}</div>
                : <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:24 }}>
                    {filtered.map((salon,i)=>(
                      <div key={salon.id} style={{ animation:`fadeUp 0.4s ease ${i*0.04}s both` }}>
                        <SalonCard salon={salon} onClick={setSelectedSalon} lang={lang} />
                      </div>
                    ))}
                  </div>
              }
            </>
          )}
        </main>
      ) : (
        // products view
        <main style={{ maxWidth:1200,margin:"0 auto",padding:"32px clamp(16px,4vw,40px) 80px" }}>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"24px",fontWeight:400,color:"#1a1a1a",marginBottom:36 }}>{t.products_view}</h2>
          {Object.entries(productsByCategory).map(([cat,items])=>(
            <div key={cat} style={{ marginBottom:48 }}>
              <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:18 }}>
                <h3 style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"11px",fontWeight:700,color:"#b85c5c",letterSpacing:"2px",textTransform:"uppercase",margin:0 }}>{cat}</h3>
                <div style={{ height:1,flex:1,background:"#ede8e2" }} />
                <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#ccc" }}>{items.length}</span>
              </div>
              <div style={{ display:"flex",gap:14,overflowX:"auto",paddingBottom:6 }}>
                {items.map(({prod,salons:sl})=>{
                  const isNew=prod._badge==="new";
                  const color=isNew?"#c9a96e":"#b85c5c";
                  const border=isNew?"#e8d9b8":"#f0d0d0";
                  const img=Array.isArray(prod.Image)?prod.Image[0]?.url:null;
                  return (
                    <div key={prod.id} style={{ background:"#fff",border:`1px solid ${border}`,overflow:"hidden",flexShrink:0,width:190,borderRadius:10 }}>
                      <div style={{ position:"relative",paddingBottom:"78%",overflow:"hidden" }}>
                        {img?<img src={img} alt={prod.product_name} style={{ position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover" }} />
                          :<div style={{ position:"absolute",inset:0,background:"#f5f0eb",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"30px" }}>✨</div>}
                        <div style={{ position:"absolute",top:8,left:8,background:color,color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:"8px",fontWeight:800,letterSpacing:"1.5px",textTransform:"uppercase",padding:"3px 9px",borderRadius:4 }}>
                          {isNew?t.new_in:t.popular}
                        </div>
                      </div>
                      <div style={{ padding:"11px 13px 13px" }}>
                        <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"9px",color,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",margin:"0 0 3px" }}>{prod.brand}</p>
                        <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#2a2a2a",margin:"0 0 8px",lineHeight:1.4 }}>{prod.product_name}</p>
                        <div style={{ borderTop:"1px solid #f0ebe5",paddingTop:7 }}>
                          <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"9px",color:"#bbb",letterSpacing:"1px",textTransform:"uppercase",margin:"0 0 3px" }}>{t.available_at}</p>
                          {sl.slice(0,2).map(s=><p key={s.id} style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#666",margin:"0 0 1px" }}>→ {s.name}</p>)}
                          {sl.length>2&&<p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#bbb",margin:0 }}>+{sl.length-2} more</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </main>
      )}

      {/* FOOTER */}
      <footer style={{ background:"#0d0d0d",padding:"32px 24px",textAlign:"center" }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"14px",color:"#f5f0eb",letterSpacing:"4px",marginBottom:6 }}>THE BEAUTY PAUSE</div>
        <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#555" }}>{t.footer}</p>
      </footer>
      </>)}

      {/* MODALS — always rendered on top */}
      {showFilter&&<FilterModal onClose={()=>setShowFilter(false)} lang={lang} filters={filters} setFilters={setFilters} areas={areas} brands={brands} sortBy={sortBy} setSortBy={setSortBy} toggleArr={toggleArr} />}
      {showJoin&&<JoinModal onClose={()=>setShowJoin(false)} lang={lang} salons={salons} />}
      {selectedSalon&&<SalonModal salon={selectedSalon} onClose={()=>setSelectedSalon(null)} leafletReady={leafletReady} lang={lang} />}
    </>
  );
}
