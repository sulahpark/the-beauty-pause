import { useState, useEffect, useRef, Component } from "react";
import { Routes, Route, useNavigate, useLocation, useParams } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

const SUPA_URL = (process.env.REACT_APP_SUPABASE_URL||"").trim();
const SUPA_KEY = (process.env.REACT_APP_SUPABASE_ANON_KEY||"").trim();

// normalize: if someone pasted just the project ref, add https:// and .supabase.co
const normalizedUrl = SUPA_URL.startsWith("http")
  ? SUPA_URL
  : SUPA_URL.length > 0 ? `https://${SUPA_URL}.supabase.co` : "";

const supabase = (normalizedUrl && SUPA_KEY)
  ? createClient(normalizedUrl, SUPA_KEY)
  : null;

// Error boundary to catch render errors
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null, errorInfo: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  componentDidCatch(e, info) { this.setState({ errorInfo: info }); console.error("ErrorBoundary caught:", e, info); }
  componentDidUpdate(prevProps) {
    // reset error when location changes (back button etc)
    if (this.state.error && prevProps.location !== this.props.location) {
      this.setState({ error: null, errorInfo: null });
    }
  }
  render() {
    if (this.state.error) return (
      <div style={{padding:40,fontFamily:"monospace",background:"#fff",color:"#333",minHeight:"100vh"}}>
        <h2 style={{color:"#b85c5c",marginBottom:16}}>Something went wrong</h2>
        <pre style={{background:"#f5f5f5",padding:16,borderRadius:8,fontSize:12,overflow:"auto",whiteSpace:"pre-wrap"}}>{String(this.state.error)}{this.state.errorInfo?.componentStack}</pre>
        <button onClick={()=>this.setState({error:null,errorInfo:null})} style={{marginTop:16,padding:"10px 20px",background:"#1a1a1a",color:"#fff",border:"none",cursor:"pointer",borderRadius:8,fontFamily:"sans-serif",fontSize:13}}>← Go back</button>
      </div>
    );
    return this.props.children;
  }
}

const AT_KEY = process.env.REACT_APP_AIRTABLE_KEY;
const AT_BASE = process.env.REACT_APP_AIRTABLE_BASE;
const TBL_RETAIL   = "tblKBJOQMOoskSVdx";
const TBL_PRODUCTS = "tblQkdtqAA9kC0n1w";
const TBL_SLOTS    = "tblpLTlKSizL7y3W6";
const TBL_MEMBERS  = "tbl6qPdK6BcW6t4ji";
const TBL_SPOTS    = "tblszhTyIaNUyDClw";

// ── i18n ──────────────────────────────────────────────────────────────────────
const T = {
  en: {
    tagline:"K-Beauty · Curated Salons · Paris",
    hero_1:"Where Korean beauty", hero_2:"meets your salon",
    hero_sub:"We place carefully selected K-beauty products in handpicked Paris salons.",
    find_salon:"Find a salon", discover:"Discover K-Beauty",
    how:"How it works",
    step1_t:"Visit a salon", step1_s:"Find a participating salon near you",
    step2_t:"Try K-beauty", step2_s:"Ask your stylist to try our curated products",
    step3_t:"Join the community", step3_s:"Get exclusive events and free product drops",
    salons:"Salons", products:"Products",
    search_salon:"Search salon or area…",
    filter:"Filters", clear:"Clear",
    kbeauty_only:"K-Beauty only",
    filter_tier:"Tier", filter_area:"Area", filter_brand:"Brand",
    sort_az:"A–Z", sort_tier:"Tier first", sort_area:"By area",
    no_salons:"No salons found",
    loading:"Loading…",
    kbeauty_here:"K-Beauty available here",
    kbeauty_desc:"Ask your stylist to try these during your visit.",
    book:"Book an appointment", via:"via",
    salons_count:"salons",
    new_in:"New In", top_pick:"Top Pick",
    available_at:"Available at",
    search_product:"Search product or brand…",
    all_categories:"All", filter_category:"Category",
    product_detail:"Product details",
    find_in_salon:"Find in salon",
    join:"Join", join_title:"Join The Beauty Pause",
    join_sub:"Be the first to know about exclusive K-beauty events and free product giveaways.",
    join_name:"First name", join_email:"Email",
    join_salon:"Favourite salon (optional)", join_salon_ph:"Select…",
    join_submit:"Join the community", join_success:"You're in! ✦",
    join_success_sub:"We'll be in touch when something special comes your way.",
    join_error:"Something went wrong.", joining:"Joining…",
    footer:"Curating K-Beauty across Paris · @thebeautypause",
  },
  fr: {
    tagline:"K-Beauty · Salons Sélectionnés · Paris",
    hero_1:"Là où la beauté coréenne", hero_2:"rencontre votre salon",
    hero_sub:"Nous plaçons des produits K-beauty dans des salons parisiens sélectionnés.",
    find_salon:"Trouver un salon", discover:"Découvrir le K-Beauty",
    how:"Comment ça marche",
    step1_t:"Visitez un salon", step1_s:"Trouvez un salon partenaire près de chez vous",
    step2_t:"Découvrez le K-beauty", step2_s:"Demandez à essayer nos produits sélectionnés",
    step3_t:"Rejoignez la communauté", step3_s:"Recevez des événements exclusifs et produits offerts",
    salons:"Salons", products:"Produits",
    search_salon:"Rechercher un salon ou quartier…",
    filter:"Filtres", clear:"Effacer",
    kbeauty_only:"K-Beauty uniquement",
    filter_tier:"Tier", filter_area:"Quartier", filter_brand:"Marque",
    sort_az:"A–Z", sort_tier:"Tier d'abord", sort_area:"Par quartier",
    no_salons:"Aucun salon trouvé",
    loading:"Chargement…",
    kbeauty_here:"K-Beauty disponible ici",
    kbeauty_desc:"Demandez à votre styliste d'essayer ces produits.",
    book:"Prendre rendez-vous", via:"via",
    salons_count:"salons",
    new_in:"Nouveau", top_pick:"Top Pick",
    available_at:"Disponible chez",
    search_product:"Rechercher un produit…",
    all_categories:"Tous", filter_category:"Catégorie",
    product_detail:"Détails du produit",
    find_in_salon:"Trouver en salon",
    join:"Rejoindre", join_title:"Rejoindre The Beauty Pause",
    join_sub:"Soyez les premiers informés des événements K-beauty exclusifs.",
    join_name:"Prénom", join_email:"Email",
    join_salon:"Salon préféré (optionnel)", join_salon_ph:"Sélectionner…",
    join_submit:"Rejoindre la communauté", join_success:"Vous êtes inscrit·e ! ✦",
    join_success_sub:"Nous vous contacterons dès qu'une offre spéciale vous attend.",
    join_error:"Une erreur s'est produite.", joining:"Inscription…",
    footer:"Curation K-Beauty à Paris · @thebeautypause",
  },
};

const TIER = {
  Platinum:{ color:"#a855f7", shadow:"0 0 10px rgba(168,85,247,0.5)" },
  Gold:    { color:"#c9a96e", shadow:"0 0 8px rgba(201,169,110,0.4)" },
  Silver:  { color:"#aaa",    shadow:"none" },
};
const TIER_ORDER = { Platinum:0, Gold:1, Silver:2 };

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

const getSalonImg = (salon) => {
  if (!salon.salon_image) return null;
  if (Array.isArray(salon.salon_image)) return salon.salon_image[0]?.url || null;
  return salon.salon_image;
};
const getProdImg = (prod) => {
  if (!prod.Image) return null;
  if (Array.isArray(prod.Image)) return prod.Image[0]?.url || null;
  return prod.Image;
};
const toggleArr = (arr, val) => arr.includes(val) ? arr.filter(x=>x!==val) : [...arr,val];

// ── TIER CROWN ────────────────────────────────────────────────────────────────
function TierBadge({ tier, size=14 }) {
  if (!tier || !TIER[tier]) return null;
  const cfg = TIER[tier];
  return <span style={{ fontSize:size, filter:`drop-shadow(${cfg.shadow})` }} title={tier}>👑</span>;
}

// ── LEAFLET MAP (split/mobile) ────────────────────────────────────────────────
function SalonMap({ salons, onPinClick, onBoundsChange, focusSalon, mini }) {
  const uid = useRef(`map-${Math.random().toString(36).slice(2)}`);
  const map  = useRef(null);
  const marks = useRef([]);
  const salRef = useRef(salons);
  salRef.current = salons;

  useEffect(()=>{
    if (map.current || !window.L) return;
    const L = window.L;
    const center = focusSalon ? [+focusSalon.latitude,+focusSalon.longitude] : [48.8566,2.3522];
    const m = L.map(uid.current,{zoomControl:!mini,scrollWheelZoom:!mini,dragging:!mini||true}).setView(center, focusSalon?15:13);
    map.current = m;
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",{attribution:"© OpenStreetMap © CARTO",maxZoom:19}).addTo(m);
    if (onBoundsChange) {
      m.on("moveend zoomend",()=>{
        const b=m.getBounds();
        onBoundsChange(salRef.current.filter(s=>{const lat=+s.latitude,lng=+s.longitude;return lat&&lng&&b.contains([lat,lng]);}).map(s=>s.id));
      });
    }
    return ()=>{ m.remove(); map.current=null; marks.current=[]; };
  },[]);

  useEffect(()=>{
    const L=window.L; if(!L||!map.current) return;
    marks.current.forEach(m=>m.remove()); marks.current=[];
    (focusSalon?[focusSalon]:salons).forEach(s=>{
      const lat=+s.latitude,lng=+s.longitude; if(!lat||!lng) return;
      const hasKbeauty=(s._products||[]).length>0;
      const col = focusSalon?.id===s.id ? "#b85c5c" : hasKbeauty ? "#c9a96e" : "#888";
      const hl = focusSalon?.id===s.id;
      const icon=L.divIcon({className:"",
        html:`<div style="width:${hl?36:28}px;height:${hl?36:28}px;border-radius:50%;background:${col};border:3px solid #fff;box-shadow:0 3px 12px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;cursor:pointer"><div style="width:6px;height:6px;border-radius:50%;background:#fff"></div></div>`,
        iconSize:[hl?36:28,hl?36:28],iconAnchor:[hl?18:14,hl?18:14]});
      const mk=L.marker([lat,lng],{icon}).addTo(map.current);
      if (!mini) {
        const tooltip = hasKbeauty
          ? `<div style="font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;color:#1a1a1a">${s.name}<span style="margin-left:6px;font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#c9a96e;background:#fdf8ee;padding:2px 6px;border-radius:10px;border:1px solid #e8d9b8">✦ K-Beauty</span></div>`
          : `<div style="font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;color:#1a1a1a">${s.name}</div>`;
        mk.bindTooltip(tooltip,{direction:"top",offset:[0,-10],className:"tbp-tooltip"});
        mk.on("click",()=>onPinClick?.(s));
      }
      marks.current.push(mk);
    });
  },[salons,focusSalon]);

  return <div id={uid.current} style={{width:"100%",height:mini?"200px":"100%",zIndex:1}} />;
}

// ── SALON CARD IMAGE ──────────────────────────────────────────────────────────
function CardImg({ salon, onClick }) {
  const [idx,setIdx]=useState(0); const [hov,setHov]=useState(false);
  const imgs=(()=>{ const i=getSalonImg(salon); if(!i) return []; return Array.isArray(salon.salon_image)?salon.salon_image.map(a=>a.url||a).filter(Boolean):[i]; })();
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{position:"relative",paddingBottom:"62%",overflow:"hidden",background:"#1a1a1a",borderRadius:"12px 12px 0 0",cursor:"pointer"}}>
      {imgs.length>0
        ? <img src={imgs[idx]} alt={salon.name} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",transition:"transform 0.4s",transform:hov?"scale(1.03)":"scale(1)"}} />
        : <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,#2a2a2a,#1a1a1a)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"48px",color:"rgba(201,169,110,0.2)"}}>{salon.name?.[0]}</span>
          </div>
      }
      <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.25) 0%,transparent 50%)"}} />
      <div style={{position:"absolute",top:10,left:10,background:"rgba(0,0,0,0.6)",color:"#f5f0eb",fontSize:"10px",fontFamily:"'DM Sans',sans-serif",fontWeight:600,letterSpacing:"1.2px",textTransform:"uppercase",padding:"3px 9px",borderRadius:20}}>{salon.category}</div>
      {salon.salon_tier&&<div style={{position:"absolute",top:10,right:10}}><TierBadge tier={salon.salon_tier}/></div>}
      {imgs.length>1&&hov&&<>
        <button onClick={e=>{e.stopPropagation();setIdx(i=>(i-1+imgs.length)%imgs.length);}} style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",width:28,height:28,borderRadius:"50%",background:"rgba(255,255,255,0.9)",border:"none",cursor:"pointer",fontSize:"14px"}}>‹</button>
        <button onClick={e=>{e.stopPropagation();setIdx(i=>(i+1)%imgs.length);}} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",width:28,height:28,borderRadius:"50%",background:"rgba(255,255,255,0.9)",border:"none",cursor:"pointer",fontSize:"14px"}}>›</button>
        <div style={{position:"absolute",bottom:8,left:"50%",transform:"translateX(-50%)",display:"flex",gap:4}}>
          {imgs.map((_,i)=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:i===idx?"#fff":"rgba(255,255,255,0.5)"}} />)}
        </div>
      </>}
    </div>
  );
}

