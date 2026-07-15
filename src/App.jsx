import { useState, useEffect, useMemo, useRef, Component, Fragment } from "react";
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
        <h2 style={{color:"#fb5607",marginBottom:16}}>Something went wrong</h2>
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
const TBL_PROGRAMS = "tblwAdaAwBALcZ7Oy";
const TBL_PROGRAM_SIGNUPS = "tblTxTsVmR2tnGO5b";

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
    kbeauty_here:"✦ Discover K-Beauty here",
    kbeauty_desc:"",
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
    footer:"",
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
    kbeauty_here:"✦ Découvrez K-Beauty ici",
    kbeauty_desc:"",
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
    footer:"",
  },
};

const TIER = {
  Platinum:{ color:"#a855f7", shadow:"0 0 10px rgba(168,85,247,0.5)" },
  Gold:    { color:"#c9a96e", shadow:"0 0 8px rgba(201,169,110,0.4)" },
  Silver:  { color:"#b0bec5", shadow:"0 0 6px rgba(176,190,197,0.5)" },
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
  return <span style={{ fontSize:size, color:cfg.color, filter:`drop-shadow(${cfg.shadow})`, lineHeight:1, verticalAlign:"middle" }} title={tier}>✦</span>;
}

// ── LEAFLET MAP (split/mobile) ────────────────────────────────────────────────
function SalonMap({ salons, onPinClick, onBoundsChange, focusSalon, mini, fitToSalons, highlightId, compact }) {
  const uid = useRef(`map-${Math.random().toString(36).slice(2)}`);
  const map  = useRef(null);
  const marks = useRef([]);
  const markMap = useRef({}); // salonId -> marker element
  const salRef = useRef(salons);
  salRef.current = salons;
  const fitRef = useRef(fitToSalons);
  fitRef.current = fitToSalons;

  // highlight effect when highlightId changes
  useEffect(()=>{
    Object.entries(markMap.current).forEach(([id, el])=>{
      if (!el) return;
      const s = salRef.current.find(x=>x.id===id);
      const hasK = (s?._products||[]).length>0;
      const isHL = id === highlightId;
      const col = isHL ? "#0d0d0d" : hasK ? "#c9a96e" : "#888";
      const size = isHL ? 36 : 28;
      el.style.width = size+"px";
      el.style.height = size+"px";
      el.style.background = col;
      el.style.transform = isHL ? "scale(1.2)" : "scale(1)";
      el.style.zIndex = isHL ? "1000" : "";
      el.style.boxShadow = isHL ? "0 4px 16px rgba(0,0,0,0.35)" : "0 3px 12px rgba(0,0,0,0.25)";
    });
  },[highlightId]);

  useEffect(()=>{
    if (map.current || !window.L) return;
    const L = window.L;
    const center = focusSalon ? [+focusSalon.latitude,+focusSalon.longitude] : [48.8566,2.3522];
    const m = L.map(uid.current,{zoomControl:!mini,scrollWheelZoom:!mini,dragging:!mini||true}).setView(center, focusSalon?15:13);
    map.current = m;
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",{attribution:'<span style="font-size:8px;opacity:0.4;filter:grayscale(1)">© OSM © CARTO</span>',maxZoom:19}).addTo(m);
    // fit to salon markers on first load
    if (!focusSalon && (!mini || compact)) {
      const pts = salRef.current.filter(s=>+s.latitude&&+s.longitude).map(s=>[+s.latitude,+s.longitude]);
      if (pts.length>0) setTimeout(()=>{
        try{
          m.invalidateSize();
          if (compact) {
            m.fitBounds(pts,{padding:[28,28],maxZoom:15});
          } else {
            const VH = window.innerHeight;
            const bottomPad = window.innerWidth < 768 ? Math.round(VH * 0.52) : 40;
            m.fitBounds(pts,{paddingTopLeft:[40,40],paddingBottomRight:[40,bottomPad+40],maxZoom:14});
          }
        }catch(e){}
      },300);
    }
    if (onBoundsChange) {
      m.on("moveend zoomend",()=>{
        const b=m.getBounds();
        onBoundsChange(salRef.current.filter(s=>{const lat=+s.latitude,lng=+s.longitude;return lat&&lng&&b.contains([lat,lng]);}).map(s=>s.id));
      });
    }
    const onResize = () => { try{ m.invalidateSize(); }catch(e){} };
    window.addEventListener("resize", onResize);
    let ro = null;
    if (compact && window.ResizeObserver) {
      ro = new ResizeObserver(()=>{
        try {
          m.invalidateSize();
          const list = fitRef.current || salRef.current;
          const pts = (list||[]).filter(s=>+s.latitude&&+s.longitude).map(s=>[+s.latitude,+s.longitude]);
          if (pts.length>0) m.fitBounds(pts,{padding:[28,28],maxZoom:15});
        } catch(e){}
      });
      const el = document.getElementById(uid.current);
      if (el) ro.observe(el);
    }
    return ()=>{ window.removeEventListener("resize", onResize); if(ro) ro.disconnect(); m.remove(); map.current=null; marks.current=[]; };
  },[]);

  // fitBounds when fitToSalons prop changes (e.g. product selected)
  useEffect(()=>{
    if (!fitToSalons || !map.current || !window.L) return;
    const pts = fitToSalons.filter(s=>+s.latitude&&+s.longitude).map(s=>[+s.latitude,+s.longitude]);
    if (pts.length>0) {
      try {
        map.current.invalidateSize();
        if (compact) {
          map.current.fitBounds(pts, {padding:[28,28], maxZoom:15});
        } else {
          const VH = window.visualViewport?.height || window.innerHeight;
          const sheetH = Math.round(VH * 0.46); // mid snap height
          map.current.fitBounds(pts, {paddingTopLeft:[40,40], paddingBottomRight:[40, sheetH+60], maxZoom:14});
        }
      } catch(e){}
    }
  },[fitToSalons]);

  useEffect(()=>{
    const L=window.L; if(!L||!map.current) return;
    marks.current.forEach(m=>m.remove()); marks.current=[];
    markMap.current = {};
    (focusSalon?[focusSalon]:salons).forEach(s=>{
      const lat=+s.latitude,lng=+s.longitude; if(!lat||!lng) return;
      const hasKbeauty=(s._products||[]).length>0;
      const col = focusSalon?.id===s.id ? "#0d0d0d" : hasKbeauty ? "#c9a96e" : "#888";
      const hl = focusSalon?.id===s.id;
      const icon=L.divIcon({className:"",
        html:`<div style="width:${hl?36:28}px;height:${hl?36:28}px;border-radius:50%;background:${col};border:3px solid #fff;box-shadow:0 3px 12px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;cursor:pointer"><div style="width:6px;height:6px;border-radius:50%;background:#fff"></div></div>`,
        iconSize:[hl?36:28,hl?36:28],iconAnchor:[hl?18:14,hl?18:14]});
      const mk=L.marker([lat,lng],{icon}).addTo(map.current);
      // store reference to marker div for hover highlight
      setTimeout(()=>{
        const el = mk.getElement()?.querySelector("div");
        if (el) { el.style.transition="all 0.15s"; markMap.current[s.id]=el; }
      },0);
      if (!mini) {
        const tooltip = hasKbeauty
          ? `<div style="font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;color:#1a1a1a;line-height:1.4">${s.name}<br/><span style="font-size:10px;font-weight:700;letter-spacing:0.5px;color:#c9a96e;background:#fdf8ee;padding:2px 8px;border-radius:10px;border:1px solid #e8d9b8;display:inline-block;margin-top:3px">✦ K-Beauty</span></div>`
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
      style={{position:"relative",paddingBottom:"62%",overflow:"hidden",background:"#1a1a1a",borderRadius:"16px 16px 0 0",cursor:"pointer"}}>
      {imgs.length>0
        ? <img src={imgs[idx]} alt={salon.name} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",transition:"transform 0.4s",transform:hov?"scale(1.03)":"scale(1)"}} />
        : <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,#2a2a2a,#1a1a1a)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"48px",color:"rgba(201,169,110,0.2)"}}>{salon.name?.[0]}</span>
          </div>
      }
      <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.25) 0%,transparent 50%)"}} />
      <div style={{position:"absolute",top:10,left:10,background:"rgba(255,255,255,0.92)",color:"#1a1a1a",fontSize:"10px",fontFamily:"'DM Sans',sans-serif",fontWeight:700,letterSpacing:"0.5px",textTransform:"uppercase",padding:"4px 10px",borderRadius:20}}>{salon.category}</div>
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
  const img=getSalonImg(salon);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onClick={()=>onClick(salon)}
      style={{display:"flex",background:"#fff",borderRadius:16,overflow:"hidden",border:`1.5px solid ${hov?"#c9a96e":"#f0e9dc"}`,transition:"border-color 0.15s",cursor:"pointer"}}>
      {/* LEFT: photo */}
      <div style={{position:"relative",width:112,aspectRatio:"1",flexShrink:0,background:"#1a1a1a"}}>
        {img
          ? <img src={img} alt={salon.name} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
          : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"24px",color:"rgba(201,169,110,0.3)"}}>{salon.name?.[0]}</span></div>}
        {salon.salon_tier&&<div style={{position:"absolute",top:6,left:6}}><TierBadge tier={salon.salon_tier} size={11}/></div>}
      </div>
      {/* RIGHT: info + products */}
      <div style={{flex:1,minWidth:0,padding:"10px 34px 10px 12px",display:"flex",flexDirection:"column",justifyContent:"center",position:"relative"}}>
        {onToggleFav&&<div style={{position:"absolute",top:8,right:8,zIndex:2}} onClick={e=>e.stopPropagation()}>
          <FavBtn type="salon" item={salon} user={user} favourites={favourites} onToggle={onToggleFav} size={16}/>
        </div>}
        <h3 style={{margin:"0 0 2px",fontFamily:"'Cormorant Garamond',serif",fontSize:"16px",fontWeight:600,color:"#1a1a1a",lineHeight:1.25,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{salon.name}</h3>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#bbb",margin:"0 0 9px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{salon.area||salon.address||"Paris"}</p>
        {prods.length>0&&(
          <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
            {prods.slice(0,3).map(p=>{
              const pimg=getProdImg(p);
              return pimg?<div key={p.id} style={{width:26,height:26,borderRadius:6,overflow:"hidden",border:"1px solid #f0e5cf",flexShrink:0}}><img src={pimg} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>:null;
            })}
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"9px",color:"#c9a96e",fontWeight:700,marginLeft:2,whiteSpace:"nowrap"}}>+{prods.length} K-Beauty</span>
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

          {/* action links — booking + instagram only at top */}
          <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
            {salon.rdv&&<a href={salon.rdv} target="_blank" rel="noopener noreferrer"
              style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",background:"#1a1a1a",border:"none",borderRadius:8,textDecoration:"none",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#f5f0eb",fontWeight:600,transition:"all 0.2s",flex:1,justifyContent:"center"}}
              onMouseEnter={e=>{e.currentTarget.style.background="#c9a96e";e.currentTarget.style.color="#0d0d0d";}}
              onMouseLeave={e=>{e.currentTarget.style.background="#1a1a1a";e.currentTarget.style.color="#f5f0eb";}}>
              📅 {t.book}{salon.bookingPlatform?` · ${salon.bookingPlatform}`:""}
            </a>}
            {salon.instagram&&<a href={`https://instagram.com/${salon.instagram.replace("@","")}`} target="_blank" rel="noopener noreferrer"
              style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",background:"#fff",border:"1px solid #ede8e2",borderRadius:8,textDecoration:"none",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#444",fontWeight:500,transition:"all 0.2s",flex:1,justifyContent:"center"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#c9a96e";e.currentTarget.style.color="#c9a96e";}}
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
              <div style={{background:"#fff",padding:"10px 14px",borderBottom:"1px solid #ede8e2",display:"flex",alignItems:"center",justifyContent:"space-between",gap:6}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span>📍</span><span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#888"}}>{salon.address}</span>
                </div>
                {salon.google&&<a href={salon.google} target="_blank" rel="noopener noreferrer"
                  style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#4285f4",fontWeight:600,textDecoration:"none",flexShrink:0,whiteSpace:"nowrap"}}
                  onMouseEnter={e=>e.currentTarget.style.textDecoration="underline"}
                  onMouseLeave={e=>e.currentTarget.style.textDecoration="none"}>
                  🗺 View on Google
                </a>}
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
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"9px",color:"#c9a96e",letterSpacing:"2px",textTransform:"uppercase",fontWeight:700,margin:0,whiteSpace:"nowrap"}}>{"✦ Discover K-Beauty here"}</p>
        <div style={{height:1,flex:1,background:"#ede8e2"}} />
      </div>

      <div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:6}}>
        {prods.map(p=>{
          const isNew=p._badge==="new"; const color=isNew?"#c9a96e":"#a07832"; const border="#e8d9b8"; const img=getProdImg(p);
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
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState("");

  const handleBuy = async () => {
    setBuying(true); setBuyError("");
    try {
      const img = getProdImg(prod);
      let brandRaw = prod.brand_name || prod.brand || "";
      let brandD = Array.isArray(brandRaw) ? (brandRaw.find(v=>typeof v==="string"&&!v.startsWith?.("rec")) || "") : brandRaw;
      if (typeof brandD !== "string") brandD = String(brandD || "");
      if (brandD.startsWith?.("rec")) brandD = "";
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: prod.id,
          productName: prod.product_name,
          brandName: brandD,
          priceEur: prod.price_customer,
          imageUrl: img && img.startsWith("http") ? img : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setBuyError(data.error || "Checkout failed. Please try again.");
        setBuying(false);
      }
    } catch (err) {
      console.error("Buy error:", err);
      setBuyError(err.message || "Something went wrong. Please try again.");
      setBuying(false);
    }
  };

  if (!prod) return null;
  const t=T[lang];
  const isNew=prod._badge==="new"; const color=isNew?"#c9a96e":"#a07832";

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
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:5000,background:"rgba(8,6,4,0.85)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#faf7f4",maxWidth:640,width:"100%",borderRadius:16,overflow:"hidden",boxShadow:"0 48px 120px rgba(0,0,0,0.4)",maxHeight:"92vh",overflowY:"auto",display:"flex",flexDirection:"column"}}>

        {/* PHOTO SLIDER — blurred bg + contained foreground */}
        <div style={{position:"relative",paddingBottom:"65%",overflow:"hidden",background:"#f5f0eb",flexShrink:0}}>
          {allImgs.length>0 ? <>
            {/* blurred background */}
            <img src={allImgs[imgIdx]} alt=""
              style={{position:"absolute",inset:"-8%",width:"116%",height:"116%",objectFit:"cover",filter:"blur(20px) saturate(1.3) opacity(0.9)",pointerEvents:"none"}} />
            {/* contained foreground */}
            <img src={allImgs[imgIdx]} alt={prod.product_name}
              onClick={e=>{e.stopPropagation();setLightbox(allImgs[imgIdx]);}}
              style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"contain",transition:"opacity 0.3s",cursor:"zoom-in",zIndex:1}} />
          </> : (
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"48px"}}>✨</div>
          )}
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.35) 0%,transparent 60%)",pointerEvents:"none",zIndex:2}} />
          <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"rgba(0,0,0,0.45)",color:"#fff",border:"none",width:32,height:32,borderRadius:"50%",cursor:"pointer",fontSize:"16px",display:"flex",alignItems:"center",justifyContent:"center",zIndex:4}}>×</button>
          {onToggleFav&&<div style={{position:"absolute",top:14,left:14,zIndex:4}}>
            <FavBtn type="product" item={prod} user={user} favourites={favourites||[]} onToggle={onToggleFav} size={22}/>
          </div>}
          {allImgs.length>1&&<>
            <button onClick={e=>{e.stopPropagation();setImgIdx(i=>(i-1+allImgs.length)%allImgs.length);}} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",width:34,height:34,borderRadius:"50%",background:"rgba(255,255,255,0.85)",border:"none",cursor:"pointer",fontSize:"16px",display:"flex",alignItems:"center",justifyContent:"center",zIndex:3}}>‹</button>
            <button onClick={e=>{e.stopPropagation();setImgIdx(i=>(i+1)%allImgs.length);}} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",width:34,height:34,borderRadius:"50%",background:"rgba(255,255,255,0.85)",border:"none",cursor:"pointer",fontSize:"16px",display:"flex",alignItems:"center",justifyContent:"center",zIndex:3}}>›</button>
            <div style={{position:"absolute",bottom:14,left:"50%",transform:"translateX(-50%)",display:"flex",gap:5,zIndex:3}}>
              {allImgs.map((_,i)=><div key={i} onClick={e=>{e.stopPropagation();setImgIdx(i);}} style={{width:i===imgIdx?18:6,height:6,borderRadius:3,background:i===imgIdx?"#fff":"rgba(255,255,255,0.5)",transition:"all 0.2s",cursor:"pointer"}} />)}
            </div>
          </>}
        </div>

        <div style={{padding:"22px 24px 28px"}}>
          {/* badge + brand + name */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <span style={{background:color,color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:"9px",fontWeight:800,letterSpacing:"1.5px",textTransform:"uppercase",padding:"4px 10px",borderRadius:4}}>{isNew?t.new_in:t.top_pick}</span>
          </div>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#c9a96e",fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",margin:"0 0 4px"}}>{brandDisplay}</p>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"26px",fontWeight:600,color:"#1a1a1a",margin:"0 0 4px",lineHeight:1.2}}>{prod.product_name}</h2>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#aaa",margin:0}}>{prod.category}</p>
            {prod.price_customer&&<><span style={{color:"#ede8e2"}}>·</span>
              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"18px",color:"#1a1a1a",margin:0,fontWeight:600}}>€{prod.price_customer}</p>
            </>}
          </div>

          {/* BUY BUTTON */}
          {prod.price_customer&&(
            <div style={{marginBottom:20}}>
              <button onClick={handleBuy} disabled={buying}
                style={{width:"100%",padding:"14px",background:buying?"#ccc":"#1a1a1a",color:"#fff",border:"none",cursor:buying?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",fontWeight:700,letterSpacing:"0.5px",borderRadius:10,transition:"opacity 0.2s"}}
                onMouseEnter={e=>!buying&&(e.currentTarget.style.opacity="0.85")}
                onMouseLeave={e=>!buying&&(e.currentTarget.style.opacity="1")}>
                {buying ? (lang==="fr"?"Redirection…":"Redirecting…") : (lang==="fr"?`Acheter — €${prod.price_customer}`:`Buy now — €${prod.price_customer}`)}
              </button>
              {buyError&&<p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#fb5607",margin:"8px 0 0"}}>{buyError}</p>}
            </div>
          )}

          {/* ✦ FIND IN SALON — first, max 3 + view more */}
          {salonsWithProd.length>0&&(
            <div style={{marginBottom:20}}>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#c9a96e",letterSpacing:"2px",textTransform:"uppercase",fontWeight:700,margin:"0 0 10px"}}>✦ {t.find_in_salon}</p>
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
                  <button onClick={()=>setShowAllSalons(true)} style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#c9a96e",background:"none",border:"1px solid #e8d9b8",cursor:"pointer",padding:"8px 0",borderRadius:8,textAlign:"center",transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.background="#fdf8ee";}} onMouseLeave={e=>{e.currentTarget.style.background="none";}}>
                    + {salonsWithProd.length-3} more salon{salonsWithProd.length-3>1?"s":""}
                  </button>
                )}
                {showAllSalons&&salonsWithProd.length>3&&(
                  <button onClick={()=>setShowAllSalons(false)} style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#aaa",background:"none",border:"1px solid #ede8e2",cursor:"pointer",padding:"8px 0",borderRadius:8,textAlign:"center"}}>
                    ↑ View less
                  </button>
                )}
              </div>
            </div>
          )}

          {/* product detail fields — clean, no boxes */}
          {details.length>0&&(
            <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:16}}>
              {details.map(({key,label})=>(
                <div key={key} style={{borderBottom:"1px solid #f0ebe5",paddingBottom:12}}>
                  <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"9px",color:"#c9a96e",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:700,margin:"0 0 4px"}}>{label}</p>
                  <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"13px",color:"#333",margin:0,lineHeight:1.6}}>{Array.isArray(prod[key])?prod[key].join(" · "):prod[key]}</p>
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
                  const img=getProdImg(p); const c=p._badge==="new"?"#c9a96e":"#a07832";
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
              style={{width:46,height:26,borderRadius:13,background:loc.kbeautyOnly?"#c9a96e":"#ddd",cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}>
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
function BottomSheet({ salons, loading, onSalonClick, lang, visibleCount, onExpandChange, onInteract, user, favourites, onToggleFav }) {
  const t=T[lang];
  const VH = window.innerHeight;
  const SNAP_COLLAPSED = 88;
  const SNAP_MID = Math.round(VH * 0.44);
  const SNAP_FULL = VH;

  const [sheetH, setSheetH] = useState(SNAP_COLLAPSED);
  const [pinned, setPinned] = useState(null);
  const listRef = useRef(null);
  const handleStartY = useRef(null);
  const startH = useRef(SNAP_COLLAPSED);
  const sheetRef = useRef(null);

  const snapTo = (h) => {
    if (sheetRef.current) sheetRef.current.style.transition = "height 0.34s cubic-bezier(0.32,0.72,0,1), border-radius 0.34s";
    setSheetH(h);
  };

  BottomSheet._setPinned = (s) => { setPinned(s); snapTo(SNAP_COLLAPSED); };
  BottomSheet._clearPinned = () => { setPinned(null); };

  // watch sheetH → update salon-nav visibility
  useEffect(() => {
    const full = sheetH >= SNAP_FULL - 40;
    const navEl = document.getElementById("salon-nav");
    if (navEl) {
      navEl.style.transition = "max-height 0.34s cubic-bezier(0.32,0.72,0,1)";
      navEl.style.maxHeight = full ? "0px" : "56px";
    }
    onExpandChange?.(full);
    onInteract?.();
  }, [sheetH]);

  const onHandleTouchStart = (e) => {
    handleStartY.current = e.touches[0].clientY;
    startH.current = sheetH;
    if (sheetRef.current) sheetRef.current.style.transition = "none";
    onInteract?.();
  };
  const onHandleTouchMove = (e) => {
    const dy = handleStartY.current - e.touches[0].clientY;
    setSheetH(Math.max(SNAP_COLLAPSED, Math.min(SNAP_FULL, startH.current + dy)));
  };
  const onHandleTouchEnd = (e) => {
    if (sheetRef.current) sheetRef.current.style.transition = "height 0.34s cubic-bezier(0.32,0.72,0,1), border-radius 0.34s";
    const dy = handleStartY.current - e.changedTouches[0].clientY;
    if (dy > 60 || sheetH > (SNAP_MID + SNAP_FULL) / 2) snapTo(SNAP_FULL);
    else if (dy < -60 || sheetH < (SNAP_COLLAPSED + SNAP_MID) / 2) snapTo(SNAP_COLLAPSED);
    else snapTo(SNAP_MID);
  };

  const listStartY = useRef(null);
  const onListTouchStart = (e) => { listStartY.current = e.touches[0].clientY; onInteract?.(); };
  const onListTouchEnd = (e) => {
    if (!listRef.current) return;
    const dy = listStartY.current - e.changedTouches[0].clientY;
    if (listRef.current.scrollTop <= 2 && dy < -40) snapTo(SNAP_MID);
  };

  const isFull = sheetH >= SNAP_FULL - 40;
  const isCollapsed = sheetH <= SNAP_COLLAPSED + 10;
  const count = visibleCount ?? salons.length;

  return (
    <>
      {/* PINNED FLOATING CARD */}
      {pinned && !isFull && (
        <div style={{position:"absolute",bottom:isCollapsed?SNAP_COLLAPSED+8:16,left:12,right:12,zIndex:200,animation:"fadeUp 0.22s ease both",
          opacity:!isCollapsed&&sheetH>SNAP_COLLAPSED+20?0:1,
          pointerEvents:!isCollapsed&&sheetH>SNAP_COLLAPSED+20?"none":"auto",
          transition:"opacity 0.2s,bottom 0.3s"}}>
          <div style={{background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 8px 32px rgba(0,0,0,0.18)",position:"relative"}}>
            {onToggleFav&&<div style={{position:"absolute",top:8,right:8,zIndex:3}} onClick={e=>e.stopPropagation()}>
              <FavBtn type="salon" item={pinned} user={user} favourites={favourites||[]} onToggle={onToggleFav} size={18}/>
            </div>}
            <div onTouchStart={e=>e.currentTarget.style.opacity="0.85"} onTouchEnd={e=>e.currentTarget.style.opacity="1"}
              onClick={()=>{onSalonClick(pinned);setPinned(null);}}
              style={{display:"flex",cursor:"pointer",height:92,transition:"opacity 0.15s"}}>
              <div style={{width:44,flexShrink:0,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:8}}>
                <button onClick={e=>{e.stopPropagation();setPinned(null);}}
                  style={{width:28,height:28,borderRadius:"50%",background:"rgba(0,0,0,0.06)",color:"#555",border:"1px solid #ddd",cursor:"pointer",fontSize:"14px",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>×</button>
              </div>
              <div style={{flex:1,padding:"10px 8px 10px 0",display:"flex",flexDirection:"column",justifyContent:"center",minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:2}}>
                  <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"15px",fontWeight:600,color:"#1a1a1a",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pinned.name}</p>
                  {pinned.salon_tier&&<TierBadge tier={pinned.salon_tier} size={11}/>}
                </div>
                <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#aaa",margin:"0 0 5px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pinned.area||"Paris"}</p>
                {(pinned._products||[]).length>0&&(
                  <div style={{display:"flex",gap:3,alignItems:"center"}}>
                    {(pinned._products||[]).slice(0,4).map(p=>{const img=getProdImg(p);return img?<div key={p.id} style={{width:18,height:18,borderRadius:3,overflow:"hidden",border:"1px solid #f0d0d0"}}><img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>:null;})}
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"9px",color:"#c9a96e",fontWeight:700,marginLeft:3}}>✦ K-Beauty</span>
                  </div>
                )}
              </div>
              <div style={{width:92,height:92,flexShrink:0,overflow:"hidden",background:"#1a1a1a"}}>
                {(()=>{const img=getSalonImg(pinned);return img
                  ?<img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  :<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"24px",color:"rgba(201,169,110,0.3)"}}>{pinned.name?.[0]}</span></div>;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM SHEET */}
      <div ref={sheetRef}
        style={{
          position:"absolute",bottom:0,left:0,right:0,
          height:sheetH,
          background:"#faf7f4",
          borderRadius:isFull?"0":"16px 16px 0 0",
          boxShadow:"0 -4px 24px rgba(0,0,0,0.14)",
          transition:"height 0.34s cubic-bezier(0.32,0.72,0,1), border-radius 0.34s",
          zIndex:pinned&&isCollapsed?50:100,
          opacity:pinned&&isCollapsed?0:1,
          pointerEvents:pinned&&isCollapsed?"none":"auto",
          display:"flex",flexDirection:"column",overflow:"hidden"
        }}>
        {/* HANDLE */}
        <div onTouchStart={onHandleTouchStart} onTouchMove={onHandleTouchMove} onTouchEnd={onHandleTouchEnd}
          style={{flexShrink:0,paddingTop:10,paddingBottom:8,touchAction:"none",cursor:"grab"}}>
          <div style={{width:36,height:4,borderRadius:2,background:"#ccc",margin:"0 auto 10px"}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px"}}>
            <div>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#aaa",fontWeight:500,margin:"0 0 1px",textTransform:"uppercase",letterSpacing:"0.5px"}}>View</p>
              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",fontWeight:600,color:"#1a1a1a",margin:0,lineHeight:1}}>
                {count} {t.salons_count}
              </p>
            </div>
            
          </div>
        </div>
        {/* LIST */}
        {!isCollapsed&&(
          <div ref={listRef} onTouchStart={onListTouchStart} onTouchEnd={onListTouchEnd}
            style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"4px 12px 32px",touchAction:"pan-y",overscrollBehavior:"contain"}}>
            {loading
              ?<div style={{textAlign:"center",padding:"40px 0",fontFamily:"'Cormorant Garamond',serif",fontSize:"18px",color:"#ccc"}}>{t.loading}</div>
              :salons.length===0
                ?<div style={{textAlign:"center",padding:"40px 0",fontFamily:"'Cormorant Garamond',serif",fontSize:"18px",color:"#ccc"}}>{t.no_salons}</div>
                :<div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {salons.map((s,i)=>(
                    <div key={s.id} style={{animation:`fadeUp 0.25s ease ${i*0.02}s both`}}>
                      <SalonCard salon={s} onClick={()=>{onSalonClick(s);snapTo(SNAP_COLLAPSED);}} lang={lang} user={user} favourites={favourites||[]} onToggleFav={onToggleFav}/>
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
        const {data, error}=await supabase.auth.signUp({
          email:em.trim(), password:pw,
          options:{data:{first_name:fn.trim()}}
        });
        if (error) { setMsg(error.message); setSt("error"); }
        else {
          // sync to Airtable Members table
          try {
            await fetch(`https://api.airtable.com/v0/${AT_BASE}/tblfvDAfIGbgkMAK7`, {
              method:"POST",
              headers:{Authorization:`Bearer ${AT_KEY}`,"Content-Type":"application/json"},
              body:JSON.stringify({records:[{fields:{
                email: em.trim(),
                first_name: fn.trim(),
                joined_at: new Date().toISOString().split("T")[0],
                supabase_id: data?.user?.id||""
              }}]})
            });
          } catch(e) { console.log("Airtable sync error:", e); }
          setSt("success"); setMsg("Check your email to confirm your account!");
        }
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
              {msg&&st==="error"&&<p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#fb5607",margin:"0 0 12px",lineHeight:1.4}}>{msg}</p>}
              <button onClick={submit} disabled={st==="loading"} style={{width:"100%",padding:"13px",background:st==="loading"?"#ccc":"#1a1a1a",color:"#f5f0eb",border:"none",cursor:st==="loading"?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"11px",fontWeight:600,letterSpacing:"2px",textTransform:"uppercase",borderRadius:8,transition:"background 0.2s",marginBottom:16}} onMouseEnter={e=>{if(st!=="loading"){e.target.style.background="#c9a96e";e.target.style.color="#0d0d0d";}}} onMouseLeave={e=>{if(st!=="loading"){e.target.style.background="#1a1a1a";e.target.style.color="#f5f0eb";}}}>
                {st==="loading"?"…":L.btn}
              </button>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#aaa",textAlign:"center",margin:0}}>
                {L.alt}{" "}
                <button onClick={()=>{setMode(mode==="login"?"signup":"login");setMsg("");setSt("idle");}} style={{background:"none",border:"none",cursor:"pointer",color:"#c9a96e",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",fontWeight:600,padding:0,textDecoration:"underline"}}>{L.altBtn}</button>
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
          fetchAll(TBL_RETAIL,"{tbp}=1"),
          fetchAll(TBL_PRODUCTS,""),
          fetchAll(TBL_SLOTS,"{slot_status}='ACTIVE'"),
        ]);
        console.log("retail:",retail.length,"products:",products.length,"slots:",slots.length);
        console.log("sample slot fields:", slots[0] ? Object.keys(slots[0]) : "no slots");
        console.log("sample slot:", JSON.stringify(slots[0]));
        const pById={}; products.forEach(p=>{pById[p.id]=p;});
        // salon lookup by name (retail_name is now text string, not linked record)
        const sByName={};
        retail.forEach(s=>{ if(s.name) sByName[s.name.trim()]=s.id; });

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
          // retail_name: text string (new) or linked record array (old)
          let sIds=[];
          if (Array.isArray(slot.retail_name)) {
            sIds = slot.retail_name;
          } else if (typeof slot.retail_name === "string") {
            const sid = sByName[slot.retail_name.trim()];
            if (sid) sIds = [sid];
          }
          const pIds=Array.isArray(slot.product)?slot.product:[];
          const slotBrand=cleanBrand(slot.brand);
          const img=slot["Image (from product)"];
          sIds.forEach(sid=>{
            if (!sProds[sid]) sProds[sid]=[];
            pIds.forEach(pid=>{
              if (!pById[pid]) return;
              const p={...pById[pid]};
              // resolve brand
              const prodBrand=cleanBrand(p.brand);
              p.brand = prodBrand||slotBrand||"—";
              // category from product_1type (lookup from slot or direct field)
              if (!p.category) {
                const raw = slot["product_1type (from product)"] || p.product_1type;
                p.category = Array.isArray(raw) ? raw[0] : (raw||null);
              }
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

// ── PROGRAMS DATA (from Airtable Program table) ──────────────────────────────
function useProgramsData() {
  const [programs, setPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  useEffect(() => {
    (async () => {
      setLoadingPrograms(true);
      try {
        const records = await fetchAll(TBL_PROGRAMS, "{status}='launch'");
        const getAttachmentUrl = (val) => {
          if (!val) return null;
          if (Array.isArray(val)) {
            const first = val[0];
            if (Array.isArray(first)) return first[0]?.url || null; // lookup-of-attachment
            if (first && typeof first === "object") return first.url || null; // plain attachment
          }
          return null;
        };
        const firstOf = (val) => Array.isArray(val) ? val[0] : val;
        const parsed = records.map(r => {
          const periodLabel = (r.period_start && r.period_end)
            ? `${String(r.period_start).replaceAll("-",".")} – ${String(r.period_end).replaceAll("-",".")}`
            : "";
          const includes = typeof r.includes === "string"
            ? r.includes.split("\n").map(s=>s.trim()).filter(Boolean)
            : [];
          const salonsField = r.salons || r.Salons || r.salon || r.Salon;
          const productBrand = firstOf(r.product_brand || r.Product_brand || r.brand);
          const productName = firstOf(r.product_name || r.Product_name);
          const productImg = getAttachmentUrl(r.product_image || r.Product_image);
          return {
            id: r.id,
            name: r.name || r.Name || r.program_name || "",
            salonIds: Array.isArray(salonsField) ? salonsField : [],
            image: getAttachmentUrl(r.image || r.Image),
            duration: r.duration || "",
            priceOriginal: r.price_original || null,
            price: r.price || null,
            tag: r.tag || null,
            category: r.category || null,
            periodLabel,
            description: r.description || "",
            includes,
            product: (productBrand || productName) ? { brand: productBrand, name: productName, image: productImg } : null,
          };
        });
        setPrograms(parsed);
      } catch(e) { console.error("Programs fetch error:", e); }
      setLoadingPrograms(false);
    })();
  }, []);
  return { programs, loadingPrograms };
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
            <button onClick={()=>setMenuOpen(v=>!v)} style={{background:"none",border:"none",cursor:"pointer",width:32,height:32,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:5,padding:4}}>
              <span style={{display:"block",width:20,height:2,background:"#c9a96e",borderRadius:1}}/>
              <span style={{display:"block",width:20,height:2,background:"#c9a96e",borderRadius:1}}/>
              <span style={{display:"block",width:20,height:2,background:"#c9a96e",borderRadius:1}}/>
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

function MobileTabBar({active, alwaysVisible, pingSignal}) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const hideTimer = useRef(null);
  const startHideTimer = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(()=>setVisible(false), 2500);
  };

  // normal pages: window scrolls — show on scroll-up, hide on scroll-down (like most native apps)
  useEffect(() => {
    if (alwaysVisible || pingSignal !== undefined) return;
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 16) setVisible(true);
      else if (y < lastY - 4) setVisible(true);
      else if (y > lastY + 4) setVisible(false);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, {passive:true});
    return () => window.removeEventListener("scroll", onScroll);
  }, [alwaysVisible, pingSignal]);

  // fixed map+sheet pages: window doesn't scroll, so visibility is "pinged" externally
  // (on mount, and whenever the sheet is dragged/touched) — peeks in, then fades after idle
  useEffect(() => {
    if (pingSignal === undefined) return;
    setVisible(true);
    startHideTimer();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [pingSignal]);

  const activeKey = (active==="/"||active==="/program-home") ? "home"
    : active?.startsWith("/program") ? "program"
    : active?.startsWith("/salons") ? "salon"
    : active?.startsWith("/products") ? "product"
    : active?.startsWith("/account") ? "account"
    : "";

  const tabs = [
    {key:"home",    label:"Home",    path:"/program-home", icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/></svg>},
    {key:"program", label:"Program", path:"/programs",     icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>},
    {key:"salon",   label:"Salon",   path:"/salons",       icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10l9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/></svg>},
    {key:"product", label:"Product", path:"/products",     icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.5 7.5 12 3 3.5 7.5 12 12l8.5-4.5Z"/><path d="M3.5 7.5v9L12 21l8.5-4.5v-9"/><path d="M12 12v9"/></svg>},
    {key:"account", label:"Account", path:"/account",      icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>},
  ];

  return (
    <div style={{position:"fixed",bottom:visible?20:-90,left:"50%",transform:"translateX(-50%)",transition:"bottom 0.7s cubic-bezier(0.22,0.61,0.36,1)",width:"calc(100% - 32px)",maxWidth:420,zIndex:600}}>
      <div style={{background:"#1a1a1a",borderRadius:26,padding:"8px 4px",display:"flex",alignItems:"center",justifyContent:"space-around",boxShadow:"0 10px 30px rgba(0,0,0,0.25)"}}>
        {tabs.map(t=>(
          <button key={t.key} onClick={()=>navigate(t.path)}
            style={{flex:1,padding:"7px 2px",borderRadius:16,background:activeKey===t.key?"rgba(255,255,255,0.1)":"transparent",color:activeKey===t.key?"#fff":"rgba(255,255,255,0.5)",border:"none",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,cursor:"pointer"}}>
            {t.icon}
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,fontWeight:600,letterSpacing:0.2}}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

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
    what_body:"The Beauty Pause helps you discover new beauty products inside salons — naturally, during your salon visit.",
    how_title:"How it works",
    steps:["Visit a participating salon","Discover products inside the Discovery Spot","Scan the QR code to learn more and join the Beauty Gift Draw"],
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
    what_body:"The Beauty Pause vous aide à découvrir de nouveaux produits de beauté dans les salons — naturellement, pendant votre visite.",
    how_title:"Comment ça marche",
    steps:["Visitez un salon partenaire","Découvrez les produits dans le Discovery Spot","Scannez le QR code pour en savoir plus et participer au Beauty Gift Draw"],
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
        <div><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(14px,4vw,17px)",color:"#f5f0eb",letterSpacing:"2px",fontWeight:300}}>THE</span><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(14px,4vw,17px)",color:"#c9a96e",letterSpacing:"2px",fontWeight:600,marginLeft:6}}>BEAUTY PAUSE</span></div>
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
            <div style={{marginTop:56}}>
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
              <button onClick={()=>navigate("/salons")} style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#fb5607",background:"none",border:"1px solid #f0d0d0",cursor:"pointer",fontWeight:600,padding:"5px 12px",borderRadius:20,whiteSpace:"nowrap",transition:"all 0.2s",flexShrink:0}} onMouseEnter={e=>{e.currentTarget.style.background="#fb5607";e.currentTarget.style.color="#fff";}} onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.color="#fb5607";}}>{L.salon_cta}</button>
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
                    {/* product chips — stacked vertically, 1.7x bigger */}
                    {prods.length>0&&(
                      <div style={{padding:"10px 12px 12px",display:"flex",flexDirection:"column",gap:7,flex:1}}>
                        {prods.slice(0,3).map(p=>{
                          const isNew=p._badge==="new"; const prodImg=getProdImg(p);
                          const brandD=p.brand_name||(Array.isArray(p.brand)?null:(!p.brand?.startsWith?.("rec")?p.brand:null))||"";
                          return (
                            <div key={p.id} style={{display:"flex",alignItems:"center",gap:9,background:isNew?"#fdf8ee":"#fff",padding:"7px 10px",borderRadius:10,border:`1px solid ${isNew?"#e8d9b8":"#ffd5c2"}`}}>
                              {prodImg&&<img src={prodImg} alt="" style={{width:48,height:48,borderRadius:8,objectFit:"cover",flexShrink:0}}/>}
                              <div style={{minWidth:0}}>
                                <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:isNew?"#c9a96e":"#a07832",fontWeight:700,letterSpacing:"0.8px",textTransform:"uppercase",margin:"0 0 2px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{brandD}</p>
                                <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#444",margin:0,lineHeight:1.3,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{p.product_name}</p>
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
        <button onClick={()=>setShowJoin(true)} style={{padding:"14px 36px",background:"#1a1a1a",color:"#f5f0eb",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",borderRadius:8,transition:"all 0.2s"}} onMouseEnter={e=>e.target.style.background="#fb5607"} onMouseLeave={e=>e.target.style.background="#1a1a1a"}>✦ {L.join_cta}</button>
      </section>

      {/* FOOTER */}
      <footer style={{background:"#0d0d0d",padding:"32px clamp(20px,5vw,64px)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16,borderTop:"1px solid rgba(255,255,255,0.05)"}}>
        <div>
          <div style={{marginBottom:4}}><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"14px",color:"#f5f0eb",letterSpacing:"3px",fontWeight:300}}>THE</span><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"14px",color:"#c9a96e",letterSpacing:"3px",fontWeight:600,marginLeft:5}}>BEAUTY PAUSE</span></div>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#333",margin:0}}>© 2025 The Beauty Pause</p>
        </div>
        <div style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#444",margin:0}}>{t.footer}</p>
          <span style={{color:"#222"}}>·</span>
          <a href="/privacy" style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#444",textDecoration:"none"}}
            onMouseEnter={e=>e.currentTarget.style.color="#c9a96e"} onMouseLeave={e=>e.currentTarget.style.color="#444"}>
            {lang==="fr"?"Confidentialité":"Privacy"}
          </a>
          <a href="/legal" style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#444",textDecoration:"none"}}
            onMouseEnter={e=>e.currentTarget.style.color="#c9a96e"} onMouseLeave={e=>e.currentTarget.style.color="#444"}>
            {lang==="fr"?"Mentions légales":"Legal"}
          </a>
          <a href="mailto:hello@thebeautypause.com" style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#444",textDecoration:"none"}}
            onMouseEnter={e=>e.currentTarget.style.color="#c9a96e"} onMouseLeave={e=>e.currentTarget.style.color="#444"}>
            Contact
          </a>
        </div>
      </footer>

      {showJoin&&<AuthModal onClose={()=>setShowJoin(false)} lang={lang} initialMode="signup" />}
    </>
  );
}

// ── SALONS PAGE ───────────────────────────────────────────────────────────────
function SalonsPage({lang,setLang,salons,loading,user,favourites,onToggleFav,onAuthClick}) {
  const t=T[lang]; const isMobile=window.innerWidth<768;
  const navigate=useNavigate();
  const location=useLocation();
  const [sf,setSf]=useState({tier:[],area:"All",brand:"All",categories:[],kbeautyOnly:true});
  const [sortBy,setSortBy]=useState("az");
  const [search,setSearch]=useState("");
  const [visibleIds,setVisibleIds]=useState(null);
  const [sheetExpanded,setSheetExpanded]=useState(false);
  const [navPing,setNavPing]=useState(0);
  const [hoveredSalonId,setHoveredSalonId]=useState(null);
  const activeFilters=[sf.kbeautyOnly,(sf.categories||[]).length>0,sf.area,search].filter(Boolean).length;
  const [filtered,setFiltered]=useState(salons);
  const [showFilter,setShowFilter]=useState(false);
  const [showJoin,setShowJoin]=useState(false);
  const [selSalon,setSelSalon]=useState(null);
  const [lr,setLr]=useState(!!window.L);
  useEffect(()=>{if(window.L){setLr(true);return;}const lnk=document.createElement("link");lnk.rel="stylesheet";lnk.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";document.head.appendChild(lnk);const s=document.createElement("script");s.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";s.onload=()=>setLr(true);document.head.appendChild(s);},[]);
  useEffect(()=>{
    if (location.state?.selectSalonId) {
      const s = salons.find(x=>x.id===location.state.selectSalonId);
      if (s) setSelSalon(s);
    }
  },[location.state,salons]);
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
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Noto+Sans+KR:wght@300;400;500;700&family=DM+Sans:wght@300;400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0}html,body{background:#ffffff;height:100%;overscroll-behavior:none}@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:#c9a96e;border-radius:3px}.leaflet-tooltip{background:#fff;border:1px solid #ede8e2;border-radius:8px;padding:6px 10px}`}</style>
      {!isMobile&&<ProgramDesktopNav user={user} onAuthClick={onAuthClick} lang={lang} setLang={setLang}/>}
      {/* content */}
      {isMobile?(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:300,display:"flex",flexDirection:"column",transition:"all 0.34s cubic-bezier(0.32,0.72,0,1)"}}>
          {/* light header — slides up when sheet expanded */}
          <div id="salon-nav" style={{flexShrink:0,overflow:"hidden",maxHeight:sheetExpanded?0:60,transition:"max-height 0.34s cubic-bezier(0.32,0.72,0,1)",background:"#fff",borderBottom:"1px solid #f0e5cf"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px"}}>
              <div onClick={()=>navigate("/")} style={{cursor:"pointer"}}>
                <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:"#1a1a1a",letterSpacing:2,fontWeight:300}}>THE</span>
                <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:"#c9a96e",letterSpacing:2,fontWeight:600,marginLeft:5}}>BEAUTY PAUSE</span>
              </div>
              <button onClick={()=>navigate("/search")} style={{width:34,height:34,borderRadius:"50%",background:"#fff",border:"1px solid #f0e5cf",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </button>
            </div>
          </div>
          {/* filterbar — always visible */}
          <div style={{flexShrink:0,background:"#fff",borderBottom:"1px solid #ede8e2",padding:"9px clamp(12px,3vw,20px)",display:"flex",alignItems:"center",gap:8,overflowX:"auto",flexWrap:"nowrap",zIndex:2}}>
            <button onClick={()=>setShowFilter(true)} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 13px",border:`1.5px solid ${activeFilters>0?"#1a1a1a":"#ede8e2"}`,background:activeFilters>0?"#1a1a1a":"#fff",color:activeFilters>0?"#fff":"#555",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",fontWeight:500,borderRadius:20,flexShrink:0}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
              {t.filter}{activeFilters>0&&<span style={{background:"#c9a96e",color:"#0d0d0d",borderRadius:"50%",width:19,height:19,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:700}}>{activeFilters}</span>}
            </button>
            <div style={{width:1,height:18,background:"#ede8e2",flexShrink:0}} />
            <button onClick={()=>setSf(f=>({...f,kbeautyOnly:!f.kbeautyOnly}))} style={{padding:"7px 13px",border:`1.5px solid ${sf.kbeautyOnly?"#c9a96e":"#ede8e2"}`,background:sf.kbeautyOnly?"#fdf8ee":"#fff",color:sf.kbeautyOnly?"#c9a96e":"#666",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",fontWeight:sf.kbeautyOnly?600:400,borderRadius:20,flexShrink:0,whiteSpace:"nowrap"}}>✦ K-Beauty</button>
            {["Nail","Beauty","Hair","Spa"].map(cat=>{const a=sf.categories?.includes(cat);return<button key={cat} onClick={()=>setSf(f=>({...f,categories:f.categories?.includes(cat)?f.categories.filter(x=>x!==cat):[...(f.categories||[]),cat]}))} style={{padding:"7px 13px",border:`1.5px solid ${a?"#1a1a1a":"#ede8e2"}`,background:a?"#1a1a1a":"#fff",color:a?"#fff":"#666",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",borderRadius:20,flexShrink:0,whiteSpace:"nowrap"}}>{cat}</button>;})}
          </div>
          {/* map */}
          <div style={{flex:1,position:"relative",overflow:"hidden",touchAction:"pan-x pan-y"}}>
            <div style={{position:"absolute",inset:0}}>{lr?<SalonMap salons={filtered} onPinClick={s=>{if(BottomSheet._setPinned)BottomSheet._setPinned(s);}} onBoundsChange={setVisibleIds} />:<div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",color:"#aaa"}}>{t.loading}</div>}</div>
            <BottomSheet salons={visibleIds?filtered.filter(s=>visibleIds.includes(s.id)):filtered} loading={loading} onSalonClick={setSelSalon} lang={lang} visibleCount={visibleIds?filtered.filter(s=>visibleIds.includes(s.id)).length:filtered.length} onExpandChange={setSheetExpanded} onInteract={()=>setNavPing(p=>p+1)} user={user} favourites={favourites} onToggleFav={onToggleFav} />
          </div>
          {!sheetExpanded&&<MobileTabBar active="/salons" pingSignal={navPing}/>}
        </div>
      ):(
        <div style={{maxWidth:1280,margin:"0 auto"}}>
          <div style={{padding:"32px clamp(24px,4vw,56px) 8px"}}>
            <p style={{fontFamily:"'Noto Sans KR',sans-serif",fontSize:24,fontWeight:700,color:"#1a1a1a",margin:0}}><Star size={22}/> Explore Salons</p>
          </div>
          <div style={{padding:"16px clamp(24px,4vw,56px) 60px"}}>

          {/* FILTER BAR */}
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,flexWrap:"wrap"}}>
            <button onClick={()=>setShowFilter(true)} style={{display:"flex",alignItems:"center",gap:5,padding:"8px 16px",border:`1.5px solid ${afc>0?"#1a1a1a":"#ede8e2"}`,background:afc>0?"#1a1a1a":"#fff",color:afc>0?"#fff":"#555",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13,borderRadius:20,transition:"all 0.2s"}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
              {t.filter}{afc>0&&<span style={{background:"#c9a96e",color:"#0d0d0d",borderRadius:"50%",width:19,height:19,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:700}}>{afc}</span>}
            </button>
            <div style={{width:1,height:20,background:"#ede8e2"}} />
            <button onClick={()=>setSf(f=>({...f,kbeautyOnly:!f.kbeautyOnly}))} style={{padding:"8px 16px",border:`1.5px solid ${sf.kbeautyOnly?"#c9a96e":"#ede8e2"}`,background:sf.kbeautyOnly?"#fdf8ee":"#fff",color:sf.kbeautyOnly?"#c9a96e":"#666",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:sf.kbeautyOnly?600:400,borderRadius:20,whiteSpace:"nowrap"}}>✦ K-Beauty</button>
            {["Nail","Beauty","Hair","Spa"].map(cat=>{const a=sf.categories.includes(cat);return<button key={cat} onClick={()=>setSf(f=>({...f,categories:toggleArr(f.categories,cat)}))} style={{padding:"8px 16px",border:`1.5px solid ${a?"#1a1a1a":"#ede8e2"}`,background:a?"#1a1a1a":"#fff",color:a?"#fff":"#666",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13,borderRadius:20,whiteSpace:"nowrap"}}>{cat}</button>;})}
          </div>

          {/* SPLIT: LIST + MAP */}
          <div style={{display:"flex",gap:28}}>
            {/* LEFT: salon list */}
            <div style={{flex:"1 1 55%",minWidth:0}}>
              {loading?<div style={{textAlign:"center",padding:"60px 0",fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",color:"#ccc"}}>{t.loading}</div>:<>
                <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#aaa",marginBottom:16}}>
                  {(visibleIds?filtered.filter(s=>visibleIds.includes(s.id)):filtered).length} {t.salons_count}
                </p>
                {(()=>{const list=visibleIds?filtered.filter(s=>visibleIds.includes(s.id)):filtered; return list.length===0
                  ?<div style={{textAlign:"center",padding:"60px 0",fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",color:"#ccc"}}>{t.no_salons}</div>
                  :<div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:20}}>
                    {list.map((s,i)=><div key={s.id}
                      onMouseEnter={()=>setHoveredSalonId(s.id)}
                      onMouseLeave={()=>setHoveredSalonId(null)}
                      style={{animation:`fadeUp 0.4s ease ${i*0.04}s both`}}>
                      <SalonCard salon={s} onClick={setSelSalon} lang={lang} user={user} favourites={favourites} onToggleFav={onToggleFav} />
                    </div>)}
                  </div>;
                })()}
              </>}
            </div>

            {/* RIGHT: sticky map */}
            <div style={{flex:"1 1 45%",position:"sticky",top:84,alignSelf:"flex-start",height:"calc(100vh - 120px)",borderRadius:16,overflow:"hidden",border:"1px solid #f0e9dc"}}>
              {lr?<SalonMap salons={filtered} onPinClick={setSelSalon} onBoundsChange={setVisibleIds} highlightId={hoveredSalonId} compact={true} />:<div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",color:"#aaa"}}>{t.loading}</div>}
            </div>
          </div>
          </div>
        </div>
      )}
      {showFilter&&<FilterModal onClose={()=>setShowFilter(false)} lang={lang} filters={sf} setFilters={setSf} areas={areas} brands={brands} sortBy={sortBy} setSortBy={setSortBy} />}
      {showJoin&&<AuthModal onClose={()=>setShowJoin(false)} lang={lang} initialMode="signup" />}
      {selSalon&&<SalonModal salon={selSalon} onClose={()=>setSelSalon(null)} leafletReady={lr} lang={lang} />}
    </>
  );
}

// ── PRODUCTS PAGE ─────────────────────────────────────────────────────────────
// ── PRODUCT BOTTOM SHEET (mobile) ────────────────────────────────────────────
function ProductBottomSheet({ fp, loading, t, SS, selProd, onProdClick, onDetail, user, favourites, onToggleFav, onClear, salons, mapSalons, onSalonClick, onExpandChange, onInteract, onModalProd, visibleProdCount }) {
  const VH = window.visualViewport?.height || window.innerHeight;
  const SNAP_COLLAPSED = 88;
  const SNAP_MID = Math.round(VH * 0.46);
  const SNAP_FULL = VH;

  const [sheetH, setSheetH] = useState(SNAP_MID);
  const [pinnedSalon, setPinnedSalon] = useState(null);
  const [inlineModal, setInlineModal] = useState(null); // product shown in modal from pinned card
  const listRef = useRef(null);
  const handleStartY = useRef(null);
  const startSheetH = useRef(SNAP_MID);
  const sheetRef = useRef(null);

  ProductBottomSheet._setPinned = (s) => { setPinnedSalon(s); snapTo(SNAP_COLLAPSED); };

  // watch sheetH and hide/show nav accordingly
  useEffect(() => {
    const full = sheetH >= SNAP_FULL - 40;
    const navEl = document.getElementById("prod-nav");
    if (navEl) {
      navEl.style.transition = "max-height 0.34s cubic-bezier(0.32,0.72,0,1)";
      navEl.style.maxHeight = full ? "0px" : "56px";
      navEl.style.overflow = "hidden";
    }
    onExpandChange?.(full);
    onInteract?.();
  }, [sheetH]);

  const snapTo = (h) => {
    if (sheetRef.current) sheetRef.current.style.transition = "height 0.34s cubic-bezier(0.32,0.72,0,1), border-radius 0.34s";
    setSheetH(h);
  };

  const onHandleTouchStart = (e) => {
    handleStartY.current = e.touches[0].clientY;
    startSheetH.current = sheetH;
    if (sheetRef.current) sheetRef.current.style.transition = "none";
    onInteract?.();
  };
  const onHandleTouchMove = (e) => {
    const dy = handleStartY.current - e.touches[0].clientY;
    setSheetH(Math.max(SNAP_COLLAPSED, Math.min(SNAP_FULL, startSheetH.current + dy)));
  };
  const onHandleTouchEnd = (e) => {
    if (sheetRef.current) sheetRef.current.style.transition = "height 0.34s cubic-bezier(0.32,0.72,0,1)";
    const dy = handleStartY.current - e.changedTouches[0].clientY; // positive = up
    // 3-way snap based on velocity + position
    if (dy > 60 || sheetH > (SNAP_MID + SNAP_FULL) / 2) snapTo(SNAP_FULL);
    else if (dy < -60 || sheetH < (SNAP_COLLAPSED + SNAP_MID) / 2) snapTo(SNAP_COLLAPSED);
    else snapTo(SNAP_MID);
  };

  const listStartY = useRef(null);
  const onListTouchStart = (e) => { listStartY.current = e.touches[0].clientY; onInteract?.(); };
  const onListTouchEnd = (e) => {
    if (!listRef.current) return;
    const dy = listStartY.current - e.changedTouches[0].clientY;
    if (listRef.current.scrollTop <= 2 && dy < -40) snapTo(SNAP_MID);
  };

  const isFull = sheetH >= SNAP_FULL - 40;
  const isMid = sheetH >= SNAP_MID - 40 && !isFull;
  const isCollapsed = sheetH <= SNAP_COLLAPSED + 10;

  const displayProds = pinnedSalon ? (pinnedSalon._products || []) : fp;
  const count = pinnedSalon ? `${pinnedSalon.name}` : `${fp.length} products`;

  return (
    <>
      {/* INLINE MODAL from pinned card product click */}
      {inlineModal&&(
        <ProductModal
          prod={inlineModal}
          salonsWithProd={inlineModal._salons||[]}
          allProducts={fp}
          onClose={()=>setInlineModal(null)}
          onSalonClick={()=>{}}
          lang={t.loading?'en':'en'}
          user={user} favourites={favourites} onToggleFav={onToggleFav}
        />
      )}

      {/* PINNED SALON CARD */}
      {pinnedSalon && isCollapsed && (
        <div style={{position:"absolute",bottom:SNAP_COLLAPSED+8,left:12,right:12,zIndex:200,animation:"fadeUp 0.22s ease both"}}>
          <div style={{background:"#fff",borderRadius:14,boxShadow:"0 8px 28px rgba(0,0,0,0.16)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px 6px"}}>
              <div style={{minWidth:0}}>
                <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"15px",fontWeight:600,color:"#1a1a1a",margin:"0 0 1px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pinnedSalon.name}</p>
                <p style={{...SS,fontSize:"10px",color:"#aaa",margin:0}}>{pinnedSalon.area||"Paris"} · {(pinnedSalon._products||[]).length} products</p>
              </div>
              <button onClick={e=>{e.stopPropagation();setPinnedSalon(null);snapTo(SNAP_MID);}}
                style={{width:26,height:26,borderRadius:"50%",background:"rgba(0,0,0,0.06)",color:"#555",border:"1px solid #ddd",cursor:"pointer",fontSize:"14px",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginLeft:8}}>×</button>
            </div>
            <div style={{display:"flex",gap:8,overflowX:"auto",padding:"0 12px 12px"}}>
              {(pinnedSalon._products||[]).slice(0,6).map(p=>{
                const img=getProdImg(p); const isNew=p._badge==="new"; const color=isNew?"#c9a96e":"#a07832";
                const bd=p.brand_name||(Array.isArray(p.brand)?null:(!p.brand?.startsWith?.("rec")?p.brand:null))||"";
                return (
                  <div key={p.id} onClick={()=>setInlineModal(p)} style={{flexShrink:0,width:60,cursor:"pointer"}}
                    onTouchStart={e=>e.currentTarget.style.opacity="0.7"} onTouchEnd={e=>e.currentTarget.style.opacity="1"}>
                    <div style={{width:60,height:60,borderRadius:10,overflow:"hidden",background:"#f5f0eb",border:`1.5px solid ${isNew?"#e8d9b8":"#ffd5c2"}`,marginBottom:3}}>
                      {img?<img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px"}}>✨</div>}
                    </div>
                    <p style={{...SS,fontSize:"8px",color,fontWeight:700,textTransform:"uppercase",margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{bd}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM SHEET */}
      <div ref={sheetRef}
        style={{
          position:"absolute",bottom:0,left:0,right:0,
          height:sheetH,
          background:"#faf7f4",
          borderRadius:isFull?"0":"16px 16px 0 0",
          boxShadow:"0 -4px 24px rgba(0,0,0,0.14)",
          transition:"height 0.34s cubic-bezier(0.32,0.72,0,1)",
          zIndex:pinnedSalon&&isCollapsed?50:100,
          opacity:pinnedSalon&&isCollapsed?0:1,
          pointerEvents:pinnedSalon&&isCollapsed?"none":"auto",
          display:"flex",flexDirection:"column",overflow:"hidden"
        }}>

        {/* HANDLE — same style as salon page */}
        <div onTouchStart={onHandleTouchStart} onTouchMove={onHandleTouchMove} onTouchEnd={onHandleTouchEnd}
          style={{flexShrink:0,paddingTop:10,paddingBottom:10,touchAction:"none",cursor:"grab"}}>
          <div style={{width:36,height:4,borderRadius:2,background:"#ccc",margin:"0 auto 10px"}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px"}}>
            <div>
              <p style={{...SS,fontSize:"11px",color:"#aaa",fontWeight:500,margin:"0 0 1px",textTransform:"uppercase",letterSpacing:"0.5px"}}>View</p>
              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",fontWeight:600,color:"#1a1a1a",margin:0,lineHeight:1}}>
                {visibleProdCount??displayProds.length} {pinnedSalon?"products":"products"}
              </p>
            </div>
          </div>
          {selProd&&!pinnedSalon&&!isFull&&<div style={{padding:"4px 16px 0"}}>
            <button onClick={onClear} style={{...SS,fontSize:"11px",color:"#c9a96e",background:"none",border:"none",cursor:"pointer",padding:0}}>× Clear selection</button>
          </div>}
        </div>

        {/* LIST — mid and full */}
        {!isCollapsed&&(
          <div ref={listRef} onTouchStart={onListTouchStart} onTouchEnd={onListTouchEnd}
            style={{flex:1,overflowY:"auto",padding:"4px 12px 80px",touchAction:"pan-y",overscrollBehavior:"contain"}}>
            {loading
              ? <div style={{textAlign:"center",padding:"32px 0",fontFamily:"'Cormorant Garamond',serif",fontSize:"18px",color:"#ccc"}}>{t.loading}</div>
              : displayProds.length===0
                ? <div style={{textAlign:"center",padding:"32px 0",fontFamily:"'Cormorant Garamond',serif",fontSize:"18px",color:"#ccc"}}>No products</div>
                : <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {displayProds.map((p,i)=>(
                      <ProductCardSlim key={p.id} p={p} t={t} SS={SS}
                        onClick={isFull ? ()=>onDetail(null,p) : ()=>onProdClick(p)}
                        onDetail={(e)=>onDetail(e,p)}
                        user={user} favourites={favourites} onToggleFav={onToggleFav}
                        isSelected={!isFull && selProd?.id===p.id}
                        hideHover={isFull}
                      />
                    ))}
                  </div>
            }
          </div>
        )}
      </div>
    </>
  );
}

function ProductCardSlim({ p, t, SS, onClick, onDetail, user, favourites, onToggleFav, isSelected, hideHover }) {
  const img = getProdImg(p);
  const isNew = p._badge==="new"; const color = "#c9a96e";
  const brandD = p.brand_name||(Array.isArray(p.brand)?null:(!p.brand?.startsWith?.("rec")?p.brand:null))||"—";
  const [pressed, setPressed] = useState(false);
  return (
    <div onClick={hideHover ? onClick : onClick}
      onTouchStart={()=>!hideHover&&setPressed(true)} onTouchEnd={()=>setPressed(false)}
      style={{display:"flex",gap:12,alignItems:"center",background:isSelected?"#fdf8ee":"#fff",
        border:`1.5px solid ${isSelected?"#c9a96e":"#ede8e2"}`,borderRadius:12,padding:"10px 12px",
        cursor:"pointer",
        transform:(!hideHover&&pressed)?"scale(0.98)":"scale(1)",
        transition:"all 0.15s",
        boxShadow:isSelected?"0 2px 12px rgba(201,169,110,0.15)":"0 1px 4px rgba(0,0,0,0.05)"}}>
      {/* image */}
      <div style={{width:56,height:56,borderRadius:10,overflow:"hidden",flexShrink:0,background:"#1a1a1a",position:"relative"}}>
        {img ? <>
          <img src={img} alt="" style={{position:"absolute",inset:"-8%",width:"116%",height:"116%",objectFit:"cover",filter:"blur(8px) saturate(1.3) opacity(0.9)",pointerEvents:"none"}} />
          <img src={img} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"contain",zIndex:1}} />
        </> : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px"}}>✨</div>}
      </div>
      {/* info */}
      <div style={{flex:1,minWidth:0}}>
        <p style={{...SS,fontSize:"9px",color,fontWeight:700,letterSpacing:"1.2px",textTransform:"uppercase",margin:"0 0 2px"}}>{brandD}</p>
        <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"14px",fontWeight:600,color:"#1a1a1a",margin:"0 0 3px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.product_name}</p>
        <p style={{...SS,fontSize:"10px",color:"#aaa",margin:"0 0 2px"}}>{p.category}</p>
        {(p._salons||[]).length>0&&<p style={{...SS,fontSize:"10px",color:"#c9a96e",fontWeight:600,margin:0}}>📍 {(p._salons||[]).length} salons</p>}
      </div>
      {/* detail button */}
      <button onClick={e=>{e.stopPropagation();onDetail(e);}}
        style={{...SS,fontSize:"9px",fontWeight:600,color:"#c9a96e",border:"1px solid #e8d9b8",background:"transparent",cursor:"pointer",padding:"5px 9px",borderRadius:8,flexShrink:0,whiteSpace:"nowrap"}}
        onMouseEnter={e=>{e.currentTarget.style.background="#c9a96e";e.currentTarget.style.color="#fff";}}
        onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#c9a96e";}}>
        ✦ Details
      </button>
    </div>
  );
}


function ProductsPage({lang,setLang,allProducts,salons,loading,user,favourites,onToggleFav,onAuthClick}) {
  const t=T[lang]; const isMobile=window.innerWidth<768;
  const navigate=useNavigate();
  const [prodSearch,setProdSearch]=useState("");
  const [prodCats,setProdCats]=useState([]); // multi-select array
  const [inSalonOnly,setInSalonOnly]=useState(false);
  const [showFilterModal,setShowFilterModal]=useState(false);
  const [fp,setFp]=useState(allProducts);
  const [showJoin,setShowJoin]=useState(false);
  const [selProd,setSelProd]=useState(null);   // selected on map
  const [modalProd,setModalProd]=useState(null); // opened in modal
  const [selSalon,setSelSalon]=useState(null);
  const [mapSalons,setMapSalons]=useState([]);
  const [prodVisibleIds,setProdVisibleIds]=useState(null);
  const [prodSheetExpanded,setProdSheetExpanded]=useState(false);
  const [navPing,setNavPing]=useState(0);
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
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Noto+Sans+KR:wght@300;400;500;700&family=DM+Sans:wght@300;400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0}html,body{background:#ffffff;height:100%;overscroll-behavior:none}@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:#c9a96e;border-radius:3px}.leaflet-tooltip{background:#fff;border:1px solid #ede8e2;border-radius:8px;padding:6px 10px}`}</style>
      {!isMobile&&<ProgramDesktopNav user={user} onAuthClick={onAuthClick} lang={lang} setLang={setLang}/>}
      {isMobile&&!prodSheetExpanded&&<MobileTabBar active="/products" pingSignal={navPing}/>}

      {/* SPLIT LAYOUT */}
      {isMobile ? (
        /* mobile: fixed fullscreen container */
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:300,display:"flex",flexDirection:"column"}}>
          {/* nav — hides on full */}
          <div id="prod-nav" style={{flexShrink:0,overflow:"hidden",background:"#fff",borderBottom:"1px solid #f0e5cf",transition:"max-height 0.34s cubic-bezier(0.32,0.72,0,1)",maxHeight:60}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px"}}>
              <div onClick={()=>navigate("/")} style={{cursor:"pointer"}}>
                <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:"#1a1a1a",letterSpacing:2,fontWeight:300}}>THE</span>
                <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:"#c9a96e",letterSpacing:2,fontWeight:600,marginLeft:5}}>BEAUTY PAUSE</span>
              </div>
              <button onClick={()=>navigate("/search")} style={{width:34,height:34,borderRadius:"50%",background:"#fff",border:"1px solid #f0e5cf",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </button>
            </div>
          </div>
          {/* filterbar — always visible */}
          <div style={{flexShrink:0,background:"#fff",borderBottom:"1px solid #ede8e2",padding:"9px 14px",display:"flex",alignItems:"center",gap:8,overflowX:"auto",flexWrap:"nowrap",zIndex:2}}>
            <button onClick={()=>setShowFilterModal(true)} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 13px",border:`1.5px solid ${activeFilterCount>0?"#1a1a1a":"#ede8e2"}`,background:activeFilterCount>0?"#1a1a1a":"#fff",color:activeFilterCount>0?"#fff":"#555",cursor:"pointer",...SS,fontSize:"12px",borderRadius:20,flexShrink:0}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
              {t.filter}{activeFilterCount>0&&<span style={{background:"#c9a96e",color:"#0d0d0d",borderRadius:"50%",width:19,height:19,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:700}}>{activeFilterCount}</span>}
            </button>
            <div style={{width:1,height:18,background:"#ede8e2",flexShrink:0}}/>
            <button onClick={()=>setInSalonOnly(v=>!v)} style={{padding:"7px 13px",border:`1.5px solid ${inSalonOnly?"#c9a96e":"#ede8e2"}`,background:inSalonOnly?"#fdf8ee":"#fff",color:inSalonOnly?"#c9a96e":"#666",cursor:"pointer",...SS,fontSize:"12px",fontWeight:inSalonOnly?600:400,borderRadius:20,flexShrink:0,whiteSpace:"nowrap"}}>
              📍 In salon
            </button>
            {cats.filter(c=>c!=="All").slice(0,4).map(cat=>{
              const a=prodCats.includes(cat);
              return <button key={cat} onClick={()=>setProdCats(prev=>prev.includes(cat)?prev.filter(x=>x!==cat):[...prev,cat])} style={{padding:"7px 13px",border:`1.5px solid ${a?"#1a1a1a":"#ede8e2"}`,background:a?"#1a1a1a":"#fff",color:a?"#fff":"#666",cursor:"pointer",...SS,fontSize:"12px",borderRadius:20,flexShrink:0,whiteSpace:"nowrap"}}>{cat}</button>;
            })}
          </div>
          {/* map */}
          <div style={{flex:1,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",inset:0}}>
              {lr?<SalonMap salons={mapSalons.length>0?mapSalons:salons} onPinClick={s=>{if(ProductBottomSheet._setPinned)ProductBottomSheet._setPinned(s);}} onBoundsChange={setProdVisibleIds} fitToSalons={mapSalons.length>0?mapSalons:null} />
                :<div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",...SS,color:"#aaa"}}>{t.loading}</div>}
            </div>
            {(()=>{
              const visibleFp = prodVisibleIds ? fp.filter(p=>(p._salons||[]).some(s=>prodVisibleIds.includes(s.id))) : fp;
              return (
                <ProductBottomSheet
                  fp={visibleFp} loading={loading} t={t} SS={SS}
                  selProd={selProd} onProdClick={handleProdClick}
                  onDetail={handleProdDetail}
                  user={user} favourites={favourites} onToggleFav={onToggleFav}
                  onClear={()=>{setSelProd(null);setMapSalons([]);}}
                  salons={salons} mapSalons={mapSalons} onSalonClick={setSelSalon}
                  onExpandChange={(full)=>{
                    const el=document.getElementById("prod-nav");
                    if(el) el.style.maxHeight=full?"0px":"60px";
                    setProdSheetExpanded(full);
                  }}
                  onInteract={()=>setNavPing(p=>p+1)}
                  onModalProd={setModalProd}
                  visibleProdCount={null}
                />
              );
            })()}
          </div>
        </div>
      ) : (
        <div style={{maxWidth:1280,margin:"0 auto"}}>
          <div style={{padding:"32px clamp(24px,4vw,56px) 8px"}}>
            <p style={{...SS,fontSize:24,fontWeight:700,color:"#1a1a1a",margin:0}}><Star size={22}/> Meet the Brands</p>
          </div>
          <div style={{padding:"16px clamp(24px,4vw,56px) 60px"}}>

          {/* FILTER BAR */}
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,flexWrap:"wrap"}}>
            <button onClick={()=>setShowFilterModal(true)} style={{display:"flex",alignItems:"center",gap:5,padding:"8px 16px",border:`1.5px solid ${activeFilterCount>0?"#1a1a1a":"#ede8e2"}`,background:activeFilterCount>0?"#1a1a1a":"#fff",color:activeFilterCount>0?"#fff":"#555",cursor:"pointer",...SS,fontSize:13,borderRadius:20,transition:"all 0.2s"}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
              {t.filter}{activeFilterCount>0&&<span style={{background:"#c9a96e",color:"#0d0d0d",borderRadius:"50%",width:19,height:19,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:700}}>{activeFilterCount}</span>}
            </button>
            <div style={{width:1,height:20,background:"#ede8e2"}} />
            <button onClick={()=>setInSalonOnly(v=>!v)} style={{padding:"8px 16px",border:`1.5px solid ${inSalonOnly?"#c9a96e":"#ede8e2"}`,background:inSalonOnly?"#fdf8ee":"#fff",color:inSalonOnly?"#c9a96e":"#666",cursor:"pointer",...SS,fontSize:13,fontWeight:inSalonOnly?600:400,borderRadius:20,whiteSpace:"nowrap"}}>
              📍 In salon
            </button>
            {cats.filter(c=>c!=="All").slice(0,4).map(cat=>{
              const a=prodCats.includes(cat);
              return <button key={cat} onClick={()=>setProdCats(prev=>prev.includes(cat)?prev.filter(x=>x!==cat):[...prev,cat])} style={{padding:"8px 16px",border:`1.5px solid ${a?"#1a1a1a":"#ede8e2"}`,background:a?"#1a1a1a":"#fff",color:a?"#fff":"#666",cursor:"pointer",...SS,fontSize:13,borderRadius:20,whiteSpace:"nowrap"}}>{cat}</button>;
            })}
          </div>

          {/* SPLIT: LIST + MAP */}
          <div style={{display:"flex",gap:28}}>
            {/* LEFT: product list */}
            <div style={{flex:"1 1 55%",minWidth:0}}>
              {loading?<div style={{textAlign:"center",padding:"60px 0",fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",color:"#ccc"}}>{t.loading}</div>
              :<>
                {(()=>{
                  const visibleFp = prodVisibleIds ? fp.filter(p=>(p._salons||[]).some(s=>prodVisibleIds.includes(s.id))) : fp;
                  return <>
                    <p style={{...SS,fontSize:"12px",color:"#aaa",marginBottom:16}}>
                      {visibleFp.length} products
                      {selProd&&` · Showing ${(selProd._salons||[]).length} salon${(selProd._salons||[]).length!==1?"s":""} on map`}
                    </p>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16}}>
                      {visibleFp.map((p,i)=>(
                        <ProductCard key={p.id} p={p} i={i} t={t}
                          onClick={()=>handleProdClick(p)}
                          onDetail={handleProdDetail}
                          user={user} favourites={favourites} onToggleFav={onToggleFav}
                          isSelected={selProd?.id===p.id}
                        />
                      ))}
                    </div>
                  </>;
                })()}
              </>}
            </div>

            {/* RIGHT: sticky map */}
            <div style={{flex:"1 1 45%",position:"sticky",top:84,alignSelf:"flex-start",height:"calc(100vh - 120px)",borderRadius:16,overflow:"hidden",border:"1px solid #f0e9dc",display:"flex",flexDirection:"column"}}>
              {/* map hint */}
              <div style={{background:"#fff",borderBottom:"1px solid #ede8e2",padding:"10px 16px",display:"flex",alignItems:"center",gap:10,flexShrink:0,minHeight:60}}>
                {selProd ? (
                  <>
                    {(()=>{const img=getProdImg(selProd);return img&&<div style={{width:40,height:40,borderRadius:8,overflow:"hidden",flexShrink:0}}><img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>;})()}
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{...SS,fontSize:"12px",fontWeight:600,color:"#1a1a1a",margin:"0 0 2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{selProd.product_name}</p>
                      <p style={{...SS,fontSize:"11px",color:"#c9a96e",margin:0}}>📍 Salons where you can discover this product ({(selProd._salons||[]).length})</p>
                    </div>
                    <button onClick={()=>{setSelProd(null);setMapSalons([]);setProdVisibleIds(null);}} style={{background:"none",border:"none",cursor:"pointer",color:"#ccc",fontSize:"18px",lineHeight:1,flexShrink:0}}>×</button>
                  </>
                ) : (
                  <><span style={{fontSize:"14px"}}>💡</span><span style={{...SS,fontSize:"12px",color:"#aaa"}}>Click a product to see where it's available</span></>
                )}
              </div>
              {lr
                ? <SalonMap salons={mapSalons.length>0?mapSalons:salons} onPinClick={setSelSalon} onBoundsChange={setProdVisibleIds} fitToSalons={mapSalons.length>0?mapSalons:null} compact={true} />
                : <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",...SS,color:"#aaa"}}>{t.loading}</div>
              }
            </div>
          </div>
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
  const [hov,setHov]=useState(false);
  const isNew=p._badge==="new"; const color=isNew?"#c9a96e":"#a07832"; const img=getProdImg(p);
  const brandDisplay=p.brand_name||(Array.isArray(p.brand)?null:(!p.brand?.startsWith?.("rec")?p.brand:null))||"—";
  const inner = (
    <>
      {onToggleFav&&!noWrapper&&<div style={{position:"absolute",top:8,right:8,zIndex:2}}><FavBtn type="product" item={p} user={user} favourites={favourites||[]} onToggle={onToggleFav} size={16}/></div>}
      <div style={{position:"relative",paddingBottom:"80%",overflow:"hidden",background:"#f5f0eb"}}>
        {img ? <>
          {/* blurred background */}
          <img src={img} alt="" style={{position:"absolute",inset:"-8%",width:"116%",height:"116%",objectFit:"cover",filter:"blur(14px) saturate(1.3) opacity(0.9)",pointerEvents:"none"}} />
          {/* contained foreground */}
          <img src={img} alt={p.product_name} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"contain",zIndex:1}} />
        </> : <div style={{position:"absolute",inset:0,background:"#f5f0eb",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"36px"}}>✨</div>}
        <div style={{position:"absolute",top:10,left:10,background:color,color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:"10px",fontWeight:700,letterSpacing:"0.5px",textTransform:"uppercase",padding:"4px 10px",borderRadius:20,zIndex:2}}>{isNew?t.new_in:t.top_pick}</div>
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
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:"#fff",border:`1.5px solid ${(isSelected||hov)?"#c9a96e":"#f0e9dc"}`,overflow:"hidden",borderRadius:16,cursor:"pointer",transition:"border-color 0.15s",animation:`fadeUp 0.4s ease ${i*0.03}s both`,position:"relative"}}>
      {inner}
    </div>
  );
}

// ── ACCOUNT PAGE ─────────────────────────────────────────────────────────────
function AccountPage({lang,setLang,salons,allProducts}) {
  const navigate=useNavigate();
  const pt = PT[lang==="fr"?"fr":"en"];
  const [profile,setProfile]=useState({first_name:"",email:"",area:""});
  const [favs,setFavs]=useState([]);
  const [programApps,setProgramApps]=useState([]);
  const [loadingApps,setLoadingApps]=useState(true);
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [userId,setUserId]=useState(null);
  const isMobile=window.innerWidth<768;
  const areas=["Le Marais","Saint-Germain","Bastille","Montmartre","Pigalle","Oberkampf","République","Châtelet","Opéra","Batignolles","Belleville","Nation","Other"];
  const KR={fontFamily:"'Noto Sans KR',sans-serif"};
  const SS={fontFamily:"'DM Sans',sans-serif"};
  const inputStyle={width:"100%",padding:"11px 14px",border:"1px solid #f0e9dc",background:"#fff",...SS,fontSize:"13px",color:"#1a1a1a",outline:"none",borderRadius:10,transition:"border 0.2s"};

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
      // load booked programs (Airtable)
      if (user.email && TBL_PROGRAM_SIGNUPS && AT_BASE && AT_KEY) {
        setLoadingApps(true);
        fetch(`https://api.airtable.com/v0/${AT_BASE}/${TBL_PROGRAM_SIGNUPS}?filterByFormula=${encodeURIComponent(`{user_email}='${user.email}'`)}`, {
          headers: { Authorization: `Bearer ${AT_KEY}` }
        }).then(r=>r.json()).then(data=>{
          setProgramApps((data.records||[]).map(r=>({id:r.id,...r.fields})));
          setLoadingApps(false);
        }).catch(e=>{console.error("Program apps fetch error:",e); setLoadingApps(false);});
      } else {
        setLoadingApps(false);
      }
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
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Noto+Sans+KR:wght@300;400;500;700&family=DM+Sans:wght@300;400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0}html,body{background:#ffffff}@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#c9a96e;border-radius:3px}`}</style>
      {isMobile ? (
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 20px 4px"}}>
          <div onClick={()=>navigate("/")} style={{cursor:"pointer"}}>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:"#1a1a1a",letterSpacing:2,fontWeight:300}}>THE</span>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:"#c9a96e",letterSpacing:2,fontWeight:600,marginLeft:5}}>BEAUTY PAUSE</span>
          </div>
          <button onClick={()=>navigate("/search")} style={{width:38,height:38,borderRadius:"50%",background:"#fff",border:"1px solid #f0e5cf",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
        </div>
      ) : (
        <ProgramDesktopNav user={userId?{}:null} lang={lang} setLang={setLang}/>
      )}
      {isMobile&&<MobileTabBar active="/account"/>}
      <main style={{maxWidth:700,margin:"0 auto",padding:"40px clamp(16px,4vw,32px) 80px"}}>
        <div style={{marginBottom:32,animation:"fadeUp 0.6s ease both"}}>
          <p style={{...SS,fontSize:"10px",color:"#c9a96e",letterSpacing:"4px",textTransform:"uppercase",marginBottom:8}}><Star size={11}/> My account</p>
          <h1 style={{...SS,fontSize:"clamp(24px,3.4vw,32px)",fontWeight:700,color:"#1a1a1a",margin:0}}>{profile.first_name?`Hello, ${profile.first_name}`:"My account"}</h1>
        </div>

        {/* Profile */}
        <div style={{background:"#fff",border:"1px solid #f0e9dc",borderRadius:16,padding:"24px",marginBottom:18,animation:"fadeUp 0.6s ease 0.05s both"}}>
          <h2 style={{...SS,fontSize:"16px",fontWeight:700,color:"#1a1a1a",margin:"0 0 20px",paddingBottom:12,borderBottom:"1px solid #f5f0f0"}}><Star size={14}/> Profile</h2>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14,marginBottom:14}}>
            <div>
              <label style={{...SS,fontSize:"10px",color:"#aaa",letterSpacing:"1.5px",textTransform:"uppercase",display:"block",marginBottom:5}}>First name</label>
              <input value={profile.first_name} onChange={e=>setProfile(p=>({...p,first_name:e.target.value}))} style={inputStyle} onFocus={e=>e.target.style.borderColor="#c9a96e"} onBlur={e=>e.target.style.borderColor="#f0e9dc"} />
            </div>
            <div>
              <label style={{...SS,fontSize:"10px",color:"#aaa",letterSpacing:"1.5px",textTransform:"uppercase",display:"block",marginBottom:5}}>Email</label>
              <input value={profile.email} disabled style={{...inputStyle,background:"#faf9f7",color:"#aaa"}} />
            </div>
          </div>
          <div style={{marginBottom:20}}>
            <label style={{...SS,fontSize:"10px",color:"#aaa",letterSpacing:"1.5px",textTransform:"uppercase",display:"block",marginBottom:5}}>My area in Paris</label>
            <select value={profile.area} onChange={e=>setProfile(p=>({...p,area:e.target.value}))} style={{...inputStyle,cursor:"pointer",appearance:"none"}}>
              <option value="">Select your area…</option>
              {areas.map(a=><option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <button onClick={save} disabled={saving} style={{padding:"11px 24px",background:saved?"#4caf50":saving?"#ccc":"#1a1a1a",color:"#fff",border:"none",cursor:"pointer",...SS,fontSize:"11px",fontWeight:600,letterSpacing:"2px",textTransform:"uppercase",borderRadius:10,transition:"all 0.2s"}}>
            {saved?"Saved ✓":saving?"Saving…":"Save changes"}
          </button>
        </div>

        {/* My Programs */}
        <div style={{background:"#fff",border:"1px solid #f0e9dc",borderRadius:16,padding:"24px",marginBottom:18,animation:"fadeUp 0.6s ease 0.08s both"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,paddingBottom:12,borderBottom:"1px solid #f5f0f0"}}>
            <h2 style={{...SS,fontSize:"16px",fontWeight:700,color:"#1a1a1a",margin:0}}><Star size={14}/> My Programs</h2>
            <button onClick={()=>navigate("/programs")} style={{...SS,fontSize:"11px",color:"#c9a96e",background:"none",border:"none",cursor:"pointer",fontWeight:600}}>Browse →</button>
          </div>
          {loadingApps
            ? <p style={{...KR,fontSize:"13px",color:"#ccc",textAlign:"center",padding:"16px 0"}}>{pt.loading}</p>
            : programApps.length===0
              ? <p style={{...KR,fontSize:"13px",color:"#ccc",textAlign:"center",padding:"16px 0"}}>{pt.myProgramsEmpty}</p>
              : <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {programApps.map(a=>(
                    <div key={a.id} style={{border:"1px solid #f0e9dc",borderRadius:14,padding:"14px 16px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:8}}>
                        <p style={{...SS,fontSize:"15px",fontWeight:700,color:"#1a1a1a",margin:0,lineHeight:1.3}}>{a.program_name}</p>
                        <span style={{...SS,fontSize:"9px",color:"#c9a96e",fontWeight:700,letterSpacing:"0.5px",textTransform:"uppercase",background:"#fdf8ee",border:"1px solid #e8d9b8",padding:"4px 10px",borderRadius:20,flexShrink:0}}>{a.status||"pending"}</span>
                      </div>
                      <p style={{...KR,fontSize:"12px",color:"#888",margin:"0 0 3px"}}>{pt.applicationSalon}: {a.salon_name||"TBD"}</p>
                      <p style={{...SS,fontSize:"11px",color:"#bbb",margin:0}}>{a.payment_method==="onsite"?pt.payAtSalon:a.payment_method} · {a.order_id}</p>
                    </div>
                  ))}
                </div>
          }
        </div>

        {/* Fav Salons */}
        <div style={{background:"#fff",border:"1px solid #f0e9dc",borderRadius:16,padding:"24px",marginBottom:18,animation:"fadeUp 0.6s ease 0.1s both"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,paddingBottom:12,borderBottom:"1px solid #f5f0f0"}}>
            <h2 style={{...SS,fontSize:"16px",fontWeight:700,color:"#1a1a1a",margin:0}}><Star size={14}/> Favourite Salons</h2>
            <button onClick={()=>navigate("/salons")} style={{...SS,fontSize:"11px",color:"#c9a96e",background:"none",border:"none",cursor:"pointer",fontWeight:600}}>Browse →</button>
          </div>
          {favSalons.length===0
            ? <p style={{...SS,fontSize:"13px",color:"#ccc",textAlign:"center",padding:"16px 0"}}>Heart a salon to save it here.</p>
            : <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {favSalons.map(f=>{
                  const s=salons.find(x=>x.id===f.item_id); const img=s?getSalonImg(s):null;
                  return (
                    <div key={f.id} onClick={()=>navigate("/salons")} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",border:"1px solid #f0e9dc",borderRadius:12,cursor:"pointer",transition:"border-color 0.15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#c9a96e"} onMouseLeave={e=>e.currentTarget.style.borderColor="#f0e9dc"}>
                      <div style={{width:44,height:44,borderRadius:10,overflow:"hidden",flexShrink:0,background:"#1a1a1a"}}>
                        {img?<img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"18px",color:"rgba(201,169,110,0.4)"}}>{f.item_name?.[0]}</span></div>}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{...SS,fontSize:"13px",fontWeight:600,color:"#1a1a1a",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.item_name}</p>
                        {s&&<p style={{...SS,fontSize:"11px",color:"#aaa",margin:0}}>{s.area||"Paris"}</p>}
                      </div>
                      <button onClick={e=>{e.stopPropagation();removeFav(f);}} style={{background:"none",border:"none",cursor:"pointer",color:"#ddd",fontSize:"18px",padding:"4px",flexShrink:0}} onMouseEnter={e=>e.target.style.color="#c9a96e"} onMouseLeave={e=>e.target.style.color="#ddd"}>×</button>
                    </div>
                  );
                })}
              </div>
          }
        </div>

        {/* Fav Products */}
        <div style={{background:"#fff",border:"1px solid #f0e9dc",borderRadius:16,padding:"24px",marginBottom:24,animation:"fadeUp 0.6s ease 0.15s both"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,paddingBottom:12,borderBottom:"1px solid #f5f0f0"}}>
            <h2 style={{...SS,fontSize:"16px",fontWeight:700,color:"#1a1a1a",margin:0}}><Star size={14}/> Favourite Products</h2>
            <button onClick={()=>navigate("/products")} style={{...SS,fontSize:"11px",color:"#c9a96e",background:"none",border:"none",cursor:"pointer",fontWeight:600}}>Browse →</button>
          </div>
          {favProds.length===0
            ? <p style={{...SS,fontSize:"13px",color:"#ccc",textAlign:"center",padding:"16px 0"}}>Heart a product to save it here.</p>
            : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:12}}>
                {favProds.map(f=>{
                  const p=allProducts.find(x=>x.id===f.item_id); const color="#c9a96e";
                  const img=p?getProdImg(p):null;
                  return (
                    <div key={f.id} onClick={()=>navigate("/products")} style={{background:"#fff",border:"1px solid #f0e9dc",borderRadius:14,overflow:"hidden",position:"relative",cursor:"pointer",transition:"border-color 0.15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#c9a96e"} onMouseLeave={e=>e.currentTarget.style.borderColor="#f0e9dc"}>
                      <div style={{paddingBottom:"80%",position:"relative",overflow:"hidden",background:"#f5f0eb"}}>
                        {img?<img src={img} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}} />:<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px"}}>✨</div>}
                      </div>
                      <div style={{padding:"8px 10px 10px"}}>
                        <p style={{...SS,fontSize:"8px",color,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",margin:"0 0 2px"}}>{p?.brand}</p>
                        <p style={{...SS,fontSize:"11px",color:"#1a1a1a",margin:0,lineHeight:1.3}}>{f.item_name}</p>
                      </div>
                      <button onClick={e=>{e.stopPropagation();removeFav(f);}} style={{position:"absolute",top:6,right:6,background:"rgba(255,255,255,0.9)",border:"none",cursor:"pointer",color:"#aaa",fontSize:"14px",width:22,height:22,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}} onMouseEnter={e=>e.target.style.color="#c9a96e"} onMouseLeave={e=>e.target.style.color="#aaa"}>×</button>
                    </div>
                  );
                })}
              </div>
          }
        </div>

        <button onClick={signOut} style={{...SS,fontSize:"12px",color:"#aaa",background:"none",border:"1px solid #f0e9dc",cursor:"pointer",padding:"10px 20px",borderRadius:10,transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#1a1a1a";e.currentTarget.style.color="#1a1a1a";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#f0e9dc";e.currentTarget.style.color="#aaa";}}>Sign out</button>
      </main>
    </>
  );
}


const TBL_LUCKY_DRAW = "tbloBydPZIIzx321q";

// ── SPOT PAGE (QR scan landing) ───────────────────────────────────────────────
function SpotPage({ lang, setLang }) {
  const { spotId } = useParams();
  const navigate = useNavigate();
  const t = T[lang];
  const [spot, setSpot] = useState(null);
  const [product, setProduct] = useState(null);
  const [salon, setSalon] = useState(null);
  const [status, setStatus] = useState("loading");
  const [screen, setScreen] = useState("landing"); // landing | product | lucky
  const [imgIdx, setImgIdx] = useState(0);

  // intercept browser back button for screen navigation
  useEffect(() => {
    if (status !== "found") return;
    window.history.pushState({ spotScreen: screen }, "");
    const handlePop = () => {
      if (screen === "lucky" || screen === "product") {
        setScreen("landing");
        window.history.pushState({ spotScreen: "landing" }, "");
      }
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [screen, status]);

  // increment scan count
  const incrementScan = async (spotRecordId) => {
    try {
      const res = await fetch(`https://api.airtable.com/v0/${AT_BASE}/${TBL_SPOTS}/${spotRecordId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${AT_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fields: {} }) // scan_count is a formula or count field — just log visit
      });
    } catch(e) { console.log("scan count skip", e); }
  };

  useEffect(() => {
    if (!spotId) { setStatus("not_found"); return; }
    (async () => {
      try {
        // spot_id may be a formula field — fetch all and filter in JS
        const allSpots = await fetchAll(TBL_SPOTS, "");
        const spots = allSpots.filter(s => s.spot_id === spotId);
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
  const SS = {fontFamily:"'DM Sans',sans-serif"};

  const SpotNav = () => (
    <nav style={{background:"#0d0d0d",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",position:"sticky",top:0,zIndex:500}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        {screen!=="landing"&&<button onClick={()=>setScreen("landing")} style={{background:"none",border:"none",cursor:"pointer",color:"#777",fontSize:"18px",padding:"4px 6px"}}>←</button>}
        <div onClick={()=>navigate("/")} style={{cursor:"pointer"}}>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"15px",color:"#f5f0eb",letterSpacing:"2px",fontWeight:300}}>THE</span>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"15px",color:"#c9a96e",letterSpacing:"2px",fontWeight:600,marginLeft:5}}>BEAUTY PAUSE</span>
        </div>
      </div>
      <div style={{display:"flex",border:"1px solid #333",borderRadius:20,overflow:"hidden"}}>
        {["en","fr"].map(l=><button key={l} onClick={()=>setLang(l)} style={{padding:"4px 9px",border:"none",cursor:"pointer",...SS,fontSize:"11px",fontWeight:600,color:lang===l?"#0d0d0d":"#777",background:lang===l?"#c9a96e":"transparent",textTransform:"uppercase"}}>{l}</button>)}
      </div>
    </nav>
  );

  if (status==="loading") return (
    <><SpotNav/><div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"80vh"}}><p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"22px",color:"#ccc"}}>Loading…</p></div></>
  );
  if (status==="not_found") return (
    <><SpotNav/><div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"80vh",padding:"40px 24px",textAlign:"center"}}>
      <p style={{...SS,fontSize:"11px",color:"#c9a96e",letterSpacing:"3px",textTransform:"uppercase",marginBottom:12}}>✦ Discovery Spot</p>
      <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"32px",fontWeight:300,color:"#1a1a1a",marginBottom:12}}>Spot not found</h1>
      <p style={{...SS,fontSize:"14px",color:"#aaa",marginBottom:28}}>This QR code may be outdated.</p>
      <button onClick={()=>navigate("/")} style={{padding:"12px 28px",background:"#1a1a1a",color:"#f5f0eb",border:"none",cursor:"pointer",...SS,fontSize:"12px",fontWeight:600,letterSpacing:"2px",textTransform:"uppercase",borderRadius:8}}>Go to homepage</button>
    </div></>
  );

  // ── SCREEN: LANDING ──────────────────────────────────────────────────────────
  if (screen==="landing") return (
    <>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}html,body{background:#faf7f4}@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}@keyframes shimmer{0%{opacity:0.6}50%{opacity:1}100%{opacity:0.6}}`}</style>
      <SpotNav/>
      <div style={{minHeight:"calc(100vh - 56px)",display:"flex",flexDirection:"column",animation:"fadeUp 0.5s ease both"}}>

        {/* ① SALON HERO — full width image with overlay */}
        {salon&&(
          <div style={{position:"relative",height:"30vh",minHeight:180,overflow:"hidden",background:"#1a1a1a",flexShrink:0}}>
            {salonImg&&<img src={salonImg} alt={salon.name} style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.7}}/>}
            <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.2) 60%,transparent 100%)"}}/>
            <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"20px 20px 24px"}}>
              <p style={{...SS,fontSize:"10px",color:"#c9a96e",letterSpacing:"3px",textTransform:"uppercase",fontWeight:700,margin:"0 0 6px"}}>✦ Discovery Spot</p>
              <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(24px,6vw,36px)",fontWeight:600,color:"#fff",margin:"0 0 4px",lineHeight:1.1}}>{salon.name}</h1>
              {salon.address&&<p style={{...SS,fontSize:"12px",color:"rgba(255,255,255,0.6)",margin:0}}>📍 {salon.address}</p>}
            </div>
          </div>
        )}

        {/* ② PRODUCT + DISCOUNT CODE — combined box */}
        {product&&(
          <div style={{padding:"20px 20px 0",flexShrink:0}}>
            <div style={{background:"#fff",border:"1px solid #ede8e2",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
              {/* product row — clickable to product detail */}
              <div onClick={()=>setScreen("product")}
                style={{display:"flex",alignItems:"center",gap:0,cursor:"pointer",transition:"opacity 0.2s"}}
                onTouchStart={e=>e.currentTarget.style.opacity="0.8"}
                onTouchEnd={e=>e.currentTarget.style.opacity="1"}>
                {/* product image */}
                <div style={{width:90,height:90,flexShrink:0,position:"relative",overflow:"hidden",background:"#1a1a1a"}}>
                  {img ? <>
                    <img src={img} alt="" style={{position:"absolute",inset:"-8%",width:"116%",height:"116%",objectFit:"cover",filter:"blur(8px) saturate(1.3) opacity(0.9)"}}/>
                    <img src={img} alt={product.product_name} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"contain",zIndex:1}}/>
                  </> : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"28px"}}>✨</div>}
                </div>
                {/* info */}
                <div style={{flex:1,padding:"14px 16px",minWidth:0}}>
                  <p style={{...SS,fontSize:"9px",color:"#c9a96e",fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",margin:"0 0 3px"}}>{brandDisplay}</p>
                  <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"15px",fontWeight:600,color:"#1a1a1a",margin:"0 0 2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{product.product_name}</p>
                  <p style={{...SS,fontSize:"11px",color:"#aaa",margin:"0 0 8px"}}>{product.category}{product.price_customer&&` · €${product.price_customer}`}</p>
                  <p style={{...SS,fontSize:"11px",color:"#c9a96e",fontWeight:600,margin:0}}>
                    {lang==="fr"?"Voir le produit →":"View product info →"}
                  </p>
                </div>
              </div>

              {/* discount code — same box, below product row */}
              {product.discount_code&&(
                <div style={{borderTop:"1px solid #f0ebe2",padding:"16px 20px",background:"#fdf8ee"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                    <span style={{fontSize:"16px"}}>🎉</span>
                    <p style={{...SS,fontSize:"11px",color:"#a07832",fontWeight:700,letterSpacing:"0.5px",margin:0}}>
                      {lang==="fr"?"Vous avez débloqué une réduction !":"You've unlocked a discount!"}
                    </p>
                  </div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fff",border:"1px dashed #c9a96e",borderRadius:10,padding:"12px 16px"}}>
                    <span style={{...SS,fontSize:"18px",fontWeight:800,color:"#1a1a1a",letterSpacing:"1px"}}>{product.discount_code}</span>
                    <button onClick={(e)=>{e.stopPropagation();navigator.clipboard?.writeText(product.discount_code);}}
                      style={{...SS,fontSize:"11px",fontWeight:700,color:"#fff",background:"#1a1a1a",border:"none",padding:"7px 14px",borderRadius:8,cursor:"pointer"}}>
                      {lang==="fr"?"Copier":"Copy"}
                    </button>
                  </div>
                  <p style={{...SS,fontSize:"10px",color:"#bbb",margin:"8px 0 0"}}>
                    {lang==="fr"
                      ?"Valable sur tous nos produits, pas seulement celui-ci. Faites une capture d'écran."
                      :"Valid on all products, not just this one. Screenshot this to save it."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ③ LUCKY DRAW — main CTA, gold card */}
        <div style={{padding:"20px 20px 0",flexShrink:0}}>
          <div style={{background:"linear-gradient(135deg,#1a1a1a 0%,#2a2218 100%)",borderRadius:20,padding:"24px 22px",boxShadow:"0 8px 32px rgba(0,0,0,0.18)",position:"relative",overflow:"hidden"}}>
            {/* decorative circle */}
            <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:"rgba(201,169,110,0.08)"}}/>
            <div style={{position:"absolute",bottom:-20,left:-20,width:80,height:80,borderRadius:"50%",background:"rgba(201,169,110,0.05)"}}/>

            <div style={{position:"relative"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <span style={{fontSize:"24px"}}>🎁</span>
                <div>
                  <p style={{...SS,fontSize:"10px",color:"#c9a96e",letterSpacing:"2px",textTransform:"uppercase",fontWeight:700,margin:0}}>
                    {lang==="fr"?"Tirage au sort":"Lucky Draw"}
                  </p>
                </div>
              </div>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(20px,5vw,28px)",fontWeight:400,color:"#f5f0eb",margin:"0 0 8px",lineHeight:1.2}}>
                {lang==="fr"?"Tournez la roue,\ngagnez à coup sûr":"Spin the wheel,\nwin every time"}
              </h2>
              <p style={{...SS,fontSize:"12px",color:"rgba(255,255,255,0.5)",margin:"0 0 20px",lineHeight:1.5}}>
                {lang==="fr"
                  ? "Une seule participation par personne · Résultat immédiat"
                  : "One spin per person · Instant result"}
              </p>
              <button onClick={()=>setScreen("lucky")}
                style={{width:"100%",padding:"15px",background:"linear-gradient(135deg,#c9a96e,#b8944d)",color:"#0d0d0d",border:"none",cursor:"pointer",...SS,fontSize:"14px",fontWeight:700,letterSpacing:"0.5px",borderRadius:12,boxShadow:"0 4px 20px rgba(201,169,110,0.4)",transition:"opacity 0.2s"}}
                onTouchStart={e=>e.currentTarget.style.opacity="0.85"}
                onTouchEnd={e=>e.currentTarget.style.opacity="1"}>
                {lang==="fr"?"✦ Tourner la roue":"✦ Spin the wheel"}
              </button>
            </div>
          </div>
        </div>

        {/* footer links */}
        <div style={{marginTop:"auto",padding:"16px 20px 32px",display:"flex",gap:16,justifyContent:"center"}}>
          <button onClick={()=>navigate("/salons")} style={{...SS,fontSize:"11px",color:"#bbb",background:"none",border:"none",cursor:"pointer"}}>Salons</button>
          <span style={{color:"#ddd"}}>·</span>
          <button onClick={()=>navigate("/products")} style={{...SS,fontSize:"11px",color:"#bbb",background:"none",border:"none",cursor:"pointer"}}>Products</button>
          <span style={{color:"#ddd"}}>·</span>
          <button onClick={()=>navigate("/")} style={{...SS,fontSize:"11px",color:"#bbb",background:"none",border:"none",cursor:"pointer"}}>Home</button>
        </div>
      </div>
    </>
  );

  // ── SCREEN: PRODUCT INFO ──────────────────────────────────────────────────────
  if (screen==="product") return (
    <>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}html,body{background:#faf7f4}@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>
      <SpotNav/>
      <main style={{maxWidth:560,margin:"0 auto",padding:"24px 20px 80px",animation:"fadeUp 0.5s ease both"}}>
        {/* salon banner */}
        {salon&&<div onClick={()=>navigate("/salons")} style={{display:"flex",alignItems:"center",gap:12,background:"#fff",border:"1px solid #ede8e2",borderRadius:12,padding:"12px 16px",marginBottom:20,cursor:"pointer"}}>
          {salonImg&&<div style={{width:44,height:44,borderRadius:8,overflow:"hidden",flexShrink:0}}><img src={salonImg} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>}
          <div style={{flex:1,minWidth:0}}>
            <p style={{...SS,fontSize:"10px",color:"#c9a96e",letterSpacing:"2px",textTransform:"uppercase",fontWeight:700,margin:"0 0 2px"}}>✦ Discovery Spot · {salon.name}</p>
            <p style={{...SS,fontSize:"11px",color:"#aaa",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{salon.address}</p>
          </div>
          <span style={{color:"#ccc",fontSize:"16px"}}>›</span>
        </div>}

        {/* photo slider */}
        {allImgs.length>0&&<div style={{borderRadius:16,overflow:"hidden",marginBottom:20,background:"#f5f0eb",position:"relative"}}>
          <div style={{paddingBottom:"75%",position:"relative"}}>
            <img src={allImgs[imgIdx]} alt={product?.product_name} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"contain",background:"#f5f0eb"}}/>
          </div>
          {allImgs.length>1&&<>
            <button onClick={()=>setImgIdx(i=>(i-1+allImgs.length)%allImgs.length)} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",width:34,height:34,borderRadius:"50%",background:"rgba(255,255,255,0.9)",border:"none",cursor:"pointer",fontSize:"16px",display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
            <button onClick={()=>setImgIdx(i=>(i+1)%allImgs.length)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",width:34,height:34,borderRadius:"50%",background:"rgba(255,255,255,0.9)",border:"none",cursor:"pointer",fontSize:"16px",display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
            <div style={{position:"absolute",bottom:10,left:"50%",transform:"translateX(-50%)",display:"flex",gap:5}}>
              {allImgs.map((_,i)=><div key={i} onClick={()=>setImgIdx(i)} style={{width:i===imgIdx?18:6,height:6,borderRadius:3,background:i===imgIdx?"#1a1a1a":"rgba(0,0,0,0.25)",transition:"all 0.2s",cursor:"pointer"}}/>)}
            </div>
          </>}
        </div>}

        {/* product info */}
        {product&&<>
          <p style={{...SS,fontSize:"10px",color:"#c9a96e",letterSpacing:"2px",textTransform:"uppercase",fontWeight:700,margin:"0 0 4px"}}>{brandDisplay}</p>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(24px,5vw,34px)",fontWeight:400,color:"#1a1a1a",margin:"0 0 6px",lineHeight:1.2}}>{product.product_name}</h1>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            {product.category&&<span style={{...SS,fontSize:"12px",color:"#aaa"}}>{product.category}</span>}
            {product.price_customer&&<><span style={{color:"#ede8e2"}}>·</span><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"22px",color:"#1a1a1a",fontWeight:600}}>€{product.price_customer}</span></>}
          </div>
          {/* PURCHASE */}
          {product.purchase_url&&<a href={product.purchase_url} target="_blank" rel="noopener noreferrer"
            style={{display:"block",textAlign:"center",padding:"15px",background:"#0d0d0d",color:"#f5f0eb",textDecoration:"none",...SS,fontSize:"12px",fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",borderRadius:10,marginBottom:20}}>
            {lang==="fr"?"Acheter maintenant":"Buy now"} →
          </a>}
          {/* details */}
          {[{k:"description",l:"Description"},{k:"product_2usage",l:"Usage"},{k:"product_3texture",l:"Texture"},{k:"test_reason",l:"Who is it for?"},{k:"product_5function",l:"Function"},{k:"product_7key_ingredient",l:"Key ingredient"}].filter(d=>product[d.k]).length>0&&(
            <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
              {[{k:"description",l:"Description"},{k:"product_2usage",l:"Usage"},{k:"product_3texture",l:"Texture"},{k:"test_reason",l:"Who is it for?"},{k:"product_5function",l:"Function"},{k:"product_7key_ingredient",l:"Key ingredient"}].filter(d=>product[d.k]).map(({k,l})=>(
                <div key={k} style={{borderBottom:"1px solid #f0ebe5",paddingBottom:10}}>
                  <p style={{...SS,fontSize:"9px",color:"#c9a96e",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:700,margin:"0 0 3px"}}>{l}</p>
                  <p style={{...SS,fontSize:"13px",color:"#333",margin:0,lineHeight:1.6}}>{Array.isArray(product[k])?product[k].join(" · "):product[k]}</p>
                </div>
              ))}
            </div>
          )}
        </>}

        {/* CTA to lucky draw */}
        <button onClick={()=>setScreen("lucky")}
          style={{width:"100%",padding:"16px",background:"linear-gradient(135deg,#c9a96e,#b8944d)",color:"#0d0d0d",border:"none",cursor:"pointer",...SS,fontSize:"13px",fontWeight:700,letterSpacing:"1px",borderRadius:12,marginTop:8}}>
          🎁 Enter Lucky Draw
        </button>
      </main>
    </>
  );

  // ── SCREEN: LUCKY DRAW ────────────────────────────────────────────────────────
  if (screen==="lucky") return (
    <LuckyDrawScreen spot={spot} salon={salon} product={product} lang={lang} setLang={setLang} spotId={spotId} onBack={()=>setScreen("landing")} SS={SS} />
  );

  return null;
}

// ── LUCKY DRAW SCREEN ─────────────────────────────────────────────────────────
const PRIZE_TIERS = [
  { key:"d10",   code:"TBP10", requiresShipping:false, weight:35, label:{en:"10% discount code",fr:"Code de réduction 10%"} },
  { key:"d15",   code:"TBP15", requiresShipping:false, weight:25, label:{en:"15% discount code",fr:"Code de réduction 15%"} },
  { key:"d20",   code:"TBP20", requiresShipping:false, weight:15, label:{en:"20% discount code",fr:"Code de réduction 20%"} },
  { key:"sample",code:null,    requiresShipping:true,  weight:15, label:{en:"Mini sample gift",fr:"Échantillon offert"} },
  { key:"gift",  code:null,    requiresShipping:true,  weight:8,  label:{en:"K-Beauty gift set",fr:"Cadeau K-Beauty"} },
  { key:"grand", code:null,    requiresShipping:true,  weight:2,  label:{en:"Full-size K-Beauty set — Grand prize",fr:"Coffret K-Beauty taille normale — Grand prix"} },
];
const WHEEL_ANGLES = [30,90,150,210,270,330];
const WHEEL_COLORS = ["#c9a96e","#b8944d","#c9a96e","#b8944d","#c9a96e","#fb5607"];

function pickPrizeTier() {
  const total = PRIZE_TIERS.reduce((s,p)=>s+p.weight,0);
  let r = Math.random()*total;
  for (const p of PRIZE_TIERS) { if (r < p.weight) return p; r -= p.weight; }
  return PRIZE_TIERS[0];
}

function LuckyDrawScreen({ spot, salon, product, lang, setLang, spotId, onBack, SS }) {
  const navigate = useNavigate();
  const storageKey = `tbp_lucky_played_${spotId}`;
  const [step, setStep] = useState("info"); // info | already | wheel | shipping | success
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [prize, setPrize] = useState(null);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postal, setPostal] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // intercept browser/phone back button
  useEffect(() => {
    window.history.pushState({ luckyStep: step }, "");
    const handlePop = (e) => {
      if (step === "info") onBack();
      // wheel/shipping/success: let it go back normally
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [step]);

  const googleReviewUrl = salon?.google_review_url || salon?.google || salon?.google_maps_url;

  const checkAndProceed = async () => {
    if (!name.trim() || !phone.trim() || !email.trim()) {
      setError(lang==="fr"?"Merci de remplir tous les champs.":"Please fill in all fields.");
      return;
    }
    setChecking(true); setError("");
    try {
      if (localStorage.getItem(storageKey)) { setStep("already"); setChecking(false); return; }
      const formula = encodeURIComponent(`AND({spot_id}='${spotId}',{phone}='${phone.trim()}')`);
      const res = await fetch(`https://api.airtable.com/v0/${AT_BASE}/${TBL_LUCKY_DRAW}?filterByFormula=${formula}`, {
        headers: { Authorization: `Bearer ${AT_KEY}` }
      });
      const data = await res.json();
      if (data?.records?.length > 0) {
        localStorage.setItem(storageKey, "1");
        setStep("already");
      } else {
        setStep("wheel");
      }
    } catch(e) {
      console.error(e);
      setError(lang==="fr"?"Une erreur s'est produite. Réessayez.":"Something went wrong. Please try again.");
    }
    setChecking(false);
  };

  const submitEntry = async (chosenPrize, shipping) => {
    setSubmitting(true); setError("");
    try {
      const fields = {
        spot_id: spotId,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        status: "won",
        prize_tier: chosenPrize.label.en,
      };
      if (salon?.id) fields.salon = [salon.id];
      if (product?.product_name) fields.product_seen = product.product_name;
      if (chosenPrize.code) fields.discount_code_sent = chosenPrize.code;
      if (shipping) fields.shipping_address = `${shipping.address}, ${shipping.city} ${shipping.postal}`;
      const res = await fetch(`https://api.airtable.com/v0/${AT_BASE}/${TBL_LUCKY_DRAW}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${AT_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ records: [{ fields }] })
      });
      const data = await res.json();
      if (res.ok) { setStep("success"); }
      else { console.error("Lucky draw error:", data); setError(data?.error?.message || (lang==="fr"?"Une erreur s'est produite.":"Something went wrong.")); }
    } catch(e) { console.error(e); setError(e.message); }
    setSubmitting(false);
  };

  const spin = () => {
    if (spinning) return;
    setSpinning(true); setError("");
    const chosen = pickPrizeTier();
    const idx = PRIZE_TIERS.indexOf(chosen);
    const spins = 5 + Math.random()*2;
    const target = wheelRotation + 360*spins + (360 - WHEEL_ANGLES[idx]);
    setWheelRotation(target);
    setTimeout(() => {
      setPrize(chosen);
      localStorage.setItem(storageKey, "1");
      setSpinning(false);
      if (chosen.requiresShipping) setStep("shipping");
      else submitEntry(chosen);
    }, 4100);
  };

  const submitShipping = () => {
    if (!address.trim() || !city.trim() || !postal.trim()) {
      setError(lang==="fr"?"Merci de remplir l'adresse complète.":"Please fill in your full address.");
      return;
    }
    submitEntry(prize, { address: address.trim(), city: city.trim(), postal: postal.trim() });
  };

  const SpotNav = () => (
    <nav style={{background:"#0d0d0d",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",position:"sticky",top:0,zIndex:500}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",color:"#777",fontSize:"18px",padding:"4px 6px"}}>←</button>
        <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"15px",color:"#c9a96e",fontWeight:600,letterSpacing:"2px"}}>🎁 Lucky Draw</span>
      </div>
      <div style={{display:"flex",border:"1px solid #333",borderRadius:20,overflow:"hidden"}}>
        {["en","fr"].map(l=><button key={l} onClick={()=>setLang(l)} style={{padding:"4px 9px",border:"none",cursor:"pointer",...SS,fontSize:"11px",fontWeight:600,color:lang===l?"#0d0d0d":"#777",background:lang===l?"#c9a96e":"transparent",textTransform:"uppercase"}}>{l}</button>)}
      </div>
    </nav>
  );

  if (step==="success") return (
    <>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}html,body{background:#0d0d0d}`}</style>
      <SpotNav/>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"calc(100vh - 56px)",padding:"40px 24px",textAlign:"center"}}>
        <div style={{fontSize:"48px",marginBottom:16}}>🎉</div>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"32px",fontWeight:400,color:"#f5f0eb",marginBottom:12}}>
          {prize?.label?.[lang==="fr"?"fr":"en"]}
        </h2>
        {prize?.code ? (
          <div style={{display:"flex",alignItems:"center",gap:10,background:"#fff",border:"1px dashed #c9a96e",borderRadius:10,padding:"12px 20px",marginBottom:20}}>
            <span style={{...SS,fontSize:"20px",fontWeight:800,color:"#0d0d0d",letterSpacing:"1px"}}>{prize.code}</span>
            <button onClick={()=>navigator.clipboard?.writeText(prize.code)}
              style={{...SS,fontSize:"11px",fontWeight:700,color:"#fff",background:"#1a1a1a",border:"none",padding:"7px 14px",borderRadius:8,cursor:"pointer"}}>
              {lang==="fr"?"Copier":"Copy"}
            </button>
          </div>
        ) : (
          <p style={{...SS,fontSize:"14px",color:"#777",lineHeight:1.7,marginBottom:20,maxWidth:360}}>
            {lang==="fr"
              ? "Votre cadeau sera expédié à l'adresse indiquée. Confirmation par email."
              : "Your gift will be shipped to the address you provided. Confirmation by email."}
          </p>
        )}
        <p style={{...SS,fontSize:"13px",color:"#777",lineHeight:1.7,marginBottom:8,maxWidth:360}}>
          {lang==="fr"
            ? "Un email de confirmation vient de vous être envoyé."
            : "A confirmation email has just been sent to you."}
        </p>

        {googleReviewUrl&&<a href={googleReviewUrl} target="_blank" rel="noopener noreferrer"
          style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,width:"100%",maxWidth:360,padding:"14px",background:"rgba(201,169,110,0.1)",border:"1px solid rgba(201,169,110,0.3)",color:"#c9a96e",textDecoration:"none",borderRadius:12,margin:"20px 0",...SS,fontSize:"13px",fontWeight:600}}>
          ⭐ {lang==="fr"?"Laisser un avis pour plus de chances de gagner":"Leave a review for a bonus prize entry"}
        </a>}

        <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center",marginTop:8}}>
          <button onClick={()=>navigate("/")} style={{padding:"12px 24px",background:"#f5f0eb",color:"#0d0d0d",border:"none",cursor:"pointer",...SS,fontSize:"12px",fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase",borderRadius:10}}>
            {lang==="fr"?"Accueil":"Homepage"}
          </button>
          <button onClick={()=>navigate("/products")} style={{padding:"12px 24px",background:"transparent",color:"#c9a96e",border:"1px solid rgba(201,169,110,0.4)",cursor:"pointer",...SS,fontSize:"12px",fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase",borderRadius:10}}>
            {lang==="fr"?"Voir les produits":"Browse products"}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}html,body{background:#faf7f4}@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>
      <SpotNav/>
      <main style={{maxWidth:480,margin:"0 auto",padding:"28px 20px 80px",animation:"fadeUp 0.5s ease both"}}>

        {step==="info" && <>
          <div style={{textAlign:"center",marginBottom:24}}>
            <span style={{fontSize:"36px",display:"block",marginBottom:12}}>🎁</span>
            <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(26px,6vw,34px)",fontWeight:400,color:"#1a1a1a",margin:"0 0 8px",lineHeight:1.2}}>
              {lang==="fr"?"Tirage au sort":"Lucky Draw"}
            </h1>
            <p style={{...SS,fontSize:"13px",color:"#888",margin:0,lineHeight:1.6}}>
              {lang==="fr"?"Une seule participation par personne. Résultat immédiat !":"One entry per person. Instant result!"}
            </p>
          </div>

          <div style={{background:"#fff",border:"1px solid #ede8e2",borderRadius:16,padding:"20px",marginBottom:20}}>
            {[
              {label:lang==="fr"?"Prénom *":"First name *", val:name, set:setName, type:"text"},
              {label:lang==="fr"?"Téléphone *":"Phone *", val:phone, set:setPhone, type:"tel"},
              {label:"Email *", val:email, set:setEmail, type:"email"},
            ].map(({label,val,set,type})=>(
              <div key={label} style={{marginBottom:14}}>
                <label style={{...SS,fontSize:"10px",color:"#aaa",letterSpacing:"1.5px",textTransform:"uppercase",display:"block",marginBottom:5}}>{label}</label>
                <input type={type} value={val} onChange={e=>set(e.target.value)}
                  style={{width:"100%",padding:"12px 14px",border:"1px solid #ede8e2",background:"#fff",...SS,fontSize:"13px",color:"#1a1a1a",outline:"none",borderRadius:8,transition:"border 0.2s"}}
                  onFocus={e=>e.target.style.borderColor="#c9a96e"} onBlur={e=>e.target.style.borderColor="#ede8e2"}/>
              </div>
            ))}
            <p style={{...SS,fontSize:"11px",color:"#bbb",lineHeight:1.6,margin:0}}>
              {lang==="fr"
                ? "Le téléphone permet de vérifier qu'une seule participation est faite par personne."
                : "Your phone number is used to make sure each person only enters once."}
            </p>
          </div>

          {error&&<p style={{...SS,fontSize:"12px",color:"#fb5607",marginBottom:14}}>{error}</p>}

          <button onClick={checkAndProceed} disabled={checking}
            style={{width:"100%",padding:"16px",background:checking?"#ccc":"linear-gradient(135deg,#c9a96e,#b8944d)",color:"#0d0d0d",border:"none",cursor:checking?"not-allowed":"pointer",...SS,fontSize:"14px",fontWeight:700,borderRadius:12,boxShadow:"0 4px 16px rgba(201,169,110,0.35)"}}>
            {checking?(lang==="fr"?"Vérification…":"Checking…"):(lang==="fr"?"Tourner la roue →":"Spin the wheel →")}
          </button>
        </>}

        {step==="already" && <>
          <div style={{textAlign:"center",padding:"40px 0"}}>
            <span style={{fontSize:"36px",display:"block",marginBottom:16}}>🙌</span>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"24px",fontWeight:400,color:"#1a1a1a",margin:"0 0 10px"}}>
              {lang==="fr"?"Vous avez déjà participé":"You've already entered"}
            </h2>
            <p style={{...SS,fontSize:"13px",color:"#888",lineHeight:1.7,marginBottom:24,maxWidth:340,margin:"0 auto 24px"}}>
              {lang==="fr"
                ? "Une seule participation est possible par personne pour ce Lucky Draw. Merci de votre visite !"
                : "Only one entry is allowed per person for this Lucky Draw. Thanks for visiting!"}
            </p>
            <button onClick={()=>navigate("/")} style={{padding:"12px 24px",background:"#1a1a1a",color:"#f5f0eb",border:"none",cursor:"pointer",...SS,fontSize:"12px",fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase",borderRadius:10}}>
              {lang==="fr"?"Accueil":"Homepage"}
            </button>
          </div>
        </>}

        {step==="wheel" && <>
          <div style={{textAlign:"center",marginBottom:20}}>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"24px",fontWeight:400,color:"#1a1a1a",margin:"0 0 6px"}}>
              {lang==="fr"?"Tournez et découvrez votre lot":"Spin to reveal your prize"}
            </h2>
            <p style={{...SS,fontSize:"12px",color:"#aaa",margin:0}}>
              {lang==="fr"?"Vous gagnez à coup sûr":"You're guaranteed to win"}
            </p>
          </div>

          <div style={{display:"flex",justifyContent:"center",margin:"20px 0"}}>
            <div style={{position:"relative",width:240,height:240}}>
              <div style={{width:240,height:240,borderRadius:"50%",position:"relative",transition:"transform 4s cubic-bezier(0.12,0.85,0.15,1)",transform:`rotate(${wheelRotation}deg)`,
                background:`conic-gradient(${WHEEL_COLORS[0]} 0deg 60deg,${WHEEL_COLORS[1]} 60deg 120deg,${WHEEL_COLORS[2]} 120deg 180deg,${WHEEL_COLORS[3]} 180deg 240deg,${WHEEL_COLORS[4]} 240deg 300deg,${WHEEL_COLORS[5]} 300deg 360deg)`,
                border:"4px solid #1a1a1a",boxSizing:"border-box"}}>
                {PRIZE_TIERS.map((p,i)=>{
                  const short = {d10:"10%",d15:"15%",d20:"20%",sample:lang==="fr"?"Échant.":"Sample",gift:lang==="fr"?"Cadeau":"Gift",grand:lang==="fr"?"Grand prix":"Grand prize"}[p.key];
                  const deg = WHEEL_ANGLES[i];
                  return <span key={p.key} style={{position:"absolute",top:"50%",left:"50%",transformOrigin:"0 0",transform:`rotate(${deg}deg) translate(28px,-6px)`,fontSize:10,fontWeight:600,color:i===5?"#fff":"#0d0d0d",width:60,textAlign:"center"}}>{short}</span>;
                })}
              </div>
              <div style={{position:"absolute",top:-6,left:"50%",transform:"translateX(-50%)",width:0,height:0,borderLeft:"10px solid transparent",borderRight:"10px solid transparent",borderTop:"16px solid #fb5607",zIndex:5}}/>
              <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:40,height:40,borderRadius:"50%",background:"#0d0d0d",border:"3px solid #c9a96e",zIndex:4}}/>
            </div>
          </div>

          <button onClick={spin} disabled={spinning}
            style={{width:"100%",padding:"16px",background:spinning?"#ccc":"linear-gradient(135deg,#c9a96e,#b8944d)",color:"#0d0d0d",border:"none",cursor:spinning?"not-allowed":"pointer",...SS,fontSize:"14px",fontWeight:700,borderRadius:12,boxShadow:"0 4px 16px rgba(201,169,110,0.35)"}}>
            {spinning?(lang==="fr"?"En cours…":"Spinning…"):(lang==="fr"?"✦ Tourner":"✦ Spin now")}
          </button>
        </>}

        {step==="shipping" && <>
          <div style={{textAlign:"center",marginBottom:20}}>
            <span style={{fontSize:"36px",display:"block",marginBottom:10}}>🎉</span>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"24px",fontWeight:400,color:"#1a1a1a",margin:"0 0 6px"}}>
              {prize?.label?.[lang==="fr"?"fr":"en"]}
            </h2>
            <p style={{...SS,fontSize:"13px",color:"#888",margin:0}}>
              {lang==="fr"?"Indiquez l'adresse d'envoi de votre cadeau.":"Enter the address to ship your gift to."}
            </p>
          </div>

          <div style={{background:"#fff",border:"1px solid #ede8e2",borderRadius:16,padding:"20px",marginBottom:20}}>
            {[
              {label:lang==="fr"?"Adresse *":"Street address *", val:address, set:setAddress},
              {label:lang==="fr"?"Ville *":"City *", val:city, set:setCity},
              {label:lang==="fr"?"Code postal *":"Postal code *", val:postal, set:setPostal},
            ].map(({label,val,set})=>(
              <div key={label} style={{marginBottom:14}}>
                <label style={{...SS,fontSize:"10px",color:"#aaa",letterSpacing:"1.5px",textTransform:"uppercase",display:"block",marginBottom:5}}>{label}</label>
                <input type="text" value={val} onChange={e=>set(e.target.value)}
                  style={{width:"100%",padding:"12px 14px",border:"1px solid #ede8e2",background:"#fff",...SS,fontSize:"13px",color:"#1a1a1a",outline:"none",borderRadius:8,transition:"border 0.2s"}}
                  onFocus={e=>e.target.style.borderColor="#c9a96e"} onBlur={e=>e.target.style.borderColor="#ede8e2"}/>
              </div>
            ))}
          </div>

          {error&&<p style={{...SS,fontSize:"12px",color:"#fb5607",marginBottom:14}}>{error}</p>}

          <button onClick={submitShipping} disabled={submitting}
            style={{width:"100%",padding:"16px",background:submitting?"#ccc":"linear-gradient(135deg,#c9a96e,#b8944d)",color:"#0d0d0d",border:"none",cursor:submitting?"not-allowed":"pointer",...SS,fontSize:"14px",fontWeight:700,borderRadius:12,boxShadow:"0 4px 16px rgba(201,169,110,0.35)"}}>
            {submitting?(lang==="fr"?"Envoi…":"Submitting…"):(lang==="fr"?"Confirmer mon cadeau 🎁":"Confirm my gift 🎁")}
          </button>
        </>}
      </main>
    </>
  );
}


// ── PRIVACY PAGE ──────────────────────────────────────────────────────────────
function PrivacyPage({ lang, setLang }) {
  const navigate = useNavigate();
  const SS = {fontFamily:"'DM Sans',sans-serif"};
  const sections = [
    {
      title: lang==="fr" ? "1. Responsable du traitement" : "1. Data Controller",
      body: `Gentle Riches\n29 rue Blanche, 75009 Paris, France\nSIREN: 920437399 | TVA: FR17920437399\nEmail: hello@thebeautypause.com`
    },
    {
      title: lang==="fr" ? "2. Données collectées" : "2. Data We Collect",
      body: lang==="fr"
        ? "Nous collectons les données suivantes :\n• Prénom et adresse email (lors de la création de compte)\n• Nom, email et numéro de téléphone (lors d'une participation au Lucky Draw)\n• Capture d'écran d'un avis Google (lors d'une participation au Lucky Draw)\n• Préférences de salons et produits (favoris)"
        : "We collect the following data:\n• First name and email address (when creating an account)\n• Name, email and phone number (when entering a Lucky Draw)\n• Screenshot of a Google review (when entering a Lucky Draw)\n• Salon and product preferences (favourites)"
    },
    {
      title: lang==="fr" ? "3. Finalités du traitement" : "3. Purpose of Processing",
      body: lang==="fr"
        ? "Vos données sont utilisées pour :\n• Gérer votre compte utilisateur\n• Organiser les tirages au sort Lucky Draw\n• Vous contacter en cas de gain\n• Améliorer nos services"
        : "Your data is used to:\n• Manage your user account\n• Organise Lucky Draw prize draws\n• Contact you if you win\n• Improve our services"
    },
    {
      title: lang==="fr" ? "4. Base légale" : "4. Legal Basis",
      body: lang==="fr"
        ? "Le traitement est fondé sur :\n• Votre consentement (participation au Lucky Draw)\n• L'exécution d'un contrat (gestion de compte)\n• Notre intérêt légitime (amélioration des services)"
        : "Processing is based on:\n• Your consent (Lucky Draw participation)\n• Contract performance (account management)\n• Our legitimate interest (service improvement)"
    },
    {
      title: lang==="fr" ? "5. Conservation des données" : "5. Data Retention",
      body: lang==="fr"
        ? "Vos données sont conservées pendant 3 ans à compter de votre dernière activité, puis supprimées automatiquement."
        : "Your data is retained for 3 years from your last activity, then automatically deleted."
    },
    {
      title: lang==="fr" ? "6. Vos droits (RGPD)" : "6. Your Rights (GDPR)",
      body: lang==="fr"
        ? "Conformément au RGPD, vous disposez des droits suivants :\n• Droit d'accès à vos données\n• Droit de rectification\n• Droit à l'effacement (« droit à l'oubli »)\n• Droit à la portabilité\n• Droit d'opposition\n\nPour exercer vos droits, contactez-nous à : hello@thebeautypause.com"
        : "Under GDPR, you have the following rights:\n• Right of access to your data\n• Right to rectification\n• Right to erasure (\"right to be forgotten\")\n• Right to data portability\n• Right to object\n\nTo exercise your rights, contact us at: hello@thebeautypause.com"
    },
    {
      title: lang==="fr" ? "7. Cookies" : "7. Cookies",
      body: lang==="fr"
        ? "Ce site utilise uniquement des cookies techniques nécessaires au fonctionnement du service (authentification). Aucun cookie publicitaire ou de tracking tiers n'est utilisé."
        : "This site only uses technical cookies necessary for the service to function (authentication). No advertising or third-party tracking cookies are used."
    },
    {
      title: lang==="fr" ? "8. Contact" : "8. Contact",
      body: "hello@thebeautypause.com"
    }
  ];

  return (
    <>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}html,body{background:#faf7f4}`}</style>
      <nav style={{background:"#0d0d0d",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",position:"sticky",top:0,zIndex:500}}>
        <button onClick={()=>navigate("/")} style={{background:"none",border:"none",cursor:"pointer"}}>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"15px",color:"#f5f0eb",letterSpacing:"2px",fontWeight:300}}>THE </span>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"15px",color:"#c9a96e",letterSpacing:"2px",fontWeight:600}}>BEAUTY PAUSE</span>
        </button>
        <div style={{display:"flex",border:"1px solid #333",borderRadius:20,overflow:"hidden"}}>
          {["en","fr"].map(l=><button key={l} onClick={()=>setLang(l)} style={{padding:"4px 9px",border:"none",cursor:"pointer",...SS,fontSize:"11px",fontWeight:600,color:lang===l?"#0d0d0d":"#777",background:lang===l?"#c9a96e":"transparent",textTransform:"uppercase"}}>{l}</button>)}
        </div>
      </nav>
      <main style={{maxWidth:720,margin:"0 auto",padding:"40px 24px 80px"}}>
        <p style={{...SS,fontSize:"10px",color:"#c9a96e",letterSpacing:"3px",textTransform:"uppercase",marginBottom:8}}>✦ Legal</p>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(28px,5vw,40px)",fontWeight:300,color:"#1a1a1a",marginBottom:8}}>
          {lang==="fr" ? "Politique de confidentialité" : "Privacy Policy"}
        </h1>
        <p style={{...SS,fontSize:"12px",color:"#aaa",marginBottom:40}}>
          {lang==="fr" ? "Dernière mise à jour : juin 2025" : "Last updated: June 2025"}
        </p>
        {sections.map(({title,body},i)=>(
          <div key={i} style={{marginBottom:32,paddingBottom:32,borderBottom:"1px solid #ede8e2"}}>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",fontWeight:600,color:"#1a1a1a",marginBottom:10}}>{title}</h2>
            <p style={{...SS,fontSize:"13px",color:"#555",lineHeight:1.8,whiteSpace:"pre-line"}}>{body}</p>
          </div>
        ))}
        <button onClick={()=>navigate("/")} style={{...SS,fontSize:"12px",color:"#c9a96e",background:"none",border:"1px solid #e8d9b8",cursor:"pointer",padding:"10px 20px",borderRadius:20,marginTop:8}}>
          ← {lang==="fr"?"Retour à l'accueil":"Back to home"}
        </button>
      </main>
    </>
  );
}

// ── LEGAL MENTIONS PAGE ────────────────────────────────────────────────────────
function LegalPage({ lang, setLang }) {
  const navigate = useNavigate();
  const SS = {fontFamily:"'DM Sans',sans-serif"};
  return (
    <>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}html,body{background:#faf7f4}`}</style>
      <nav style={{background:"#0d0d0d",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",position:"sticky",top:0,zIndex:500}}>
        <button onClick={()=>navigate("/")} style={{background:"none",border:"none",cursor:"pointer"}}>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"15px",color:"#f5f0eb",letterSpacing:"2px",fontWeight:300}}>THE </span>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"15px",color:"#c9a96e",letterSpacing:"2px",fontWeight:600}}>BEAUTY PAUSE</span>
        </button>
        <div style={{display:"flex",border:"1px solid #333",borderRadius:20,overflow:"hidden"}}>
          {["en","fr"].map(l=><button key={l} onClick={()=>setLang(l)} style={{padding:"4px 9px",border:"none",cursor:"pointer",...SS,fontSize:"11px",fontWeight:600,color:lang===l?"#0d0d0d":"#777",background:lang===l?"#c9a96e":"transparent",textTransform:"uppercase"}}>{l}</button>)}
        </div>
      </nav>
      <main style={{maxWidth:720,margin:"0 auto",padding:"40px 24px 80px"}}>
        <p style={{...SS,fontSize:"10px",color:"#c9a96e",letterSpacing:"3px",textTransform:"uppercase",marginBottom:8}}>✦ Legal</p>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(28px,5vw,40px)",fontWeight:300,color:"#1a1a1a",marginBottom:40}}>
          {lang==="fr" ? "Mentions légales" : "Legal Notice"}
        </h1>
        {[
          {title: lang==="fr"?"Éditeur du site":"Site Publisher", body:"Gentle Riches\n29 rue Blanche, 75009 Paris, France\nSIREN: 920437399\nTVA intracommunautaire: FR17920437399\nEmail: hello@thebeautypause.com"},
          {title: lang==="fr"?"Directeur de la publication":"Publication Director", body:"Gentle Riches"},
          {title: lang==="fr"?"Hébergement":"Hosting", body:"Vercel Inc.\n340 Pine Street, Suite 701\nSan Francisco, CA 94104, USA\nhttps://vercel.com"},
          {title: lang==="fr"?"Propriété intellectuelle":"Intellectual Property", body: lang==="fr"
            ?"L'ensemble des contenus présents sur le site thebeautypause.com (textes, images, logos) sont la propriété exclusive de Gentle Riches et sont protégés par les lois françaises et internationales relatives à la propriété intellectuelle."
            :"All content on thebeautypause.com (texts, images, logos) is the exclusive property of Gentle Riches and is protected by French and international intellectual property laws."},
          {title:"Contact", body:"hello@thebeautypause.com"},
        ].map(({title,body},i)=>(
          <div key={i} style={{marginBottom:32,paddingBottom:32,borderBottom:"1px solid #ede8e2"}}>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",fontWeight:600,color:"#1a1a1a",marginBottom:10}}>{title}</h2>
            <p style={{...SS,fontSize:"13px",color:"#555",lineHeight:1.8,whiteSpace:"pre-line"}}>{body}</p>
          </div>
        ))}
        <button onClick={()=>navigate("/")} style={{...SS,fontSize:"12px",color:"#c9a96e",background:"none",border:"1px solid #e8d9b8",cursor:"pointer",padding:"10px 20px",borderRadius:20,marginTop:8}}>
          ← {lang==="fr"?"Retour à l'accueil":"Back to home"}
        </button>
      </main>
    </>
  );
}



// ── FOR BRANDS PAGE ───────────────────────────────────────────────────────────
function ForBrandsPage() {
  const navigate = useNavigate();
  const KR = {fontFamily:"'Noto Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif"};
  const SS = {fontFamily:"'DM Sans',sans-serif"};
  const CG = {fontFamily:"'Cormorant Garamond',serif"};
  const [showTop, setShowTop] = useState(false);

  useEffect(()=>{
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const CityRotator = () => {
    const cities = ["런던","피렌체","마드리드","파리"];
    const [idx, setIdx] = useState(0);
    const [done, setDone] = useState(false);
    const ref = useRef(null);
    const [started, setStarted] = useState(false);
    useEffect(() => {
      const obs = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !started) {
          setStarted(true);
          let i = 0;
          const interval = setInterval(() => {
            i++;
            if (i >= cities.length) {
              clearInterval(interval);
              setIdx(cities.length - 1);
              setDone(true);
            } else {
              setIdx(i);
            }
          }, 220);
        }
      }, { threshold: 0.3 });
      if (ref.current) obs.observe(ref.current);
      return () => obs.disconnect();
    }, [started]);
    return <span ref={ref} style={{animation:done?"flicker 2.4s ease-in-out infinite":"none"}}>{cities[idx]}</span>;
  };

  const CountUp = ({ target, suffix="", duration=1400 }) => {
    const [val, setVal] = useState(0);
    const [done, setDone] = useState(false);
    const ref = useRef(null);
    const [started, setStarted] = useState(false);
    useEffect(() => {
      const obs = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !started) {
          setStarted(true);
          const startTime = Date.now();
          const tick = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setVal(Math.round(target * eased));
            if (progress < 1) requestAnimationFrame(tick);
            else setDone(true);
          };
          requestAnimationFrame(tick);
        }
      }, { threshold: 0.3 });
      if (ref.current) obs.observe(ref.current);
      return () => obs.disconnect();
    }, [started]);
    return <span ref={ref} style={{animation:done?"flicker 2.4s ease-in-out infinite":"none"}}>{val}{suffix}</span>;
  };

  const StaticFlicker = ({ children }) => {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
      const obs = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) setVisible(true);
      }, { threshold: 0.3 });
      if (ref.current) obs.observe(ref.current);
      return () => obs.disconnect();
    }, []);
    return <span ref={ref} style={{animation:visible?"flicker 2.4s ease-in-out infinite":"none"}}>{children}</span>;
  };

  const BrandsNav = () => (
    <nav style={{background:"#0d0d0d",height:60,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 clamp(20px,5vw,64px)",position:"sticky",top:0,zIndex:500,borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
      <button onClick={()=>{navigate("/");window.scrollTo(0,0);}} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
        <span style={{...CG,fontSize:"15px",color:"#f5f0eb",letterSpacing:"2px",fontWeight:300}}>THE</span>
        <span style={{...CG,fontSize:"15px",color:"#c9a96e",letterSpacing:"2px",fontWeight:600,marginLeft:5}}>BEAUTY PAUSE</span>
      </button>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <button onClick={()=>{navigate("/newsletter");window.scrollTo(0,0);}}
          style={{...SS,fontSize:"13px",color:"rgba(255,255,255,0.6)",background:"none",border:"1px solid rgba(255,255,255,0.15)",padding:"8px 18px",borderRadius:24,cursor:"pointer",fontWeight:600}}>
          운영현황
        </button>
        <a href="mailto:hello@thebeautypause.com"
          style={{...SS,fontSize:"13px",color:"#c9a96e",border:"1px solid rgba(201,169,110,0.5)",padding:"8px 20px",borderRadius:24,textDecoration:"none",fontWeight:600}}>
          브랜드 등록하기
        </a>
      </div>
    </nav>
  );

  const Badge = ({children}) => (
    <span style={{...SS,fontSize:"10px",color:"#c9a96e",letterSpacing:"2.5px",textTransform:"uppercase",fontWeight:600,display:"inline-block",marginBottom:16}}>{children}</span>
  );
  const Divider = () => <div style={{width:36,height:2,background:"#c9a96e",margin:"12px 0 28px"}}/>;
  const Tag = ({children}) => (
    <span style={{...KR,fontSize:"13px",color:"#c9a96e",background:"rgba(201,169,110,0.1)",border:"1px solid rgba(201,169,110,0.25)",padding:"6px 16px",borderRadius:20,display:"inline-block",margin:"4px"}}>{children}</span>
  );
  const CheckItem = ({children, light}) => (
    <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:10}}>
      <span style={{color:"#c9a96e",flexShrink:0,marginTop:2}}>✓</span>
      <p style={{...KR,fontSize:"14px",color:light?"rgba(255,255,255,0.6)":"#555",margin:0,lineHeight:1.6}}>{children}</p>
    </div>
  );
  const ProgramItem = ({children, accent}) => (
    <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
      <span style={{color:accent||"#c9a96e",fontSize:"12px",flexShrink:0}}>✓</span>
      <p style={{...KR,fontSize:"14px",color:"rgba(255,255,255,0.55)",margin:0}}>{children}</p>
    </div>
  );

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}html,body{background:#0d0d0d}@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}@keyframes flicker{0%,100%{opacity:1}50%{opacity:0.7}}`}</style>
      <BrandsNav/>

      {/* HERO */}
      <section style={{background:"#0d0d0d",padding:"96px clamp(24px,6vw,80px) 88px",animation:"fadeUp 0.5s ease both"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <Badge>✦ For Brands</Badge>
          <h1 style={{...KR,fontSize:"clamp(28px,5vw,52px)",fontWeight:700,color:"#f5f0eb",lineHeight:1.25,margin:"0 0 28px"}}>
            파리에서 브랜드가<br/>발견되는 기회를 만드세요.
          </h1>
          <p style={{...KR,fontSize:"16px",color:"rgba(255,255,255,0.5)",lineHeight:1.9,maxWidth:580,margin:"0 0 44px"}}>The Beauty Pause는 파리의 뷰티 살롱 네트워크를 통해<br/>브랜드가 고객과 자연스럽게 만날 수 있는 오프라인 경험을 만들고 운영합니다.</p>
          <a href="mailto:hello@thebeautypause.com"
            style={{display:"inline-flex",alignItems:"center",gap:10,padding:"15px 32px",background:"linear-gradient(135deg,#c9a96e,#b8944d)",color:"#0d0d0d",...KR,fontSize:"15px",fontWeight:700,borderRadius:12,textDecoration:"none",boxShadow:"0 6px 24px rgba(201,169,110,0.3)"}}>
            브랜드 등록하기 →
          </a>
        </div>
      </section>

      {/* EXPERIENCE DESIGN */}
      <section style={{background:"#fff",padding:"56px clamp(24px,6vw,80px)",borderBottom:"1px solid #ede8e2"}}>
        <div style={{maxWidth:700,margin:"0 auto",textAlign:"center"}}>
          <Badge>✦ Experience Design</Badge>
          <h2 style={{...KR,fontSize:"clamp(18px,2.5vw,24px)",fontWeight:700,color:"#1a1a1a",lineHeight:1.5,margin:"8px 0 16px"}}>
            좋은 브랜드도 고객을 만날 기회가 필요합니다.
          </h2>
          <p style={{...KR,fontSize:"clamp(14px,2vw,16px)",color:"#666",lineHeight:1.9,margin:"0 0 10px"}}>
            온라인 광고만으로는 브랜드를 경험할 수 없습니다.
          </p>
          <p style={{...KR,fontSize:"clamp(14px,2vw,16px)",color:"#1a1a1a",fontWeight:600,lineHeight:1.9,margin:"0 0 32px"}}>
            <span style={{color:"#c9a96e"}}>The Beauty Pause</span>는 고객이 머무는 뷰티 살롱에서<br/>브랜드를 자연스럽게 발견하고 경험할 수 있는 환경을 만듭니다.
          </p>

          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,flexWrap:"wrap"}}>
            {["브랜드","살롱 네트워크","⭐ 고객 경험 ⭐","브랜드 발견","다음 기회"].map((step,i,arr)=>{
              const emphasized = i===2;
              return (
                <Fragment key={step}>
                  <span style={{...KR,fontSize:13,fontWeight:emphasized?700:500,color:emphasized?"#0d0d0d":"#555",background:emphasized?"#c9a96e":"#faf7f4",border:emphasized?"none":"1px solid #ede8e2",padding:"8px 14px",borderRadius:20,whiteSpace:"nowrap"}}>{step}</span>
                  {i<arr.length-1&&<span style={{color:"#c9a96e",fontSize:14}}>→</span>}
                </Fragment>
              );
            })}
          </div>
        </div>
      </section>

      {/* CUSTOMER EXPERIENCE */}
      <section style={{background:"#faf7f4",padding:"80px clamp(24px,6vw,80px)"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <Badge>✦ Customer Experience</Badge>
          <Divider/>
          <h2 style={{...KR,fontSize:"clamp(20px,3vw,32px)",fontWeight:700,color:"#1a1a1a",margin:"0 0 20px"}}>고객 경험은 다양한 방식으로 만들어집니다.</h2>
          <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:32}}>
            {["살롱 서비스 프로그램","QR 콘텐츠 및 이벤트","테스터 운영"].map(tag=>(
              <span key={tag} style={{...KR,fontSize:13,fontWeight:600,color:"#a07832",background:"#fff",border:"1px solid #e8d9b8",padding:"9px 16px",borderRadius:20}}>{tag}</span>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {/* big left — 1:1 */}
            <div style={{borderRadius:14,overflow:"hidden",aspectRatio:"1",background:"#ddd",pointerEvents:"none",userSelect:"none"}}>
              <img src="/images/aurabeaute04.jpeg" alt="salon" draggable="false" style={{width:"100%",height:"100%",objectFit:"cover",display:"block",pointerEvents:"none"}}/>
            </div>
            {/* right 2x2 — each 1:1, total same height as left */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gridTemplateRows:"1fr 1fr",gap:8}}>
              {["/images/IMG_0189.jpeg","/images/IMG20260529105931.jpg","/images/IMG_0175.jpeg","/images/IMG_0183.jpeg"].map((src,i)=>(
                <div key={i} style={{borderRadius:10,overflow:"hidden",aspectRatio:"1",background:"#ddd",pointerEvents:"none",userSelect:"none"}}>
                  <img src={src} alt="salon" draggable="false" style={{width:"100%",height:"100%",objectFit:"cover",display:"block",pointerEvents:"none"}}/>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section style={{background:"#fff",padding:"80px clamp(24px,6vw,80px)"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <Badge>✦ How It Works</Badge>
          <Divider/>
          <h2 style={{...KR,fontSize:"clamp(20px,2.5vw,28px)",fontWeight:700,color:"#1a1a1a",margin:"0 0 40px"}}>어떻게 운영되나요?</h2>
          <div style={{display:"flex",flexDirection:"column",gap:0}}>
            {[
              {n:"01",t:"브랜드 경험을 설계합니다.",d1:"브랜드 목적에 맞춰 제품 운영, 프로그램, QR, 콘텐츠 등",d2:"적합한 고객 경험을 함께 설계합니다."},
              {n:"02",t:"파리 살롱에서 운영합니다.",d1:"브랜드는 파트너 뷰티 살롱에서 고객과 자연스럽게 만납니다.",d2:"The Beauty Pause가 살롱 매칭과 현장 운영을 관리합니다."},
              {n:"03",t:"고객이 브랜드를 경험합니다.",d1:"고객은 서비스를 이용하며 브랜드를 자연스럽게 발견하고,",d2:"제품 체험과 QR 콘텐츠를 통해 브랜드를 알아갑니다."},
              {n:"04",t:"다음 기회로 이어집니다.",d1:"고객 경험은 판매, 유통, 광고, 콘텐츠 등",d2:"브랜드의 다음 전략으로 이어질 수 있습니다."},
            ].map(({n,t,d1,d2},i)=>(
              <div key={n} style={{display:"grid",gridTemplateColumns:"80px 1fr",gap:"0 24px",padding:"32px 0",borderTop:`2px solid ${i===0?"#c9a96e":"#ede8e2"}`}}>
                <p style={{...CG,fontSize:"40px",color:"rgba(201,169,110,0.25)",fontWeight:300,lineHeight:1,paddingTop:4}}>{n}</p>
                <div>
                  <p style={{...KR,fontSize:"16px",fontWeight:700,color:"#1a1a1a",margin:"0 0 8px"}}>{t}</p>
                  <p style={{...KR,fontSize:"14px",color:"#444",lineHeight:1.8,margin:"0 0 6px"}}>{d1}</p>
                  <p style={{...KR,fontSize:"14px",color:"#888",lineHeight:1.8,margin:0}}>{d2}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:40,borderRadius:16,overflow:"hidden"}}>
            <img src="/images/how-it-works-illustration.png" alt="Salon discovery illustration" draggable="false" style={{width:"100%",height:"auto",display:"block",pointerEvents:"none",userSelect:"none"}}/>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section style={{background:"#faf7f4",padding:"80px clamp(24px,6vw,80px)"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <Badge>✦ Benefits</Badge>
          <Divider/>
          <h2 style={{...KR,fontSize:"clamp(20px,2.5vw,28px)",fontWeight:700,color:"#1a1a1a",margin:"0 0 36px"}}>파리에서 시작되는 브랜드 경험</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16,marginBottom:48}}>
            {[
              {t:"① 프랑스 소비자의 첫 브랜드 경험",d:"온라인이 아닌 실제 살롱에서 고객이 브랜드를 경험합니다."},
              {t:"② 현지 고객 반응 확인",d:"어떤 고객이 관심을 보이는지 직접 확인할 수 있습니다."},
              {t:"③ 유럽 마케팅 자산 확보",d:"사진·영상·콘텐츠를 이후 해외 마케팅에도 활용할 수 있습니다."},
              {t:"④ 다음 확장을 위한 첫 레퍼런스",d:"살롱 협업 사례를 기반으로 다른 파트너와의 확장을 준비합니다."},
            ].map(({t,d})=>(
              <div key={t} style={{background:"#fff",borderRadius:16,padding:"20px 18px",border:"1px solid #e8e0d8"}}>
                <div style={{width:24,height:2,background:"#c9a96e",marginBottom:12}}/>
                <p style={{...KR,fontSize:"13px",fontWeight:700,color:"#1a1a1a",margin:"0 0 8px",lineHeight:1.4}}>{t}</p>
                <p style={{...KR,fontSize:"12px",color:"#777",lineHeight:1.6,margin:0}}>{d}</p>
              </div>
            ))}
          </div>

          <p style={{...KR,fontSize:"15px",color:"#777",margin:"0 0 16px",lineHeight:1.8}}>The Beauty Pause는 특히 아래와 같은 브랜드와 잘 맞습니다.</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
            {["스킨케어","헤어케어","바디케어","웰니스 뷰티","신생 뷰티 브랜드","유럽 고객과 만나고 싶은 브랜드","오프라인 접점을 만들고 싶은 브랜드"].map(t=><Tag key={t}>{t}</Tag>)}
          </div>
        </div>
      </section>

      {/* NETWORK */}
      <section style={{background:"#fff",padding:"80px clamp(24px,6vw,80px)"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <Badge>✦ Network</Badge>
          <Divider/>
          <h2 style={{...KR,fontSize:"clamp(20px,2.5vw,28px)",fontWeight:700,color:"#1a1a1a",margin:"0 0 16px",lineHeight:1.4}}>살롱 네트워크</h2>
          <p style={{...KR,fontSize:"15px",color:"#666",lineHeight:1.9,margin:"0 0 36px",maxWidth:560}}>
            네일, 헤어, 마사지 살롱을 중심으로 뷰티 네트워크를 운영하고 있으며, 네트워크는 지속적으로 확장되고 있습니다.
          </p>

          {/* operating metrics */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:16,marginBottom:36}}>
            <div style={{background:"#faf7f4",border:"1px solid #e8e0d8",borderRadius:14,padding:"20px 18px"}}>
              <p style={{...KR,fontSize:"28px",color:"#c9a96e",fontWeight:700,margin:"0 0 4px",lineHeight:1}}><CityRotator/></p>
              <p style={{...KR,fontSize:"12px",color:"#999",margin:0}}>운영 도시</p>
            </div>
            <div style={{background:"#faf7f4",border:"1px solid #e8e0d8",borderRadius:14,padding:"20px 18px"}}>
              <p style={{...KR,fontSize:"28px",color:"#c9a96e",fontWeight:700,margin:"0 0 4px",lineHeight:1}}><CountUp target={21} suffix="개+"/></p>
              <p style={{...KR,fontSize:"12px",color:"#999",margin:0}}>참여 살롱</p>
            </div>
            <div style={{background:"#faf7f4",border:"1px solid #e8e0d8",borderRadius:14,padding:"20px 18px"}}>
              <p style={{...KR,fontSize:"28px",color:"#c9a96e",fontWeight:700,margin:"0 0 4px",lineHeight:1}}><StaticFlicker>3종</StaticFlicker></p>
              <p style={{...KR,fontSize:"12px",color:"#999",margin:0}}>운영 카테고리</p>
              <p style={{...KR,fontSize:"10px",color:"#bbb",margin:"4px 0 0"}}>네일 · 헤어 · 마사지</p>
            </div>
            <div style={{background:"#faf7f4",border:"1px solid #e8e0d8",borderRadius:14,padding:"20px 18px"}}>
              <p style={{...KR,fontSize:"28px",color:"#c9a96e",fontWeight:700,margin:"0 0 4px",lineHeight:1}}><CountUp target={20} suffix="가지+"/></p>
              <p style={{...KR,fontSize:"12px",color:"#999",margin:0}}>비치 완료 제품</p>
            </div>
          </div>

          {/* live network CTA */}
          <a href="https://thebeautypause.com" target="_blank" rel="noopener noreferrer"
            style={{display:"inline-flex",alignItems:"center",gap:8,...KR,fontSize:"14px",color:"#1a1a1a",textDecoration:"none",fontWeight:600,border:"1px solid #e8d9b8",padding:"11px 22px",borderRadius:10,transition:"all 0.2s"}}
            onMouseEnter={e=>{e.currentTarget.style.background="#fdf8ee"}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent"}}>
            실제 운영 살롱 보기 →
          </a>
        </div>
      </section>

      {/* WAYS TO JOIN */}
      <section style={{background:"#0d0d0d",padding:"80px clamp(24px,6vw,80px)"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <Badge>✦ Ways to Join</Badge>
          <Divider/>
          <h2 style={{...KR,fontSize:"clamp(20px,2.5vw,28px)",fontWeight:700,color:"#f5f0eb",margin:"0 0 48px"}}>브랜드 참여 방법</h2>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:24,alignItems:"start",marginBottom:36}}>

            {/* Launch Partner */}
            <div style={{background:"rgba(201,169,110,0.06)",borderRadius:20,padding:"36px 32px",border:"1px solid rgba(201,169,110,0.25)"}}>
              <p style={{...SS,fontSize:"10px",color:"#c9a96e",letterSpacing:"2px",textTransform:"uppercase",fontWeight:700,margin:"0 0 10px"}}>✦ Launch Partner</p>
              <p style={{...KR,fontSize:"20px",color:"#f5f0eb",fontWeight:700,margin:"0 0 8px"}}>런칭 파트너</p>
              <p style={{...KR,fontSize:"13px",color:"rgba(255,255,255,0.4)",lineHeight:1.6,margin:"0 0 24px"}}>브랜드를 파리에서 공식 런칭합니다.</p>

              <div style={{background:"rgba(201,169,110,0.08)",border:"1px solid rgba(201,169,110,0.2)",borderRadius:12,padding:"16px 18px",marginBottom:24}}>
                <p style={{...KR,fontSize:"13px",color:"#c9a96e",fontWeight:700,margin:"0 0 10px",textAlign:"center",letterSpacing:"1px"}}>
                  ✦ PARIS LAUNCH WEEK ✦
                </p>
                <p style={{...SS,fontSize:"12px",color:"#c9a96e",fontWeight:600,margin:0,textAlign:"center",letterSpacing:"0.3px"}}>
                  10 Beauty Salons · 2 Weeks · QR Experience · Event
                </p>
              </div>

              <p style={{...KR,fontSize:"11px",color:"rgba(255,255,255,0.35)",letterSpacing:"1px",textTransform:"uppercase",fontWeight:700,margin:"0 0 12px"}}>운영 내용</p>
              <div style={{display:"flex",flexDirection:"column",gap:0,marginBottom:10}}>
                {["파트너 살롱 제품 운영","브랜드 카드 및 QR 운영","TBP 웹사이트 등록","TBP 공식 SNS 소개"].map(i=>(
                  <div key={i} style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{color:"#c9a96e",fontSize:"12px",flexShrink:0}}>✓</span>
                    <p style={{...KR,fontSize:"13px",color:"rgba(255,255,255,0.55)",margin:"6px 0"}}>{i}</p>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:0,marginBottom:24}}>
                {["파리 런칭 캠페인 운영","브랜드 콘텐츠 제작","기사용 콘텐츠 제작"].map(i=>(
                  <div key={i} style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{color:"#c9a96e",fontSize:"12px",flexShrink:0}}>✓</span>
                    <p style={{...KR,fontSize:"13px",color:"rgba(255,255,255,0.55)",margin:"6px 0"}}>{i}</p>
                  </div>
                ))}
              </div>

              <p style={{...KR,fontSize:"11px",color:"rgba(255,255,255,0.35)",letterSpacing:"1px",textTransform:"uppercase",fontWeight:700,margin:"0 0 12px"}}>브랜드가 얻는 것</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(78px,1fr))",gap:8,marginBottom:24}}>
                {[
                  {icon:"🔗",label:"파리 런칭 페이지"},
                  {icon:"📢",label:"TBP SNS 홍보"},
                  {icon:"🏅",label:"파트너 브랜드 배지"},
                  {icon:"📸",label:"파리 런칭 사진"},
                  {icon:"🎬",label:"릴스 영상 제작"},
                  {icon:"📰",label:"기사 작성 자료"},
                  {icon:"🎖️",label:"파리 런칭 배지"},
                ].map(({icon,label})=>(
                  <div key={label} style={{background:"linear-gradient(160deg,rgba(201,169,110,0.12),rgba(255,255,255,0.02))",border:"1px solid rgba(201,169,110,0.3)",borderRadius:12,padding:"10px 6px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:5,minHeight:78}}>
                    <span style={{fontSize:20,lineHeight:1}}>{icon}</span>
                    <p style={{...KR,fontSize:9,color:"rgba(255,255,255,0.65)",lineHeight:1.35,margin:0}}>{label}</p>
                  </div>
                ))}
              </div>

              <div style={{borderTop:"1px solid rgba(255,255,255,0.07)",paddingTop:24}}>
                <p style={{...KR,fontSize:"15px",color:"rgba(255,255,255,0.35)",margin:"0 0 4px",textDecoration:"line-through"}}>1,790,000원</p>
                <p style={{...KR,fontSize:"28px",color:"#f5f0eb",margin:"0 0 8px",fontWeight:700}}>790,000원</p>
                <p style={{...KR,fontSize:"12px",color:"#c9a96e",fontWeight:600,lineHeight:1.6,margin:0}}>초기 파트너 한정 참가비<br/>(10개 브랜드 이후 종료 예정)</p>
              </div>
            </div>

            {/* Seeding Partner */}
            <div style={{background:"rgba(255,255,255,0.03)",borderRadius:20,padding:"36px 32px",border:"1px solid rgba(255,255,255,0.08)"}}>
              <p style={{...SS,fontSize:"10px",color:"rgba(255,255,255,0.4)",letterSpacing:"2px",textTransform:"uppercase",fontWeight:700,margin:"0 0 10px"}}>✦ Seeding Partner</p>
              <p style={{...KR,fontSize:"20px",color:"#f5f0eb",fontWeight:700,margin:"0 0 8px"}}>시딩 파트너</p>
              <p style={{...KR,fontSize:"13px",color:"rgba(255,255,255,0.4)",lineHeight:1.6,margin:"0 0 24px"}}>제품을 먼저 파리 시장에 소개해봅니다.</p>

              <p style={{...KR,fontSize:"11px",color:"rgba(255,255,255,0.35)",letterSpacing:"1px",textTransform:"uppercase",fontWeight:700,margin:"0 0 12px"}}>운영 내용</p>
              <div style={{display:"flex",flexDirection:"column",gap:0,marginBottom:24}}>
                {["파트너 살롱 제품 운영","브랜드 카드 및 QR 운영","TBP 웹사이트 등록","TBP 공식 SNS 소개"].map(i=>(
                  <div key={i} style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{color:"rgba(255,255,255,0.4)",fontSize:"12px",flexShrink:0}}>✓</span>
                    <p style={{...KR,fontSize:"13px",color:"rgba(255,255,255,0.5)",margin:"6px 0"}}>{i}</p>
                  </div>
                ))}
              </div>

              <p style={{...KR,fontSize:"11px",color:"rgba(255,255,255,0.35)",letterSpacing:"1px",textTransform:"uppercase",fontWeight:700,margin:"0 0 12px"}}>브랜드가 얻는 것</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(78px,1fr))",gap:8,marginBottom:24}}>
                {[
                  {icon:"🔗",label:"파리 런칭 페이지"},
                  {icon:"📢",label:"TBP SNS 홍보"},
                  {icon:"🏅",label:"파트너 브랜드 배지"},
                ].map(({icon,label})=>(
                  <div key={label} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:12,padding:"10px 6px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:5,minHeight:78}}>
                    <span style={{fontSize:20,lineHeight:1}}>{icon}</span>
                    <p style={{...KR,fontSize:9,color:"rgba(255,255,255,0.55)",lineHeight:1.35,margin:0}}>{label}</p>
                  </div>
                ))}
              </div>

              <div style={{borderTop:"1px solid rgba(255,255,255,0.07)",paddingTop:24}}>
                <p style={{...KR,fontSize:"15px",color:"rgba(255,255,255,0.35)",margin:"0 0 4px",textDecoration:"line-through"}}>99,000원</p>
                <p style={{...KR,fontSize:"28px",color:"#f5f0eb",margin:"0 0 8px",fontWeight:700}}>무료</p>
                <p style={{...KR,fontSize:"13px",color:"rgba(255,255,255,0.5)",lineHeight:1.6,margin:0}}>얼리 파트너 혜택<br/>(7월 20일까지 신청 브랜드)</p>
              </div>
            </div>
          </div>

          <div style={{textAlign:"center"}}>
            <a href="mailto:hello@thebeautypause.com"
              style={{display:"inline-flex",alignItems:"center",gap:8,padding:"14px 32px",background:"linear-gradient(135deg,#c9a96e,#b8944d)",color:"#0d0d0d",...KR,fontSize:"13px",fontWeight:700,borderRadius:10,textDecoration:"none"}}>
              파트너 참여 문의하기 →
            </a>
          </div>

        </div>
      </section>

      {/* PRICING */}
      <section style={{background:"#0d0d0d",padding:"0 clamp(24px,6vw,80px) 80px"}}>
        <div style={{maxWidth:760,margin:"0 auto"}}>

          <p style={{...SS,fontSize:"10px",color:"#c9a96e",letterSpacing:"2px",textTransform:"uppercase",fontWeight:700,margin:"0 0 10px"}}>Optional Add-ons</p>
          <p style={{...KR,fontSize:"20px",color:"#f5f0eb",fontWeight:700,margin:"0 0 8px"}}>선택 옵션</p>
          <p style={{...KR,fontSize:"14px",color:"rgba(255,255,255,0.4)",lineHeight:1.7,margin:"0 0 28px"}}>필요에 따라 추가할 수 있는 선택 서비스입니다.</p>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:28}}>
            {[
              {n:"①",t:"살롱 콜라보 캠페인",d:"브랜드와 파트너 살롱이 함께하는 협업 캠페인을 기획하고 운영합니다.",label:"예시",items:["Korean Hair Care Month","Hand Care Week","Seasonal Campaign"]},
              {n:"②",t:"확장 운영",d:"더 많은 제품과 더 많은 파트너 살롱으로 운영 규모를 확장합니다.",items:["제품 수량 확대","참여 살롱 확대","운영 기간 확대"]},
              {n:"③",t:"현지 구매 구조",d:"파리 현지에서 제품을 구매할 수 있는 환경을 구축합니다.",items:["현지 보관","배송 대행","위탁 판매 운영"]},
            ].map(({n,t,d,label,items})=>(
              <div key={t} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"18px 16px"}}>
                <p style={{...CG,fontSize:"18px",color:"#c9a96e",fontWeight:600,margin:"0 0 6px"}}>{n}</p>
                <p style={{...KR,fontSize:"13px",fontWeight:700,color:"#f5f0eb",margin:"0 0 8px"}}>{t}</p>
                <p style={{...KR,fontSize:"11px",color:"rgba(255,255,255,0.5)",lineHeight:1.7,margin:"0 0 12px"}}>{d}</p>
                {label&&<p style={{...KR,fontSize:"9px",color:"rgba(255,255,255,0.3)",letterSpacing:"1px",margin:"0 0 6px"}}>{label}</p>}
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  {items.map(it=>(
                    <div key={it} style={{display:"flex",gap:6,alignItems:"flex-start"}}>
                      <span style={{color:"#c9a96e",fontSize:"10px",flexShrink:0,marginTop:2}}>·</span>
                      <p style={{...KR,fontSize:"11px",color:"rgba(255,255,255,0.5)",lineHeight:1.6,margin:0}}>{it}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{marginBottom:24}}>
            <a href="mailto:hello@thebeautypause.com"
              style={{display:"inline-flex",alignItems:"center",gap:8,padding:"12px 24px",background:"transparent",color:"#c9a96e",border:"1px solid rgba(201,169,110,0.4)",...KR,fontSize:"13px",fontWeight:700,borderRadius:10,textDecoration:"none"}}>
              선택 옵션 문의하기 →
            </a>
          </div>

          <p style={{...KR,fontSize:"12px",color:"rgba(255,255,255,0.3)",lineHeight:1.8,margin:0}}>
            ※ TBP는 프로그램 운영 이후, 브랜드와의 협업을 지속적으로 검토합니다. 운영 결과와 시장 상황에 따라 추가적인 협업이나 유통 기회가 논의될 수 있습니다.
          </p>

        </div>
      </section>

      {/* PURCHASE OPTIONS */}
      <section style={{background:"#faf7f4",padding:"80px clamp(24px,6vw,80px)"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <Badge>✦ Purchase Options</Badge>
          <Divider/>
          <h2 style={{...KR,fontSize:"clamp(20px,2.5vw,28px)",fontWeight:700,color:"#1a1a1a",margin:"0 0 16px"}}>브랜드에 맞는 판매 방식을 선택할 수 있습니다.</h2>
          <p style={{...KR,fontSize:"15px",color:"#666",lineHeight:1.8,margin:"0 0 40px",maxWidth:600}}>
            The Beauty Pause는 브랜드의 운영 방식에 맞춰 다양한 판매 구조를 제공합니다.
          </p>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16}}>
            {[
              {
                n:"Option 1", t:"브랜드 자사몰 연결",
                flow:"QR → 브랜드 자사몰 → 한국 발송",
                items:["가장 가볍게 시작","브랜드가 주문 및 배송 관리","초기 테스트에 적합"],
                tag:null
              },
              {
                n:"Option 2", t:"현지 발송 대행",
                flow:"QR → 브랜드 자사몰 → TBP 프랑스 발송",
                items:["결제는 브랜드 자사몰","소량 재고를 프랑스에 보관","빠른 배송 가능"],
                tag:null
              },
              {
                n:"Option 3", t:"The Beauty Pause Shop",
                flow:"QR → TBP Shop → TBP 현지 운영",
                items:["TBP에서 주문·결제·현지 발송","브랜드는 위탁 방식으로 제품 공급","판매된 수량 기준 정산"],
                tag:"Coming Soon"
              },
            ].map(({n,t,flow,items,tag})=>(
              <div key={n} style={{background:"#fff",border:"1px solid #e8e0d8",borderRadius:16,padding:"26px 22px",position:"relative"}}>
                {tag&&<span style={{position:"absolute",top:18,right:18,...SS,fontSize:"9px",color:"#fb5607",border:"1px solid rgba(251,86,7,0.3)",padding:"3px 9px",borderRadius:12,fontWeight:700,letterSpacing:"0.5px"}}>{tag}</span>}
                <p style={{...SS,fontSize:"10px",color:"#c9a96e",letterSpacing:"2px",textTransform:"uppercase",fontWeight:700,margin:"0 0 6px"}}>{n}</p>
                <p style={{...KR,fontSize:"17px",fontWeight:700,color:"#1a1a1a",margin:"0 0 14px"}}>{t}</p>
                <div style={{background:"#faf7f4",border:"1px solid #ede8e2",borderRadius:10,padding:"10px 12px",marginBottom:18}}>
                  <p style={{...SS,fontSize:"11px",color:"#888",margin:0,lineHeight:1.6,fontFamily:"monospace,'DM Sans',sans-serif"}}>{flow}</p>
                </div>
                <div>
                  {items.map(i=>(
                    <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:8}}>
                      <span style={{color:"#c9a96e",fontSize:"11px",flexShrink:0,marginTop:2}}>✓</span>
                      <p style={{...KR,fontSize:"13px",color:"#666",lineHeight:1.6,margin:0}}>{i}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOUNDING BRAND PROGRAM */}
      <section style={{background:"#fff",padding:"80px clamp(24px,6vw,80px)"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <Badge>✦ Founding Brand</Badge>
          <Divider/>
          <h2 style={{...KR,fontSize:"clamp(20px,2.5vw,28px)",fontWeight:700,color:"#1a1a1a",margin:"0 0 20px"}}>파리 네트워크의 초기 파트너 브랜드</h2>
          <p style={{...KR,fontSize:"15px",color:"#555",lineHeight:1.9,margin:"0 0 8px",maxWidth:600}}>
            The Beauty Pause와 함께 파리의 오프라인 뷰티 네트워크를 만들어갈 브랜드를 모집합니다.
          </p>
          <p style={{...KR,fontSize:"14px",color:"#777",lineHeight:1.9,margin:"0 0 36px",maxWidth:600}}>
            초기 파트너 브랜드는 네트워크 성장과 함께 다양한 우선 참여 혜택을 제공합니다.
          </p>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:20,marginBottom:32}}>
            {[
              {n:"①",t:"초기 파트너 가격",d:"현재 적용되는 초기 파트너 가격으로 참여할 수 있으며, 향후 가격이 변경되어도 기존 조건이 유지됩니다."},
              {n:"②",t:"우선 참여 혜택",d:"신규 살롱, 도시 확장, 신규 프로그램 운영 시 우선 참여 기회가 제공됩니다."},
              {n:"③",t:"초기 파트너 자격",d:"초기 파트너 배지가 부여되며, 향후 추가되는 브랜드 콘텐츠, 프로그램 및 신규 기능에 우선 참여할 수 있습니다."},
              {n:"④",t:"네트워크 성장 혜택",d:"네트워크가 확장될수록 더 많은 살롱과 고객 접점이 만들어지며, 초기 파트너는 그 혜택을 가장 먼저 누릴 수 있습니다."},
            ].map(({n,t,d})=>(
              <div key={t} style={{background:"#faf7f4",border:"1px solid #e8e0d8",borderRadius:16,padding:"24px 22px"}}>
                <p style={{...CG,fontSize:"22px",color:"#c9a96e",fontWeight:600,margin:"0 0 10px"}}>{n}</p>
                <p style={{...KR,fontSize:"14px",fontWeight:700,color:"#1a1a1a",margin:"0 0 8px"}}>{t}</p>
                <p style={{...KR,fontSize:"12px",color:"#777",lineHeight:1.7,margin:0}}>{d}</p>
              </div>
            ))}
          </div>

          <p style={{...KR,fontSize:"13px",color:"#999",fontStyle:"italic",margin:0}}>
            ※ 초기 파트너 브랜드 모집은 선착순 10개 브랜드로 마감됩니다.
          </p>
        </div>
      </section>

      {/* WHY TBP */}
      <section style={{background:"#faf7f4",padding:"80px clamp(24px,6vw,80px)"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <Badge>✦ Why The Beauty Pause</Badge>
          <Divider/>
          <h2 style={{...KR,fontSize:"clamp(20px,2.5vw,28px)",fontWeight:700,color:"#1a1a1a",margin:"0 0 24px"}}>왜 뷰티 살롱인가요?</h2>
          <p style={{...KR,fontSize:"15px",color:"#555",lineHeight:1.9,margin:"0 0 20px",maxWidth:600}}>
            뷰티 고객은 살롱에서 수십 분에서 수 시간까지 머무르며, 새로운 제품과 뷰티 정보를 접하기에 가장 적합한 환경에 있습니다.
          </p>
          <p style={{...KR,fontSize:"15px",color:"#555",lineHeight:1.9,margin:"0 0 40px",maxWidth:600}}>
            <span style={{color:"#c9a96e",fontWeight:600}}>The Beauty Pause</span>는 고객을 새로운 공간으로 데려오는 것이 아니라, 고객이 이미 머무는 공간에서 브랜드를 자연스럽게 발견하도록 만듭니다.
          </p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:16}}>
            {[
              {n:"01",t:"파리에서 브랜드를 소개합니다",d:"온라인이 아닌, 파리의 실제 뷰티 살롱에서 브랜드를 소개하며 오프라인 접점을 만듭니다."},
              {n:"02",t:"적은 물량으로 시작할 수 있습니다",d:"대량 수출이나 유통 계약 없이도 파리에서 브랜드를 소개할 수 있습니다."},
              {n:"03",t:"현지 운영 부담 없이 진행합니다",d:"The Beauty Pause가 파트너 살롱을 직접 방문하며 제품 관리와 현장 운영을 담당합니다."},
              {n:"04",t:"해외 마케팅으로 이어집니다",d:"브랜드의 파리 활동을 사진과 영상으로 기록하여 해외 마케팅 콘텐츠로 활용할 수 있습니다."},
            ].map(({n,t,d})=>(
              <div key={n} style={{background:"#fff",border:"1px solid #e8e0d8",borderRadius:16,padding:"28px 24px"}}>
                <p style={{...CG,fontSize:"32px",color:"rgba(201,169,110,0.3)",fontWeight:300,margin:"0 0 14px",lineHeight:1}}>{n}</p>
                <p style={{...KR,fontSize:"15px",fontWeight:700,color:"#1a1a1a",margin:"0 0 10px",lineHeight:1.5}}>{t}</p>
                <p style={{...KR,fontSize:"13px",color:"#666",lineHeight:1.8,margin:0}}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{background:"#0d0d0d",padding:"88px clamp(24px,6vw,80px)",textAlign:"center"}}>
        <div style={{maxWidth:560,margin:"0 auto"}}>
          <Badge>✦ Contact</Badge>
          <h2 style={{...KR,fontSize:"clamp(22px,3.5vw,36px)",fontWeight:700,color:"#f5f0eb",margin:"16px 0 16px",lineHeight:1.4}}>
            프랑스 살롱 네트워크를 통해<br/>브랜드를 소개하고 싶으신가요?
          </h2>
          <p style={{...SS,fontSize:"15px",color:"rgba(255,255,255,0.3)",margin:"0 0 36px"}}>hello@thebeautypause.com</p>
          <a href="mailto:hello@thebeautypause.com"
            style={{display:"inline-flex",alignItems:"center",gap:10,padding:"16px 40px",background:"linear-gradient(135deg,#c9a96e,#b8944d)",color:"#0d0d0d",...KR,fontSize:"15px",fontWeight:700,borderRadius:12,textDecoration:"none",boxShadow:"0 6px 24px rgba(201,169,110,0.35)"}}>
            브랜드 등록하기 →
          </a>
        </div>
      </section>

      {/* SCROLL TO TOP */}
      {showTop&&(
        <button onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}
          style={{position:"fixed",bottom:28,right:20,width:44,height:44,borderRadius:"50%",background:"#c9a96e",color:"#0d0d0d",border:"none",cursor:"pointer",fontSize:"18px",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px rgba(0,0,0,0.3)",zIndex:999}}>
          ↑
        </button>
      )}

      {/* FOOTER */}
      <footer style={{background:"#0d0d0d",padding:"32px clamp(20px,5vw,64px)",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16,marginBottom:20}}>
          <div>
            <div style={{marginBottom:4}}>
              <span style={{...CG,fontSize:"15px",color:"#f5f0eb",letterSpacing:"2px",fontWeight:300}}>THE</span>
              <span style={{...CG,fontSize:"15px",color:"#c9a96e",letterSpacing:"2px",fontWeight:600,marginLeft:5}}>BEAUTY PAUSE</span>
            </div>
            <p style={{...SS,fontSize:"10px",color:"#333",margin:0}}>© 2025 The Beauty Pause</p>
          </div>
          <a href="mailto:hello@thebeautypause.com"
            style={{...SS,fontSize:"11px",color:"#444",textDecoration:"none"}}
            onMouseEnter={e=>e.currentTarget.style.color="#c9a96e"}
            onMouseLeave={e=>e.currentTarget.style.color="#444"}>
            Contact
          </a>
        </div>
        <div style={{borderTop:"1px solid rgba(255,255,255,0.05)",paddingTop:16}}>
          <p style={{...SS,fontSize:"10px",color:"#444",lineHeight:1.8,margin:0}}>
            주식회사 쏜다 · 대표자 박슬아 · 서울 강남구 테헤란로82길 15 (대치동, 디아이타워)<br/>
            사업자등록번호 426-88-02305 · 통신판매업신고번호 2025-서울강남-00594<br/>
            hello@thebeautypause.com
          </p>
        </div>
      </footer>
    </>
  );
}

// ── FOR PARTNERS PAGE (institutional / agencies) ─────────────────────────────
function ForPartnersPage() {
  const navigate = useNavigate();
  const KR = {fontFamily:"'Noto Sans KR','Apple SD Gothic Neo',sans-serif"};
  const SS = {fontFamily:"'DM Sans',sans-serif"};
  const CG = {fontFamily:"'Cormorant Garamond',serif"};
  const [showTop, setShowTop] = useState(false);
  useEffect(()=>{
    const fn = () => setShowTop(window.scrollY > 600);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const Badge = ({children}) => <span style={{...SS,fontSize:"10px",color:"#c9a96e",letterSpacing:"2.5px",textTransform:"uppercase",fontWeight:600,display:"inline-block",marginBottom:16}}>{children}</span>;
  const Divider = () => <div style={{width:36,height:2,background:"#c9a96e",margin:"12px 0 28px"}}/>;
  const Tag = ({children}) => <span style={{...KR,fontSize:"13px",color:"#c9a96e",background:"rgba(201,169,110,0.08)",border:"1px solid rgba(201,169,110,0.25)",padding:"6px 16px",borderRadius:20,display:"inline-block",margin:4}}>{children}</span>;
  const CheckItem = ({children,dark}) => (
    <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:4}}>
      <span style={{color:"#c9a96e",flexShrink:0,marginTop:1}}>✓</span>
      <p style={{...KR,fontSize:"14px",color:dark?"rgba(255,255,255,0.6)":"#555",lineHeight:1.6,margin:0}}>{children}</p>
    </div>
  );

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}html,body{background:#0d0d0d}@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}`}</style>

      {/* NAV */}
      <nav style={{background:"#0d0d0d",height:60,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 clamp(20px,5vw,64px)",position:"sticky",top:0,zIndex:500,borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
        <button onClick={()=>{navigate("/");window.scrollTo(0,0);}} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
          <span style={{...CG,fontSize:"15px",color:"#f5f0eb",letterSpacing:"2px",fontWeight:300}}>THE</span>
          <span style={{...CG,fontSize:"15px",color:"#c9a96e",letterSpacing:"2px",fontWeight:600,marginLeft:5}}>BEAUTY PAUSE</span>
        </button>
        <a href="mailto:hello@thebeautypause.com" style={{...SS,fontSize:"13px",color:"#c9a96e",border:"1px solid rgba(201,169,110,0.5)",padding:"8px 20px",borderRadius:24,textDecoration:"none",fontWeight:600}}>문의하기</a>
      </nav>

      {/* HERO */}
      <section style={{background:"#0d0d0d",padding:"96px clamp(24px,6vw,80px) 64px",animation:"fadeUp 0.5s ease both"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <Badge>✦ For Institutions &amp; Agencies</Badge>
          <h1 style={{...KR,fontSize:"clamp(28px,5vw,48px)",fontWeight:700,color:"#f5f0eb",lineHeight:1.3,margin:"0 0 24px"}}>
            파리 런칭 위크<br/><span style={{fontSize:"0.55em",color:"rgba(245,240,235,0.5)",fontWeight:400,display:"block",marginTop:8}}>한국 뷰티 브랜드의 파리 오프라인 런칭 프로그램</span>
          </h1>
          <p style={{...KR,fontSize:"16px",color:"rgba(255,255,255,0.5)",lineHeight:1.9,maxWidth:580}}>더뷰티퍼즈(The Beauty Pause)는 파리의 실제 뷰티 살롱 네트워크를 통해 한국 뷰티 브랜드가 유럽 소비자와 만날 수 있는 오프라인 런칭 프로그램을 운영합니다.</p>
        </div>
      </section>

      {/* HERO IMAGES */}
      <section style={{background:"#0d0d0d",padding:"0 clamp(24px,6vw,80px) 64px"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div style={{borderRadius:14,overflow:"hidden",aspectRatio:"1",background:"#ddd",pointerEvents:"none",userSelect:"none"}}>
              <img src="/images/aurabeaute04.jpeg" alt="salon" draggable="false" style={{width:"100%",height:"100%",objectFit:"cover",display:"block",pointerEvents:"none"}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gridTemplateRows:"1fr 1fr",gap:8}}>
              {["/images/IMG_0189.jpeg","/images/IMG20260529105931.jpg","/images/IMG_0175.jpeg","/images/IMG_0183.jpeg"].map((src,i)=>(
                <div key={i} style={{borderRadius:10,overflow:"hidden",aspectRatio:"1",background:"#ddd",pointerEvents:"none",userSelect:"none"}}>
                  <img src={src} alt="salon" draggable="false" style={{width:"100%",height:"100%",objectFit:"cover",display:"block",pointerEvents:"none"}}/>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PARIS LAUNCH WEEK — light */}
      <section style={{background:"#fff",padding:"80px clamp(24px,6vw,80px)"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <Badge>✦ Paris Launch Week</Badge>
          <Divider/>
          <h2 style={{...KR,fontSize:"clamp(20px,2.5vw,28px)",fontWeight:700,color:"#1a1a1a",margin:"0 0 12px",lineHeight:1.4}}>파리에서 시작하는 브랜드 런칭 캠페인</h2>
          <p style={{...KR,fontSize:"14px",color:"#666",lineHeight:1.9,margin:"0 0 10px",maxWidth:600}}>선정된 브랜드는 2주 동안 파리의 참여 뷰티 살롱 10곳에서 동시에 소개됩니다.</p>
          <p style={{...KR,fontSize:"14px",color:"#666",lineHeight:1.9,margin:"0 0 32px",maxWidth:600}}>고객은 제품을 발견하고 QR을 통해 브랜드 정보를 확인하거나 이벤트에 참여하고, 브랜드의 구매 페이지까지 이동할 수 있습니다.</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12}}>
            {[{i:"🏠",t:"살롱 10곳"},{i:"📅",t:"2주간 운영"},{i:"🎁",t:"고객 참여 이벤트"},{i:"📸",t:"SNS 콘텐츠"},{i:"🛍",t:"구매 연결"}].map(({i,t})=>(
              <div key={t} style={{border:"1px solid #e8e0d8",borderRadius:12,padding:"18px 14px",textAlign:"center",background:"#f8f5f0"}}>
                <p style={{fontSize:20,margin:"0 0 8px"}}>{i}</p>
                <p style={{...KR,fontSize:"12px",fontWeight:600,color:"#1a1a1a",margin:0}}>{t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — mid */}
      <section style={{background:"#faf7f4",padding:"80px clamp(24px,6vw,80px)"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <Badge>✦ How It Works</Badge>
          <Divider/>
          <h2 style={{...KR,fontSize:"clamp(20px,2.5vw,28px)",fontWeight:700,color:"#1a1a1a",margin:"0 0 8px",lineHeight:1.4}}>브랜드는 이렇게 유럽에서 소개됩니다.</h2>
          <p style={{...KR,fontSize:"13px",color:"#999",margin:"8px 0 36px"}}>계약은 한국에서, 운영은 프랑스 법인이 직접 담당합니다.</p>
          <div style={{overflowX:"auto",paddingBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:0,minWidth:"max-content"}}>
              {[
                {l:"한국 브랜드",s:"",flag:"🇰🇷"},
                {l:"한국 법인 계약",s:"더뷰티퍼즈 한국",flag:""},
                {l:"제품 발송",s:"",flag:""},
                {l:"프랑스 법인 운영",s:"더뷰티퍼즈 프랑스",flag:"🇫🇷"},
                {l:"파리 살롱",s:"네트워크",accent:true},
                {l:"유럽 고객",s:""},
                {l:"QR",s:"이벤트/구매"},
                {l:"리포트",s:""},
              ].map(({l,s,flag,accent},i,arr)=>(
                <Fragment key={l}>
                  <div style={{
                    background: accent?"rgba(201,169,110,0.15)":(i>=3?"#fff8ee":"#fff"),
                    border: accent?"2px solid #c9a96e":(i>=3?"1px solid rgba(201,169,110,0.35)":"1px solid #e8e0d8"),
                    borderRadius:12,padding:"12px 16px",textAlign:"center",
                    ...KR,fontSize:12,fontWeight:700,color:"#1a1a1a",
                    display:"flex",flexDirection:"column",alignItems:"center",gap:3,minWidth:96,
                    boxShadow: i>=3?"0 2px 8px rgba(201,169,110,0.08)":"none"
                  }}>
                    {flag&&<span style={{fontSize:14}}>{flag}</span>}
                    <span>{l}</span>
                    {s&&<small style={{fontSize:9,fontWeight:400,color: i>=3?"#b8924a":"#999"}}>{s}</small>}
                  </div>
                  {i<arr.length-1&&(
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"0 2px"}}>
                      {i===2&&<div style={{width:1,height:10,background:"#ccc"}}/>}
                      <span style={{color:i>=2?"#c9a96e":"#ccc",fontSize:14,fontWeight:i>=2?700:400,padding:"0 2px"}}>→</span>
                      {i===2&&<div style={{width:1,height:10,background:"#ccc"}}/>}
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHAT WE DO — dark */}
      <section style={{background:"#0d0d0d",padding:"80px clamp(24px,6vw,80px)"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <Badge>✦ What We Do</Badge>
          <Divider/>
          <h2 style={{...KR,fontSize:"clamp(20px,2.5vw,28px)",fontWeight:700,color:"#f5f0eb",margin:"0 0 8px",lineHeight:1.4}}>The Beauty Pause가 현지 운영을 담당합니다.</h2>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 24px",marginTop:28}}>
            {["한국 법인 계약","CPNP 지원 및 라벨링 지원 필요 시","현지 수령 관리","파리 살롱 매칭","제품 설치 및 관리","QR 페이지 제작 및 연결","고객 참여 이벤트 운영","현장 콘텐츠 제작","운영 결과 정리 및 공유"].map(t=><CheckItem key={t} dark>{t}</CheckItem>)}
          </div>
        </div>
      </section>

      {/* BRAND DELIVERABLES — light */}
      <section style={{background:"#fff",padding:"80px clamp(24px,6vw,80px)"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <Badge>✦ Brand Deliverables</Badge>
          <Divider/>
          <h2 style={{...KR,fontSize:"clamp(20px,2.5vw,28px)",fontWeight:700,color:"#1a1a1a",margin:"0 0 8px",lineHeight:1.4}}>프로그램 운영 결과를 제공합니다.</h2>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 24px",marginTop:28}}>
            {["제품이 소개된 살롱 정보","현장 설치 사진","현장 콘텐츠 사진·영상","QR 방문 현황","고객 참여 현황","운영 결과 요약"].map(t=><CheckItem key={t}>{t}</CheckItem>)}
          </div>
        </div>
      </section>

      {/* WHY 더뷰티퍼즈 — dark */}
      <section style={{background:"#faf7f4",padding:"80px clamp(24px,6vw,80px)"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <Badge>✦ Why 더뷰티퍼즈</Badge>
          <Divider/>
          <h2 style={{...KR,fontSize:"clamp(20px,2.5vw,28px)",fontWeight:700,color:"#1a1a1a",margin:"0 0 28px",lineHeight:1.4}}>왜 더뷰티퍼즈여야 하나</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12}}>
            {[
              {i:"🇰🇷",t:"한국 계약 가능",d:"한국 법인으로 계약 진행 — 해외 법인 설립 없이 바로 시작"},
              {i:"📍",t:"프랑스 현지 직접 운영",d:"파리에 기반한 팀이 살롱 입점부터 현장 관리까지 직접 담당"},
              {i:"💄",t:"파리 살롱 네트워크 보유",d:"파리 전역 뷰티 살롱과의 신뢰 관계 — 즉시 입점 가능"},
              {i:"📊",t:"데이터 기반 결과 리포트",d:"QR 스캔, 구매 연결 현황을 수치로 정리해서 제공"},
            ].map(({i,t,d})=>(
              <div key={t} style={{background:"#fff",border:"1px solid #e8e0d8",borderRadius:12,padding:20}}>
                <p style={{fontSize:18,marginBottom:10}}>{i}</p>
                <p style={{...KR,fontSize:13,color:"#666",lineHeight:1.6,margin:0}}><strong style={{color:"#1a1a1a",fontWeight:700,display:"block",marginBottom:4}}>{t}</strong>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FLEXIBLE — dark */}
      <section style={{background:"#0d0d0d",padding:"80px clamp(24px,6vw,80px)"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <Badge>✦ Flexible Program</Badge>
          <Divider/>
          <h2 style={{...KR,fontSize:"clamp(20px,2.5vw,28px)",fontWeight:700,color:"#f5f0eb",margin:"0 0 8px",lineHeight:1.4}}>기관 사업 목적에 맞게 프로그램을 조정할 수 있습니다.</h2>
          <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:20}}>
            {["참여 브랜드 수","운영 기간","살롱 수","이벤트 방식","콘텐츠 제작","결과 리포트"].map(t=><Tag key={t}>{t}</Tag>)}
          </div>
        </div>
      </section>

      {/* WHY THIS MODEL — light */}
      <section style={{background:"#fff",padding:"80px clamp(24px,6vw,80px)"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <Badge>✦ Why This Model</Badge>
          <Divider/>
          <h2 style={{...KR,fontSize:"clamp(20px,2.5vw,28px)",fontWeight:700,color:"#1a1a1a",margin:"0 0 32px",lineHeight:1.4}}>기존 방식과 다른 점</h2>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div style={{background:"#faf7f4",border:"1px solid #e8e0d8",borderRadius:16,padding:"28px 24px"}}>
              <p style={{...SS,fontSize:"10px",color:"#999",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:700,margin:"0 0 16px"}}>기존 해외진출</p>
              {[["✕","박람회 — 행사 후 연결 끊김"],["✕","유통사 계약 — 높은 진입장벽"],["✕","바이어 미팅 — 결과 불명확"],["✕","리테일 입점 — 긴 준비 기간"]].map(([ic,t])=>(
                <div key={t} style={{display:"flex",gap:8,...KR,fontSize:14,color:"#666",marginBottom:10,lineHeight:1.5}}>
                  <span style={{color:"#ccc",flexShrink:0}}>{ic}</span>{t}
                </div>
              ))}
            </div>
            <div style={{background:"#111",border:"1px solid rgba(201,169,110,0.2)",borderRadius:16,padding:"28px 24px"}}>
              <p style={{...SS,fontSize:"10px",color:"#c9a96e",letterSpacing:"1.5px",textTransform:"uppercase",fontWeight:700,margin:"0 0 16px"}}>더뷰티퍼즈</p>
              {[["✓","파리 살롱에서 실제 소비자 직접 노출"],["✓","QR로 브랜드 정보 및 구매 연결"],["✓","유통·리테일 이전 단계에서 반응 확인"],["✓","운영 결과 리포트 제공"]].map(([ic,t])=>(
                <div key={t} style={{display:"flex",gap:8,...KR,fontSize:14,color:"rgba(255,255,255,0.75)",marginBottom:10,lineHeight:1.5}}>
                  <span style={{color:"#c9a96e",flexShrink:0}}>{ic}</span>{t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHY WE DO THIS — mid */}
      <section style={{background:"#faf7f4",padding:"88px clamp(24px,6vw,80px)"}}>
        <div style={{maxWidth:680,margin:"0 auto",textAlign:"center"}}>
          <Badge>✦ Why We Do This</Badge>
          <h2 style={{...KR,fontSize:"clamp(20px,3vw,28px)",fontWeight:700,color:"#1a1a1a",margin:"16px 0 24px",lineHeight:1.5}}>해외 진출의 새로운 실행 방식을 제안합니다.</h2>
          <p style={{...KR,fontSize:15,color:"#666",lineHeight:2,margin:"0 0 16px"}}>The Beauty Pause는 파리 현지에서 직접 운영하는 뷰티 살롱 네트워크를 기반으로 한국 브랜드가 유럽 소비자와 만날 수 있는 오프라인 프로그램을 운영합니다.</p>
          <p style={{...KR,fontSize:15,color:"#666",lineHeight:2,margin:"0 0 16px"}}>현지 소비자 접점과 운영까지 포함하는 새로운 형태의 해외 마케팅 프로그램으로 활용할 수 있습니다.</p>
          <p style={{...KR,fontSize:15,color:"#666",lineHeight:2,margin:"0 0 40px"}}>검토 후 궁금한 점이나, 함께 조정해볼 수 있는 운영 방식이 있다면 편하게 의견 주세요.</p>
          <a href="mailto:hello@thebeautypause.com" style={{display:"inline-flex",alignItems:"center",gap:10,padding:"16px 40px",background:"linear-gradient(135deg,#c9a96e,#b8944d)",color:"#0d0d0d",...KR,fontSize:15,fontWeight:700,borderRadius:12,textDecoration:"none",boxShadow:"0 6px 24px rgba(201,169,110,0.35)"}}>
            hello@thebeautypause.com
          </a>
        </div>
      </section>

      {/* SCROLL TOP */}
      {showTop&&<button onClick={()=>window.scrollTo({top:0,behavior:"smooth"})} style={{position:"fixed",bottom:28,right:20,width:44,height:44,borderRadius:"50%",background:"#c9a96e",color:"#0d0d0d",border:"none",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px rgba(0,0,0,0.3)",zIndex:999}}>↑</button>}

      {/* FOOTER */}
      <footer style={{background:"#0d0d0d",padding:"32px clamp(20px,5vw,64px)",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16,marginBottom:20}}>
          <div>
            <div style={{marginBottom:4}}>
              <span style={{...CG,fontSize:"15px",color:"#f5f0eb",letterSpacing:"2px",fontWeight:300}}>THE</span>
              <span style={{...CG,fontSize:"15px",color:"#c9a96e",letterSpacing:"2px",fontWeight:600,marginLeft:5}}>BEAUTY PAUSE</span>
            </div>
            <p style={{...SS,fontSize:"10px",color:"#333",margin:0}}>© 2025 The Beauty Pause</p>
          </div>
          <a href="mailto:hello@thebeautypause.com" style={{...SS,fontSize:"11px",color:"#444",textDecoration:"none"}}>Contact</a>
        </div>
        <div style={{borderTop:"1px solid rgba(255,255,255,0.05)",paddingTop:16}}>
          <p style={{...SS,fontSize:"10px",color:"#444",lineHeight:1.8,margin:0}}>
            주식회사 쏜다 · 대표자 박슬아 · 서울 강남구 테헤란로82길 15 (대치동, 디아이타워)<br/>
            사업자등록번호 426-88-02305 · 통신판매업신고번호 2025-서울강남-00594<br/>
            hello@thebeautypause.com
          </p>
        </div>
      </footer>
    </>
  );
}

function ForManufacturersPage() {
  const navigate = useNavigate();
  const KR = {fontFamily:"'Noto Sans KR','Apple SD Gothic Neo',sans-serif"};
  const SS = {fontFamily:"'DM Sans',sans-serif"};
  const CG = {fontFamily:"'Cormorant Garamond',serif"};
  const [showTop, setShowTop] = useState(false);
  useEffect(()=>{
    const fn = () => setShowTop(window.scrollY > 600);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const Badge = ({children}) => <span style={{...SS,fontSize:"10px",color:"#c9a96e",letterSpacing:"2.5px",textTransform:"uppercase",fontWeight:600,display:"inline-block",marginBottom:16}}>{children}</span>;
  const Divider = () => <div style={{width:36,height:2,background:"#c9a96e",margin:"12px 0 28px"}}/>;
  const Tag = ({children}) => <span style={{...KR,fontSize:"13px",color:"#c9a96e",background:"rgba(201,169,110,0.08)",border:"1px solid rgba(201,169,110,0.25)",padding:"6px 16px",borderRadius:20,display:"inline-block",margin:4}}>{children}</span>;


  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}html,body{background:#0d0d0d}@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}`}</style>

      {/* NAV */}
      <nav style={{background:"#0d0d0d",height:60,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 clamp(20px,5vw,64px)",position:"sticky",top:0,zIndex:500,borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
        <button onClick={()=>{navigate("/");window.scrollTo(0,0);}} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
          <span style={{...CG,fontSize:"15px",color:"#f5f0eb",letterSpacing:"2px",fontWeight:300}}>THE</span>
          <span style={{...CG,fontSize:"15px",color:"#c9a96e",letterSpacing:"2px",fontWeight:600,marginLeft:5}}>BEAUTY PAUSE</span>
        </button>
        <a href="mailto:hello@thebeautypause.com" style={{...SS,fontSize:"13px",color:"#c9a96e",border:"1px solid rgba(201,169,110,0.5)",padding:"8px 20px",borderRadius:24,textDecoration:"none",fontWeight:600}}>협력 문의</a>
      </nav>

      {/* HERO */}
      <section style={{background:"#0d0d0d",padding:"96px clamp(24px,6vw,80px) 88px",animation:"fadeUp 0.5s ease both"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <Badge>✦ For Manufacturers</Badge>
          <h1 style={{...KR,fontSize:"clamp(28px,5vw,48px)",fontWeight:700,color:"#f5f0eb",lineHeight:1.3,margin:"0 0 24px"}}>
            유럽 진출 브랜드를 위한<br/>오프라인 런칭 프로그램
          </h1>
          <p style={{...KR,fontSize:"16px",color:"rgba(255,255,255,0.5)",lineHeight:1.9,maxWidth:600,margin:"0 0 8px"}}>
            The Beauty Pause는 한국 뷰티 브랜드의 유럽 진출을 위한 오프라인 마케팅 플랫폼입니다.
          </p>
          <p style={{...KR,fontSize:"16px",color:"rgba(255,255,255,0.5)",lineHeight:1.9,maxWidth:600}}>
            파리의 실제 뷰티 살롱을 기반으로, 브랜드가 적은 물량으로도 유럽 시장에서 제품을 소개하고 현지 고객과 만날 수 있는 프로그램을 운영합니다.
          </p>
        </div>
      </section>

      {/* WHY PARTNER */}
      <section style={{background:"#fff",padding:"80px clamp(24px,6vw,80px)"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <Badge>✦ Why Partner with The Beauty Pause</Badge>
          <Divider/>
          <h2 style={{...KR,fontSize:"clamp(20px,2.5vw,28px)",fontWeight:700,color:"#1a1a1a",margin:"0 0 28px"}}>왜 함께하나요?</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16}}>
            {[
              {t:"고객사에게 새로운 서비스 제공",d:"유럽 진출을 준비하는 브랜드에게 오프라인 런칭 프로그램을 함께 제안할 수 있습니다."},
              {t:"소규모 브랜드도 참여 가능",d:"대량 수출이나 현지 유통 계약 없이도 부담 없이 시작할 수 있습니다."},
              {t:"현지 운영은 TBP가 담당",d:"브랜드 상담부터 파리 현지 운영까지 The Beauty Pause가 직접 진행합니다."},
            ].map(({t,d})=>(
              <div key={t} style={{background:"#faf7f4",border:"1px solid #e8e0d8",borderRadius:16,padding:"24px 22px"}}>
                <div style={{width:24,height:2,background:"#c9a96e",marginBottom:14}}/>
                <p style={{...KR,fontSize:"15px",fontWeight:700,color:"#1a1a1a",margin:"0 0 10px",lineHeight:1.4}}>{t}</p>
                <p style={{...KR,fontSize:"13px",color:"#777",lineHeight:1.7,margin:0}}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW WE WORK */}
      <section style={{background:"#faf7f4",padding:"80px clamp(24px,6vw,80px)"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <Badge>✦ How We Work</Badge>
          <Divider/>
          <h2 style={{...KR,fontSize:"clamp(20px,2.5vw,28px)",fontWeight:700,color:"#1a1a1a",margin:"0 0 28px"}}>협력 방식</h2>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:0,padding:"8px 0 4px"}}>
            {[
              {t:"파트너사 서비스",sub:"(제조 · 인증 등)"},
              {t:"유럽 진출 프로그램"},
              {t:"더뷰티퍼즈",accent:true},
              {t:"파리 오프라인 런칭"},
            ].map((step,i,arr)=>(
              <Fragment key={step.t}>
                <div style={{background:step.accent?"rgba(201,169,110,0.15)":"#fff",border:step.accent?"2px solid #c9a96e":"1px solid #e8e0d8",borderRadius:12,padding:"14px 28px",textAlign:"center",minWidth:220,boxShadow:step.accent?"0 2px 8px rgba(201,169,110,0.1)":"none"}}>
                  <p style={{...KR,fontSize:14,fontWeight:700,color:step.accent?"#a07832":"#1a1a1a",margin:0}}>{step.t}</p>
                  {step.sub&&<p style={{...KR,fontSize:11,fontWeight:400,color:"#999",margin:"3px 0 0"}}>{step.sub}</p>}
                </div>
                {i<arr.length-1 && <div style={{color:"#c9a96e",fontSize:18,padding:"4px 0"}}>↓</div>}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* PARTNERSHIP */}
      <section style={{background:"#0d0d0d",padding:"80px clamp(24px,6vw,80px)"}}>
        <div style={{maxWidth:700,margin:"0 auto"}}>
          <Badge>✦ Partnership</Badge>
          <Divider/>
          <h2 style={{...KR,fontSize:"clamp(20px,2.5vw,28px)",fontWeight:700,color:"#f5f0eb",margin:"0 0 24px"}}>파트너가 얻는 가치</h2>
          <p style={{...KR,fontSize:15,color:"rgba(255,255,255,0.55)",lineHeight:2,margin:"0 0 16px"}}>The Beauty Pause는 제조사와 함께 유럽 진출 프로그램을 운영합니다.</p>
          <p style={{...KR,fontSize:15,color:"rgba(255,255,255,0.55)",lineHeight:2,margin:"0 0 16px"}}>제조사는 기존 고객에게 새로운 해외 진출 서비스를 제공하고,<br/>The Beauty Pause는 프랑스 현지에서 브랜드의 오프라인 런칭과 운영을 담당합니다.</p>
          <p style={{...KR,fontSize:15,color:"rgba(255,255,255,0.55)",lineHeight:2,margin:0}}>브랜드 상담부터 프로그램 운영까지 함께 진행하며, 파트너십 형태로 협력합니다.</p>
        </div>
      </section>

      {/* IDEAL PARTNERS */}
      <section style={{background:"#fff",padding:"80px clamp(24px,6vw,80px)"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <Badge>✦ Ideal Partners</Badge>
          <Divider/>
          <h2 style={{...KR,fontSize:"clamp(20px,2.5vw,28px)",fontWeight:700,color:"#1a1a1a",margin:"0 0 24px"}}>이런 파트너를 찾고 있습니다</h2>
          <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
            {["화장품 제조사 (OEM / ODM)","브랜드 인큐베이팅 기업","브랜드 액셀러레이터","해외 진출 컨설팅 기업","수출 지원 기관"].map(t=><Tag key={t}>{t}</Tag>)}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section style={{background:"#0d0d0d",padding:"88px clamp(24px,6vw,80px)",textAlign:"center"}}>
        <div style={{maxWidth:560,margin:"0 auto"}}>
          <Badge>✦ Contact</Badge>
          <h2 style={{...KR,fontSize:"clamp(22px,3.5vw,32px)",fontWeight:700,color:"#f5f0eb",margin:"16px 0 12px",lineHeight:1.5}}>
            함께 만드는 서비스
          </h2>
          <p style={{...KR,fontSize:16,color:"rgba(255,255,255,0.6)",margin:"0 0 8px",lineHeight:1.7}}>
            유럽 진출을 준비하는 브랜드와 함께하고 계신가요?
          </p>
          <p style={{...KR,fontSize:15,color:"rgba(255,255,255,0.4)",margin:"0 0 36px"}}>The Beauty Pause와 함께 새로운 서비스를 만들어보세요.</p>
          <p style={{...SS,fontSize:"14px",color:"rgba(255,255,255,0.3)",margin:"0 0 24px"}}>hello@thebeautypause.com</p>
          <a href="mailto:hello@thebeautypause.com"
            style={{display:"inline-flex",alignItems:"center",gap:10,padding:"16px 40px",background:"linear-gradient(135deg,#c9a96e,#b8944d)",color:"#0d0d0d",...KR,fontSize:15,fontWeight:700,borderRadius:12,textDecoration:"none",boxShadow:"0 6px 24px rgba(201,169,110,0.35)"}}>
            협력 문의하기 →
          </a>
        </div>
      </section>

      {/* SCROLL TOP */}
      {showTop&&<button onClick={()=>window.scrollTo({top:0,behavior:"smooth"})} style={{position:"fixed",bottom:28,right:20,width:44,height:44,borderRadius:"50%",background:"#c9a96e",color:"#0d0d0d",border:"none",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px rgba(0,0,0,0.3)",zIndex:999}}>↑</button>}

      {/* FOOTER */}
      <footer style={{background:"#0d0d0d",padding:"32px clamp(20px,5vw,64px)",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16,marginBottom:20}}>
          <div>
            <div style={{marginBottom:4}}>
              <span style={{...CG,fontSize:"15px",color:"#f5f0eb",letterSpacing:"2px",fontWeight:300}}>THE</span>
              <span style={{...CG,fontSize:"15px",color:"#c9a96e",letterSpacing:"2px",fontWeight:600,marginLeft:5}}>BEAUTY PAUSE</span>
            </div>
            <p style={{...SS,fontSize:"10px",color:"#333",margin:0}}>© 2025 The Beauty Pause</p>
          </div>
          <a href="mailto:hello@thebeautypause.com" style={{...SS,fontSize:"11px",color:"#444",textDecoration:"none"}}>Contact</a>
        </div>
        <div style={{borderTop:"1px solid rgba(255,255,255,0.05)",paddingTop:16}}>
          <p style={{...SS,fontSize:"10px",color:"#444",lineHeight:1.8,margin:0}}>
            주식회사 쏜다 · 대표자 박슬아 · 서울 강남구 테헤란로82길 15 (대치동, 디아이타워)<br/>
            사업자등록번호 426-88-02305 · 통신판매업신고번호 2025-서울강남-00594<br/>
            hello@thebeautypause.com
          </p>
        </div>
      </footer>
    </>
  );
}

// ── NEWSLETTER PAGE (운영현황 · monthly update, edited manually by Sulah) ────
function NewsletterPage() {
  const navigate = useNavigate();

  const newsletterBody = `
    <div class="header">
      <div class="logo">THE <span>BEAUTY PAUSE</span></div>
      <div class="header-tag">JULY 2025</div>
    </div>
    <div class="hero">
      <div class="hero-eyebrow">Monthly Update</div>
      <h1>파리에서<br><em>많은 일이 일어나고 있습니다.</em></h1>
      <p>이번 달 TBP 파리 살롱 네트워크 운영 현황을 공유드립니다.</p>
    </div>
    <div class="big-stats">
      <div class="big-stat">
        <div class="n">25</div>
        <div class="l">파트너 살롱</div>
        <div class="sub">▲ 이번 달 3곳 추가</div>
      </div>
      <div class="big-stat">
        <div class="n">4+</div>
        <div class="l">참여 브랜드</div>
        <div class="sub">유료·제품 파트너</div>
      </div>
      <div class="big-stat">
        <div class="n">20</div>
        <div class="l">이번 달 판매 제품</div>
        <div class="sub">▲ 첫 살롱 구매 발생</div>
      </div>
    </div>
    <div class="feed">
      <div class="feed-title">✦ 이번 달 일어난 일들</div>
      <div class="news-card">
        <div class="news-icon gold">🏠</div>
        <div class="news-body">
          <span class="news-tag">New Salon</span>
          <div class="news-title">이번 달 파트너 살롱 3곳 추가</div>
          <div class="news-desc">네일 2곳, 헤어 1곳이 새로 합류했습니다. 누적 25개 살롱 운영 중.</div>
          <span class="news-pill">총 25개 살롱</span>
        </div>
      </div>
      <div class="news-card">
        <div class="news-icon green">🛍</div>
        <div class="news-body">
          <span class="news-tag">First Deal</span>
          <div class="news-title">파리 살롱 첫 제품 구매 거래 성사</div>
          <div class="news-desc">BelleGlamour Paris에서 고객 선물용 K-뷰티 제품 구매. 이번 달 총 20개 제품 판매.</div>
          <span class="news-pill">20개 제품 판매</span>
        </div>
      </div>
      <div class="news-card">
        <div class="news-icon gold">💄</div>
        <div class="news-body">
          <span class="news-tag">First Contract</span>
          <div class="news-title">유료 파트너 브랜드 첫 계약 성사</div>
          <div class="news-desc">파리 런칭 위크 첫 유료 브랜드 계약이 완료됐습니다.</div>
          <span class="news-pill">유료 브랜드 1호</span>
        </div>
      </div>
      <div class="news-card">
        <div class="news-icon blue">📸</div>
        <div class="news-body">
          <span class="news-tag">Collab</span>
          <div class="news-title">살롱 콜라보 콘텐츠 3건 제작</div>
          <div class="news-desc">파트너 살롱 3곳과 K-뷰티 브랜드 콜라보 콘텐츠를 촬영하고 SNS에 업로드했습니다.</div>
          <span class="news-pill">콘텐츠 3건</span>
        </div>
      </div>
    </div>
    <div class="small-stats">
      <div class="small-stat">
        <div class="n">30 <span>건</span></div>
        <div class="l">주간 QR 스캔</div>
      </div>
      <div class="small-stat">
        <div class="n">3 <span>개</span></div>
        <div class="l">운영 프로그램</div>
      </div>
      <div class="small-stat">
        <div class="n">3 <span>건</span></div>
        <div class="l">살롱 콜라보</div>
      </div>
      <div class="small-stat">
        <div class="n">4 <span>개</span></div>
        <div class="l">참여 브랜드</div>
      </div>
    </div>
    <div class="programs">
      <div class="programs-title">✦ 운영 프로그램</div>
      <div class="prog-row">
        <div class="prog-chip">
          <span class="emoji">💆</span>
          <div class="name">K 헤드스파</div>
          <div class="status">운영 중</div>
        </div>
        <div class="prog-chip">
          <span class="emoji">🧴</span>
          <div class="name">K 샴푸잉</div>
          <div class="status">운영 중</div>
        </div>
        <div class="prog-chip">
          <span class="emoji">✨</span>
          <div class="name">K 헤어팩</div>
          <div class="status">운영 중</div>
        </div>
      </div>
    </div>
    <div class="brand-join">
      <div class="brand-join-title">✦ 브랜드 참가 방법</div>
      <div class="brand-options">
        <div class="brand-option paid">
          <span class="opt-badge">✦ Launch Partner</span>
          <h4>런칭 파트너</h4>
          <ul class="opt-list">
            <li>파리 런칭 위크 운영</li>
            <li>살롱 우선 매칭</li>
            <li>QR 및 구매 연결</li>
            <li>캠페인 · 콘텐츠 추가 가능</li>
          </ul>
        </div>
        <div class="brand-option free">
          <span class="opt-badge">✦ Product Partner</span>
          <h4>제품 파트너</h4>
          <ul class="opt-list">
            <li>살롱 네트워크 운영</li>
            <li>제품 배치 및 체험</li>
            <li>운영 현황 공유</li>
            <li>런칭 파트너 전환 가능</li>
          </ul>
        </div>
      </div>
    </div>
    <div class="cta-area">
      <a href="mailto:hello@thebeautypause.com?subject=브랜드 참가 문의" class="cta-main">브랜드 참가 문의 →</a>
      <a href="mailto:hello@thebeautypause.com?subject=협업 문의" class="cta-sub">협업 문의 →</a>
    </div>
    <div class="cta-email">
      <p>hello@thebeautypause.com · <a href="https://thebeautypause.com">thebeautypause.com</a></p>
    </div>
    <div class="footer">
      <p>
        The Beauty Pause · Paris<br>
        수신을 원하지 않으시면 <a href="#">여기</a>를 클릭해 주세요.
      </p>
    </div>
  `;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #f5f0eb; font-family: 'DM Sans', 'Apple SD Gothic Neo', sans-serif; }
        .wrap { max-width: 600px; margin: 32px auto; background: #0d0d0d; border-radius: 16px; overflow: hidden; }
        .header { padding: 24px 32px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .logo { font-size: 12px; letter-spacing: 2.5px; color: #f5f0eb; font-weight: 300; }
        .logo span { color: #c9a96e; font-weight: 600; }
        .header-tag { font-size: 10px; background: rgba(201,169,110,0.15); color: #c9a96e; padding: 4px 10px; border-radius: 20px; letter-spacing: 1px; }
        .hero { padding: 32px 32px 24px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .hero-eyebrow { font-size: 10px; color: rgba(255,255,255,0.3); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px; }
        .hero h1 { font-size: 26px; color: #f5f0eb; font-weight: 500; line-height: 1.3; margin-bottom: 8px; }
        .hero h1 em { color: #c9a96e; font-style: normal; }
        .hero p { font-size: 13px; color: rgba(255,255,255,0.35); line-height: 1.7; }
        .big-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 1px; background: rgba(255,255,255,0.06); border-top: 1px solid rgba(255,255,255,0.06); border-bottom: 1px solid rgba(255,255,255,0.06); }
        .big-stat { padding: 20px 16px; background: #0d0d0d; text-align: center; }
        .big-stat .n { font-size: 32px; font-weight: 600; color: #c9a96e; line-height: 1; margin-bottom: 4px; }
        .big-stat .l { font-size: 10px; color: rgba(255,255,255,0.3); letter-spacing: 0.5px; line-height: 1.4; }
        .big-stat .sub { font-size: 10px; color: rgba(201,169,110,0.6); margin-top: 2px; }
        .feed { padding: 24px 32px; }
        .feed-title { font-size: 10px; color: rgba(255,255,255,0.25); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px; }
        .news-card { border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; padding: 16px; margin-bottom: 10px; display: flex; gap: 14px; align-items: flex-start; }
        .news-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .news-icon.gold { background: rgba(201,169,110,0.12); }
        .news-icon.green { background: rgba(100,200,150,0.1); }
        .news-icon.blue { background: rgba(100,150,255,0.1); }
        .news-body { flex: 1; }
        .news-tag { font-size: 9px; color: #c9a96e; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px; display: block; }
        .news-title { font-size: 14px; color: #f5f0eb; font-weight: 500; margin-bottom: 4px; line-height: 1.3; }
        .news-desc { font-size: 12px; color: rgba(255,255,255,0.35); line-height: 1.6; }
        .news-pill { display: inline-block; font-size: 10px; background: rgba(201,169,110,0.1); color: #c9a96e; padding: 2px 8px; border-radius: 20px; margin-top: 6px; }
        .small-stats { display: grid; grid-template-columns: repeat(2,1fr); gap: 8px; margin: 0 32px 24px; }
        .small-stat { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 14px 16px; }
        .small-stat .n { font-size: 22px; font-weight: 600; color: #f5f0eb; margin-bottom: 2px; }
        .small-stat .n span { font-size: 13px; color: #c9a96e; margin-left: 2px; }
        .small-stat .l { font-size: 11px; color: rgba(255,255,255,0.3); }
        .programs { margin: 0 32px 24px; }
        .programs-title { font-size: 10px; color: rgba(255,255,255,0.25); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; }
        .prog-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .prog-chip { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 10px 14px; flex: 1; min-width: 140px; }
        .prog-chip .emoji { font-size: 18px; margin-bottom: 6px; display: block; }
        .prog-chip .name { font-size: 12px; color: #f5f0eb; font-weight: 500; }
        .prog-chip .status { font-size: 10px; color: #c9a96e; margin-top: 2px; }
        .brand-join { margin: 0 32px 20px; }
        .brand-join-title { font-size: 10px; color: rgba(255,255,255,0.25); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; }
        .brand-options { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .brand-option { border-radius: 10px; padding: 18px; border: 1px solid rgba(255,255,255,0.07); }
        .brand-option.paid { border-color: rgba(201,169,110,0.3); background: rgba(201,169,110,0.04); }
        .brand-option.free { background: rgba(255,255,255,0.02); }
        .opt-badge { font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; display: block; margin-bottom: 6px; }
        .brand-option.paid .opt-badge { color: #c9a96e; }
        .brand-option.free .opt-badge { color: rgba(255,255,255,0.25); }
        .brand-option h4 { font-size: 13px; color: #f5f0eb; font-weight: 600; margin-bottom: 12px; }
        .opt-list { list-style: none; }
        .opt-list li { font-size: 11px; color: rgba(255,255,255,0.4); padding: 3px 0; display: flex; align-items: flex-start; gap: 7px; line-height: 1.5; }
        .brand-option.paid .opt-list li::before { content: "✦"; color: #c9a96e; flex-shrink: 0; font-size: 9px; margin-top: 2px; }
        .brand-option.free .opt-list li::before { content: "·"; color: rgba(255,255,255,0.2); flex-shrink: 0; }
        .cta-area { margin: 0 32px 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .cta-main { display: block; background: linear-gradient(135deg, #c9a96e, #b8944d); color: #0d0d0d; font-size: 12px; font-weight: 700; padding: 13px 16px; border-radius: 8px; text-decoration: none; text-align: center; line-height: 1.4; }
        .cta-sub { display: block; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); font-size: 12px; font-weight: 500; padding: 13px 16px; border-radius: 8px; text-decoration: none; text-align: center; line-height: 1.4; }
        .cta-email { margin: 0 32px 28px; text-align: center; padding-top: 10px; }
        .cta-email p { font-size: 11px; color: rgba(255,255,255,0.2); }
        .cta-email a { color: rgba(201,169,110,0.5); text-decoration: none; }
        .footer { padding: 20px 32px; border-top: 1px solid rgba(255,255,255,0.05); text-align: center; }
        .footer p { font-size: 10px; color: rgba(255,255,255,0.15); line-height: 1.8; }
        .footer a { color: rgba(201,169,110,0.4); text-decoration: none; }
      `}</style>
      <div style={{maxWidth:600,margin:"20px auto 0",padding:"0 16px"}}>
        <button onClick={()=>navigate("/brands")}
          style={{background:"none",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#8a8a8a",padding:"6px 0",display:"flex",alignItems:"center",gap:6}}>
          ← 브랜드 페이지로
        </button>
      </div>
      <div className="wrap" dangerouslySetInnerHTML={{ __html: newsletterBody }} />
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// PROGRAM SITE — new concept, white+gold base (black used sparingly as accent)
// Mobile-first home screen: Featured Programs + Partner Salons
// ══════════════════════════════════════════════════════════════════════════

// placeholder program data — small number of programs, hand-maintained for now
// Program data now comes live from Airtable (see useProgramsData / TBL_PROGRAMS above).

function ProgramCard({ program, salons, onClick }) {
  const KR = {fontFamily:"'Noto Sans KR','Apple SD Gothic Neo',sans-serif"};
  const SS = {fontFamily:"'DM Sans',sans-serif"};
  return (
    <div onClick={onClick} style={{flexShrink:0,width:296,cursor:"pointer"}}>
      <div style={{position:"relative",width:296,aspectRatio:"5/3",borderRadius:20,overflow:"hidden",background:"#f0ebe2"}}>
        {program.image
          ? <img src={program.image} alt={program.name} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
          : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,color:"#c9a96e"}}>✦</span></div>}
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(13,13,13,0.8) 0%,rgba(13,13,13,0.15) 44%,transparent 68%)"}}/>
        <div style={{position:"absolute",top:12,left:12,right:12,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          {program.category&&<div style={{background:"rgba(255,255,255,0.92)",color:"#1a1a1a",...SS,fontSize:10,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",padding:"4px 10px",borderRadius:20}}>{program.category}</div>}
          {program.tag&&<div style={{background:"#c9a96e",color:"#0d0d0d",...SS,fontSize:10,fontWeight:700,letterSpacing:0.5,padding:"4px 10px",borderRadius:20}}>{program.tag}</div>}
        </div>
        <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"14px 16px 16px"}}>
          <p style={{...KR,fontSize:21,fontWeight:700,color:"#fff",margin:"0 0 8px",lineHeight:1.25,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{program.name}</p>
          <div style={{display:"flex",alignItems:"baseline",gap:6}}>
            {program.priceOriginal&&<span style={{...SS,fontSize:12,color:"rgba(255,255,255,0.45)",textDecoration:"line-through"}}>€{program.priceOriginal}</span>}
            <span style={{...SS,fontSize:16,color:"#c9a96e",fontWeight:700}}>€{program.price}</span>
            <span style={{...KR,fontSize:11,color:"rgba(255,255,255,0.55)",marginLeft:"auto"}}>{program.duration}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgramSalonCard({ salon, onClick, featured, showAddress }) {
  const KR = {fontFamily:"'Noto Sans KR','Apple SD Gothic Neo',sans-serif"};
  const SS = {fontFamily:"'DM Sans',sans-serif"};
  const img = getSalonImg(salon);
  const prods = salon._products || [];
  return (
    <div onClick={onClick} style={{display:"flex",gap:14,alignItems:"center",background:"#fff",border:featured?"1px solid #e8d9b8":"1px solid #f0e9dc",borderRadius:16,padding:12,cursor:"pointer"}}>
      <div style={{width:64,height:64,borderRadius:14,overflow:"hidden",flexShrink:0,background:"#f0ebe2"}}>
        {img
          ? <img src={img} alt={salon.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:"#c9a96e"}}>{salon.name?.[0]}</span></div>}
      </div>
      <div style={{flex:1,minWidth:0}}>
        {featured&&<span style={{display:"inline-block",...SS,fontSize:9,color:"#c9a96e",fontWeight:700,letterSpacing:0.3,background:"#fdf8ee",border:"1px solid #e8d9b8",borderRadius:20,padding:"2px 8px",marginBottom:5}}>✦ Featured Program</span>}
        <p style={{...KR,fontSize:15,fontWeight:700,color:"#1a1a1a",margin:"0 0 2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{salon.name}</p>
        {showAddress ? (
          <p style={{...SS,fontSize:11,color:"#aaa",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{salon.address || salon.area || "Paris"}</p>
        ) : (
          <>
            <p style={{...SS,fontSize:11,color:"#aaa",margin:"0 0 6px"}}>{salon.area || "Paris"}</p>
            {prods.length>0&&(
              <div style={{display:"flex",gap:4,alignItems:"center"}}>
                {prods.slice(0,4).map(p=>{
                  const pi=getProdImg(p);
                  return pi?<div key={p.id} style={{width:20,height:20,borderRadius:5,overflow:"hidden",border:"1px solid #f0e5cf"}}><img src={pi} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>:null;
                })}
                <span style={{...SS,fontSize:9,color:"#c9a96e",fontWeight:700,marginLeft:2}}>+{prods.length} K-Beauty</span>
              </div>
            )}
          </>
        )}
      </div>
      <span style={{color:"#ddd",fontSize:18,flexShrink:0}}>›</span>
    </div>
  );
}

// ── PROGRAM SITE TRANSLATIONS (en default, fr on toggle) ────────────────────
const PT = {
  en: {
    heroTitle1:"Discover K-Beauty", heroTitle2:"programs in Paris salons",
    heroSub:"Book a K-Beauty program run with our partner salons, and enjoy a new beauty experience.",
    featuredPrograms:"Featured Programs", featuredProgramsSub:"Discover a range of K-Beauty programs.",
    exploreSalons:"Explore Salons", exploreSalonsSub:"Meet K-Beauty at Paris salons.",
    meetBrands:"Meet the Brands", meetBrandsSub:"Meet the K-Beauty brands launched in Paris.",
    seeAll:"See all", loading:"Loading…", noPrograms:"No programs available yet.",
    searchPlaceholder:"Search programs, salons, products",
    period:"Available period", program:"program", programsCount:"programs",
    filter:"Filter", allCategories:"All", allAreas:"All areas",
    noMatch:"No matches found.",
    collabProduct:"Collab Product", included:"What's Included",
    runningSalons:"Salons", locations:"locations",
    mapLoading:"Loading map…", noLocation:"No salon location to show",
    applyNow:"Apply for this program", loginAndApply:"Log in to apply",
    selectSalonTitle:"Select a salon", paymentMethodTitle:"Payment method",
    payAtSalonNote:"salon", payAtSalonDesc:"you'll pay directly when you visit.",
    confirmPay:"Pay at salon · Confirm application",
    applicationComplete:"Application complete", paymentMethodLabel:"Payment method",
    payAtSalon:"Pay at salon (on visit)", applicationSalon:"Salon",
    applicationNumber:"Application no.", place:"Place",
    visitNote:"Please choose your visit date and time on the salon's booking system.",
    bookSalon:"Book your salon visit →", linkPending:"Booking link coming soon",
    backHome:"Back to home", notFound:"Program not found.",
    searchHint:"Start typing to search…", searchNoResults:"No results for",
    duration:"Duration", price:"Price", back:"Back",
    myProgramsEmpty:"No programs applied yet.",
  },
  fr: {
    heroTitle1:"Découvrez le K-Beauty", heroTitle2:"dans les salons parisiens",
    heroSub:"Réservez un programme K-Beauty avec nos salons partenaires, et profitez d'une nouvelle expérience beauté.",
    featuredPrograms:"Programmes en vedette", featuredProgramsSub:"Découvrez nos programmes K-Beauty.",
    exploreSalons:"Explorer les salons", exploreSalonsSub:"Découvrez le K-Beauty dans les salons parisiens.",
    meetBrands:"Découvrir les marques", meetBrandsSub:"Découvrez les marques K-Beauty lancées à Paris.",
    seeAll:"Voir tout", loading:"Chargement…", noPrograms:"Aucun programme disponible pour le moment.",
    searchPlaceholder:"Rechercher programmes, salons, produits",
    period:"Période disponible", program:"programme", programsCount:"programmes",
    filter:"Filtrer", allCategories:"Tous", allAreas:"Tous les quartiers",
    noMatch:"Aucun résultat.",
    collabProduct:"Produit associé", included:"Ce qui est inclus",
    runningSalons:"Salons", locations:"salons",
    mapLoading:"Chargement de la carte…", noLocation:"Aucun salon à afficher",
    applyNow:"Réserver ce programme", loginAndApply:"Se connecter pour réserver",
    selectSalonTitle:"Choisissez un salon", paymentMethodTitle:"Mode de paiement",
    payAtSalonNote:"salon", payAtSalonDesc:"vous payez directement sur place.",
    confirmPay:"Payer sur place · Confirmer",
    applicationComplete:"Réservation confirmée", paymentMethodLabel:"Mode de paiement",
    payAtSalon:"Paiement sur place", applicationSalon:"Salon",
    applicationNumber:"N° de réservation", place:"Lieu",
    visitNote:"Choisissez votre date et heure de visite sur le système de réservation du salon.",
    bookSalon:"Réserver un créneau →", linkPending:"Lien de réservation à venir",
    backHome:"Retour à l'accueil", notFound:"Programme introuvable.",
    searchHint:"Commencez à taper pour rechercher…", searchNoResults:"Aucun résultat pour",
    duration:"Durée", price:"Prix", back:"Retour",
    myProgramsEmpty:"Aucun programme réservé pour l'instant.",
  },
};

function Star({size=16}) {
  return <span style={{background:"linear-gradient(135deg,#f0e2c0,#c9a96e 55%,#9c7830)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",fontSize:size,display:"inline-block"}}>✦</span>;
}

function ProgramDesktopNav({ user, onAuthClick, lang, setLang }) {
  const navigate = useNavigate();
  const CG = {fontFamily:"'Cormorant Garamond',serif"};
  const SS = {fontFamily:"'DM Sans',sans-serif"};
  const NAV_LINKS = [
    {label:"Programs", path:"/programs"},
    {label:"Salons", path:"/salons"},
    {label:"Products", path:"/products"},
  ];
  return (
    <nav style={{background:"#0d0d0d",height:64,display:"flex",alignItems:"center",gap:28,padding:"0 clamp(24px,4vw,56px)",position:"sticky",top:0,zIndex:500,borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
      <div onClick={()=>navigate("/")} style={{cursor:"pointer",flexShrink:0}}>
        <span style={{...CG,fontSize:17,color:"#f5f0eb",letterSpacing:2,fontWeight:300}}>THE</span>
        <span style={{...CG,fontSize:17,color:"#c9a96e",letterSpacing:2,fontWeight:600,marginLeft:6}}>BEAUTY PAUSE</span>
      </div>
      <div style={{display:"flex",gap:28,flexShrink:0}}>
        {NAV_LINKS.map(l=>(
          <button key={l.path} onClick={()=>navigate(l.path)} style={{background:"none",border:"none",cursor:"pointer",...SS,fontSize:13,color:"rgba(255,255,255,0.65)",fontWeight:500,whiteSpace:"nowrap"}}>{l.label}</button>
        ))}
      </div>
      <button onClick={()=>navigate("/search")}
        style={{flex:1,maxWidth:420,display:"flex",alignItems:"center",gap:8,padding:"9px 16px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:20,cursor:"pointer",textAlign:"left"}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" style={{flexShrink:0}}><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <span style={{...SS,fontSize:12,color:"rgba(255,255,255,0.4)"}}>{PT[lang||"en"].searchPlaceholder}</span>
      </button>
      <div style={{display:"flex",alignItems:"center",gap:14,flexShrink:0,marginLeft:"auto"}}>
        {user
          ? <button onClick={()=>navigate("/account")} style={{padding:"8px 18px",background:"transparent",color:"#c9a96e",border:"1px solid rgba(201,169,110,0.4)",cursor:"pointer",...SS,fontSize:12,fontWeight:600,letterSpacing:0.5,textTransform:"uppercase",borderRadius:20,whiteSpace:"nowrap"}}>✦ Account</button>
          : <button onClick={()=>onAuthClick?.("login")} style={{padding:"8px 18px",background:"#c9a96e",color:"#0d0d0d",border:"none",cursor:"pointer",...SS,fontSize:12,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",borderRadius:20,whiteSpace:"nowrap"}}>Sign in</button>
        }
        {lang&&setLang&&(
          <div style={{display:"flex",border:"1px solid #333",borderRadius:20,overflow:"hidden",flexShrink:0}}>
            {["en","fr"].map(l=><button key={l} onClick={()=>setLang(l)} style={{padding:"4px 9px",border:"none",cursor:"pointer",...SS,fontSize:11,fontWeight:600,color:lang===l?"#0d0d0d":"#777",background:lang===l?"#c9a96e":"transparent",textTransform:"uppercase"}}>{l}</button>)}
          </div>
        )}
      </div>
    </nav>
  );
}

function ProgramHomePage({ salons, allProducts, loading, programs, loadingPrograms, user, onAuthClick }) {
  const [lang, setLang] = useState("en");
  const pt = PT[lang];
  const navigate = useNavigate();
  const KR = {fontFamily:"'Noto Sans KR','Apple SD Gothic Neo',sans-serif"};
  const SS = {fontFamily:"'DM Sans',sans-serif"};
  const CG = {fontFamily:"'Cormorant Garamond',serif"};
  const isMobile = window.innerWidth<768;
  const programScrollRef = useRef(null);
  const exploreSalons = useMemo(()=>{
    const featuredIds = new Set((programs||[]).flatMap(p=>p.salonIds||[]));
    const featured = (salons||[]).filter(s=>featuredIds.has(s.id));
    const rest = (salons||[]).filter(s=>!featuredIds.has(s.id));
    // shuffle the rest randomly
    for (let i=rest.length-1;i>0;i--) {
      const j = Math.floor(Math.random()*(i+1));
      [rest[i],rest[j]] = [rest[j],rest[i]];
    }
    const list = [...featured, ...rest];
    return list.slice(0,isMobile?4:6).map(s=>({ ...s, _featured: featuredIds.has(s.id) }));
  }, [salons, programs, isMobile]);

  // build a brand -> product-photo list, pick one random photo per brand (re-picked each mount)
  const brandCards = useMemo(()=>{
    const byBrand = {};
    (allProducts||[]).forEach(p=>{
      const brand = p.brand_name || (Array.isArray(p.brand)?null:(!p.brand?.startsWith?.("rec")?p.brand:null));
      if (!brand) return;
      const img = getProdImg(p);
      if (!img) return;
      if (!byBrand[brand]) byBrand[brand]=[];
      byBrand[brand].push(img);
    });
    return Object.entries(byBrand).map(([brand,imgs])=>({
      brand, img: imgs[Math.floor(Math.random()*imgs.length)]
    }));
  }, [allProducts]);

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Noto+Sans+KR:wght@300;400;500;700&family=DM+Sans:wght@300;400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0}html,body{background:#ffffff}.hide-scrollbar{scrollbar-width:none;-ms-overflow-style:none}.hide-scrollbar::-webkit-scrollbar{display:none}@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}`}</style>

      {isMobile ? (
        <div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",background:"#ffffff",paddingBottom:96,position:"relative"}}>

          {/* HEADER */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 20px 4px",gap:10}}>
            <div onClick={()=>navigate("/")} style={{cursor:"pointer"}}>
              <span style={{...CG,fontSize:15,color:"#1a1a1a",letterSpacing:2,fontWeight:300}}>THE</span>
              <span style={{...CG,fontSize:15,color:"#c9a96e",letterSpacing:2,fontWeight:600,marginLeft:5}}>BEAUTY PAUSE</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:"auto"}}>
              <div style={{display:"flex",border:"1px solid #f0e5cf",borderRadius:20,overflow:"hidden"}}>
                {["en","fr"].map(l=><button key={l} onClick={()=>setLang(l)} style={{padding:"6px 9px",border:"none",cursor:"pointer",...SS,fontSize:10,fontWeight:600,color:lang===l?"#0d0d0d":"#999",background:lang===l?"#c9a96e":"transparent",textTransform:"uppercase"}}>{l}</button>)}
              </div>
              <button onClick={()=>navigate("/search")} style={{width:38,height:38,borderRadius:"50%",background:"#fff",border:"1px solid #f0e5cf",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </button>
            </div>
          </div>

          {/* GREETING */}
          <div style={{padding:"36px 20px 40px",background:"linear-gradient(135deg,#faf3e6,#f0dfb8)"}}>
            <p style={{...SS,fontSize:11,color:"#a8823f",letterSpacing:2,textTransform:"uppercase",fontWeight:700,margin:"0 0 10px"}}><Star size={13}/> The Beauty Pause</p>
            <p style={{...KR,fontSize:24,fontWeight:700,color:"#1a1a1a",margin:"0 0 10px",lineHeight:1.4}}>{pt.heroTitle1}<br/>{pt.heroTitle2}</p>
            <p style={{...KR,fontSize:13,color:"#6b5a3a",lineHeight:1.7,margin:0}}>{pt.heroSub}</p>
          </div>

          {/* FEATURED PROGRAMS */}
          <div style={{marginTop:28,marginBottom:32,position:"relative"}}>
            <div style={{padding:"0 20px",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                <p style={{...KR,fontSize:16,fontWeight:700,color:"#1a1a1a",margin:0}}><Star size={15}/> {pt.featuredPrograms}</p>
                <button onClick={()=>navigate("/programs")} style={{...SS,fontSize:12,color:"#c9a96e",fontWeight:600,background:"none",border:"none",cursor:"pointer"}}>{pt.seeAll}</button>
              </div>
              <p style={{...KR,fontSize:12,color:"#999",margin:0}}>{pt.featuredProgramsSub}</p>
            </div>
            <div ref={programScrollRef} className="hide-scrollbar" style={{display:"flex",gap:14,overflowX:"auto",padding:"0 20px 4px",scrollBehavior:"smooth"}}>
              {loadingPrograms
                ? <p style={{...KR,fontSize:13,color:"#bbb",padding:"24px 0"}}>{pt.loading}</p>
                : programs.map((p,i)=>(
                    <div key={p.id} style={{animation:`fadeUp 0.4s ease ${i*0.05}s both`}}>
                      <ProgramCard program={p} salons={salons} onClick={()=>navigate(`/program/${p.id}`)}/>
                    </div>
                  ))
              }
            </div>
            {!loadingPrograms&&programs.length>1&&(
              <>
                <button onClick={()=>programScrollRef.current?.scrollBy({left:-310,behavior:"smooth"})}
                  style={{position:"absolute",left:6,top:"calc(50% + 14px)",transform:"translateY(-50%)",width:32,height:32,borderRadius:"50%",background:"rgba(255,255,255,0.92)",border:"1px solid #f0e5cf",boxShadow:"0 2px 8px rgba(0,0,0,0.1)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",zIndex:2}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <button onClick={()=>programScrollRef.current?.scrollBy({left:310,behavior:"smooth"})}
                  style={{position:"absolute",right:6,top:"calc(50% + 14px)",transform:"translateY(-50%)",width:32,height:32,borderRadius:"50%",background:"rgba(255,255,255,0.92)",border:"1px solid #f0e5cf",boxShadow:"0 2px 8px rgba(0,0,0,0.1)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",zIndex:2}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </>
            )}
          </div>

          {/* EXPLORE SALONS */}
          <div style={{marginBottom:32}}>
            <div style={{padding:"0 20px",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                <p style={{...KR,fontSize:16,fontWeight:700,color:"#1a1a1a",margin:0}}><Star size={15}/> {pt.exploreSalons}</p>
                <button onClick={()=>navigate("/salons")} style={{...SS,fontSize:12,color:"#c9a96e",fontWeight:600,background:"none",border:"none",cursor:"pointer"}}>{pt.seeAll}</button>
              </div>
              <p style={{...KR,fontSize:12,color:"#999",margin:0}}>{pt.exploreSalonsSub}</p>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10,padding:"0 20px"}}>
              {loading
                ? <p style={{...KR,fontSize:13,color:"#bbb",textAlign:"center",padding:"24px 0"}}>{pt.loading}</p>
                : exploreSalons.map((s,i)=>(
                    <div key={s.id} style={{animation:`fadeUp 0.4s ease ${i*0.03}s both`}}>
                      <ProgramSalonCard salon={s} featured={s._featured} onClick={()=>navigate("/salons",{state:{selectSalonId:s.id}})}/>
                    </div>
                  ))
              }
            </div>
          </div>

          {/* MEET THE BRANDS */}
          {brandCards.length>0&&(
            <div>
              <div style={{padding:"0 20px",marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                  <p style={{...KR,fontSize:16,fontWeight:700,color:"#1a1a1a",margin:0}}><Star size={15}/> {pt.meetBrands}</p>
                  <button onClick={()=>navigate("/products")} style={{...SS,fontSize:12,color:"#c9a96e",fontWeight:600,background:"none",border:"none",cursor:"pointer"}}>{pt.seeAll}</button>
                </div>
                <p style={{...KR,fontSize:12,color:"#999",margin:0}}>{pt.meetBrandsSub}</p>
              </div>
              <div className="hide-scrollbar" style={{display:"flex",gap:16,overflowX:"auto",padding:"0 20px 4px"}}>
                {brandCards.map(({brand,img})=>(
                  <div key={brand} style={{flexShrink:0,width:64,textAlign:"center"}}>
                    <div style={{width:64,height:64,borderRadius:"50%",overflow:"hidden",border:"2px solid #e8d9b8",marginBottom:6}}>
                      <img src={img} alt={brand} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    </div>
                    <p style={{...SS,fontSize:10,color:"#555",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{brand}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BOTTOM NAV */}
          <MobileTabBar active="/program-home"/>

        </div>
      ) : (
        <div style={{background:"#ffffff",minHeight:"100vh"}}>

          {/* DESKTOP NAV */}
          <ProgramDesktopNav user={user} onAuthClick={onAuthClick} lang={lang} setLang={setLang}/>

          {/* HERO */}
          <section style={{background:"linear-gradient(135deg,#faf3e6,#f0dfb8)",padding:"clamp(56px,7vw,96px) clamp(24px,4vw,56px) clamp(48px,6vw,72px)"}}>
            <div style={{maxWidth:1240,margin:"0 auto"}}>
              <p style={{...SS,fontSize:11,color:"#a8823f",letterSpacing:3,textTransform:"uppercase",fontWeight:700,margin:"0 0 14px"}}><Star size={14}/> The Beauty Pause</p>
              <h1 style={{...KR,fontSize:"clamp(28px,3.4vw,44px)",fontWeight:700,color:"#1a1a1a",margin:"0 0 12px",lineHeight:1.3,maxWidth:640}}>{pt.heroTitle1}<br/>{pt.heroTitle2}</h1>
              <p style={{...KR,fontSize:15,color:"#6b5a3a",lineHeight:1.8,maxWidth:520}}>{pt.heroSub}</p>
            </div>
          </section>

          {/* FEATURED PROGRAMS */}
          <section style={{padding:"48px clamp(24px,4vw,56px) 56px",maxWidth:1240,margin:"0 auto",position:"relative"}}>
            <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:20}}>
              <div>
                <p style={{...KR,fontSize:22,fontWeight:700,color:"#1a1a1a",margin:"0 0 6px"}}><Star size={20}/> {pt.featuredPrograms}</p>
                <p style={{...KR,fontSize:13,color:"#999",margin:0}}>{pt.featuredProgramsSub}</p>
              </div>
              <button onClick={()=>navigate("/programs")} style={{...SS,fontSize:13,color:"#c9a96e",fontWeight:600,background:"none",border:"1px solid #f0d0d0",cursor:"pointer",padding:"7px 16px",borderRadius:20}}>{pt.seeAll} →</button>
            </div>
            <div ref={programScrollRef} className="hide-scrollbar" style={{display:"flex",gap:20,overflowX:"auto",paddingBottom:4}}>
              {loadingPrograms
                ? <p style={{...KR,fontSize:14,color:"#bbb",padding:"24px 0"}}>{pt.loading}</p>
                : programs.length===0
                  ? <p style={{...KR,fontSize:14,color:"#bbb",padding:"24px 0"}}>{pt.noPrograms}</p>
                  : programs.map((p,i)=>(
                      <div key={p.id} style={{animation:`fadeUp 0.4s ease ${i*0.05}s both`}}>
                        <ProgramCard program={p} salons={salons} onClick={()=>navigate(`/program/${p.id}`)}/>
                      </div>
                    ))
              }
            </div>
          </section>

          {/* EXPLORE SALONS */}
          <section style={{padding:"0 clamp(24px,4vw,56px) 56px",maxWidth:1240,margin:"0 auto"}}>
            <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:20}}>
              <div>
                <p style={{...KR,fontSize:22,fontWeight:700,color:"#1a1a1a",margin:"0 0 6px"}}><Star size={20}/> {pt.exploreSalons}</p>
                <p style={{...KR,fontSize:13,color:"#999",margin:0}}>{pt.exploreSalonsSub}</p>
              </div>
              <button onClick={()=>navigate("/salons")} style={{...SS,fontSize:13,color:"#c9a96e",fontWeight:600,background:"none",border:"1px solid #f0d0d0",cursor:"pointer",padding:"7px 16px",borderRadius:20}}>{pt.seeAll} →</button>
            </div>
            {loading ? (
              <p style={{...KR,fontSize:14,color:"#bbb",padding:"24px 0"}}>{pt.loading}</p>
            ) : (
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
                {exploreSalons.map((s,i)=>(
                  <div key={s.id} style={{animation:`fadeUp 0.4s ease ${i*0.03}s both`}}>
                    <ProgramSalonCard salon={s} featured={s._featured} onClick={()=>navigate("/salons",{state:{selectSalonId:s.id}})}/>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* MEET THE BRANDS */}
          {brandCards.length>0&&(
            <section style={{padding:"0 clamp(24px,4vw,56px) 80px",maxWidth:1240,margin:"0 auto"}}>
              <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:24}}>
                <div>
                  <p style={{...KR,fontSize:22,fontWeight:700,color:"#1a1a1a",margin:"0 0 6px"}}><Star size={20}/> {pt.meetBrands}</p>
                  <p style={{...KR,fontSize:13,color:"#999",margin:0}}>{pt.meetBrandsSub}</p>
                </div>
                <button onClick={()=>navigate("/products")} style={{...SS,fontSize:13,color:"#c9a96e",fontWeight:600,background:"none",border:"1px solid #f0d0d0",cursor:"pointer",padding:"7px 16px",borderRadius:20}}>{pt.seeAll} →</button>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:28}}>
                {brandCards.map(({brand,img})=>(
                  <div key={brand} style={{width:84,textAlign:"center"}}>
                    <div style={{width:84,height:84,borderRadius:"50%",overflow:"hidden",border:"2px solid #e8d9b8",marginBottom:8}}>
                      <img src={img} alt={brand} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    </div>
                    <p style={{...SS,fontSize:11,color:"#555",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{brand}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* FOOTER */}
          <footer style={{background:"#0d0d0d",padding:"32px clamp(24px,4vw,56px)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16,borderTop:"1px solid rgba(255,255,255,0.05)"}}>
            <div>
              <div style={{marginBottom:4}}>
                <span style={{...CG,fontSize:14,color:"#f5f0eb",letterSpacing:3,fontWeight:300}}>THE</span>
                <span style={{...CG,fontSize:14,color:"#c9a96e",letterSpacing:3,fontWeight:600,marginLeft:5}}>BEAUTY PAUSE</span>
              </div>
              <p style={{...SS,fontSize:10,color:"#333",margin:0}}>© 2026 The Beauty Pause</p>
            </div>
            <div style={{display:"flex",gap:16,alignItems:"center"}}>
              <a href="/privacy" style={{...SS,fontSize:11,color:"#444",textDecoration:"none"}}>Privacy</a>
              <span style={{color:"#222"}}>·</span>
              <a href="/legal" style={{...SS,fontSize:11,color:"#444",textDecoration:"none"}}>Legal</a>
              <span style={{color:"#222"}}>·</span>
              <a href="mailto:hello@thebeautypause.com" style={{...SS,fontSize:11,color:"#444",textDecoration:"none"}}>Contact</a>
            </div>
          </footer>

        </div>
      )}
    </>
  );
}

// ── PROGRAM DETAIL PAGE ──────────────────────────────────────────────────────

// ── PROGRAMS LIST PAGE (전체보기 — swipeable carousel + synced map) ─────────
function ProgramsListPage({ salons, programs, loadingPrograms, user, onAuthClick }) {
  const [lang, setLang] = useState("en");
  const pt = PT[lang];
  const navigate = useNavigate();
  const KR = {fontFamily:"'Noto Sans KR','Apple SD Gothic Neo',sans-serif"};
  const SS = {fontFamily:"'DM Sans',sans-serif"};
  const CG = {fontFamily:"'Cormorant Garamond',serif"};
  const isMobile = window.innerWidth<768;
  const CARD_W = 296, GAP = 14, STEP = CARD_W+GAP;

  const scrollRef = useRef(null);
  const [centerIndex, setCenterIndex] = useState(0);
  const [lr, setLr] = useState(!!window.L);
  useEffect(()=>{if(window.L){setLr(true);return;}const lnk=document.createElement("link");lnk.rel="stylesheet";lnk.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";document.head.appendChild(lnk);const s=document.createElement("script");s.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";s.onload=()=>setLr(true);document.head.appendChild(s);},[]);

  // default to the 2nd card centered so the row doesn't feel empty on the left
  useEffect(()=>{
    if (!loadingPrograms && (programs||[]).length>1) {
      setCenterIndex(1);
      requestAnimationFrame(()=>{ scrollRef.current?.scrollTo({left:STEP*1, behavior:"auto"}); });
    }
  },[loadingPrograms]);

  const handleScroll = () => {
    const el = scrollRef.current; if (!el) return;
    const idx = Math.round(el.scrollLeft / STEP);
    setCenterIndex(Math.max(0, Math.min((programs||[]).length-1, idx)));
  };

  const activeProgram = (programs||[])[centerIndex];
  const activeSalons = useMemo(()=>{
    if (!activeProgram) return [];
    const live = (salons||[]).filter(s=>(activeProgram.salonIds||[]).includes(s.id));
    return live;
  }, [activeProgram, salons]);

  // list-view filters
  const [catFilter, setCatFilter] = useState("All");
  const [areaFilter, setAreaFilter] = useState("All");
  const categories = ["All","Hair","Nail","Skin","Body"];

  const programSalonsMap = useMemo(()=>{
    const map = {};
    (programs||[]).forEach(p=>{
      const live = (salons||[]).filter(s=>(p.salonIds||[]).includes(s.id));
      map[p.id] = live;
    });
    return map;
  }, [programs, salons]);

  const areas = useMemo(()=>{
    const set = new Set();
    Object.values(programSalonsMap).forEach(list=>list.forEach(s=>{ if (s.area) set.add(s.area); }));
    return ["All", ...Array.from(set).sort()];
  }, [programSalonsMap]);

  const filteredPrograms = useMemo(()=>{
    return (programs||[]).filter(p=>{
      if (catFilter!=="All" && p.category!==catFilter) return false;
      if (areaFilter!=="All") {
        const areasForP = (programSalonsMap[p.id]||[]).map(s=>s.area);
        if (!areasForP.includes(areaFilter)) return false;
      }
      return true;
    });
  }, [programs, catFilter, areaFilter, programSalonsMap]);

  // desktop: hover-to-highlight map
  const [hoveredProgramId, setHoveredProgramId] = useState(null);
  const desktopMapSalons = useMemo(()=>{
    if (hoveredProgramId) return programSalonsMap[hoveredProgramId]||[];
    const all = filteredPrograms.flatMap(p=>programSalonsMap[p.id]||[]);
    const seen = new Set(); const uniq=[];
    all.forEach(s=>{ if(!seen.has(s.id)){seen.add(s.id);uniq.push(s);} });
    return uniq;
  }, [hoveredProgramId, filteredPrograms, programSalonsMap]);

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Noto+Sans+KR:wght@300;400;500;700&family=DM+Sans:wght@300;400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0}html,body{background:#ffffff}.hide-scrollbar{scrollbar-width:none;-ms-overflow-style:none}.hide-scrollbar::-webkit-scrollbar{display:none}@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}.leaflet-tooltip{background:#fff;border:1px solid #ede8e2;border-radius:8px;padding:6px 10px}`}</style>

      {isMobile ? (
      <div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",background:"#ffffff"}}>
        {/* NAV */}
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"20px 20px 4px"}}>
          <button onClick={()=>navigate("/program-home")} style={{width:36,height:36,borderRadius:"50%",background:"#fff",border:"1px solid #f0e5cf",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <p style={{...KR,fontSize:16,fontWeight:700,color:"#1a1a1a",margin:0}}><Star size={15}/> {pt.featuredPrograms}</p>
          <div style={{display:"flex",border:"1px solid #f0e5cf",borderRadius:20,overflow:"hidden",marginLeft:"auto"}}>
            {["en","fr"].map(l=><button key={l} onClick={()=>setLang(l)} style={{padding:"6px 9px",border:"none",cursor:"pointer",...SS,fontSize:10,fontWeight:600,color:lang===l?"#0d0d0d":"#999",background:lang===l?"#c9a96e":"transparent",textTransform:"uppercase"}}>{l}</button>)}
          </div>
        </div>

        {loadingPrograms ? (
          <p style={{...KR,fontSize:13,color:"#bbb",textAlign:"center",padding:"60px 0"}}>{pt.loading}</p>
        ) : (programs||[]).length===0 ? (
          <p style={{...KR,fontSize:13,color:"#bbb",textAlign:"center",padding:"60px 0"}}>{pt.noPrograms}</p>
        ) : (
          <>
            {/* CAROUSEL */}
            <div style={{position:"relative"}}>
              <div ref={scrollRef} onScroll={handleScroll} className="hide-scrollbar"
                style={{display:"flex",gap:GAP,overflowX:"auto",scrollSnapType:"x mandatory",WebkitOverflowScrolling:"touch",padding:`28px calc(50% - ${CARD_W/2}px) 18px`}}>
                {programs.map((p,i)=>(
                  <div key={p.id} style={{flexShrink:0,scrollSnapAlign:"center",transition:"opacity 0.25s ease, transform 0.25s ease",opacity:i===centerIndex?1:0.35,transform:i===centerIndex?"scale(1)":"scale(0.9)"}}>
                    <ProgramCard program={p} salons={salons} onClick={()=>navigate(`/program/${p.id}`)}/>
                  </div>
                ))}
              </div>
              {programs.length>1&&(
                <>
                  <button onClick={()=>scrollRef.current?.scrollBy({left:-STEP,behavior:"smooth"})}
                    style={{position:"absolute",left:6,top:"calc(50% - 5px)",transform:"translateY(-50%)",width:34,height:34,borderRadius:"50%",background:"rgba(255,255,255,0.92)",border:"1px solid #f0e5cf",boxShadow:"0 2px 8px rgba(0,0,0,0.1)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",zIndex:2}}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  <button onClick={()=>scrollRef.current?.scrollBy({left:STEP,behavior:"smooth"})}
                    style={{position:"absolute",right:6,top:"calc(50% - 5px)",transform:"translateY(-50%)",width:34,height:34,borderRadius:"50%",background:"rgba(255,255,255,0.92)",border:"1px solid #f0e5cf",boxShadow:"0 2px 8px rgba(0,0,0,0.1)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",zIndex:2}}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                </>
              )}
            </div>

            {/* DOTS */}
            <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:22}}>
              {programs.map((_,i)=>(
                <div key={i} style={{width:i===centerIndex?16:6,height:6,borderRadius:3,background:i===centerIndex?"#c9a96e":"#e5ddc8",transition:"width 0.2s"}}/>
              ))}
            </div>

            {/* SYNCED MAP */}
            <div style={{margin:"0 20px 32px",borderRadius:16,overflow:"hidden",border:"1px solid #f0e9dc",height:280}}>
              {!lr ? (
                <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",...KR,fontSize:12,color:"#bbb"}}>{pt.mapLoading}</div>
              ) : activeSalons.length===0 ? (
                <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",...KR,fontSize:12,color:"#bbb"}}>{pt.noLocation}</div>
              ) : (
                <SalonMap salons={activeSalons} fitToSalons={activeSalons} compact={true} />
              )}
            </div>

            {/* FILTERS */}
            <div style={{padding:"0 20px",marginBottom:14}}>
              <p style={{...KR,fontSize:15,fontWeight:700,color:"#1a1a1a",margin:"0 0 12px"}}>{pt.featuredPrograms}</p>
              <div className="hide-scrollbar" style={{display:"flex",gap:8,overflowX:"auto",marginBottom:10,paddingBottom:2}}>
                {categories.map(c=>{
                  const active = catFilter===c;
                  return (
                    <button key={c} onClick={()=>setCatFilter(c)}
                      style={{flexShrink:0,padding:"7px 14px",borderRadius:20,border:`1.5px solid ${active?"#1a1a1a":"#f0e5cf"}`,background:active?"#1a1a1a":"#fff",color:active?"#fff":"#666",cursor:"pointer",...SS,fontSize:12,fontWeight:500}}>
                      {c==="All"?pt.allCategories:c}
                    </button>
                  );
                })}
              </div>
              <select value={areaFilter} onChange={e=>setAreaFilter(e.target.value)}
                style={{width:"100%",padding:"9px 12px",border:"1px solid #f0e5cf",borderRadius:10,background:"#fff",...SS,fontSize:12,color:"#555",outline:"none"}}>
                {areas.map(a=><option key={a} value={a}>{a==="All"?pt.allAreas:a}</option>)}
              </select>
            </div>

            {/* LIST */}
            <div style={{padding:"0 20px 40px",display:"flex",flexDirection:"column",gap:8}}>
              {filteredPrograms.length===0 ? (
                <p style={{...KR,fontSize:13,color:"#bbb",textAlign:"center",padding:"32px 0"}}>{pt.noMatch}</p>
              ) : filteredPrograms.map(p=>{
                const pSalons = programSalonsMap[p.id]||[];
                const salonLabel = pSalons.length>1 ? `${pSalons[0]?.name} +${pSalons.length-1}` : pSalons[0]?.name;
                return (
                  <div key={p.id} onClick={()=>navigate(`/program/${p.id}`)}
                    style={{display:"flex",gap:12,alignItems:"center",background:"#fff",border:"1px solid #f0e9dc",borderRadius:14,padding:10,cursor:"pointer"}}>
                    <div style={{width:56,height:56,borderRadius:10,overflow:"hidden",flexShrink:0,background:"#f0ebe2"}}>
                      {p.image
                        ? <img src={p.image} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                        : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:"#c9a96e"}}>✦</span></div>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{...KR,fontSize:13,fontWeight:700,color:"#1a1a1a",margin:"0 0 2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</p>
                      <p style={{...SS,fontSize:10,color:"#aaa",margin:"0 0 4px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{salonLabel}</p>
                      <p style={{...SS,fontSize:11,color:"#c9a96e",fontWeight:700,margin:0}}>€{p.price} · {p.duration}</p>
                    </div>
                    <span style={{color:"#ddd",fontSize:16,flexShrink:0}}>›</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
        <div style={{height:80}}/>
        <MobileTabBar active="/programs"/>
      </div>
      ) : (
        <div style={{background:"#ffffff",minHeight:"100vh"}}>
          <ProgramDesktopNav user={user} onAuthClick={onAuthClick} lang={lang} setLang={setLang}/>

          <div style={{padding:"32px clamp(24px,4vw,56px) 8px",maxWidth:1280,margin:"0 auto"}}>
            <p style={{...KR,fontSize:24,fontWeight:700,color:"#1a1a1a",margin:0}}><Star size={22}/> {pt.featuredPrograms}</p>
          </div>

          {loadingPrograms ? (
            <p style={{...KR,fontSize:14,color:"#bbb",textAlign:"center",padding:"80px 0"}}>{pt.loading}</p>
          ) : (programs||[]).length===0 ? (
            <p style={{...KR,fontSize:14,color:"#bbb",textAlign:"center",padding:"80px 0"}}>{pt.noPrograms}</p>
          ) : (
            <div style={{maxWidth:1280,margin:"0 auto",padding:"16px clamp(24px,4vw,56px) 60px"}}>

              {/* FILTER BAR */}
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,flexWrap:"wrap"}}>
                {categories.map(c=>{
                  const active = catFilter===c;
                  return (
                    <button key={c} onClick={()=>setCatFilter(c)}
                      style={{padding:"8px 16px",borderRadius:20,border:`1.5px solid ${active?"#1a1a1a":"#ede8e2"}`,background:active?"#1a1a1a":"#fff",color:active?"#fff":"#666",cursor:"pointer",...SS,fontSize:13,fontWeight:500}}>
                      {c==="All"?pt.allCategories:c}
                    </button>
                  );
                })}
                <div style={{width:1,height:20,background:"#ede8e2"}}/>
                <select value={areaFilter} onChange={e=>setAreaFilter(e.target.value)}
                  style={{padding:"8px 14px",border:"1px solid #ede8e2",borderRadius:10,background:"#fff",...SS,fontSize:13,color:"#555",outline:"none",cursor:"pointer"}}>
                  {areas.map(a=><option key={a} value={a}>{a==="All"?pt.allAreas:a}</option>)}
                </select>
              </div>

              {/* SPLIT: LIST + MAP */}
              <div style={{display:"flex",gap:28}}>
                {/* LEFT: program list */}
                <div style={{flex:"1 1 55%",minWidth:0}}>
                  <p style={{...SS,fontSize:12,color:"#aaa",margin:"0 0 16px"}}>{filteredPrograms.length} programs</p>
                  {filteredPrograms.length===0 ? (
                    <p style={{...KR,fontSize:14,color:"#bbb",textAlign:"center",padding:"60px 0"}}>{pt.noMatch}</p>
                  ) : (
                    <div style={{display:"flex",flexDirection:"column",gap:14}}>
                      {filteredPrograms.map(p=>{
                        const pSalons = programSalonsMap[p.id]||[];
                        const salonLabel = pSalons.length>1 ? `${pSalons[0]?.name} +${pSalons.length-1}` : pSalons[0]?.name;
                        return (
                          <div key={p.id} onClick={()=>navigate(`/program/${p.id}`)}
                            onMouseEnter={()=>setHoveredProgramId(p.id)} onMouseLeave={()=>setHoveredProgramId(null)}
                            style={{display:"flex",background:"#fff",border:`1.5px solid ${hoveredProgramId===p.id?"#c9a96e":"#f0e9dc"}`,borderRadius:18,overflow:"hidden",cursor:"pointer",transition:"border-color 0.15s",height:176}}>
                            <div style={{width:220,flexShrink:0,position:"relative",background:"#f0ebe2"}}>
                              {p.image
                                ? <img src={p.image} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                                : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><Star size={32}/></div>}
                              {p.category&&<div style={{position:"absolute",top:12,left:12,background:"rgba(255,255,255,0.92)",color:"#1a1a1a",...SS,fontSize:10,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",padding:"4px 10px",borderRadius:20}}>{p.category}</div>}
                              {p.tag&&<div style={{position:"absolute",top:12,right:12,background:"#c9a96e",color:"#0d0d0d",...SS,fontSize:10,fontWeight:700,letterSpacing:0.5,padding:"4px 10px",borderRadius:20}}>{p.tag}</div>}
                            </div>
                            <div style={{flex:1,minWidth:0,padding:"20px 24px",display:"flex",flexDirection:"column",justifyContent:"center"}}>
                              <p style={{...SS,fontSize:11,color:"#aaa",margin:"0 0 6px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{salonLabel}</p>
                              <p style={{...KR,fontSize:22,fontWeight:700,color:"#1a1a1a",margin:"0 0 8px",lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</p>
                              <p style={{...SS,fontSize:12,color:"#999",margin:"0 0 14px"}}>{p.periodLabel}</p>
                              <div style={{display:"flex",alignItems:"baseline",gap:8}}>
                                {p.priceOriginal&&<span style={{...SS,fontSize:13,color:"#bbb",textDecoration:"line-through"}}>€{p.priceOriginal}</span>}
                                <span style={{...KR,fontSize:20,color:"#1a1a1a",fontWeight:700}}>€{p.price}</span>
                                <span style={{...SS,fontSize:13,color:"#c9a96e",fontWeight:600,marginLeft:6}}>⏱ {p.duration}</span>
                              </div>
                            </div>
                            <div style={{display:"flex",alignItems:"center",padding:"0 20px",flexShrink:0}}>
                              <span style={{color:"#ddd",fontSize:20}}>›</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* RIGHT: sticky map */}
                <div style={{flex:"1 1 45%",position:"sticky",top:84,alignSelf:"flex-start",height:"calc(100vh - 120px)",borderRadius:16,overflow:"hidden",border:"1px solid #f0e9dc"}}>
                  {!lr ? (
                    <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",...KR,fontSize:13,color:"#bbb"}}>{pt.mapLoading}</div>
                  ) : desktopMapSalons.length===0 ? (
                    <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",...KR,fontSize:13,color:"#bbb"}}>{pt.noLocation}</div>
                  ) : (
                    <SalonMap salons={desktopMapSalons} fitToSalons={desktopMapSalons} highlightId={hoveredProgramId?desktopMapSalons[0]?.id:null} compact={true} />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ── SEARCH PAGE ───────────────────────────────────────────────────────────────
function SearchPage({ salons, allProducts, programs }) {
  const navigate = useNavigate();
  const [lang,setLang] = useState("en");
  const pt = PT[lang];
  const KR = {fontFamily:"'Noto Sans KR','Apple SD Gothic Neo',sans-serif"};
  const SS = {fontFamily:"'DM Sans',sans-serif"};
  const CG = {fontFamily:"'Cormorant Garamond',serif"};
  const [q, setQ] = useState("");
  const inputRef = useRef(null);
  useEffect(()=>{ inputRef.current?.focus(); },[]);

  const query = q.trim().toLowerCase();
  const matchedPrograms = query ? (programs||[]).filter(p=>{
    if (p.name?.toLowerCase().includes(query)) return true;
    const pSalonNames = (p.salonIds||[]).map(id=>(salons||[]).find(s=>s.id===id)?.name).filter(Boolean);
    return pSalonNames.some(n=>n.toLowerCase().includes(query));
  }) : [];
  const matchedSalons = query ? (salons||[]).filter(s=>s.name?.toLowerCase().includes(query)) : [];
  const matchedProducts = query ? (allProducts||[]).filter(p=>{
    const brand = p.brand_name || (Array.isArray(p.brand)?null:(!p.brand?.startsWith?.("rec")?p.brand:null)) || "";
    return p.product_name?.toLowerCase().includes(query) || String(brand).toLowerCase().includes(query);
  }) : [];
  const totalResults = matchedPrograms.length + matchedSalons.length + matchedProducts.length;

  const ResultRow = ({ img, title, subtitle, onClick }) => (
    <div onClick={onClick} style={{display:"flex",gap:12,alignItems:"center",background:"#fff",border:"1px solid #f0e9dc",borderRadius:14,padding:10,cursor:"pointer"}}>
      <div style={{width:48,height:48,borderRadius:10,overflow:"hidden",flexShrink:0,background:"#f0ebe2"}}>
        {img
          ? <img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:"#c9a96e"}}>✦</span></div>}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <p style={{...KR,fontSize:13,fontWeight:700,color:"#1a1a1a",margin:"0 0 2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{title}</p>
        {subtitle&&<p style={{...SS,fontSize:11,color:"#aaa",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{subtitle}</p>}
      </div>
      <span style={{color:"#ddd",fontSize:16,flexShrink:0}}>›</span>
    </div>
  );

  const Section = ({ title, count, children }) => (
    <div style={{marginBottom:24}}>
      <p style={{...SS,fontSize:10,color:"#c9a96e",letterSpacing:1,textTransform:"uppercase",fontWeight:700,margin:"0 0 10px"}}>{title} ({count})</p>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>{children}</div>
    </div>
  );

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Noto+Sans+KR:wght@300;400;500;700&family=DM+Sans:wght@300;400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0}html,body{background:#ffffff}`}</style>
      <div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",background:"#ffffff",paddingBottom:40}}>

        {/* HEADER + SEARCH INPUT */}
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"20px 20px 16px"}}>
          <button onClick={()=>navigate(-1)} style={{width:36,height:36,borderRadius:"50%",background:"#fff",border:"1px solid #f0e5cf",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div style={{flex:1,position:"relative"}}>
            <input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)} placeholder={pt.searchPlaceholder}
              style={{width:"100%",padding:"11px 14px",border:"1px solid #f0e5cf",borderRadius:20,background:"#faf7f4",...SS,fontSize:13,color:"#1a1a1a",outline:"none",boxSizing:"border-box"}}/>
          </div>
          <div style={{display:"flex",border:"1px solid #f0e5cf",borderRadius:20,overflow:"hidden",flexShrink:0}}>
            {["en","fr"].map(l=><button key={l} onClick={()=>setLang(l)} style={{padding:"6px 9px",border:"none",cursor:"pointer",...SS,fontSize:10,fontWeight:600,color:lang===l?"#0d0d0d":"#999",background:lang===l?"#c9a96e":"transparent",textTransform:"uppercase"}}>{l}</button>)}
          </div>
        </div>

        <div style={{padding:"0 20px"}}>
          {!query ? (
            <p style={{...KR,fontSize:13,color:"#bbb",textAlign:"center",padding:"40px 0"}}>{pt.searchHint}</p>
          ) : totalResults===0 ? (
            <p style={{...KR,fontSize:13,color:"#bbb",textAlign:"center",padding:"40px 0"}}>{pt.searchNoResults} "{q}"</p>
          ) : (
            <>
              {matchedPrograms.length>0&&(
                <Section title="Programs" count={matchedPrograms.length}>
                  {matchedPrograms.map(p=>(
                    <ResultRow key={p.id} img={p.image} title={p.name} subtitle={p.price?`€${p.price} · ${p.duration}`:p.duration}
                      onClick={()=>navigate(`/program/${p.id}`)}/>
                  ))}
                </Section>
              )}
              {matchedSalons.length>0&&(
                <Section title="Salons" count={matchedSalons.length}>
                  {matchedSalons.map(s=>(
                    <ResultRow key={s.id} img={getSalonImg(s)} title={s.name} subtitle={s.area||"Paris"}
                      onClick={()=>navigate("/salons")}/>
                  ))}
                </Section>
              )}
              {matchedProducts.length>0&&(
                <Section title="Products" count={matchedProducts.length}>
                  {matchedProducts.map(p=>(
                    <ResultRow key={p.id} img={getProdImg(p)} title={p.product_name} subtitle={p.brand_name || (Array.isArray(p.brand)?null:(!p.brand?.startsWith?.("rec")?p.brand:null)) || ""}
                      onClick={()=>navigate("/products")}/>
                  ))}
                </Section>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function ProgramDetailPage({ salons, allProducts, user, onAuthClick, programs, loadingPrograms }) {
  const { programId } = useParams();
  const navigate = useNavigate();
  const [lang, setLang] = useState("en");
  const pt = PT[lang];
  const KR = {fontFamily:"'Noto Sans KR','Apple SD Gothic Neo',sans-serif"};
  const SS = {fontFamily:"'DM Sans',sans-serif"};
  const CG = {fontFamily:"'Cormorant Garamond',serif"};
  const isMobile = window.innerWidth<768;

  const program = (programs||[]).find(p=>p.id===programId);
  const matchedProduct = program?.product ? (allProducts||[]).find(p=>p.product_name===program.product.name) : null;
  const liveSalons = (salons||[]).filter(s=>(program?.salonIds||[]).includes(s.id));
  const programSalons = liveSalons;
  const [step, setStep] = useState("idle"); // idle | select-salon | payment | confirmed
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [lr, setLr] = useState(!!window.L);
  useEffect(()=>{if(window.L){setLr(true);return;}const lnk=document.createElement("link");lnk.rel="stylesheet";lnk.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";document.head.appendChild(lnk);const s=document.createElement("script");s.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";s.onload=()=>setLr(true);document.head.appendChild(s);},[]);

  if (loadingPrograms) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Noto Sans KR',sans-serif",color:"#bbb",fontSize:14}}>{pt.loading}</div>
  );

  if (!program) return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,fontFamily:"'Noto Sans KR',sans-serif"}}>
      <p style={{fontSize:16,color:"#888"}}>{pt.notFound}</p>
      <button onClick={()=>navigate("/program-home")} style={{padding:"10px 20px",background:"#1a1a1a",color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13}}>{pt.backHome}</button>
    </div>
  );

  const submitApplication = async () => {
    const newOrderId = `TBP${Date.now().toString(36).toUpperCase()}`;
    setOrderId(newOrderId);
    setSubmitError("");
    try {
      const fields = {
        program: [program.id],
        salon: selectedSalon?.id && !selectedSalon.id.startsWith("sample-") ? [selectedSalon.id] : undefined,
        program_name: program.name,
        salon_name: selectedSalon?.name,
        user_email: user?.email,
        user_name: user?.user_metadata?.first_name || "",
        payment_method: "onsite",
        order_id: newOrderId,
        status: "confirmed",
      };
      Object.keys(fields).forEach(k=>fields[k]===undefined&&delete fields[k]);
      if (TBL_PROGRAM_SIGNUPS && TBL_PROGRAM_SIGNUPS !== "REPLACE_WITH_REAL_TABLE_ID") {
        await fetch(`https://api.airtable.com/v0/${AT_BASE}/${TBL_PROGRAM_SIGNUPS}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${AT_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ records: [{ fields }] }),
        });
      } else {
        console.log("Program signup table not configured yet — skipping Airtable write.", fields);
      }
    } catch(e) {
      console.error("Program signup error:", e);
      setSubmitError("There was an issue saving your application, but it went through.");
    }
    setStep("confirmed");
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Noto+Sans+KR:wght@300;400;500;700&family=DM+Sans:wght@300;400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0}html,body{background:#ffffff}@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}`}</style>

      {isMobile ? (
      <div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",background:"#ffffff",paddingBottom:110,position:"relative",animation:"fadeUp 0.4s ease both"}}>

        {/* HERO IMAGE */}
        <div style={{position:"relative",width:"100%",aspectRatio:"5/3",overflow:"hidden",background:"#eee2c8"}}>
          <img src={program.image} alt={program.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(13,13,13,0.55) 0%,transparent 40%)"}}/>
          <button onClick={()=>navigate(-1)} style={{position:"absolute",top:18,left:18,width:38,height:38,borderRadius:"50%",background:"rgba(255,255,255,0.9)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div style={{position:"absolute",top:18,left:64,display:"flex",border:"1px solid rgba(255,255,255,0.4)",borderRadius:20,overflow:"hidden",background:"rgba(0,0,0,0.3)"}}>
            {["en","fr"].map(l=><button key={l} onClick={()=>setLang(l)} style={{padding:"7px 10px",border:"none",cursor:"pointer",...SS,fontSize:10,fontWeight:600,color:lang===l?"#0d0d0d":"#fff",background:lang===l?"#c9a96e":"transparent",textTransform:"uppercase"}}>{l}</button>)}
          </div>
          {program.tag&&<div style={{position:"absolute",top:18,right:18,background:"#c9a96e",color:"#0d0d0d",...SS,fontSize:10,fontWeight:700,letterSpacing:0.5,padding:"5px 12px",borderRadius:20}}>{program.tag}</div>}
        </div>

        {/* INFO */}
        <div style={{padding:"22px 20px 0"}}>
          <p style={{...KR,fontSize:22,fontWeight:700,color:"#1a1a1a",margin:"0 0 10px",lineHeight:1.3}}>{program.name}</p>
          <p style={{...SS,fontSize:12,color:"#999",margin:"0 0 20px"}}>{pt.period} 📅 {program.periodLabel}</p>

          {/* collab product — circular card (right under period, product matters most) */}
          {program.product&&(
            <div style={{marginBottom:24}}>
              <p style={{...KR,fontSize:11,color:"#c9a96e",letterSpacing:1,textTransform:"uppercase",fontWeight:700,margin:"0 0 12px"}}>{pt.collabProduct}</p>
              <div onClick={()=>navigate("/products", matchedProduct?{state:{selectProductId:matchedProduct.id}}:undefined)}
                style={{display:"flex",alignItems:"center",gap:14,background:"#fff",border:"1px solid #f0e9dc",borderRadius:16,padding:14,cursor:"pointer"}}>
                <div style={{width:64,height:64,borderRadius:"50%",overflow:"hidden",flexShrink:0,border:"2px solid #e8d9b8"}}>
                  <img src={program.product.image} alt={program.product.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                </div>
                <div style={{minWidth:0,flex:1}}>
                  <p style={{...SS,fontSize:10,color:"#c9a96e",letterSpacing:0.5,textTransform:"uppercase",fontWeight:700,margin:"0 0 3px"}}>{program.product.brand}</p>
                  <p style={{...KR,fontSize:14,fontWeight:700,color:"#1a1a1a",margin:0,lineHeight:1.3}}>{program.product.name}</p>
                </div>
                <span style={{color:"#ddd",fontSize:18,flexShrink:0}}>›</span>
              </div>
            </div>
          )}

          {/* price */}
          <div style={{display:"flex",alignItems:"baseline",gap:10,padding:"16px 0",borderTop:"1px solid #f0e5cf",borderBottom:"1px solid #f0e5cf",marginBottom:24}}>
            {program.priceOriginal&&<span style={{...SS,fontSize:14,color:"#bbb",textDecoration:"line-through"}}>€{program.priceOriginal}</span>}
            <span style={{...KR,fontSize:26,color:"#1a1a1a",fontWeight:700}}>€{program.price}</span>
            <span style={{...SS,fontSize:12,color:"#999",marginLeft:"auto"}}>⏱ {program.duration}</span>
          </div>

          {/* description */}
          <p style={{...KR,fontSize:13,color:"#666",lineHeight:1.8,marginBottom:24}}>{program.description}</p>

          {/* includes */}
          <p style={{...KR,fontSize:11,color:"#c9a96e",letterSpacing:1,textTransform:"uppercase",fontWeight:700,margin:"0 0 12px"}}>{pt.included}</p>
          <div style={{display:"flex",flexDirection:"column",gap:0,marginBottom:28}}>
            {program.includes.map(i=>(
              <div key={i} style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{color:"#c9a96e",fontSize:12,flexShrink:0}}>✓</span>
                <p style={{...KR,fontSize:13,color:"#555",margin:"7px 0"}}>{i}</p>
              </div>
            ))}
          </div>

          {/* salons running this program */}
          {programSalons.length>0&&(
            <div style={{marginBottom:28}}>
              <p style={{...KR,fontSize:11,color:"#c9a96e",letterSpacing:1,textTransform:"uppercase",fontWeight:700,margin:"0 0 12px"}}>{pt.runningSalons} {programSalons.length>1&&`(${programSalons.length} ${pt.locations})`}</p>
              <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
                {programSalons.map(s=>(
                  <ProgramSalonCard key={s.id} salon={s} showAddress onClick={()=>navigate("/salons",{state:{selectSalonId:s.id}})}/>
                ))}
              </div>
              <div style={{borderRadius:16,overflow:"hidden",border:"1px solid #f0e9dc",height:200}}>
                {lr
                  ? <SalonMap salons={programSalons} mini={true} compact={true} fitToSalons={programSalons} />
                  : <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",...KR,fontSize:12,color:"#bbb"}}>{pt.mapLoading}</div>}
              </div>
            </div>
          )}
        </div>

        {/* FIXED CTA (idle only) */}
        {step==="idle" && (
          <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#fff",borderTop:"1px solid #f0e5cf",padding:"16px 20px calc(16px + env(safe-area-inset-bottom))"}}>
            <div style={{maxWidth:480,margin:"0 auto"}}>
              <button onClick={()=>{ if (!user) { onAuthClick?.("login"); return; } setStep("select-salon"); }}
                style={{width:"100%",padding:"15px",background:"linear-gradient(135deg,#c9a96e,#b8944d)",color:"#0d0d0d",border:"none",borderRadius:12,cursor:"pointer",...KR,fontSize:14,fontWeight:700}}>
                {user ? pt.applyNow : pt.loginAndApply}
              </button>
            </div>
          </div>
        )}
      </div>
      ) : (
        <div style={{background:"#ffffff",minHeight:"100vh"}}>
          <ProgramDesktopNav user={user} onAuthClick={onAuthClick} lang={lang} setLang={setLang}/>

          <div style={{maxWidth:1200,margin:"0 auto",padding:"40px clamp(24px,4vw,56px) 80px",display:"flex",gap:40}}>

            {/* LEFT: content */}
            <div style={{flex:"1 1 60%",minWidth:0}}>
              <button onClick={()=>navigate(-1)} style={{background:"none",border:"none",cursor:"pointer",...SS,fontSize:13,color:"#999",padding:0,marginBottom:20,display:"flex",alignItems:"center",gap:6}}>
                ‹ {pt.back}
              </button>

              <div style={{position:"relative",width:"100%",aspectRatio:"5/3",borderRadius:20,overflow:"hidden",background:"#eee2c8",marginBottom:28}}>
                <img src={program.image} alt={program.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                {program.tag&&<div style={{position:"absolute",top:18,left:18,background:"#c9a96e",color:"#0d0d0d",...SS,fontSize:11,fontWeight:700,letterSpacing:0.5,padding:"6px 14px",borderRadius:20}}>{program.tag}</div>}
              </div>

              <p style={{...KR,fontSize:28,fontWeight:700,color:"#1a1a1a",margin:"0 0 8px",lineHeight:1.3}}>{program.name}</p>
              <p style={{...SS,fontSize:13,color:"#999",margin:"0 0 24px"}}>{pt.period} 📅 {program.periodLabel}</p>

              {program.product&&(
                <div style={{marginBottom:28,maxWidth:600}}>
                  <p style={{...KR,fontSize:12,color:"#c9a96e",letterSpacing:1,textTransform:"uppercase",fontWeight:700,margin:"0 0 14px"}}>{pt.collabProduct}</p>
                  <div onClick={()=>navigate("/products", matchedProduct?{state:{selectProductId:matchedProduct.id}}:undefined)}
                    style={{display:"flex",alignItems:"center",gap:14,background:"#faf7f4",border:"1px solid #f0e9dc",borderRadius:16,padding:14,cursor:"pointer"}}>
                    <div style={{width:60,height:60,borderRadius:"50%",overflow:"hidden",flexShrink:0,border:"2px solid #e8d9b8"}}>
                      <img src={program.product.image} alt={program.product.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    </div>
                    <div style={{minWidth:0,flex:1}}>
                      <p style={{...SS,fontSize:10,color:"#c9a96e",letterSpacing:0.5,textTransform:"uppercase",fontWeight:700,margin:"0 0 3px"}}>{program.product.brand}</p>
                      <p style={{...KR,fontSize:14,fontWeight:700,color:"#1a1a1a",margin:0,lineHeight:1.3}}>{program.product.name}</p>
                    </div>
                    <span style={{color:"#ddd",fontSize:18,flexShrink:0}}>›</span>
                  </div>
                </div>
              )}

              <p style={{...KR,fontSize:15,color:"#666",lineHeight:1.9,marginBottom:28,maxWidth:600}}>{program.description}</p>

              <p style={{...KR,fontSize:12,color:"#c9a96e",letterSpacing:1,textTransform:"uppercase",fontWeight:700,margin:"0 0 14px"}}>{pt.included}</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 24px",marginBottom:32,maxWidth:600}}>
                {program.includes.map(i=>(
                  <div key={i} style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{color:"#c9a96e",fontSize:13,flexShrink:0}}>✓</span>
                    <p style={{...KR,fontSize:14,color:"#555",margin:"7px 0"}}>{i}</p>
                  </div>
                ))}
              </div>

              {programSalons.length>0&&(
                <div>
                  <p style={{...KR,fontSize:12,color:"#c9a96e",letterSpacing:1,textTransform:"uppercase",fontWeight:700,margin:"0 0 14px"}}>{pt.runningSalons} {programSalons.length>1&&`(${programSalons.length} ${pt.locations})`}</p>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
                    {programSalons.map(s=>(
                      <ProgramSalonCard key={s.id} salon={s} showAddress onClick={()=>navigate("/salons",{state:{selectSalonId:s.id}})}/>
                    ))}
                  </div>
                  <div style={{borderRadius:16,overflow:"hidden",border:"1px solid #f0e9dc",height:280}}>
                    {lr
                      ? <SalonMap salons={programSalons} mini={true} compact={true} fitToSalons={programSalons} />
                      : <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",...KR,fontSize:13,color:"#bbb"}}>{pt.mapLoading}</div>}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: sticky booking card — price, duration, CTA only */}
            <div style={{flex:"1 1 34%",maxWidth:340}}>
              <div style={{position:"sticky",top:96,background:"#fff",border:"1px solid #f0e9dc",borderRadius:20,padding:24}}>
                <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:24}}>
                  {program.priceOriginal&&<span style={{...SS,fontSize:14,color:"#bbb",textDecoration:"line-through"}}>€{program.priceOriginal}</span>}
                  <span style={{...KR,fontSize:28,color:"#1a1a1a",fontWeight:700}}>€{program.price}</span>
                  <span style={{...SS,fontSize:12,color:"#999",marginLeft:"auto"}}>⏱ {program.duration}</span>
                </div>

                <button onClick={()=>{ if (!user) { onAuthClick?.("login"); return; } setStep("select-salon"); }}
                  style={{width:"100%",padding:"15px",background:"linear-gradient(135deg,#c9a96e,#b8944d)",color:"#0d0d0d",border:"none",borderRadius:12,cursor:"pointer",...KR,fontSize:14,fontWeight:700}}>
                  {user ? pt.applyNow : pt.loginAndApply}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

        {/* RESERVATION FLOW — MODAL */}
        {step!=="idle" && (
          <div onClick={()=>{ if(step!=="confirmed") setStep("idle"); }} style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(8,6,4,0.75)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
            <div onClick={e=>e.stopPropagation()} style={{background:"#fff",width:"100%",maxWidth:420,maxHeight:"85vh",overflowY:"auto",borderRadius:20,padding:"20px 20px calc(20px + env(safe-area-inset-bottom))"}}>

              {step==="select-salon" && (
                <>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
                    <button onClick={()=>setStep("idle")} style={{background:"none",border:"none",cursor:"pointer",padding:0,color:"#aaa",fontSize:18}}>‹</button>
                    <p style={{...KR,fontSize:15,fontWeight:700,color:"#1a1a1a",margin:0}}>{pt.selectSalonTitle}</p>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {programSalons.map(s=>(
                      <ProgramSalonCard key={s.id} salon={s} onClick={()=>{setSelectedSalon(s);setStep("payment");}}/>
                    ))}
                  </div>
                </>
              )}

              {step==="payment" && (
                <>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
                    <button onClick={()=>setStep("select-salon")} style={{background:"none",border:"none",cursor:"pointer",padding:0,color:"#aaa",fontSize:18}}>‹</button>
                    <p style={{...KR,fontSize:15,fontWeight:700,color:"#1a1a1a",margin:0}}>{pt.paymentMethodTitle}</p>
                  </div>
                  <p style={{...KR,fontSize:12,color:"#999",lineHeight:1.6,margin:"0 0 14px"}}>{selectedSalon?.name} — {pt.payAtSalonDesc}</p>
                  <button onClick={submitApplication}
                    style={{width:"100%",padding:"15px",background:"linear-gradient(135deg,#c9a96e,#b8944d)",color:"#0d0d0d",border:"none",borderRadius:12,cursor:"pointer",...KR,fontSize:14,fontWeight:700}}>
                    {pt.confirmPay}
                  </button>
                </>
              )}

              {step==="confirmed" && (
                <>
                  <p style={{...KR,fontSize:15,fontWeight:700,color:"#1a1a1a",margin:"0 0 14px",textAlign:"center"}}>✦ {pt.applicationComplete}</p>
                  {submitError&&<p style={{...KR,fontSize:11,color:"#fb5607",margin:"0 0 12px",textAlign:"center"}}>{submitError}</p>}

                  {/* E-TICKET — gold background, framed photo */}
                  <div style={{position:"relative",borderRadius:20,overflow:"hidden",background:"linear-gradient(160deg,#e8d9b8,#c9a96e)",marginBottom:14,padding:16}}>
                    <div style={{borderRadius:14,overflow:"hidden",marginBottom:16,border:"3px solid rgba(255,255,255,0.5)"}}>
                      <img src={program.image} alt={program.name} style={{width:"100%",aspectRatio:"5/3",objectFit:"cover",display:"block"}}/>
                    </div>

                    <p style={{...SS,fontSize:9,color:"rgba(13,13,13,0.5)",letterSpacing:0.5,textTransform:"uppercase",margin:"0 0 4px"}}>The Beauty Pause</p>
                    <p style={{...KR,fontSize:17,fontWeight:700,color:"#1a1a1a",margin:"0 0 16px"}}>{program.name}</p>

                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px 10px",marginBottom:14}}>
                      <div>
                        <p style={{...SS,fontSize:9,color:"rgba(13,13,13,0.45)",margin:"0 0 3px"}}>{pt.period}</p>
                        <p style={{...KR,fontSize:12,color:"#1a1a1a",margin:0}}>{program.periodLabel}</p>
                      </div>
                      <div>
                        <p style={{...SS,fontSize:9,color:"rgba(13,13,13,0.45)",margin:"0 0 3px"}}>{pt.paymentMethodTitle}</p>
                        <p style={{...KR,fontSize:12,color:"#1a1a1a",margin:0}}>{pt.payAtSalon}</p>
                      </div>
                      <div>
                        <p style={{...SS,fontSize:9,color:"rgba(13,13,13,0.45)",margin:"0 0 3px"}}>{pt.applicationSalon}</p>
                        <p style={{...KR,fontSize:12,color:"#1a1a1a",margin:0}}>{selectedSalon?.name}</p>
                      </div>
                      <div>
                        <p style={{...SS,fontSize:9,color:"rgba(13,13,13,0.45)",margin:"0 0 3px"}}>{pt.applicationNumber}</p>
                        <p style={{...SS,fontSize:12,color:"#1a1a1a",fontWeight:700,margin:0}}>{orderId}</p>
                      </div>
                    </div>

                    <p style={{...SS,fontSize:9,color:"rgba(13,13,13,0.45)",margin:"0 0 3px"}}>{pt.place}</p>
                    <p style={{...KR,fontSize:12,color:"#1a1a1a",margin:0,lineHeight:1.5}}>{selectedSalon?.name}, {selectedSalon?.area || "Paris"}</p>
                  </div>

                  <p style={{...KR,fontSize:11,color:"#999",lineHeight:1.6,margin:"0 0 12px",textAlign:"center"}}>{pt.visitNote}</p>
                  {selectedSalon?.rdv ? (
                    <a href={selectedSalon.rdv} target="_blank" rel="noopener noreferrer"
                      style={{display:"block",width:"100%",padding:"15px",background:"#1a1a1a",color:"#fff",border:"none",borderRadius:12,textDecoration:"none",textAlign:"center",...KR,fontSize:14,fontWeight:700,boxSizing:"border-box",marginBottom:10}}>
                      {pt.bookSalon}
                    </a>
                  ) : (
                    <button disabled style={{width:"100%",padding:"15px",background:"#eee",color:"#aaa",border:"none",borderRadius:12,...KR,fontSize:14,fontWeight:700,marginBottom:10}}>
                      {pt.linkPending}
                    </button>
                  )}
                  <button onClick={()=>{setStep("idle");navigate("/program-home");}}
                    style={{width:"100%",padding:"13px",background:"none",color:"#999",border:"none",cursor:"pointer",...KR,fontSize:12}}>
                    {pt.backHome}
                  </button>
                </>
              )}

            </div>
          </div>
        )}

    </>
  );
}

export default function App() {
  const [lang,setLang]=useState("fr");
  const {salons,allProducts,loading}=useData();
  const {programs,loadingPrograms}=useProgramsData();
  const [user,setUser]=useState(null);
  const [favourites,setFavourites]=useState([]);
  const [showAuth,setShowAuth]=useState(false);
  const [authMode,setAuthMode]=useState("signup");
  const [cookieConsent,setCookieConsent]=useState(()=>localStorage.getItem("tbp_cookie_consent"));

  const handleAccept = () => {
    localStorage.setItem("tbp_cookie_consent","accepted");
    setCookieConsent("accepted");
    // Enable GA after consent
    window.gtag && window.gtag('consent','update',{analytics_storage:'granted'});
  };
  const handleDecline = () => {
    localStorage.setItem("tbp_cookie_consent","declined");
    setCookieConsent("declined");
    window.gtag && window.gtag('consent','update',{analytics_storage:'denied'});
  };

  const SS = {fontFamily:"'DM Sans',sans-serif"};
  const KR = {fontFamily:"'Noto Sans KR',sans-serif"};
  const CookieBanner = () => cookieConsent ? null : (
    <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:9999,background:"#1a1a1a",borderTop:"1px solid rgba(255,255,255,0.08)",padding:"16px clamp(16px,4vw,48px)",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
      <p style={{...SS,fontSize:"13px",color:"rgba(255,255,255,0.7)",margin:0,maxWidth:560,lineHeight:1.6}}>
        {lang==="fr"
          ? "Nous utilisons des cookies pour analyser le trafic du site (Google Analytics). Aucune donnée personnelle n'est partagée."
          : "We use cookies to analyse site traffic (Google Analytics). No personal data is shared."}
        {" "}<a href="/privacy" style={{color:"#c9a96e",textDecoration:"underline"}}>{lang==="fr"?"Politique de confidentialité":"Privacy policy"}</a>
      </p>
      <div style={{display:"flex",gap:8,flexShrink:0}}>
        <button onClick={handleDecline} style={{...SS,fontSize:"13px",fontWeight:600,color:"rgba(255,255,255,0.4)",background:"none",border:"1px solid rgba(255,255,255,0.15)",padding:"8px 18px",borderRadius:8,cursor:"pointer"}}>
          {lang==="fr"?"Refuser":"Decline"}
        </button>
        <button onClick={handleAccept} style={{...SS,fontSize:"13px",fontWeight:700,color:"#0d0d0d",background:"#c9a96e",border:"none",padding:"8px 20px",borderRadius:8,cursor:"pointer"}}>
          {lang==="fr"?"Accepter":"Accept"}
        </button>
      </div>
    </div>
  );

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
        <Route path="/" element={<ProgramHomePage salons={salons} allProducts={allProducts} loading={loading} programs={programs} loadingPrograms={loadingPrograms} user={user} onAuthClick={(m)=>{setAuthMode(m);setShowAuth(true);}} />} />
        <Route path="/salons" element={<SalonsPage lang={lang} setLang={setLang} salons={salons} loading={loading} user={user} favourites={favourites} onToggleFav={toggleFavourite} onAuthClick={(m)=>{setAuthMode(m);setShowAuth(true);}} />} />
        <Route path="/products" element={<ProductsPage lang={lang} setLang={setLang} allProducts={allProducts} salons={salons} loading={loading} user={user} favourites={favourites} onToggleFav={toggleFavourite} onAuthClick={(m)=>{setAuthMode(m);setShowAuth(true);}} />} />
        <Route path="/account" element={<AccountPage lang={lang} setLang={setLang} salons={salons} allProducts={allProducts} />} />
        <Route path="/spot/:spotId" element={<SpotPage lang={lang} setLang={setLang} />} />
        <Route path="/privacy" element={<PrivacyPage lang={lang} setLang={setLang} />} />
        <Route path="/legal" element={<LegalPage lang={lang} setLang={setLang} />} />
        <Route path="/brands" element={<ForBrandsPage />} />
        <Route path="/partners" element={<ForPartnersPage />} />
        <Route path="/manufacturers" element={<ForManufacturersPage />} />
        <Route path="/newsletter" element={<NewsletterPage />} />
        <Route path="/program-home" element={<ProgramHomePage salons={salons} allProducts={allProducts} loading={loading} programs={programs} loadingPrograms={loadingPrograms} user={user} onAuthClick={(m)=>{setAuthMode(m);setShowAuth(true);}} />} />
        <Route path="/programs" element={<ProgramsListPage salons={salons} programs={programs} loadingPrograms={loadingPrograms} user={user} onAuthClick={(m)=>{setAuthMode(m);setShowAuth(true);}} />} />
        <Route path="/search" element={<SearchPage salons={salons} allProducts={allProducts} programs={programs} />} />
        <Route path="/program/:programId" element={<ProgramDetailPage salons={salons} allProducts={allProducts} user={user} onAuthClick={(m)=>{setAuthMode(m);setShowAuth(true);}} programs={programs} loadingPrograms={loadingPrograms} />} />
        <Route path="*" element={<ProgramHomePage salons={salons} allProducts={allProducts} loading={loading} programs={programs} loadingPrograms={loadingPrograms} user={user} onAuthClick={(m)=>{setAuthMode(m);setShowAuth(true);}} />} />
      </Routes>
      {showAuth&&<AuthModal onClose={()=>setShowAuth(false)} lang={lang} initialMode={authMode} />}
      <CookieBanner/>
    </LocationAwareErrorBoundary>
  );
}