// ── SALON CARD ────────────────────────────────────────────────────────────────
function SalonCard({ salon, onClick, lang, user, favourites=[], onToggleFav }) {
  const t=T[lang]; const [hov,setHov]=useState(false);
  const prods=salon._products||[];
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:"#fff",borderRadius:12,overflow:"hidden",transition:"transform 0.25s,box-shadow 0.25s",transform:hov?"translateY(-3px)":"none",boxShadow:hov?"0 12px 40px rgba(0,0,0,0.12)":"0 2px 12px rgba(0,0,0,0.06)",cursor:"pointer"}}>
      <div style={{position:"relative"}}>
        <CardImg salon={salon} onClick={()=>onClick(salon)} />
        {/* heart btn */}
        {onToggleFav&&<div style={{position:"absolute",top:10,right:salon.salon_tier?38:10,zIndex:2}}>
          <FavBtn type="salon" item={salon} user={user} favourites={favourites} onToggle={onToggleFav} size={18}/>
        </div>}
      </div>
      <div style={{padding:"12px 14px 14px"}} onClick={()=>onClick(salon)}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:3}}>
          <h3 style={{margin:0,fontFamily:"'Cormorant Garamond',serif",fontSize:"17px",fontWeight:600,color:"#1a1a1a",lineHeight:1.2}}>{salon.name}</h3>
          {salon.area&&<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#bbb",marginLeft:8,flexShrink:0}}>{salon.area}</span>}
        </div>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#bbb",margin:"0 0 8px"}}>{salon.address}</p>
        {salon.salon_bio&&<p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#888",margin:"0 0 8px",fontStyle:"italic",lineHeight:1.5}}>"{salon.salon_bio}"</p>}
        {prods.length>0&&(
          <div style={{display:"flex",gap:6,borderTop:"1px solid #f5f0f0",paddingTop:8,overflowX:"auto"}}>
            {prods.map(p=>{
              const isNew=p._badge==="new"; const img=getProdImg(p);
              return (
                <div key={p.id} style={{flexShrink:0,width:60}}>
                  <div style={{width:60,height:60,borderRadius:8,overflow:"hidden",background:"#f5f0eb",marginBottom:3,position:"relative",border:`1.5px solid ${isNew?"#e8d9b8":"#f0d0d0"}`}}>
                    {img?<img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px"}}>✨</div>}
                    <div style={{position:"absolute",top:2,right:2,width:7,height:7,borderRadius:"50%",background:isNew?"#c9a96e":"#b85c5c",border:"1.5px solid #fff"}} />
                  </div>
                  <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"8px",color:isNew?"#a07832":"#b85c5c",fontWeight:700,textTransform:"uppercase",margin:"0 0 1px",letterSpacing:"0.5px"}}>{isNew?t.new_in:t.top_pick}</p>
                  <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"8px",color:"#888",margin:0,lineHeight:1.2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.brand_name||(Array.isArray(p.brand)?null:(!p.brand?.startsWith?.("rec")?p.brand:null))||""}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── SALON MODAL ───────────────────────────────────────────────────────────────
function SalonModal({ salon, onClose, leafletReady, lang }) {
  if (!salon) return null;
  const t=T[lang]; const prods=salon._products||[];
  const services=salon.main_services?salon.main_services.split(",").map(s=>s.trim()).filter(Boolean):[];
  const img=getSalonImg(salon);
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1500,background:"rgba(8,6,4,0.8)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,overflowY:"auto"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#faf7f4",maxWidth:680,width:"100%",maxHeight:"92vh",overflow:"auto",borderRadius:16,boxShadow:"0 48px 120px rgba(0,0,0,0.35)"}}>
        <div style={{position:"relative",paddingBottom:"38%",overflow:"hidden",background:"#1a1a1a",borderRadius:"16px 16px 0 0",minHeight:160}}>
          {img?<img src={img} alt={salon.name} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}} />:<div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,#1a1a1a,#2d2420)"}} />}
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 55%)"}} />
          <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"rgba(255,255,255,0.15)",color:"#fff",border:"none",width:34,height:34,borderRadius:"50%",cursor:"pointer",fontSize:"18px",display:"flex",alignItems:"center",justifyContent:"center",zIndex:10}}>×</button>
          <div style={{position:"absolute",bottom:20,left:24}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#c9a96e",letterSpacing:"2px",textTransform:"uppercase",margin:0}}>{salon.category} · Paris</p>
              {salon.salon_tier&&<TierBadge tier={salon.salon_tier} />}
            </div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"30px",fontWeight:600,color:"#fff",margin:0}}>{salon.name}</h2>
          </div>
        </div>
        <div style={{padding:"22px 24px 32px"}}>
          {/* K-Beauty first */}
          {prods.length>0&&<div style={{background:"#fdf8ee",border:"1px solid #e8d9b8",borderRadius:8,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:"16px"}}>✦</span>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#a07832",fontWeight:600}}>K-Beauty products available in this salon</span>
          </div>}
          {/* action links */}
          <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
            {salon.google_maps_url&&<a href={salon.google_maps_url} target="_blank" rel="noopener noreferrer"
              style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",background:"#fff",border:"1px solid #ede8e2",borderRadius:8,textDecoration:"none",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#444",fontWeight:500,transition:"all 0.2s",flex:1,justifyContent:"center"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#4285f4";e.currentTarget.style.color="#4285f4";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="#ede8e2";e.currentTarget.style.color="#444";}}>
              🗺 Google Maps
            </a>}
            {salon.bookingUrl&&<a href={salon.bookingUrl} target="_blank" rel="noopener noreferrer"
              style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",background:"#1a1a1a",border:"none",borderRadius:8,textDecoration:"none",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#f5f0eb",fontWeight:600,transition:"all 0.2s",flex:1,justifyContent:"center"}}
              onMouseEnter={e=>e.currentTarget.style.background="#b85c5c"}
              onMouseLeave={e=>e.currentTarget.style.background="#1a1a1a"}>
              📅 {t.book}{salon.bookingPlatform?` · ${salon.bookingPlatform}`:""}
            </a>}
            {salon.instagram&&<a href={`https://instagram.com/${salon.instagram.replace("@","")}`} target="_blank" rel="noopener noreferrer"
              style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",background:"#fff",border:"1px solid #ede8e2",borderRadius:8,textDecoration:"none",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#444",fontWeight:500,transition:"all 0.2s",flex:1,justifyContent:"center"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#b85c5c";e.currentTarget.style.color="#b85c5c";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="#ede8e2";e.currentTarget.style.color="#444";}}>
              📸 Instagram
            </a>}
          </div>
          {salon.salon_bio&&<div style={{background:"#fff",border:"1px solid #ede8e2",padding:"11px 14px",borderRadius:8,marginBottom:14}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"9px",color:"#bbb",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:3}}>About</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#555",lineHeight:1.5}}>✦ {salon.salon_bio}</div>
          </div>}
          {services.length>0&&<div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>{services.map(s=><span key={s} style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#666",background:"#fff",border:"1px solid #ede8e2",padding:"4px 12px",borderRadius:20}}>{s}</span>)}</div>}
          <SalonModalProducts prods={prods} t={t} onClose={onClose} lang={lang} />
          {leafletReady&&salon.latitude&&salon.longitude&&(
            <div style={{overflow:"hidden",border:"1px solid #ede8e2",borderRadius:8}}>
              <div style={{background:"#fff",padding:"10px 14px",borderBottom:"1px solid #ede8e2",display:"flex",alignItems:"center",gap:6}}>
                <span>📍</span><span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#888"}}>{salon.address}</span>
              </div>
              <SalonMap salons={[salon]} focusSalon={salon} mini={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── SALON MODAL PRODUCTS (with 2 action buttons) ──────────────────────────────
function SalonModalProducts({ prods, t, onClose, lang }) {
  const navigate = useNavigate();
  const [modalProd, setModalProd] = useState(null);
  if (!prods || prods.length === 0) return null;

  const goToProductPage = (p) => {
    onClose();
    // navigate to products page with this product pre-selected via state
    setTimeout(() => navigate("/products", { state: { selectProductId: p.id } }), 200);
  };

  return (
    <div style={{marginBottom:24}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <div style={{height:1,flex:1,background:"#ede8e2"}} />
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"9px",color:"#b85c5c",letterSpacing:"2px",textTransform:"uppercase",fontWeight:700,margin:0,whiteSpace:"nowrap"}}>{t.kbeauty_here}</p>
        <div style={{height:1,flex:1,background:"#ede8e2"}} />
      </div>
      <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#aaa",margin:"0 0 14px",lineHeight:1.6}}>{t.kbeauty_desc}</p>
      <div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:6}}>
        {prods.map(p=>{
          const isNew=p._badge==="new"; const color=isNew?"#c9a96e":"#b85c5c"; const border=isNew?"#e8d9b8":"#f0d0d0"; const img=getProdImg(p);
          const brandD=p.brand_name||(Array.isArray(p.brand)?null:(!p.brand?.startsWith?.("rec")?p.brand:null))||"";
          return (
            <div key={p.id} style={{background:"#fff",border:`1px solid ${border}`,overflow:"hidden",flexShrink:0,width:180,borderRadius:10}}>
              <div style={{position:"relative",paddingBottom:"70%",overflow:"hidden"}}>
                {img?<img src={img} alt={p.product_name} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}} />:<div style={{position:"absolute",inset:0,background:"#f5f0eb",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"28px"}}>✨</div>}
                <div style={{position:"absolute",top:7,left:7,background:color,color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:"8px",fontWeight:800,letterSpacing:"1.5px",textTransform:"uppercase",padding:"3px 8px",borderRadius:4}}>{isNew?t.new_in:t.top_pick}</div>
              </div>
              <div style={{padding:"10px 11px 12px"}}>
                <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"9px",color,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",margin:"0 0 2px"}}>{brandD}</p>
                <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#1a1a1a",margin:"0 0 8px",lineHeight:1.4,fontWeight:500}}>{p.product_name}</p>
                {/* 2 action buttons */}
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  <button onClick={()=>goToProductPage(p)}
                    style={{width:"100%",padding:"6px 8px",background:"#faf7f4",color:"#555",border:"1px solid #ede8e2",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"9px",fontWeight:600,letterSpacing:"1px",textTransform:"uppercase",borderRadius:6,transition:"all 0.2s",textAlign:"center"}}
                    onMouseEnter={e=>{e.currentTarget.style.background="#c9a96e";e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor="#c9a96e";}}
                    onMouseLeave={e=>{e.currentTarget.style.background="#faf7f4";e.currentTarget.style.color="#555";e.currentTarget.style.borderColor="#ede8e2";}}>
                    📍 {lang==="fr"?"Autres salons":"Other salons"}
                  </button>
                  <button onClick={()=>setModalProd(p)}
                    style={{width:"100%",padding:"6px 8px",background:"transparent",color:"#c9a96e",border:"1px solid #e8d9b8",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"9px",fontWeight:600,letterSpacing:"1px",textTransform:"uppercase",borderRadius:6,transition:"all 0.2s"}}
                    onMouseEnter={e=>{e.currentTarget.style.background="#c9a96e";e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor="#c9a96e";}}
                    onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#c9a96e";e.currentTarget.style.borderColor="#e8d9b8";}}>
                    ✦ {lang==="fr"?"Voir le produit":"Product details"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {modalProd&&<ProductModal prod={modalProd} salonsWithProd={modalProd._salons||[]} allProducts={[]} onClose={()=>setModalProd(null)} onSalonClick={()=>{}} lang={lang} />}
    </div>
  );
}

// ── PRODUCT MODAL ─────────────────────────────────────────────────────────────
function ProductModal({ prod, salonsWithProd, allProducts, onClose, onSalonClick, lang, user, favourites, onToggleFav }) {
  if (!prod) return null;
  const t=T[lang];
  const isNew=prod._badge==="new"; const color=isNew?"#c9a96e":"#b85c5c";

  // ALL state hooks must be before any return
  const [imgIdx,setImgIdx]=useState(0);
  const [showAllSalons,setShowAllSalons]=useState(false);
  const [showIngr,setShowIngr]=useState(false);
  const [lightbox,setLightbox]=useState(null);

  // photo slider
  const allImgs=(()=>{
    const main=Array.isArray(prod.Image)?prod.Image.map(a=>a.url||a).filter(Boolean):(prod.Image?[prod.Image]:[]);
    const more=Array.isArray(prod.more_image)?prod.more_image.map(a=>a.url||a).filter(Boolean):[];
    return [...new Set([...main,...more])];
  })();

  // brand
  const brandDisplay=prod.brand_name||(Array.isArray(prod.brand)?null:(!prod.brand?.startsWith?.("rec")?prod.brand:null))||"—";

  // detail fields
  const details=[
    {key:"product_1type",    label:lang==="fr"?"Type":"Type"},
    {key:"product_2usage",   label:lang==="fr"?"Utilisation":"Usage"},
    {key:"product_3texture", label:lang==="fr"?"Texture":"Texture"},
    {key:"test_reason",      label:lang==="fr"?"Pour qui ?":"Who is it for?"},
    {key:"product_4target",  label:lang==="fr"?"Peau cible":"Target skin"},
    {key:"product_5function",label:lang==="fr"?"Fonction":"Function"},
    {key:"product_6formula", label:lang==="fr"?"Formule":"Formula"},
    {key:"product_7key_ingredient",label:lang==="fr"?"Ingrédient clé":"Key ingredient"},
    {key:"product_8organic_certification",label:lang==="fr"?"Certification bio":"Certification"},
    {key:"description",      label:lang==="fr"?"Description":"Description"},
  ].filter(d=>prod[d.key]);

  // related products
  const related=(allProducts||[]).filter(p=>p.id!==prod.id&&p.category===prod.category).slice(0,4);

  return (
    <>
    {/* LIGHTBOX */}
    {lightbox&&(
      <div onClick={()=>setLightbox(null)} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.95)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out"}}>
        <img src={lightbox} alt="" style={{maxWidth:"95vw",maxHeight:"95vh",objectFit:"contain",borderRadius:4}} />
        <button onClick={()=>setLightbox(null)} style={{position:"absolute",top:16,right:16,background:"rgba(255,255,255,0.1)",color:"#fff",border:"none",width:36,height:36,borderRadius:"50%",cursor:"pointer",fontSize:"18px",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
      </div>
    )}
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(8,6,4,0.85)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#faf7f4",maxWidth:640,width:"100%",borderRadius:16,overflow:"hidden",boxShadow:"0 48px 120px rgba(0,0,0,0.4)",maxHeight:"92vh",overflowY:"auto",display:"flex",flexDirection:"column"}}>

        {/* PHOTO SLIDER */}
        <div style={{position:"relative",paddingBottom:"60%",overflow:"hidden",background:"#f5f0eb",flexShrink:0}}>
          {allImgs.length>0
            ? <img src={allImgs[imgIdx]} alt={prod.product_name}
                onClick={e=>{e.stopPropagation();setLightbox(allImgs[imgIdx]);}}
                style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",transition:"opacity 0.3s",cursor:"zoom-in"}} />
            : <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"48px"}}>✨</div>
          }
          {allImgs.length>0&&<div style={{position:"absolute",bottom:8,right:10,background:"rgba(0,0,0,0.45)",color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:"9px",padding:"3px 8px",borderRadius:20,pointerEvents:"none"}}>🔍 click to expand</div>}
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.4) 0%,transparent 50%)",pointerEvents:"none"}} />
          <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"rgba(0,0,0,0.4)",color:"#fff",border:"none",width:32,height:32,borderRadius:"50%",cursor:"pointer",fontSize:"16px",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2}}>×</button>
          <div style={{position:"absolute",bottom:14,left:14,background:color,color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:"9px",fontWeight:800,letterSpacing:"1.5px",textTransform:"uppercase",padding:"4px 12px",borderRadius:4}}>{isNew?t.new_in:t.top_pick}</div>
          {onToggleFav&&<div style={{position:"absolute",top:14,left:14,zIndex:2}}>
            <FavBtn type="product" item={prod} user={user} favourites={favourites||[]} onToggle={onToggleFav} size={22}/>
          </div>}
          {allImgs.length>1&&<>
            <button onClick={e=>{e.stopPropagation();setImgIdx(i=>(i-1+allImgs.length)%allImgs.length);}} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",width:34,height:34,borderRadius:"50%",background:"rgba(255,255,255,0.85)",border:"none",cursor:"pointer",fontSize:"16px",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2}}>‹</button>
            <button onClick={e=>{e.stopPropagation();setImgIdx(i=>(i+1)%allImgs.length);}} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",width:34,height:34,borderRadius:"50%",background:"rgba(255,255,255,0.85)",border:"none",cursor:"pointer",fontSize:"16px",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2}}>›</button>
            <div style={{position:"absolute",bottom:14,left:"50%",transform:"translateX(-50%)",display:"flex",gap:5,zIndex:2}}>
              {allImgs.map((_,i)=><div key={i} onClick={e=>{e.stopPropagation();setImgIdx(i);}} style={{width:i===imgIdx?18:6,height:6,borderRadius:3,background:i===imgIdx?"#fff":"rgba(255,255,255,0.5)",transition:"all 0.2s",cursor:"pointer"}} />)}
            </div>
          </>}
        </div>

        <div style={{padding:"22px 24px 28px"}}>
          {/* brand + name */}
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",margin:"0 0 4px"}}>{brandDisplay}</p>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"26px",fontWeight:600,color:"#1a1a1a",margin:"0 0 4px",lineHeight:1.2}}>{prod.product_name}</h2>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#aaa",margin:0}}>{prod.category}</p>
            {prod.price_customer&&<><span style={{color:"#ede8e2"}}>·</span>
              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"18px",color:"#1a1a1a",margin:0,fontWeight:600}}>€{prod.price_customer}</p>
            </>}
          </div>

          {/* ✦ FIND IN SALON — first, max 3 + view more */}
          {salonsWithProd.length>0&&(
            <div style={{marginBottom:20}}>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#b85c5c",letterSpacing:"2px",textTransform:"uppercase",fontWeight:700,margin:"0 0 10px"}}>✦ {t.find_in_salon}</p>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {(showAllSalons?salonsWithProd:salonsWithProd.slice(0,3)).map(s=>{
                  const sImg=getSalonImg(s);
                  return (
                    <div key={s.id} onClick={()=>{onClose();setTimeout(()=>onSalonClick(s),200);}}
                      style={{display:"flex",alignItems:"center",gap:12,background:"#fff",border:"1px solid #ede8e2",padding:"10px 14px",borderRadius:10,cursor:"pointer",transition:"all 0.2s"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor="#c9a96e";e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.08)";}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="#ede8e2";e.currentTarget.style.boxShadow="none";}}>
                      <div style={{width:44,height:44,borderRadius:8,overflow:"hidden",flexShrink:0,background:"#1a1a1a"}}>
                        {sImg?<img src={sImg} alt={s.name} style={{width:"100%",height:"100%",objectFit:"cover"}} />:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",color:"rgba(201,169,110,0.4)"}}>{s.name?.[0]}</span></div>}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"15px",fontWeight:600,color:"#1a1a1a",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</p>
                        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#aaa",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.address}</p>
                      </div>
                      <span style={{color:"#ccc",fontSize:"16px",flexShrink:0}}>›</span>
                    </div>
                  );
                })}
                {salonsWithProd.length>3&&!showAllSalons&&(
                  <button onClick={()=>setShowAllSalons(true)} style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#b85c5c",background:"none",border:"1px solid #f0d0d0",cursor:"pointer",padding:"8px 0",borderRadius:8,textAlign:"center",transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.background="#fdf0f0";}} onMouseLeave={e=>{e.currentTarget.style.background="none";}}>
                    + {salonsWithProd.length-3} more salon{salonsWithProd.length-3>1?"s":""}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* product detail fields */}
          {details.length>0&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
              {details.map(({key,label})=>(
                <div key={key} style={{background:"#fff",border:"1px solid #ede8e2",borderRadius:8,padding:"10px 13px",gridColumn:["description","test_reason"].includes(key)?"1/-1":"auto"}}>
                  <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"9px",color:"#c9a96e",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:700,margin:"0 0 3px"}}>{label}</p>
                  <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#444",margin:0,lineHeight:1.5}}>{prod[key]}</p>
                </div>
              ))}
            </div>
          )}

          {/* ingredients — collapsible */}
          {prod.ingredients&&(
            <div style={{marginBottom:16,border:"1px solid #ede8e2",borderRadius:8,overflow:"hidden"}}>
              <button onClick={()=>setShowIngr(v=>!v)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 14px",background:"#fff",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#444",fontWeight:500}}>
                <span style={{fontSize:"9px",color:"#c9a96e",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:700}}>{lang==="fr"?"Ingrédients":"Ingredients"}</span>
                <span style={{color:"#aaa",fontSize:"16px",transition:"transform 0.2s",display:"inline-block",transform:showIngr?"rotate(180deg)":"none"}}>▾</span>
              </button>
              {showIngr&&(
                <div style={{padding:"0 14px 14px",background:"#fff",borderTop:"1px solid #f5f0f0"}}>
                  <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#777",lineHeight:1.7,margin:"10px 0 0"}}>{prod.ingredients}</p>
                </div>
              )}
            </div>
          )}

          {/* related products */}
          {related.length>0&&(
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                <div style={{height:1,flex:1,background:"#ede8e2"}} />
                <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"9px",color:"#aaa",letterSpacing:"2px",textTransform:"uppercase",margin:0,whiteSpace:"nowrap"}}>You might also like</p>
                <div style={{height:1,flex:1,background:"#ede8e2"}} />
              </div>
              <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4}}>
                {related.map(p=>{
                  const img=getProdImg(p); const c=p._badge==="new"?"#c9a96e":"#b85c5c";
                  const bd=p.brand_name||(Array.isArray(p.brand)?null:(!p.brand?.startsWith?.("rec")?p.brand:null))||"";
                  return (
                    <div key={p.id} style={{flexShrink:0,width:110,background:"#fff",border:"1px solid #ede8e2",borderRadius:10,overflow:"hidden",cursor:"pointer",transition:"all 0.2s"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=c;e.currentTarget.style.transform="translateY(-2px)";}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="#ede8e2";e.currentTarget.style.transform="none";}}>
                      <div style={{paddingBottom:"80%",position:"relative",overflow:"hidden",background:"#f5f0eb"}}>
                        {img?<img src={img} alt={p.product_name} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}} />:<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px"}}>✨</div>}
                      </div>
                      <div style={{padding:"7px 8px 9px"}}>
                        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"8px",color:c,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",margin:"0 0 2px"}}>{bd}</p>
                        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#1a1a1a",margin:0,lineHeight:1.3,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{p.product_name}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}


// ── FILTER MODAL ──────────────────────────────────────────────────────────────
function FilterModal({ onClose, lang, filters, setFilters, areas, brands, sortBy, setSortBy }) {
  const t=T[lang];
  const [loc,setLoc]=useState(filters); const [lSort,setLSort]=useState(sortBy);
  const apply=()=>{setFilters(loc);setSortBy(lSort);onClose();};
  const tog=(k,v)=>setLoc(f=>({...f,[k]:toggleArr(f[k],v)}));
  const cnt=[loc.tier.length>0,loc.area!=="All",loc.brand!=="All",loc.categories.length>0,loc.kbeautyOnly].filter(Boolean).length;
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:3000,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#faf7f4",width:"100%",maxWidth:560,borderRadius:16,maxHeight:"88vh",overflow:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.25)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 22px 12px",borderBottom:"1px solid #ede8e2",position:"sticky",top:0,background:"#faf7f4",zIndex:1}}>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:"20px",color:"#999",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          <h3 style={{fontFamily:"'DM Sans',sans-serif",fontSize:"14px",fontWeight:600,color:"#1a1a1a",margin:0}}>{t.filter}</h3>
          <button onClick={()=>setLoc({tier:[],area:"All",brand:"All",categories:[],kbeautyOnly:false})} style={{background:"none",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#aaa",textDecoration:"underline"}}>{t.clear}</button>
        </div>
        <div style={{padding:"18px 22px 28px"}}>
          {/* K-beauty */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingBottom:18,borderBottom:"1px solid #ede8e2",marginBottom:18}}>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"13px",color:"#333",fontWeight:500}}>✦ {t.kbeauty_only}</span>
            <div onClick={()=>setLoc(f=>({...f,kbeautyOnly:!f.kbeautyOnly}))}
              style={{width:46,height:26,borderRadius:13,background:loc.kbeautyOnly?"#b85c5c":"#ddd",cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:loc.kbeautyOnly?22:2,transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}} />
            </div>
          </div>
          {/* Sort */}
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#aaa",letterSpacing:"1.5px",textTransform:"uppercase",margin:"0 0 10px"}}>Sort</p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
            {[["az",t.sort_az],["tier",t.sort_tier],["area",t.sort_area]].map(([v,l])=>(
              <button key={v} onClick={()=>setLSort(v)} style={{padding:"8px 16px",border:`1.5px solid ${lSort===v?"#1a1a1a":"#ede8e2"}`,background:lSort===v?"#1a1a1a":"#fff",color:lSort===v?"#fff":"#777",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",borderRadius:20,transition:"all 0.2s"}}>{l}</button>
            ))}
          </div>
          {/* Category */}
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#aaa",letterSpacing:"1.5px",textTransform:"uppercase",margin:"0 0 10px"}}>Category</p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
            {["Nail","Beauty","Hair","Spa"].map(cat=>{const a=loc.categories.includes(cat);return(
              <button key={cat} onClick={()=>tog("categories",cat)} style={{padding:"8px 16px",border:`1.5px solid ${a?"#1a1a1a":"#ede8e2"}`,background:a?"#1a1a1a":"#fff",color:a?"#fff":"#777",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",borderRadius:20,transition:"all 0.2s"}}>{cat}</button>
            );})}
          </div>
          {/* Tier */}
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#aaa",letterSpacing:"1.5px",textTransform:"uppercase",margin:"0 0 10px"}}>{t.filter_tier}</p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
            {["Platinum","Gold","Silver"].map(v=>{const a=loc.tier.includes(v);return(
              <button key={v} onClick={()=>tog("tier",v)} style={{padding:"8px 16px",border:`1.5px solid ${a?"#1a1a1a":"#ede8e2"}`,background:a?"#1a1a1a":"#fff",color:a?"#fff":"#777",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",borderRadius:20,transition:"all 0.2s",display:"flex",alignItems:"center",gap:5}}>
                <TierBadge tier={v} />{v}
              </button>
            );})}
          </div>
          {/* Area */}
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#aaa",letterSpacing:"1.5px",textTransform:"uppercase",margin:"0 0 10px"}}>{t.filter_area}</p>
          <select value={loc.area} onChange={e=>setLoc(f=>({...f,area:e.target.value}))} style={{width:"100%",padding:"11px 14px",border:"1px solid #ede8e2",background:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",color:"#555",borderRadius:8,outline:"none",marginBottom:20,cursor:"pointer"}}>
            {areas.map(a=><option key={a} value={a}>{a}</option>)}
          </select>
          {/* Brand */}
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#aaa",letterSpacing:"1.5px",textTransform:"uppercase",margin:"0 0 10px"}}>{t.filter_brand}</p>
          <select value={loc.brand} onChange={e=>setLoc(f=>({...f,brand:e.target.value}))} style={{width:"100%",padding:"11px 14px",border:"1px solid #ede8e2",background:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",color:"#555",borderRadius:8,outline:"none",marginBottom:22,cursor:"pointer"}}>
            {brands.map(b=><option key={b} value={b}>{b}</option>)}
          </select>
          <button onClick={apply} style={{width:"100%",padding:"14px",background:"#1a1a1a",color:"#fff",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",fontWeight:600,letterSpacing:"2px",textTransform:"uppercase",borderRadius:8}}>
            {cnt>0?`Apply (${cnt})`:"Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MOBILE BOTTOM SHEET ───────────────────────────────────────────────────────
function BottomSheet({ salons, loading, onSalonClick, lang, visibleCount }) {
  const t=T[lang];
  const [expanded, setExpanded] = useState(false);
  const [pinned, setPinned] = useState(null);
  const listRef = useRef(null);
  const handleStartY = useRef(null);

  BottomSheet._setPinned = (s) => { setPinned(s); };
  BottomSheet._clearPinned = () => setPinned(null);

  // Only handle touches on the drag handle bar
  const onHandleTouchStart = (e) => {
    handleStartY.current = e.touches[0].clientY;
  };
  const onHandleTouchEnd = (e) => {
    const dy = handleStartY.current - e.changedTouches[0].clientY;
    if (dy > 30) setExpanded(true);
    else if (dy < -30) setExpanded(false);
  };

  // List: only collapse when at very top + dragging down
  const listStartY = useRef(null);
  const onListTouchStart = (e) => {
    listStartY.current = e.touches[0].clientY;
  };
  const onListTouchEnd = (e) => {
    if (!listRef.current) return;
    const scrollTop = listRef.current.scrollTop;
    const dy = listStartY.current - e.changedTouches[0].clientY;
    // only collapse if at top AND dragging down
    if (scrollTop <= 2 && dy < -40) {
      setExpanded(false);
    }
  };

  const count = visibleCount ?? salons.length;

  return (
    <>
      {/* PINNED FLOATING CARD — sits above sheet, not part of sheet */}
      {pinned && !expanded && (
        <div style={{position:"absolute",bottom:92,left:12,right:12,zIndex:200,animation:"fadeUp 0.22s ease both"}}>
          <div style={{background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 8px 32px rgba(0,0,0,0.18)",position:"relative"}}>
            <button onClick={e=>{e.stopPropagation();setPinned(null);}}
              style={{position:"absolute",top:8,right:8,width:26,height:26,borderRadius:"50%",background:"rgba(0,0,0,0.5)",color:"#fff",border:"none",cursor:"pointer",fontSize:"14px",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2}}>×</button>
            <div onClick={()=>{onSalonClick(pinned);setPinned(null);}} style={{display:"flex",cursor:"pointer",minHeight:84}}>
              <div style={{width:88,flexShrink:0,overflow:"hidden",background:"#1a1a1a"}}>
                {(()=>{const img=getSalonImg(pinned);return img
                  ?<img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  :<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"24px",color:"rgba(201,169,110,0.3)"}}>{pinned.name?.[0]}</span></div>;
                })()}
              </div>
              <div style={{padding:"10px 12px",flex:1,minWidth:0,display:"flex",flexDirection:"column",justifyContent:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:2}}>
                  <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"15px",fontWeight:600,color:"#1a1a1a",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pinned.name}</p>
                  {pinned.salon_tier&&<TierBadge tier={pinned.salon_tier} size={11}/>}
                </div>
                <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#aaa",margin:"0 0 5px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pinned.area||"Paris"}</p>
                {(pinned._products||[]).length>0&&(
                  <div style={{display:"flex",gap:3,alignItems:"center"}}>
                    {(pinned._products||[]).slice(0,4).map(p=>{const img=getProdImg(p);return img?<div key={p.id} style={{width:18,height:18,borderRadius:3,overflow:"hidden"}}><img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>:null;})}
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"9px",color:"#c9a96e",fontWeight:700,marginLeft:3}}>✦ K-Beauty</span>
                  </div>
                )}
              </div>
              <div style={{display:"flex",alignItems:"center",paddingRight:10}}><span style={{color:"#ddd",fontSize:"18px"}}>›</span></div>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM SHEET */}
      <div style={{
        position:"absolute",bottom:0,left:0,right:0,
        height:expanded?"100%":"88px",
        background:"#faf7f4",
        borderRadius:expanded?"0":"16px 16px 0 0",
        boxShadow:"0 -4px 24px rgba(0,0,0,0.14)",
        transition:"height 0.34s cubic-bezier(0.32,0.72,0,1), border-radius 0.34s",
        zIndex:100,display:"flex",flexDirection:"column",overflow:"hidden"
      }}>
        {/* HANDLE — drag target ONLY */}
        <div
          onTouchStart={onHandleTouchStart} onTouchEnd={onHandleTouchEnd}
          style={{flexShrink:0,paddingTop:10,paddingBottom:8,touchAction:"none",userSelect:"none",cursor:"pointer"}}
          onClick={()=>!expanded&&setExpanded(true)}>
          <div style={{width:36,height:4,borderRadius:2,background:"#ccc",margin:"0 auto 8px"}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px"}}>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"13px",fontWeight:600,color:"#1a1a1a",margin:0}}>
              {count} {t.salons_count}
            </p>
            {expanded&&(
              <button onClick={e=>{e.stopPropagation();setExpanded(false);setPinned(null);}}
                style={{display:"flex",alignItems:"center",gap:5,padding:"7px 14px",background:"#0d0d0d",color:"#fff",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",fontWeight:600,borderRadius:22}}>
                🗺 Map
              </button>
            )}
          </div>
        </div>

        {/* LIST — only touchAction pan-y so native scroll works, collapse only at top */}
        {expanded&&(
          <div ref={listRef}
            onTouchStart={onListTouchStart}
            onTouchEnd={onListTouchEnd}
            style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"4px 12px 32px",touchAction:"pan-y",overscrollBehavior:"contain"}}>
            {loading
              ?<div style={{textAlign:"center",padding:"40px 0",fontFamily:"'Cormorant Garamond',serif",fontSize:"18px",color:"#ccc"}}>{t.loading}</div>
              :salons.length===0
                ?<div style={{textAlign:"center",padding:"40px 0",fontFamily:"'Cormorant Garamond',serif",fontSize:"18px",color:"#ccc"}}>{t.no_salons}</div>
                :<div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {salons.map((s,i)=>(
                    <div key={s.id} style={{animation:`fadeUp 0.25s ease ${i*0.02}s both`}}>
                      <SalonCard salon={s} onClick={()=>{onSalonClick(s);setExpanded(false);}} lang={lang}/>
                    </div>
                  ))}
                </div>
            }
          </div>
        )}
      </div>
    </>
  );
}

// ── AUTH MODAL (Sign up + Log in) ─────────────────────────────────────────────
function AuthModal({ onClose, lang, salons, initialMode="signup" }) {
  const t=T[lang];
  const [mode,setMode]=useState(initialMode); // signup | login | reset
  const [fn,setFn]=useState(""); const [em,setEm]=useState(""); const [pw,setPw]=useState("");
  const [st,setSt]=useState("idle"); const [msg,setMsg]=useState("");

  const submit=async()=>{
    if (!em.trim()||(mode!=="reset"&&!pw.trim())) return;
    setSt("loading"); setMsg("");
    try {
      if (mode==="signup") {
        if (!fn.trim()) { setMsg("Please enter your first name."); setSt("idle"); return; }
        const {error}=await supabase.auth.signUp({
          email:em.trim(), password:pw,
          options:{data:{first_name:fn.trim()}}
        });
        if (error) { setMsg(error.message); setSt("error"); }
        else { setSt("success"); setMsg("Check your email to confirm your account!"); }
      } else if (mode==="login") {
        const {error}=await supabase.auth.signInWithPassword({email:em.trim(),password:pw});
        if (error) { setMsg(error.message); setSt("error"); }
        else { onClose(); }
      } else {
        const {error}=await supabase.auth.resetPasswordForEmail(em.trim(),{redirectTo:`${window.location.origin}/account`});
        if (error) { setMsg(error.message); setSt("error"); }
        else { setSt("success"); setMsg("Password reset email sent!"); }
      }
    } catch(e) { setMsg(e.message); setSt("error"); }
  };

  const L={
    signup:{
      title: lang==="fr"?"Créer un compte":"Create your account",
      sub: lang==="fr"?"Sauvegardez vos salons et produits préférés.":"Save your favourite salons and products.",
      btn: lang==="fr"?"Créer un compte":"Create account",
      alt: lang==="fr"?"Déjà un compte ?":"Already have an account?",
      altBtn: lang==="fr"?"Se connecter":"Log in",
      fname: lang==="fr"?"Prénom":"First name",
      email:"Email",
      password: lang==="fr"?"Mot de passe":"Password",
      forgot: lang==="fr"?"Mot de passe oublié ?":"Forgot password?",
    },
    login:{
      title: lang==="fr"?"Bon retour":"Welcome back",
      sub: lang==="fr"?"Connectez-vous pour voir vos favoris.":"Log in to see your favourites.",
      btn: lang==="fr"?"Se connecter":"Log in",
      alt: lang==="fr"?"Nouveau ici ?":"New here?",
      altBtn: lang==="fr"?"Créer un compte":"Create account",
      fname: lang==="fr"?"Prénom":"First name",
      email:"Email",
      password: lang==="fr"?"Mot de passe":"Password",
      forgot: lang==="fr"?"Mot de passe oublié ?":"Forgot password?",
    },
    reset:{
      title: lang==="fr"?"Réinitialiser le mot de passe":"Reset password",
      sub: lang==="fr"?"Nous vous enverrons un lien de réinitialisation.":"We'll send you a link to reset your password.",
      btn: lang==="fr"?"Envoyer le lien":"Send reset link",
      alt: lang==="fr"?"Retour à":"Back to",
      altBtn: lang==="fr"?"Se connecter":"Log in",
      fname:"First name", email:"Email", password:"Password", forgot:"",
    },
  }[mode];

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:4000,background:"rgba(8,6,4,0.85)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#faf7f4",maxWidth:420,width:"100%",borderRadius:16,overflow:"hidden",boxShadow:"0 48px 120px rgba(0,0,0,0.4)"}}>
        {/* header */}
        <div style={{background:"#0d0d0d",padding:"26px 26px 22px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-50,right:-50,width:200,height:200,borderRadius:"50%",border:"1px solid rgba(201,169,110,0.12)"}} />
          <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"rgba(255,255,255,0.1)",color:"#fff",border:"none",width:28,height:28,borderRadius:"50%",cursor:"pointer",fontSize:"16px",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#c9a96e",letterSpacing:"3px",textTransform:"uppercase",margin:"0 0 10px"}}>✦ The Beauty Pause</p>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"26px",fontWeight:400,color:"#f5f0eb",margin:"0 0 6px"}}>{L.title}</h2>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#666",margin:0}}>{L.sub}</p>
        </div>
        <div style={{padding:"24px 26px 28px"}}>
          {st==="success" ? (
            <div style={{textAlign:"center",padding:"8px 0"}}>
              <div style={{fontSize:"32px",marginBottom:12}}>✦</div>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"14px",color:"#555",lineHeight:1.6,marginBottom:20}}>{msg}</p>
              <button onClick={onClose} style={{padding:"10px 24px",background:"#1a1a1a",color:"#f5f0eb",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"11px",fontWeight:600,letterSpacing:"2px",textTransform:"uppercase",borderRadius:8}}>Close</button>
            </div>
          ) : (
            <>
              {mode==="signup"&&(
                <div style={{marginBottom:14}}>
                  <label style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#aaa",letterSpacing:"1.5px",textTransform:"uppercase",display:"block",marginBottom:5}}>{L.fname}</label>
                  <input value={fn} onChange={e=>setFn(e.target.value)} style={{width:"100%",padding:"11px 14px",border:"1px solid #ede8e2",background:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",color:"#1a1a1a",outline:"none",borderRadius:8,transition:"border 0.2s"}} onFocus={e=>e.target.style.borderColor="#c9a96e"} onBlur={e=>e.target.style.borderColor="#ede8e2"} />
                </div>
              )}
              <div style={{marginBottom:14}}>
                <label style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#aaa",letterSpacing:"1.5px",textTransform:"uppercase",display:"block",marginBottom:5}}>{L.email}</label>
                <input type="email" value={em} onChange={e=>setEm(e.target.value)} style={{width:"100%",padding:"11px 14px",border:"1px solid #ede8e2",background:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",color:"#1a1a1a",outline:"none",borderRadius:8,transition:"border 0.2s"}} onFocus={e=>e.target.style.borderColor="#c9a96e"} onBlur={e=>e.target.style.borderColor="#ede8e2"} />
              </div>
              {mode!=="reset"&&(
                <div style={{marginBottom:20}}>
                  <label style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#aaa",letterSpacing:"1.5px",textTransform:"uppercase",display:"block",marginBottom:5}}>{L.password}</label>
                  <input type="password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} style={{width:"100%",padding:"11px 14px",border:"1px solid #ede8e2",background:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",color:"#1a1a1a",outline:"none",borderRadius:8,transition:"border 0.2s"}} onFocus={e=>e.target.style.borderColor="#c9a96e"} onBlur={e=>e.target.style.borderColor="#ede8e2"} />
                  {mode==="login"&&<button onClick={()=>{setMode("reset");setMsg("");setSt("idle");}} style={{background:"none",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#aaa",marginTop:6,padding:0,textDecoration:"underline"}}>{L.forgot}</button>}
                </div>
              )}
              {msg&&st==="error"&&<p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#b85c5c",margin:"0 0 12px",lineHeight:1.4}}>{msg}</p>}
              <button onClick={submit} disabled={st==="loading"} style={{width:"100%",padding:"13px",background:st==="loading"?"#ccc":"#1a1a1a",color:"#f5f0eb",border:"none",cursor:st==="loading"?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"11px",fontWeight:600,letterSpacing:"2px",textTransform:"uppercase",borderRadius:8,transition:"background 0.2s",marginBottom:16}} onMouseEnter={e=>{if(st!=="loading")e.target.style.background="#b85c5c";}} onMouseLeave={e=>{if(st!=="loading")e.target.style.background="#1a1a1a";}}>
                {st==="loading"?"…":L.btn}
              </button>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#aaa",textAlign:"center",margin:0}}>
                {L.alt}{" "}
                <button onClick={()=>{setMode(mode==="login"?"signup":"login");setMsg("");setSt("idle");}} style={{background:"none",border:"none",cursor:"pointer",color:"#b85c5c",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",fontWeight:600,padding:0,textDecoration:"underline"}}>{L.altBtn}</button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── HEART / FAVOURITE BUTTON ──────────────────────────────────────────────────
function FavBtn({ type, item, user, favourites, onToggle, size=22 }) {
  const isFav = favourites.some(f=>f.type===type&&f.item_id===item.id);
  const [optimistic, setOptimistic] = useState(null); // null | true | false
  const active = optimistic !== null ? optimistic : isFav;
  const [hov,setHov]=useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    setOptimistic(!active); // instant visual feedback
    onToggle(type, item);
  };

  // sync back when real state updates
  useEffect(()=>{ setOptimistic(null); },[isFav]);

  return (
    <button onClick={handleClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:"none",border:"none",cursor:"pointer",padding:2,display:"flex",alignItems:"center",justifyContent:"center",transition:"transform 0.2s",transform:hov?"scale(1.2)":"scale(1)",filter:`drop-shadow(0 1px 3px rgba(0,0,0,0.3))`}}
      title={active?"Remove from favourites":"Save to favourites"}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill={active?"#e05c7a":"none"} stroke={active?"#e05c7a":"rgba(255,255,255,0.9)"} strokeWidth="2.5">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </button>
  );
}


function LocationAwareErrorBoundary({children}) {
  const location = useLocation();
  return <ErrorBoundary location={location.pathname}>{children}</ErrorBoundary>;
}
function useData() {
  const [salons,setSalons]=useState([]);
  const [allProducts,setAllProducts]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    (async()=>{
      setLoading(true);
      try {
        const [retail,products,slots]=await Promise.all([
          fetchAll(TBL_RETAIL,"{current_status}='YES'"),
          fetchAll(TBL_PRODUCTS,""),
          fetchAll(TBL_SLOTS,"{stage}='ACTIVE'"),
        ]);
        const pById={}; products.forEach(p=>{pById[p.id]=p;});

        // helper: extract text brand, ignore record IDs (strings starting with 'rec')
        const cleanBrand=(val)=>{
          if (!val) return null;
          if (Array.isArray(val)) {
            const txt = val.find(v=>typeof v==="string"&&!v.startsWith("rec"));
            return txt||null;
          }
          if (typeof val==="string"&&val.startsWith("rec")) return null;
          return val;
        };

        const sProds={};
        slots.forEach(slot=>{
          const sIds=Array.isArray(slot.retail_name)?slot.retail_name:[];
          const pIds=Array.isArray(slot.product)?slot.product:[];
          const slotBrand=cleanBrand(slot.brand);
          const img=slot["Image (from product)"];
          sIds.forEach(sid=>{
            if (!sProds[sid]) sProds[sid]=[];
            pIds.forEach(pid=>{
              if (!pById[pid]) return;
              const p={...pById[pid]};
              // resolve brand: product brand first, then slot brand
              const prodBrand=cleanBrand(p.brand);
              p.brand = prodBrand||slotBrand||"—";
              if ((!p.Image||(Array.isArray(p.Image)&&p.Image.length===0))&&img) p.Image=img;
              p._badge=sProds[sid].length===0?"new":"popular";
              sProds[sid].push(p);
            });
          });
        });
        const enriched=retail.map(s=>({...s,_products:sProds[s.id]||[]}));
        setSalons(enriched);
        const seen=new Set(); const uProds=[];
        enriched.forEach(s=>(s._products||[]).forEach(p=>{
          if(!seen.has(p.id)){seen.add(p.id);uProds.push({...p,_salons:[s]});}
          else{const ex=uProds.find(x=>x.id===p.id);if(ex&&!ex._salons.find(x=>x.id===s.id))ex._salons.push(s);}
        }));
        setAllProducts(uProds);
      } catch(e){console.error(e);}
      setLoading(false);
    })();
  },[]);
  return {salons,allProducts,loading};
}

// ── SHARED NAV ────────────────────────────────────────────────────────────────
function Nav({lang,setLang,onJoin,user,onAuthClick}) {
  const navigate=useNavigate(); const location=useLocation();
  const isMobile=window.innerWidth<768; const t=T[lang];
  const [menuOpen,setMenuOpen]=useState(false);
  return (
    <>
      <nav style={{background:"#0d0d0d",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",position:"sticky",top:0,zIndex:500}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flex:1}}>
          <button onClick={()=>navigate("/")} style={{background:"none",border:"none",cursor:"pointer",color:"#777",fontSize:"18px",lineHeight:1,padding:"4px 6px"}} >←</button>
          <div onClick={()=>navigate("/")} style={{cursor:"pointer"}}>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"15px",color:"#f5f0eb",letterSpacing:"2px",fontWeight:300}}>THE</span>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"15px",color:"#c9a96e",letterSpacing:"2px",fontWeight:600,marginLeft:5}}>BEAUTY PAUSE</span>
          </div>
        </div>
        {!isMobile&&(
          <div style={{display:"flex",gap:4,position:"absolute",left:"50%",transform:"translateX(-50%)"}}>
            {[{path:"/salons",label:t.salons},{path:"/products",label:t.products}].map(({path,label})=>{
              const active=location.pathname===path;
              return <button key={path} onClick={()=>navigate(path)} style={{background:"none",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:active?"#f5f0eb":"#666",padding:"6px 16px",fontWeight:active?600:400,borderBottom:active?"1px solid #c9a96e":"1px solid transparent"}}>{label}</button>;
            })}
          </div>
        )}
        <div style={{display:"flex",alignItems:"center",gap:8,flex:1,justifyContent:"flex-end"}}>
          {!isMobile&&(user
            ?<button onClick={()=>navigate("/account")} style={{padding:"6px 14px",background:"transparent",color:"#c9a96e",border:"1px solid rgba(201,169,110,0.4)",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"11px",fontWeight:600,letterSpacing:"1px",textTransform:"uppercase",borderRadius:20}}>✦ Account</button>
            :<button onClick={()=>onAuthClick("login")} style={{padding:"6px 14px",background:"#c9a96e",color:"#0d0d0d",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"11px",fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",borderRadius:20}}>Sign in</button>
          )}
          <div style={{display:"flex",border:"1px solid #333",borderRadius:20,overflow:"hidden"}}>
            {["en","fr"].map(l=><button key={l} onClick={()=>setLang(l)} style={{padding:"4px 9px",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"11px",fontWeight:600,color:lang===l?"#0d0d0d":"#777",background:lang===l?"#c9a96e":"transparent",textTransform:"uppercase"}}>{l}</button>)}
          </div>
          {isMobile&&(
            <button onClick={()=>setMenuOpen(v=>!v)} style={{background:"none",border:"1px solid #444",cursor:"pointer",width:34,height:34,borderRadius:8,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,padding:6}}>
              <span style={{display:"block",width:16,height:2,background:"#f5f0eb",borderRadius:1}}/>
              <span style={{display:"block",width:16,height:2,background:"#f5f0eb",borderRadius:1}}/>
              <span style={{display:"block",width:16,height:2,background:"#f5f0eb",borderRadius:1}}/>
            </button>
          )}
        </div>
      </nav>
      {isMobile&&menuOpen&&(
        <div onClick={()=>setMenuOpen(false)} style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,0.6)"}}>
          <div onClick={e=>e.stopPropagation()} style={{position:"absolute",top:56,right:12,background:"#0d0d0d",border:"1px solid #333",borderRadius:12,overflow:"hidden",width:200,boxShadow:"0 8px 32px rgba(0,0,0,0.4)"}}>
            {[{path:"/salons",label:"🏪 "+t.salons},{path:"/products",label:"✨ "+t.products},{path:"/account",label:"👤 Account"}].map(({path,label})=>(
              <button key={path} onClick={()=>{navigate(path);setMenuOpen(false);}} style={{display:"block",width:"100%",padding:"14px 18px",background:location.pathname===path?"#1a1a1a":"transparent",border:"none",borderBottom:"1px solid #222",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",color:location.pathname===path?"#c9a96e":"#f5f0eb",textAlign:"left",fontWeight:location.pathname===path?600:400}}>{label}</button>
            ))}
            {!user
              ?<button onClick={()=>{onAuthClick("login");setMenuOpen(false);}} style={{display:"block",width:"100%",padding:"14px 18px",background:"transparent",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",color:"#c9a96e",textAlign:"left",fontWeight:600}}>Sign in ✦</button>
              :<button onClick={()=>{navigate("/account");setMenuOpen(false);}} style={{display:"block",width:"100%",padding:"14px 18px",background:"transparent",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",color:"#c9a96e",textAlign:"left",fontWeight:600}}>My account ✦</button>
            }
          </div>
        </div>
      )}
    </>
  );
}

function MobileTabBar({lang,active,user}) { return null; }

// ── LANDING PAGE ──────────────────────────────────────────────────────────────
function LandingPage({lang,setLang,salons,allProducts,user,onAuthClick}) {
  const t=T[lang]; const navigate=useNavigate();
  const [showJoin,setShowJoin]=useState(false);
  const isMobile=window.innerWidth<768;
  const px="clamp(20px,5vw,64px)";
  const L={en:{
    hero:"Discover K-Beauty\nin Paris beauty salons.",
    sub:"Find salons near you. Explore products inside.",
    cta1:"→ Explore Salons", cta2:"→ Browse Products",
    what_title:"What is this?",
    what_body:"The Beauty Pause brings K-Beauty products into beauty salons across Paris — so you can discover them naturally, while you're already there.",
    how_title:"How it works",
    steps:["Find a salon near you","Discover K-Beauty products inside","Learn more or purchase via QR"],
    salon_title:"Featured Salons",
    salon_cta:"View all salons →",
    prod_title:"K-Beauty Products",
    prod_cta:"View all products →",
    prod_note:"Products are available to discover in-salon. Purchase via QR code on-site.",
    join_cta:"Join the community",
    join_sub:"Get early access to exclusive K-beauty events and free product drops.",
  },fr:{
    hero:"Découvrez le K-Beauty\ndans les salons parisiens.",
    sub:"Trouvez un salon près de chez vous. Explorez les produits à l'intérieur.",
    cta1:"→ Explorer les salons", cta2:"→ Voir les produits",
    what_title:"C'est quoi ?",
    what_body:"The Beauty Pause apporte des produits K-Beauty dans les salons de beauté parisiens — pour que vous puissiez les découvrir naturellement, pendant votre visite.",
    how_title:"Comment ça marche",
    steps:["Trouvez un salon près de chez vous","Découvrez des produits K-Beauty à l'intérieur","En savoir plus ou acheter via QR code"],
    salon_title:"Salons à découvrir",
    salon_cta:"Voir tous les salons →",
    prod_title:"Produits K-Beauty",
    prod_cta:"Voir tous les produits →",
    prod_note:"Les produits sont disponibles à découvrir en salon. Achat via QR code sur place.",
    join_cta:"Rejoindre la communauté",
    join_sub:"Accédez en avant-première aux événements K-beauty exclusifs et aux envois de produits gratuits.",
  }}[lang];

  const Section=({children,dark=false,style={}})=>(
    <section style={{background:dark?"#0d0d0d":"#faf7f4",padding:`clamp(48px,7vw,88px) ${px}`,...style}}>
      {children}
    </section>
  );
  const Label=({children})=>(
    <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#c9a96e",letterSpacing:"4px",textTransform:"uppercase",marginBottom:20}}>{children}</p>
  );

  // shuffle helper
  const shuffle=(arr)=>[...arr].sort(()=>Math.random()-0.5);
  const previewSalons = shuffle(salons.filter(s=>(s._products||[]).length>0));
  const previewProds  = shuffle(allProducts);

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0}html,body{background:#0d0d0d;overflow-x:hidden}@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:#c9a96e;border-radius:3px}.hide-scrollbar{scrollbar-width:none;-ms-overflow-style:none}.hide-scrollbar::-webkit-scrollbar{display:none}`}</style>

      {/* NAV */}
      <nav style={{background:"#0d0d0d",height:60,display:"flex",alignItems:"center",justifyContent:"space-between",padding:`0 ${px}`,position:"sticky",top:0,zIndex:500,borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
        <div><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"17px",color:"#f5f0eb",letterSpacing:"2px",fontWeight:300}}>THE</span><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"17px",color:"#c9a96e",letterSpacing:"2px",fontWeight:600,marginLeft:6}}>BEAUTY PAUSE</span></div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {!isMobile&&(user
            ? <button onClick={()=>navigate("/account")} style={{padding:"7px 16px",background:"transparent",color:"#c9a96e",border:"1px solid rgba(201,169,110,0.4)",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"11px",fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase",borderRadius:20,transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.background="#c9a96e";e.currentTarget.style.color="#0d0d0d";}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#c9a96e";}}>✦ Account</button>
            : <button onClick={()=>setShowJoin(true)} style={{padding:"7px 16px",background:"transparent",color:"#c9a96e",border:"1px solid rgba(201,169,110,0.4)",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"11px",fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase",borderRadius:20,transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.background="#c9a96e";e.currentTarget.style.color="#0d0d0d";}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#c9a96e";}}>✦ {t.join}</button>
          )}
          <div style={{display:"flex",border:"1px solid #333",borderRadius:20,overflow:"hidden"}}>
            {["en","fr"].map(l=><button key={l} onClick={()=>setLang(l)} style={{padding:"5px 10px",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"11px",fontWeight:600,color:lang===l?"#0d0d0d":"#666",background:lang===l?"#c9a96e":"transparent",transition:"all 0.2s",textTransform:"uppercase"}}>{l}</button>)}
          </div>
        </div>
      </nav>

      {/* ① HERO — 40:60 split */}
      <section style={{background:"#0d0d0d",minHeight:"92vh",display:"flex",alignItems:"stretch",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-200,left:-100,width:600,height:600,borderRadius:"50%",border:"1px solid rgba(201,169,110,0.05)",pointerEvents:"none"}} />

        {/* LEFT 40%: text */}
        <div style={{width:isMobile?"100%":"40%",flexShrink:0,display:"flex",flexDirection:"column",justifyContent:"flex-start",paddingTop:"clamp(40px,8vh,96px)",padding:`clamp(40px,8vh,96px) ${px} clamp(32px,4vw,56px)`,animation:"fadeUp 1s ease both"}}>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#c9a96e",letterSpacing:"4px",textTransform:"uppercase",marginBottom:20}}>{t.tagline}</p>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(36px,4.5vw,68px)",fontWeight:300,color:"#f5f0eb",lineHeight:1.05,marginBottom:20,whiteSpace:"pre-line"}}>{L.hero}</h1>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"clamp(13px,1.4vw,16px)",color:"#666",lineHeight:1.8,marginBottom:36}}>{L.sub}</p>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <button onClick={()=>navigate("/salons")} style={{padding:"13px 24px",background:"#f5f0eb",color:"#0d0d0d",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",fontWeight:700,letterSpacing:"1.5px",borderRadius:8,transition:"all 0.2s",whiteSpace:"nowrap"}} onMouseEnter={e=>e.target.style.background="#c9a96e"} onMouseLeave={e=>e.target.style.background="#f5f0eb"}>{L.cta1}</button>
            <button onClick={()=>navigate("/products")} style={{padding:"13px 24px",background:"transparent",color:"#f5f0eb",border:"1px solid rgba(255,255,255,0.18)",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",fontWeight:500,letterSpacing:"1.5px",borderRadius:8,transition:"all 0.2s",whiteSpace:"nowrap"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#c9a96e";e.currentTarget.style.color="#c9a96e";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.18)";e.currentTarget.style.color="#f5f0eb";}}>{L.cta2}</button>
          </div>
        {/* mobile: horizontal salon preview below CTA */}
          {isMobile&&previewSalons.length>0&&(
            <div style={{marginTop:36}}>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#c9a96e",letterSpacing:"3px",textTransform:"uppercase",marginBottom:14,fontWeight:700}}>✦ K-Beauty Salons</p>
              <div className="hide-scrollbar" style={{display:"flex",gap:12,overflowX:"auto",marginLeft:`calc(-1 * ${px})`,marginRight:`calc(-1 * ${px})`,paddingLeft:px,paddingRight:px,paddingBottom:4}}>
                {previewSalons.slice(0,8).map(s=>{
                  const img=getSalonImg(s); const prods=s._products||[];
                  return (
                    <div key={s.id} onClick={()=>navigate("/salons")} style={{flexShrink:0,width:170,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:14,overflow:"hidden",cursor:"pointer"}}>
                      <div style={{paddingBottom:"55%",position:"relative",overflow:"hidden",background:"#1a1a1a"}}>
                        {img?<img src={img} alt={s.name} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}} />:<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"28px",color:"rgba(201,169,110,0.2)"}}>{s.name?.[0]}</span></div>}
                        <div style={{position:"absolute",top:7,left:7,background:"rgba(0,0,0,0.55)",color:"#f5f0eb",fontSize:"9px",fontFamily:"'DM Sans',sans-serif",fontWeight:600,letterSpacing:"1px",textTransform:"uppercase",padding:"2px 7px",borderRadius:20}}>{s.category}</div>
                      </div>
                      <div style={{padding:"9px 11px 10px"}}>
                        <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"13px",fontWeight:600,color:"#f5f0eb",margin:"0 0 5px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.name}</p>
                        {/* product thumbnails */}
                        {prods.length>0&&(
                          <div style={{display:"flex",gap:3,alignItems:"center"}}>
                            {prods.slice(0,3).map(p=>{const pi=getProdImg(p);return pi?<div key={p.id} style={{width:20,height:20,borderRadius:4,overflow:"hidden",border:"1px solid rgba(255,255,255,0.2)"}}><img src={pi} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>:null;})}
                            {prods.length>0&&<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"8px",color:"#c9a96e",fontWeight:600,marginLeft:3}}>✦</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT 60%: white panel — tall salon cards only */}
        {!isMobile&&(
          <div style={{flex:1,background:"#faf7f4",display:"flex",flexDirection:"column",justifyContent:"center",padding:"clamp(32px,4vw,56px) clamp(24px,3vw,40px)",overflow:"hidden",animation:"fadeUp 1s ease 0.15s both"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div>
                <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"22px",color:"#1a1a1a",margin:0,fontWeight:400}}>Featured Salons <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#c9a96e",fontWeight:700,letterSpacing:"1px"}}>✦ K-Beauty</span></p>
              </div>
              <button onClick={()=>navigate("/salons")} style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#b85c5c",background:"none",border:"1px solid #f0d0d0",cursor:"pointer",fontWeight:600,padding:"5px 12px",borderRadius:20,whiteSpace:"nowrap",transition:"all 0.2s",flexShrink:0}} onMouseEnter={e=>{e.currentTarget.style.background="#b85c5c";e.currentTarget.style.color="#fff";}} onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.color="#b85c5c";}}>{L.salon_cta}</button>
            </div>
            {/* horizontal scroll of tall cards — 1.2x bigger: 200→240 */}
            <div className="hide-scrollbar" style={{display:"flex",gap:14,overflowX:"auto",paddingBottom:4}}>
              {previewSalons.map(s=>{
                const img=getSalonImg(s); const prods=s._products||[];
                return (
                  <div key={s.id} onClick={()=>navigate("/salons")}
                    style={{flexShrink:0,width:240,background:"#fff",border:"1px solid #f0ebe5",borderRadius:14,overflow:"hidden",cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,0.05)",transition:"all 0.2s",display:"flex",flexDirection:"column"}}
                    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 10px 28px rgba(0,0,0,0.1)";e.currentTarget.style.borderColor="#e8c9a0";}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.05)";e.currentTarget.style.borderColor="#f0ebe5";}}>
                    {/* salon image — 45% height */}
                    <div style={{paddingBottom:"55%",position:"relative",overflow:"hidden",background:"#1a1a1a",flexShrink:0}}>
                      {img?<img src={img} alt={s.name} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}} />
                        :<div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,#2a2a2a,#1a1a1a)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"36px",color:"rgba(201,169,110,0.2)"}}>{s.name?.[0]}</span></div>}
                      <div style={{position:"absolute",top:8,left:8,background:"rgba(0,0,0,0.55)",color:"#f5f0eb",fontSize:"9px",fontFamily:"'DM Sans',sans-serif",fontWeight:600,letterSpacing:"1px",textTransform:"uppercase",padding:"2px 8px",borderRadius:20}}>{s.category}</div>
                      {s.salon_tier&&<div style={{position:"absolute",top:7,right:7}}><TierBadge tier={s.salon_tier} size={12}/></div>}
                    </div>
                    {/* salon info */}
                    <div style={{padding:"10px 12px 8px",borderBottom:prods.length>0?"1px solid #f5f0f0":"none"}}>
                      <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"15px",fontWeight:600,color:"#1a1a1a",margin:"0 0 2px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.name}</p>
                      <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#bbb",margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.area||"Paris"}</p>
                    </div>
                    {/* product chips — stacked vertically */}
                    {prods.length>0&&(
                      <div style={{padding:"8px 12px 10px",display:"flex",flexDirection:"column",gap:5,flex:1}}>
                        {prods.slice(0,3).map(p=>{
                          const isNew=p._badge==="new"; const prodImg=getProdImg(p);
                          const brandD=p.brand_name||(Array.isArray(p.brand)?null:(!p.brand?.startsWith?.("rec")?p.brand:null))||"";
                          return (
                            <div key={p.id} style={{display:"flex",alignItems:"center",gap:7,background:isNew?"#fdf8ee":"#fdf0f0",padding:"5px 9px",borderRadius:8,border:`1px solid ${isNew?"#e8d9b8":"#f0d0d0"}`}}>
                              {prodImg&&<img src={prodImg} alt="" style={{width:34,height:34,borderRadius:6,objectFit:"cover",flexShrink:0}}/>}
                              <div style={{minWidth:0}}>
                                <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"9px",color:isNew?"#a07832":"#b85c5c",fontWeight:700,letterSpacing:"0.8px",textTransform:"uppercase",margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{brandD}</p>
                                <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#555",margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.product_name}</p>
                              </div>
                            </div>
                          );
                        })}
                        {prods.length>3&&<p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"9px",color:"#bbb",margin:0,textAlign:"center"}}>+{prods.length-3} more</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
      <div style={{height:"1px",background:"rgba(255,255,255,0.08)"}} />

      {/* ② WHAT IS THIS + HOW IT WORKS — merged dark section, centered */}
      <section style={{background:"#0d0d0d",padding:`clamp(56px,7vw,96px) ${px}`,textAlign:"center"}}>
        <div style={{maxWidth:640,margin:"0 auto",marginBottom:56}}>
          <Label>{L.what_title}</Label>
          <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(22px,3vw,34px)",fontWeight:300,color:"#f5f0eb",lineHeight:1.5}}>{L.what_body}</p>
        </div>
        <div style={{height:1,background:"rgba(255,255,255,0.08)",marginBottom:48,maxWidth:560,margin:"0 auto 48px"}} />
        <Label>{L.how_title}</Label>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:32,maxWidth:820,margin:"0 auto",textAlign:"left"}}>
          {L.steps.map((step,i)=>(
            <div key={i} style={{display:"flex",gap:20,alignItems:"flex-start",animation:`fadeUp 0.7s ease ${i*0.12}s both`}}>
              <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"52px",color:"rgba(201,169,110,0.2)",fontWeight:300,lineHeight:1,flexShrink:0,marginTop:-6}}>0{i+1}</span>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"15px",color:"#aaa",fontWeight:400,lineHeight:1.6,margin:"8px 0 0"}}>{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ④ JOIN CTA */}
      <section style={{background:"#faf7f4",padding:`clamp(56px,7vw,88px) ${px}`,textAlign:"center"}}>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#c9a96e",letterSpacing:"4px",textTransform:"uppercase",marginBottom:16}}>✦ Community</p>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(28px,4vw,48px)",fontWeight:300,color:"#1a1a1a",maxWidth:560,margin:"0 auto 16px"}}>{L.join_cta}</h2>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"14px",color:"#888",lineHeight:1.7,maxWidth:440,margin:"0 auto 32px"}}>{L.join_sub}</p>
        <button onClick={()=>setShowJoin(true)} style={{padding:"14px 36px",background:"#1a1a1a",color:"#f5f0eb",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",borderRadius:8,transition:"all 0.2s"}} onMouseEnter={e=>e.target.style.background="#b85c5c"} onMouseLeave={e=>e.target.style.background="#1a1a1a"}>✦ {L.join_cta}</button>
      </section>

      {/* FOOTER */}
      <footer style={{background:"#0d0d0d",padding:"32px clamp(20px,5vw,64px)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12,borderTop:"1px solid rgba(255,255,255,0.05)"}}>
        <div><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"14px",color:"#f5f0eb",letterSpacing:"3px",fontWeight:300}}>THE</span><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"14px",color:"#c9a96e",letterSpacing:"3px",fontWeight:600,marginLeft:5}}>BEAUTY PAUSE</span></div>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#444"}}>{t.footer}</p>
      </footer>

      {showJoin&&<AuthModal onClose={()=>setShowJoin(false)} lang={lang} initialMode="signup" />}
    </>
  );
}

// ── SALONS PAGE ───────────────────────────────────────────────────────────────
function SalonsPage({lang,setLang,salons,loading,user,favourites,onToggleFav,onAuthClick}) {
  const t=T[lang]; const isMobile=window.innerWidth<768;
  const [sf,setSf]=useState({tier:[],area:"All",brand:"All",categories:[],kbeautyOnly:true});
  const [sortBy,setSortBy]=useState("az");
  const [search,setSearch]=useState("");
  const [visibleIds,setVisibleIds]=useState(null);
  const [filtered,setFiltered]=useState(salons);
  const [showFilter,setShowFilter]=useState(false);
  const [showJoin,setShowJoin]=useState(false);
  const [selSalon,setSelSalon]=useState(null);
  const [lr,setLr]=useState(!!window.L);
  useEffect(()=>{if(window.L){setLr(true);return;}const lnk=document.createElement("link");lnk.rel="stylesheet";lnk.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";document.head.appendChild(lnk);const s=document.createElement("script");s.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";s.onload=()=>setLr(true);document.head.appendChild(s);},[]);
  useEffect(()=>{
    let r=[...salons];
    if(sf.categories.length>0)r=r.filter(s=>sf.categories.map(c=>c.toLowerCase()).includes((s.category||"").toLowerCase()));
    if(sf.tier.length>0)r=r.filter(s=>sf.tier.includes(s.salon_tier));
    if(sf.area!=="All")r=r.filter(s=>s.area===sf.area);
    if(sf.brand!=="All")r=r.filter(s=>(s._products||[]).some(p=>p.brand===sf.brand));
    if(sf.kbeautyOnly)r=r.filter(s=>(s._products||[]).length>0);
    if(search)r=r.filter(s=>s.name?.toLowerCase().includes(search.toLowerCase())||s.address?.toLowerCase().includes(search.toLowerCase()));
    if(sortBy==="az")r.sort((a,b)=>(a.name||"").localeCompare(b.name||""));
    if(sortBy==="tier")r.sort((a,b)=>(TIER_ORDER[a.salon_tier]??9)-(TIER_ORDER[b.salon_tier]??9));
    if(sortBy==="area")r.sort((a,b)=>(a.area||"").localeCompare(b.area||""));
    setFiltered(r);
  },[salons,sf,search,sortBy,visibleIds]);
  const areas=["All",...Array.from(new Set(salons.map(s=>s.area).filter(Boolean))).sort()];
  const brands=["All",...Array.from(new Set(salons.flatMap(s=>(s._products||[]).map(p=>p.brand)).filter(Boolean))).sort()];
  const afc=[sf.tier.length>0,sf.area!=="All",sf.brand!=="All",sf.categories.length>0,sf.kbeautyOnly].filter(Boolean).length;
  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0}html,body{background:#faf7f4;height:100%;overscroll-behavior:none}@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:#c9a96e;border-radius:3px}.leaflet-tooltip{background:#fff;border:1px solid #ede8e2;border-radius:8px;padding:6px 10px}`}</style>
      <Nav lang={lang} setLang={setLang} onJoin={()=>setShowJoin(true)} user={user} onAuthClick={onAuthClick} />
      {isMobile&&<MobileTabBar lang={lang} active="/salons" user={user} />}
      {/* filter */}
      <div style={{background:"#fff",borderBottom:"1px solid #ede8e2",padding:"9px clamp(12px,3vw,20px)",display:"flex",alignItems:"center",gap:8,overflowX:"auto",position:"sticky",top:56,zIndex:399,flexWrap:"nowrap"}}>
        <button onClick={()=>setShowFilter(true)} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 13px",border:`1.5px solid ${afc>0?"#1a1a1a":"#ede8e2"}`,background:afc>0?"#1a1a1a":"#fff",color:afc>0?"#fff":"#555",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",borderRadius:20,flexShrink:0,transition:"all 0.2s"}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
          {t.filter}{afc>0&&<span style={{background:"#c9a96e",color:"#0d0d0d",borderRadius:"50%",width:19,height:19,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:700}}>{afc}</span>}
        </button>
        <div style={{width:1,height:18,background:"#ede8e2",flexShrink:0}} />
        <button onClick={()=>setSf(f=>({...f,kbeautyOnly:!f.kbeautyOnly}))} style={{padding:"7px 13px",border:`1.5px solid ${sf.kbeautyOnly?"#c9a96e":"#ede8e2"}`,background:sf.kbeautyOnly?"#fdf8ee":"#fff",color:sf.kbeautyOnly?"#c9a96e":"#666",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",fontWeight:sf.kbeautyOnly?600:400,borderRadius:20,flexShrink:0,transition:"all 0.2s",whiteSpace:"nowrap"}}>✦ K-Beauty</button>
        {["Nail","Beauty","Hair","Spa"].map(cat=>{const a=sf.categories.includes(cat);return<button key={cat} onClick={()=>setSf(f=>({...f,categories:toggleArr(f.categories,cat)}))} style={{padding:"7px 13px",border:`1.5px solid ${a?"#1a1a1a":"#ede8e2"}`,background:a?"#1a1a1a":"#fff",color:a?"#fff":"#666",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",borderRadius:20,flexShrink:0,transition:"all 0.2s",whiteSpace:"nowrap"}}>{cat}</button>;})}
        <input placeholder={t.search_salon} value={search} onChange={e=>setSearch(e.target.value)} style={{padding:"7px 13px",border:"1px solid #ede8e2",background:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#555",outline:"none",borderRadius:20,width:isMobile?130:200,marginLeft:"auto",flexShrink:0}}/>
      </div>
      {/* content */}
      {isMobile?(
        <div style={{position:"relative",height:`calc(100vh - 56px - 44px)`,overflow:"hidden",touchAction:"pan-x pan-y"}}>
          <div style={{position:"absolute",inset:0}}>{lr?<SalonMap salons={filtered} onPinClick={s=>{if(BottomSheet._setPinned)BottomSheet._setPinned(s);}} onBoundsChange={setVisibleIds} />:<div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",color:"#aaa"}}>{t.loading}</div>}</div>
          <BottomSheet salons={filtered} loading={loading} onSalonClick={setSelSalon} lang={lang} visibleCount={visibleIds?filtered.length:salons.length} />
        </div>
      ):(
        <div style={{display:"flex",height:"calc(100vh - 56px - 44px)",overflow:"hidden"}}>
          <div style={{width:"52%",overflowY:"auto",padding:"20px 16px 40px 20px"}}>
            {loading?<div style={{textAlign:"center",padding:"60px 0",fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",color:"#ccc"}}>{t.loading}</div>:<>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#aaa",marginBottom:16}}>{filtered.length} {t.salons_count}</p>
              {filtered.length===0?<div style={{textAlign:"center",padding:"60px 0",fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",color:"#ccc"}}>{t.no_salons}</div>
              :<div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:20}}>
                {filtered.map((s,i)=><div key={s.id} style={{animation:`fadeUp 0.4s ease ${i*0.04}s both`}}><SalonCard salon={s} onClick={setSelSalon} lang={lang} user={user} favourites={favourites} onToggleFav={onToggleFav} /></div>)}
              </div>}
            </>}
          </div>
          <div style={{flex:1,position:"sticky",top:0,height:"100%"}}>{lr?<SalonMap salons={filtered} onPinClick={setSelSalon} onBoundsChange={setVisibleIds} />:<div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",color:"#aaa"}}>{t.loading}</div>}</div>
        </div>
      )}
      {showFilter&&<FilterModal onClose={()=>setShowFilter(false)} lang={lang} filters={sf} setFilters={setSf} areas={areas} brands={brands} sortBy={sortBy} setSortBy={setSortBy} />}
      {showJoin&&<AuthModal onClose={()=>setShowJoin(false)} lang={lang} initialMode="signup" />}
      {selSalon&&<SalonModal salon={selSalon} onClose={()=>setSelSalon(null)} leafletReady={lr} lang={lang} />}
    </>
  );
}

// ── PRODUCTS PAGE ─────────────────────────────────────────────────────────────
function ProductsPage({lang,setLang,allProducts,salons,loading,user,favourites,onToggleFav,onAuthClick}) {
  const t=T[lang]; const isMobile=window.innerWidth<768;
  const [prodSearch,setProdSearch]=useState("");
  const [prodCats,setProdCats]=useState([]); // multi-select array
  const [inSalonOnly,setInSalonOnly]=useState(false);
  const [showFilterModal,setShowFilterModal]=useState(false);
  const [fp,setFp]=useState(allProducts);
  const [showJoin,setShowJoin]=useState(false);
  const [selProd,setSelProd]=useState(null);   // selected on map
  const [modalProd,setModalProd]=useState(null); // opened in modal
  const [selSalon,setSelSalon]=useState(null);
  const [mapSalons,setMapSalons]=useState([]); // salons shown on map
  const [lr,setLr]=useState(!!window.L);

  useEffect(()=>{if(window.L){setLr(true);return;}const lnk=document.createElement("link");lnk.rel="stylesheet";lnk.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";document.head.appendChild(lnk);const s=document.createElement("script");s.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";s.onload=()=>setLr(true);document.head.appendChild(s);},[]);

  const location = useLocation();
  useEffect(()=>{
    let r=[...allProducts];
    if (prodCats.length>0) r=r.filter(p=>prodCats.includes(p.category));
    if (inSalonOnly) r=r.filter(p=>(p._salons||[]).length>0);
    if (prodSearch) r=r.filter(p=>p.product_name?.toLowerCase().includes(prodSearch.toLowerCase())||p.brand?.toLowerCase().includes(prodSearch.toLowerCase()));
    setFp(r);
  },[allProducts,prodCats,inSalonOnly,prodSearch]);

  // handle navigation from SalonModal "other salons" button
  useEffect(()=>{
    if (location.state?.selectProductId) {
      const p = allProducts.find(x=>x.id===location.state.selectProductId);
      if (p) { setSelProd(p); setMapSalons(p._salons||[]); }
    }
  },[location.state,allProducts]);

  // when product selected, update map to show its salons (no modal)
  const handleProdClick=(p)=>{
    setSelProd(p);
    setMapSalons(p._salons||[]);
  };
  const handleProdDetail=(e,p)=>{
    e.stopPropagation();
    setModalProd(p);
  };

  const cats=["All",...Array.from(new Set(allProducts.map(p=>p.category).filter(Boolean))).sort()];
  const activeFilterCount=[prodCats.length>0,inSalonOnly].filter(Boolean).length;

  const SS={fontFamily:"'DM Sans',sans-serif"};

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0}html,body{background:#faf7f4;height:100%;overscroll-behavior:none}@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:#c9a96e;border-radius:3px}.leaflet-tooltip{background:#fff;border:1px solid #ede8e2;border-radius:8px;padding:6px 10px}`}</style>
      <Nav lang={lang} setLang={setLang} onJoin={()=>setShowJoin(true)} user={user} onAuthClick={onAuthClick} />
      {isMobile&&<MobileTabBar lang={lang} active="/products" user={user} />}

      {/* FILTER BAR */}
      <div style={{background:"#fff",borderBottom:"1px solid #ede8e2",padding:"9px clamp(12px,3vw,20px)",display:"flex",alignItems:"center",gap:8,overflowX:"auto",position:"sticky",top:56,zIndex:399,flexWrap:"nowrap"}}>
        {/* filter modal button */}
        <button onClick={()=>setShowFilterModal(true)} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 13px",border:`1.5px solid ${activeFilterCount>0?"#1a1a1a":"#ede8e2"}`,background:activeFilterCount>0?"#1a1a1a":"#fff",color:activeFilterCount>0?"#fff":"#555",cursor:"pointer",...SS,fontSize:"12px",fontWeight:500,borderRadius:20,flexShrink:0,transition:"all 0.2s"}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
          {t.filter}
          {activeFilterCount>0&&<span style={{background:"#c9a96e",color:"#0d0d0d",borderRadius:"50%",width:19,height:19,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:700}}>{activeFilterCount}</span>}
        </button>
        <div style={{width:1,height:18,background:"#ede8e2",flexShrink:0}} />
        {/* in salon button */}
        <button onClick={()=>setInSalonOnly(v=>!v)} style={{padding:"7px 13px",border:`1.5px solid ${inSalonOnly?"#c9a96e":"#ede8e2"}`,background:inSalonOnly?"#fdf8ee":"#fff",color:inSalonOnly?"#c9a96e":"#666",cursor:"pointer",...SS,fontSize:"12px",fontWeight:inSalonOnly?600:400,borderRadius:20,flexShrink:0,transition:"all 0.2s",whiteSpace:"nowrap"}}>
          📍 In salon
        </button>
        {/* category chips */}
        {cats.filter(c=>c!=="All").map(cat=>{
          const a=prodCats.includes(cat);
          return <button key={cat} onClick={()=>setProdCats(prev=>prev.includes(cat)?prev.filter(x=>x!==cat):[...prev,cat])} style={{padding:"7px 13px",border:`1.5px solid ${a?"#1a1a1a":"#ede8e2"}`,background:a?"#1a1a1a":"#fff",color:a?"#fff":"#666",cursor:"pointer",...SS,fontSize:"12px",borderRadius:20,flexShrink:0,transition:"all 0.2s",whiteSpace:"nowrap"}}>{cat}</button>;
        })}
        {/* search */}
        <input placeholder={t.search_product} value={prodSearch} onChange={e=>setProdSearch(e.target.value)} style={{padding:"7px 13px",border:"1px solid #ede8e2",background:"#fff",...SS,fontSize:"12px",color:"#555",outline:"none",borderRadius:20,width:isMobile?130:200,marginLeft:"auto",flexShrink:0}}/>
      </div>

      {/* SPLIT LAYOUT */}
      {isMobile ? (
        /* mobile: fullscreen map + bottom sheet with product cards */
        <div style={{position:"relative",height:`calc(100vh - 56px - 44px - 52px)`,overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0}}>
            {lr?<SalonMap salons={mapSalons.length>0?mapSalons:salons} onPinClick={setSelSalon} />
              :<div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",...SS,color:"#aaa"}}>{t.loading}</div>}
          </div>
          {/* bottom sheet */}
          <div style={{position:"absolute",bottom:0,left:0,right:0,background:"#faf7f4",borderRadius:"16px 16px 0 0",boxShadow:"0 -4px 24px rgba(0,0,0,0.12)",zIndex:100,maxHeight:"65vh",display:"flex",flexDirection:"column"}}>
            <div style={{padding:"12px 0 8px",display:"flex",justifyContent:"center",flexShrink:0}}>
              <div style={{width:36,height:4,borderRadius:2,background:"#ddd"}} />
            </div>
            <div style={{padding:"0 14px 8px",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <p style={{...SS,fontSize:"12px",color:"#aaa",margin:0}}>{fp.length} products</p>
              {selProd&&<button onClick={()=>{setSelProd(null);setMapSalons([]);}} style={{...SS,fontSize:"11px",color:"#b85c5c",background:"none",border:"none",cursor:"pointer"}}>× Clear selection</button>}
            </div>
            <div style={{overflowY:"auto",padding:"0 14px 80px",flex:1}}>
              {loading?<div style={{textAlign:"center",padding:"40px 0",fontFamily:"'Cormorant Garamond',serif",fontSize:"18px",color:"#ccc"}}>{t.loading}</div>
              :<div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
                {fp.map((p,i)=><ProductCard key={p.id} p={p} i={i} t={t} onClick={()=>handleProdClick(p)} onDetail={handleProdDetail} user={user} favourites={favourites} onToggleFav={onToggleFav} isSelected={selProd?.id===p.id}/>)}
              </div>}
            </div>
          </div>
        </div>
      ) : (
        <div style={{display:"flex",height:"calc(100vh - 56px - 44px)",overflow:"hidden"}}>
          {/* LEFT: product list */}
          <div style={{width:"52%",overflowY:"auto",padding:"20px 16px 40px 20px"}}>
            {loading?<div style={{textAlign:"center",padding:"60px 0",fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",color:"#ccc"}}>{t.loading}</div>
            :<>
              <p style={{...SS,fontSize:"12px",color:"#aaa",marginBottom:16}}>{fp.length} products{selProd?` · Showing ${(selProd._salons||[]).length} salon${(selProd._salons||[]).length!==1?"s":""} on map`:""}</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16}}>
                {fp.map((p,i)=>(
                  <ProductCard key={p.id} p={p} i={i} t={t}
                    onClick={()=>handleProdClick(p)}
                    onDetail={handleProdDetail}
                    user={user} favourites={favourites} onToggleFav={onToggleFav}
                    isSelected={selProd?.id===p.id}
                  />
                ))}
              </div>
            </>}
          </div>
          {/* RIGHT: map */}
          <div style={{flex:1,position:"sticky",top:0,height:"100%",display:"flex",flexDirection:"column"}}>
            {/* map hint */}
            <div style={{background:"#fff",borderBottom:"1px solid #ede8e2",padding:"10px 16px",display:"flex",alignItems:"center",gap:10,flexShrink:0,minHeight:60}}>
              {selProd ? (
                <>
                  {/* product thumbnail */}
                  {(()=>{const img=getProdImg(selProd);return img&&<div style={{width:40,height:40,borderRadius:8,overflow:"hidden",flexShrink:0}}><img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>;})()}
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{...SS,fontSize:"12px",fontWeight:600,color:"#1a1a1a",margin:"0 0 2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{selProd.product_name}</p>
                    <p style={{...SS,fontSize:"11px",color:"#c9a96e",margin:0}}>📍 Salons where you can discover this product ({(selProd._salons||[]).length})</p>
                  </div>
                  <button onClick={()=>{setSelProd(null);setMapSalons([]);}} style={{background:"none",border:"none",cursor:"pointer",color:"#ccc",fontSize:"18px",lineHeight:1,flexShrink:0}}>×</button>
                </>
              ) : (
                <><span style={{fontSize:"14px"}}>💡</span><span style={{...SS,fontSize:"12px",color:"#aaa"}}>Click a product to see where it's available</span></>
              )}
            </div>
            {lr
              ? <SalonMap salons={mapSalons.length>0?mapSalons:salons} onPinClick={setSelSalon} />
              : <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",...SS,color:"#aaa"}}>{t.loading}</div>
            }
          </div>
        </div>
      )}

      {/* product filter modal */}
      {showFilterModal&&(
        <div onClick={()=>setShowFilterModal(false)} style={{position:"fixed",inset:0,zIndex:3000,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#faf7f4",width:"100%",maxWidth:480,borderRadius:16,maxHeight:"85vh",overflow:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.25)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 22px 12px",borderBottom:"1px solid #ede8e2",position:"sticky",top:0,background:"#faf7f4"}}>
              <button onClick={()=>setShowFilterModal(false)} style={{background:"none",border:"none",cursor:"pointer",fontSize:"20px",color:"#999",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
              <h3 style={{...SS,fontSize:"14px",fontWeight:600,color:"#1a1a1a",margin:0}}>{t.filter}</h3>
              <button onClick={()=>{setProdCats([]);setInSalonOnly(false);}} style={{background:"none",border:"none",cursor:"pointer",...SS,fontSize:"12px",color:"#aaa",textDecoration:"underline"}}>{t.clear}</button>
            </div>
            <div style={{padding:"18px 22px 28px"}}>
              {/* In salon */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingBottom:18,borderBottom:"1px solid #ede8e2",marginBottom:18}}>
                <span style={{...SS,fontSize:"13px",color:"#333",fontWeight:500}}>📍 In salon only</span>
                <div onClick={()=>setInSalonOnly(v=>!v)} style={{width:46,height:26,borderRadius:13,background:inSalonOnly?"#c9a96e":"#ddd",cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}>
                  <div style={{width:22,height:22,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:inSalonOnly?22:2,transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}} />
                </div>
              </div>
              {/* Category */}
              <p style={{...SS,fontSize:"10px",color:"#aaa",letterSpacing:"1.5px",textTransform:"uppercase",margin:"0 0 10px"}}>Category</p>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
                {cats.map(cat=>{
                if(cat==="All") return null;
                const a=prodCats.includes(cat);
                return<button key={cat} onClick={()=>setProdCats(prev=>prev.includes(cat)?prev.filter(x=>x!==cat):[...prev,cat])} style={{padding:"8px 16px",border:`1.5px solid ${a?"#1a1a1a":"#ede8e2"}`,background:a?"#1a1a1a":"#fff",color:a?"#fff":"#777",cursor:"pointer",...SS,fontSize:"12px",borderRadius:20,transition:"all 0.2s"}}>{cat}</button>;
              })}
              </div>
              <button onClick={()=>setShowFilterModal(false)} style={{width:"100%",padding:"14px",background:"#1a1a1a",color:"#fff",border:"none",cursor:"pointer",...SS,fontSize:"12px",fontWeight:600,letterSpacing:"2px",textTransform:"uppercase",borderRadius:8}}>Apply</button>
            </div>
          </div>
        </div>
      )}

      {showJoin&&<AuthModal onClose={()=>setShowJoin(false)} lang={lang} initialMode="signup" />}
      {modalProd&&<ProductModal prod={modalProd} salonsWithProd={modalProd._salons||[]} allProducts={allProducts} onClose={()=>setModalProd(null)} onSalonClick={s=>setSelSalon(s)} lang={lang} user={user} favourites={favourites} onToggleFav={onToggleFav} />}
      {selSalon&&<SalonModal salon={selSalon} onClose={()=>setSelSalon(null)} leafletReady={lr} lang={lang} />}
    </>
  );
}

// ── PRODUCT CARD (shared) ──────────────────────────────────────────────────────
function ProductCard({ p, i, t, onClick, onDetail, user, favourites, onToggleFav, noWrapper, isSelected }) {
  const isNew=p._badge==="new"; const color=isNew?"#c9a96e":"#b85c5c"; const border=isNew?"#e8d9b8":"#f0d0d0"; const img=getProdImg(p);
  const brandDisplay=p.brand_name||(Array.isArray(p.brand)?null:(!p.brand?.startsWith?.("rec")?p.brand:null))||"—";
  const inner = (
    <>
      {onToggleFav&&!noWrapper&&<div style={{position:"absolute",top:8,right:8,zIndex:2}}><FavBtn type="product" item={p} user={user} favourites={favourites||[]} onToggle={onToggleFav} size={16}/></div>}
      <div style={{position:"relative",paddingBottom:"80%",overflow:"hidden"}}>
        {img?<img src={img} alt={p.product_name} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}} />:<div style={{position:"absolute",inset:0,background:"#f5f0eb",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"36px"}}>✨</div>}
        <div style={{position:"absolute",top:8,left:8,background:color,color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:"8px",fontWeight:800,letterSpacing:"1.5px",textTransform:"uppercase",padding:"3px 9px",borderRadius:4}}>{isNew?t.new_in:t.top_pick}</div>
      </div>
      <div style={{padding:"11px 13px 13px"}}>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"9px",color,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",margin:"0 0 3px"}}>{brandDisplay}</p>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"13px",color:"#1a1a1a",margin:"0 0 3px",lineHeight:1.35,fontWeight:500}}>{p.product_name}</p>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#aaa",margin:"0 0 5px"}}>{p.category}</p>
        {p.price_customer&&<p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"17px",color:"#1a1a1a",margin:"0 0 6px",fontWeight:600}}>€{p.price_customer}</p>}
        {(p._salons||[]).length>0&&<p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#c9a96e",margin:"0 0 8px"}}>📍 {(p._salons||[]).length} salon{(p._salons||[]).length!==1?"s":""}</p>}
        {onDetail&&<button onClick={e=>{e.stopPropagation();onDetail(e,p);}} style={{width:"100%",padding:"5px 0",background:"transparent",color:"#c9a96e",border:"1px solid #e8d9b8",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"9px",fontWeight:600,letterSpacing:"1px",textTransform:"uppercase",borderRadius:6,transition:"all 0.2s",marginTop:4}} onMouseEnter={e=>{e.currentTarget.style.background="#c9a96e";e.currentTarget.style.color="#fff";}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#c9a96e";}}>
          ✦ View details
        </button>}
      </div>
    </>
  );
  if (noWrapper) return inner;
  return (
    <div onClick={onClick} style={{background:"#fff",border:`1.5px solid ${isSelected?"#c9a96e":border}`,overflow:"hidden",borderRadius:12,cursor:"pointer",transition:"all 0.2s",animation:`fadeUp 0.4s ease ${i*0.03}s both`,position:"relative",boxShadow:isSelected?"0 4px 20px rgba(201,169,110,0.2)":"none"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=isSelected?"0 4px 20px rgba(201,169,110,0.2)":"0 10px 30px rgba(0,0,0,0.1)";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow=isSelected?"0 4px 20px rgba(201,169,110,0.2)":"none";}}>
      {inner}
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
// ── ACCOUNT PAGE ─────────────────────────────────────────────────────────────
function AccountPage({lang,setLang,salons,allProducts}) {
  const navigate=useNavigate();
  const [profile,setProfile]=useState({first_name:"",email:"",area:""});
  const [favs,setFavs]=useState([]);
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [userId,setUserId]=useState(null);
  const isMobile=window.innerWidth<768;
  const areas=["Le Marais","Saint-Germain","Bastille","Montmartre","Pigalle","Oberkampf","République","Châtelet","Opéra","Batignolles","Belleville","Nation","Other"];
  const SS={fontFamily:"'DM Sans',sans-serif"};
  const inputStyle={width:"100%",padding:"11px 14px",border:"1px solid #ede8e2",background:"#fff",...SS,fontSize:"13px",color:"#1a1a1a",outline:"none",borderRadius:8,transition:"border 0.2s"};

  useEffect(()=>{
    if (!supabase) return;
    supabase.auth.getUser().then(({data:{user}})=>{
      if (!user){navigate("/");return;}
      setUserId(user.id);
      // load profile
      supabase.from("profiles").select("*").eq("id",user.id).single()
        .then(({data,error})=>{
          console.log("Profile loaded:",data,error);
          if(data) setProfile({first_name:data.first_name||"",email:data.email||user.email,area:data.area||""});
          else setProfile(p=>({...p,email:user.email}));
        });
      // load favourites
      supabase.from("favourites").select("*").eq("user_id",user.id)
        .then(({data,error})=>{
          console.log("Favs loaded:",data,error);
          if(data) setFavs(data);
        });
    });
  },[]);

  const save=async()=>{
    if (!userId) return; setSaving(true);
    const {error}=await supabase.from("profiles").upsert({
      id:userId,
      first_name:profile.first_name,
      area:profile.area,
      email:profile.email
    });
    console.log("Save result:",error);
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),2000);
  };
  const removeFav=async(fav)=>{ await supabase.from("favourites").delete().eq("id",fav.id); setFavs(f=>f.filter(x=>x.id!==fav.id)); };
  const signOut=async()=>{ await supabase.auth.signOut(); navigate("/"); };

  const favSalons=favs.filter(f=>f.type==="salon");
  const favProds=favs.filter(f=>f.type==="product");

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0}html,body{background:#faf7f4}@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#c9a96e;border-radius:3px}`}</style>
      <Nav lang={lang} setLang={setLang} onJoin={()=>{}} />
      {isMobile&&<MobileTabBar lang={lang} active="/account" />}
      <main style={{maxWidth:700,margin:"0 auto",padding:"40px clamp(16px,4vw,32px) 80px"}}>
        <div style={{marginBottom:32,animation:"fadeUp 0.6s ease both"}}>
          <p style={{...SS,fontSize:"10px",color:"#c9a96e",letterSpacing:"4px",textTransform:"uppercase",marginBottom:8}}>✦ My account</p>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(28px,4vw,40px)",fontWeight:300,color:"#1a1a1a"}}>{profile.first_name?`Hello, ${profile.first_name} ✦`:"My account"}</h1>
        </div>

        {/* Profile */}
        <div style={{background:"#fff",border:"1px solid #ede8e2",borderRadius:12,padding:"24px",marginBottom:18,animation:"fadeUp 0.6s ease 0.05s both"}}>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",fontWeight:400,color:"#1a1a1a",margin:"0 0 20px",paddingBottom:12,borderBottom:"1px solid #f5f0f0"}}>Profile</h2>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14,marginBottom:14}}>
            <div>
              <label style={{...SS,fontSize:"10px",color:"#aaa",letterSpacing:"1.5px",textTransform:"uppercase",display:"block",marginBottom:5}}>First name</label>
              <input value={profile.first_name} onChange={e=>setProfile(p=>({...p,first_name:e.target.value}))} style={inputStyle} onFocus={e=>e.target.style.borderColor="#c9a96e"} onBlur={e=>e.target.style.borderColor="#ede8e2"} />
            </div>
            <div>
              <label style={{...SS,fontSize:"10px",color:"#aaa",letterSpacing:"1.5px",textTransform:"uppercase",display:"block",marginBottom:5}}>Email</label>
              <input value={profile.email} disabled style={{...inputStyle,background:"#f9f9f9",color:"#aaa"}} />
            </div>
          </div>
          <div style={{marginBottom:20}}>
            <label style={{...SS,fontSize:"10px",color:"#aaa",letterSpacing:"1.5px",textTransform:"uppercase",display:"block",marginBottom:5}}>My area in Paris</label>
            <select value={profile.area} onChange={e=>setProfile(p=>({...p,area:e.target.value}))} style={{...inputStyle,cursor:"pointer",appearance:"none"}}>
              <option value="">Select your area…</option>
              {areas.map(a=><option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <button onClick={save} disabled={saving} style={{padding:"11px 24px",background:saved?"#4caf50":saving?"#ccc":"#1a1a1a",color:"#fff",border:"none",cursor:"pointer",...SS,fontSize:"11px",fontWeight:600,letterSpacing:"2px",textTransform:"uppercase",borderRadius:8,transition:"all 0.2s"}}>
            {saved?"Saved ✓":saving?"Saving…":"Save changes"}
          </button>
        </div>

        {/* Fav Salons */}
        <div style={{background:"#fff",border:"1px solid #ede8e2",borderRadius:12,padding:"24px",marginBottom:18,animation:"fadeUp 0.6s ease 0.1s both"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,paddingBottom:12,borderBottom:"1px solid #f5f0f0"}}>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",fontWeight:400,color:"#1a1a1a",margin:0}}>Favourite Salons ♡</h2>
            <button onClick={()=>navigate("/salons")} style={{...SS,fontSize:"11px",color:"#b85c5c",background:"none",border:"none",cursor:"pointer",fontWeight:600}}>Browse →</button>
          </div>
          {favSalons.length===0
            ? <p style={{...SS,fontSize:"13px",color:"#ccc",textAlign:"center",padding:"16px 0"}}>Heart a salon to save it here.</p>
            : <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {favSalons.map(f=>{
                  const s=salons.find(x=>x.id===f.item_id); const img=s?getSalonImg(s):null;
                  return (
                    <div key={f.id} onClick={()=>navigate("/salons")} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",border:"1px solid #f0ebe5",borderRadius:10,cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#e8d0b0"} onMouseLeave={e=>e.currentTarget.style.borderColor="#f0ebe5"}>
                      <div style={{width:44,height:44,borderRadius:8,overflow:"hidden",flexShrink:0,background:"#1a1a1a"}}>
                        {img?<img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"18px",color:"rgba(201,169,110,0.4)"}}>{f.item_name?.[0]}</span></div>}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{...SS,fontSize:"13px",fontWeight:600,color:"#1a1a1a",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.item_name}</p>
                        {s&&<p style={{...SS,fontSize:"11px",color:"#aaa",margin:0}}>{s.area||"Paris"}</p>}
                      </div>
                      <button onClick={e=>{e.stopPropagation();removeFav(f);}} style={{background:"none",border:"none",cursor:"pointer",color:"#ddd",fontSize:"18px",padding:"4px",flexShrink:0}} onMouseEnter={e=>e.target.style.color="#b85c5c"} onMouseLeave={e=>e.target.style.color="#ddd"}>×</button>
                    </div>
                  );
                })}
              </div>
          }
        </div>

        {/* Fav Products */}
        <div style={{background:"#fff",border:"1px solid #ede8e2",borderRadius:12,padding:"24px",marginBottom:24,animation:"fadeUp 0.6s ease 0.15s both"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,paddingBottom:12,borderBottom:"1px solid #f5f0f0"}}>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",fontWeight:400,color:"#1a1a1a",margin:0}}>Favourite Products ♡</h2>
            <button onClick={()=>navigate("/products")} style={{...SS,fontSize:"11px",color:"#c9a96e",background:"none",border:"none",cursor:"pointer",fontWeight:600}}>Browse →</button>
          </div>
          {favProds.length===0
            ? <p style={{...SS,fontSize:"13px",color:"#ccc",textAlign:"center",padding:"16px 0"}}>Heart a product to save it here.</p>
            : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:12}}>
                {favProds.map(f=>{
                  const p=allProducts.find(x=>x.id===f.item_id); const img=p?getProdImg(p):null;
                  const isNew=p?._badge==="new"; const color=isNew?"#c9a96e":"#b85c5c";
                  return (
                    <div key={f.id} onClick={()=>navigate("/products")} style={{background:"#fff",border:`1px solid ${isNew?"#e8d9b8":"#f0d0d0"}`,borderRadius:10,overflow:"hidden",position:"relative",cursor:"pointer"}}>
                      <div style={{paddingBottom:"80%",position:"relative",overflow:"hidden",background:"#f5f0eb"}}>
                        {img?<img src={img} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}} />:<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px"}}>✨</div>}
                      </div>
                      <div style={{padding:"8px 10px 10px"}}>
                        <p style={{...SS,fontSize:"8px",color,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",margin:"0 0 2px"}}>{p?.brand}</p>
                        <p style={{...SS,fontSize:"11px",color:"#1a1a1a",margin:0,lineHeight:1.3}}>{f.item_name}</p>
                      </div>
                      <button onClick={e=>{e.stopPropagation();removeFav(f);}} style={{position:"absolute",top:6,right:6,background:"rgba(255,255,255,0.9)",border:"none",cursor:"pointer",color:"#aaa",fontSize:"14px",width:22,height:22,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}} onMouseEnter={e=>e.target.style.color="#b85c5c"} onMouseLeave={e=>e.target.style.color="#aaa"}>×</button>
                    </div>
                  );
                })}
              </div>
          }
        </div>

        <button onClick={signOut} style={{...SS,fontSize:"12px",color:"#aaa",background:"none",border:"1px solid #ede8e2",cursor:"pointer",padding:"10px 20px",borderRadius:8,transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#b85c5c";e.currentTarget.style.color="#b85c5c";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#ede8e2";e.currentTarget.style.color="#aaa";}}>Sign out</button>
      </main>
    </>
  );
}


// ── SPOT PAGE (QR scan landing) ───────────────────────────────────────────────
function SpotPage({ lang, setLang }) {
  const { spotId } = useParams();
  const navigate = useNavigate();
  const t = T[lang];
  const [spot, setSpot] = useState(null);
  const [product, setProduct] = useState(null);
  const [salon, setSalon] = useState(null);
  const [status, setStatus] = useState("loading");
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    if (!spotId) { setStatus("not_found"); return; }
    (async () => {
      try {
        const spots = await fetchAll(TBL_SPOTS, `{spot_id}="${spotId}"`);
        if (!spots.length) { setStatus("not_found"); return; }
        const s = spots[0];
        setSpot(s);
        const prodIds = Array.isArray(s.current_product) ? s.current_product : [];
        if (prodIds.length > 0) {
          const res = await fetch(`https://api.airtable.com/v0/${AT_BASE}/${TBL_PRODUCTS}/${prodIds[0]}`, { headers: { Authorization: `Bearer ${AT_KEY}` } });
          if (res.ok) { const d = await res.json(); setProduct({ id: d.id, ...d.fields }); }
        }
        const salonIds = Array.isArray(s.salon) ? s.salon : [];
        if (salonIds.length > 0) {
          const res = await fetch(`https://api.airtable.com/v0/${AT_BASE}/${TBL_RETAIL}/${salonIds[0]}`, { headers: { Authorization: `Bearer ${AT_KEY}` } });
          if (res.ok) { const d = await res.json(); setSalon({ id: d.id, ...d.fields }); }
        }
        setStatus("found");
      } catch(e) { console.error(e); setStatus("not_found"); }
    })();
  }, [spotId]);

  const img = product ? getProdImg(product) : null;
  const moreImgs = product && Array.isArray(product.more_image) ? product.more_image.map(a=>a.url||a).filter(Boolean) : [];
  const allImgs = img ? [img, ...moreImgs] : moreImgs;
  const brandDisplay = product ? (product.brand_name || (Array.isArray(product.brand) ? null : (!product.brand?.startsWith?.("rec") ? product.brand : null)) || "") : "";
  const salonImg = salon ? getSalonImg(salon) : null;
  const details = product ? [
    {key:"product_1type",label:"Type"},
    {key:"product_2usage",label:"Usage"},
    {key:"product_3texture",label:"Texture"},
    {key:"test_reason",label:"Who is it for?"},
    {key:"product_4target",label:"Target skin"},
    {key:"product_5function",label:"Function"},
    {key:"product_7key_ingredient",label:"Key ingredient"},
    {key:"description",label:"Description"},
  ].filter(d=>product[d.key]) : [];

  const SS = {fontFamily:"'DM Sans',sans-serif"};

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0}html,body{background:#faf7f4}@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>
      <nav style={{background:"#0d0d0d",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",position:"sticky",top:0,zIndex:500}}>
        <div onClick={()=>navigate("/")} style={{cursor:"pointer"}}>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"15px",color:"#f5f0eb",letterSpacing:"2px",fontWeight:300}}>THE</span>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"15px",color:"#c9a96e",letterSpacing:"2px",fontWeight:600,marginLeft:5}}>BEAUTY PAUSE</span>
        </div>
        <div style={{display:"flex",gap:16,alignItems:"center"}}>
          {[{path:"/salons",label:t.salons},{path:"/products",label:t.products}].map(({path,label})=>(
            <button key={path} onClick={()=>navigate(path)} style={{background:"none",border:"none",cursor:"pointer",...SS,fontSize:"12px",color:"#777",letterSpacing:"0.5px"}} onMouseEnter={e=>e.target.style.color="#f5f0eb"} onMouseLeave={e=>e.target.style.color="#777"}>{label}</button>
          ))}
          <div style={{display:"flex",border:"1px solid #333",borderRadius:20,overflow:"hidden"}}>
            {["en","fr"].map(l=><button key={l} onClick={()=>setLang(l)} style={{padding:"4px 9px",border:"none",cursor:"pointer",...SS,fontSize:"11px",fontWeight:600,color:lang===l?"#0d0d0d":"#777",background:lang===l?"#c9a96e":"transparent",transition:"all 0.2s",textTransform:"uppercase"}}>{l}</button>)}
          </div>
        </div>
      </nav>

      {status==="loading"&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"80vh"}}><p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"22px",color:"#ccc"}}>Loading…</p></div>}

      {status==="not_found"&&(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"80vh",padding:"40px 24px",textAlign:"center"}}>
          <p style={{...SS,fontSize:"11px",color:"#c9a96e",letterSpacing:"3px",textTransform:"uppercase",marginBottom:12}}>✦ Discovery Spot</p>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"32px",fontWeight:300,color:"#1a1a1a",marginBottom:12}}>Spot not found</h1>
          <p style={{...SS,fontSize:"14px",color:"#aaa",marginBottom:28}}>This QR code may be outdated or invalid.</p>
          <button onClick={()=>navigate("/")} style={{padding:"12px 28px",background:"#1a1a1a",color:"#f5f0eb",border:"none",cursor:"pointer",...SS,fontSize:"12px",fontWeight:600,letterSpacing:"2px",textTransform:"uppercase",borderRadius:8}}>Go to homepage</button>
        </div>
      )}

      {status==="found"&&!product&&(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh",padding:"40px 24px",textAlign:"center"}}>
          {salon&&<p style={{...SS,fontSize:"11px",color:"#c9a96e",letterSpacing:"2px",textTransform:"uppercase",marginBottom:8}}>✦ {salon.name}</p>}
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"28px",fontWeight:300,color:"#1a1a1a",marginBottom:12}}>No product here yet</h1>
          <p style={{...SS,fontSize:"14px",color:"#aaa",marginBottom:28}}>This spot is being refreshed — check back soon!</p>
          <button onClick={()=>navigate("/products")} style={{padding:"12px 28px",background:"#1a1a1a",color:"#f5f0eb",border:"none",cursor:"pointer",...SS,fontSize:"12px",fontWeight:600,letterSpacing:"2px",textTransform:"uppercase",borderRadius:8}}>Browse all products</button>
        </div>
      )}

      {status==="found"&&product&&(
        <main style={{maxWidth:560,margin:"0 auto",padding:"32px 20px 80px",animation:"fadeUp 0.6s ease both"}}>
          {salon&&(
            <div onClick={()=>navigate("/salons")} style={{display:"flex",alignItems:"center",gap:12,background:"#fff",border:"1px solid #ede8e2",borderRadius:12,padding:"12px 16px",marginBottom:24,cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#c9a96e"} onMouseLeave={e=>e.currentTarget.style.borderColor="#ede8e2"}>
              {salonImg&&<div style={{width:44,height:44,borderRadius:8,overflow:"hidden",flexShrink:0}}><img src={salonImg} alt={salon.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>}
              <div style={{flex:1,minWidth:0}}>
                <p style={{...SS,fontSize:"10px",color:"#c9a96e",letterSpacing:"2px",textTransform:"uppercase",fontWeight:700,margin:"0 0 2px"}}>✦ Discovery Spot · {salon.name}</p>
                <p style={{...SS,fontSize:"11px",color:"#aaa",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{salon.address}</p>
              </div>
              <span style={{color:"#ccc",fontSize:"16px"}}>›</span>
            </div>
          )}
          <div style={{borderRadius:16,overflow:"hidden",marginBottom:24,background:"#f5f0eb"}}>
            <div style={{paddingBottom:"75%",position:"relative",overflow:"hidden"}}>
              {allImgs.length>0
                ? <img src={allImgs[imgIdx]} alt={product.product_name} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"contain",background:"#f5f0eb"}} />
                : <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"64px"}}>✨</div>
              }
              {allImgs.length>1&&<>
                <button onClick={()=>setImgIdx(i=>(i-1+allImgs.length)%allImgs.length)} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",width:36,height:36,borderRadius:"50%",background:"rgba(255,255,255,0.9)",border:"none",cursor:"pointer",fontSize:"18px",display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
                <button onClick={()=>setImgIdx(i=>(i+1)%allImgs.length)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",width:36,height:36,borderRadius:"50%",background:"rgba(255,255,255,0.9)",border:"none",cursor:"pointer",fontSize:"18px",display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
                <div style={{position:"absolute",bottom:12,left:"50%",transform:"translateX(-50%)",display:"flex",gap:6}}>
                  {allImgs.map((_,i)=><div key={i} onClick={()=>setImgIdx(i)} style={{width:i===imgIdx?20:7,height:7,borderRadius:4,background:i===imgIdx?"#1a1a1a":"rgba(0,0,0,0.25)",transition:"all 0.2s",cursor:"pointer"}} />)}
                </div>
              </>}
            </div>
            {allImgs.length>1&&(
              <div style={{display:"flex",gap:6,padding:"10px 12px",background:"#f5f0eb",borderTop:"1px solid #ede8e2"}}>
                {allImgs.slice(0,6).map((url,i)=>(
                  <div key={i} onClick={()=>setImgIdx(i)} style={{width:48,height:48,borderRadius:6,overflow:"hidden",border:i===imgIdx?"2px solid #1a1a1a":"2px solid transparent",cursor:"pointer",flexShrink:0}}>
                    <img src={url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />
                  </div>
                ))}
              </div>
            )}
          </div>
          <p style={{...SS,fontSize:"10px",color:"#c9a96e",letterSpacing:"2px",textTransform:"uppercase",fontWeight:700,margin:"0 0 4px"}}>{brandDisplay}</p>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(26px,5vw,36px)",fontWeight:400,color:"#1a1a1a",margin:"0 0 6px",lineHeight:1.2}}>{product.product_name}</h1>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            {product.category&&<span style={{...SS,fontSize:"12px",color:"#aaa"}}>{product.category}</span>}
            {product.price_customer&&<><span style={{color:"#ede8e2"}}>·</span><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"22px",color:"#1a1a1a",fontWeight:600}}>€{product.price_customer}</span></>}
          </div>
          {product.description&&<p style={{...SS,fontSize:"14px",color:"#666",lineHeight:1.75,marginBottom:20}}>{product.description}</p>}

          {/* PURCHASE — only on QR page */}
          <div style={{background:"#0d0d0d",borderRadius:12,padding:"20px 22px",marginBottom:24}}>
            <p style={{...SS,fontSize:"10px",color:"#c9a96e",letterSpacing:"3px",textTransform:"uppercase",fontWeight:700,margin:"0 0 6px"}}>✦ Purchase</p>
            <p style={{...SS,fontSize:"13px",color:"#aaa",lineHeight:1.6,margin:"0 0 16px"}}>{lang==="fr"?"Vous avez découvert ce produit en salon. Commandez-le maintenant.":"You discovered this product in the salon. Order it now."}</p>
            {product.price_customer&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <span style={{...SS,fontSize:"13px",color:"#777"}}>Price</span>
              <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"28px",color:"#f5f0eb",fontWeight:400}}>€{product.price_customer}</span>
            </div>}
            {product.purchase_url
              ? <a href={product.purchase_url} target="_blank" rel="noopener noreferrer" style={{display:"block",textAlign:"center",padding:"15px",background:"#c9a96e",color:"#0d0d0d",textDecoration:"none",...SS,fontSize:"12px",fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",borderRadius:8}}>{lang==="fr"?"Acheter maintenant":"Buy now"} →</a>
              : <div style={{textAlign:"center",padding:"14px",background:"rgba(201,169,110,0.1)",border:"1px solid rgba(201,169,110,0.3)",borderRadius:8}}><p style={{...SS,fontSize:"12px",color:"#c9a96e",margin:0}}>Purchase link coming soon</p></div>
            }
          </div>

          {details.length>0&&(
            <div style={{marginBottom:20}}>
              <p style={{...SS,fontSize:"10px",color:"#aaa",letterSpacing:"2px",textTransform:"uppercase",margin:"0 0 12px"}}>Product details</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {details.map(({key,label})=>(
                  <div key={key} style={{background:"#fff",border:"1px solid #ede8e2",borderRadius:8,padding:"10px 13px",gridColumn:["description","test_reason"].includes(key)?"1/-1":"auto"}}>
                    <p style={{...SS,fontSize:"9px",color:"#c9a96e",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:700,margin:"0 0 3px"}}>{label}</p>
                    <p style={{...SS,fontSize:"12px",color:"#444",margin:0,lineHeight:1.5}}>{product[key]}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{borderTop:"1px solid #ede8e2",paddingTop:20,display:"flex",gap:12,flexWrap:"wrap"}}>
            <button onClick={()=>navigate("/products")} style={{flex:1,padding:"12px",background:"#fff",color:"#1a1a1a",border:"1px solid #ede8e2",cursor:"pointer",...SS,fontSize:"11px",fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase",borderRadius:8,minWidth:120}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#c9a96e";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#ede8e2";}}>{lang==="fr"?"Voir les produits":"Browse products"}</button>
            {salon&&<button onClick={()=>navigate("/salons")} style={{flex:1,padding:"12px",background:"#fff",color:"#1a1a1a",border:"1px solid #ede8e2",cursor:"pointer",...SS,fontSize:"11px",fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase",borderRadius:8,minWidth:120}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#b85c5c";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#ede8e2";}}>{lang==="fr"?"Voir les salons":"Browse salons"}</button>}
          </div>
        </main>
      )}
    </>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [lang,setLang]=useState("en");
  const {salons,allProducts,loading}=useData();
  const [user,setUser]=useState(null);
  const [favourites,setFavourites]=useState([]);
  const [showAuth,setShowAuth]=useState(false);
  const [authMode,setAuthMode]=useState("signup");

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      setUser(session?.user||null);
      if (session?.user) loadFavourites(session.user.id);
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{
      setUser(session?.user||null);
      if (session?.user) loadFavourites(session.user.id);
      else setFavourites([]);
    });
    return ()=>subscription.unsubscribe();
  },[]);

  const loadFavourites=async(uid)=>{
    const {data}=await supabase.from("favourites").select("*").eq("user_id",uid);
    if (data) setFavourites(data);
  };

  const toggleFavourite=async(type,item)=>{
    if (!user){setAuthMode("login");setShowAuth(true);return;}
    if (!supabase) return;
    const existing=favourites.find(f=>f.type===type&&f.item_id===item.id);
    if (existing){
      const {error}=await supabase.from("favourites").delete().eq("id",existing.id);
      if (error) console.error("Delete fav error:",error);
      else setFavourites(f=>f.filter(x=>x.id!==existing.id));
    } else {
      const itemName = item.name||item.product_name||"";
      const {data,error}=await supabase.from("favourites").insert({user_id:user.id,type,item_id:item.id,item_name:itemName}).select().single();
      if (error) console.error("Insert fav error:",error);
      else if (data) setFavourites(f=>[...f,data]);
    }
  };

  return (
    <LocationAwareErrorBoundary>
      <Routes>
        <Route path="/" element={<LandingPage lang={lang} setLang={setLang} salons={salons} allProducts={allProducts} user={user} onAuthClick={(m)=>{setAuthMode(m);setShowAuth(true);}} />} />
        <Route path="/salons" element={<SalonsPage lang={lang} setLang={setLang} salons={salons} loading={loading} user={user} favourites={favourites} onToggleFav={toggleFavourite} onAuthClick={(m)=>{setAuthMode(m);setShowAuth(true);}} />} />
        <Route path="/products" element={<ProductsPage lang={lang} setLang={setLang} allProducts={allProducts} salons={salons} loading={loading} user={user} favourites={favourites} onToggleFav={toggleFavourite} onAuthClick={(m)=>{setAuthMode(m);setShowAuth(true);}} />} />
        <Route path="/account" element={<AccountPage lang={lang} setLang={setLang} salons={salons} allProducts={allProducts} />} />
        <Route path="/spot/:spotId" element={<SpotPage lang={lang} setLang={setLang} />} />
        <Route path="*" element={<LandingPage lang={lang} setLang={setLang} salons={salons} allProducts={allProducts} user={user} onAuthClick={(m)=>{setAuthMode(m);setShowAuth(true);}} />} />
      </Routes>
      {showAuth&&<AuthModal onClose={()=>setShowAuth(false)} lang={lang} initialMode={authMode} />}
    </LocationAwareErrorBoundary>
  );
}
