import { useState, useEffect, useRef } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";

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
      const tier=TIER[s.salon_tier];
      const col = tier?.color||"#0d0d0d";
      const hl = focusSalon?.id===s.id;
      const icon=L.divIcon({className:"",
        html:`<div style="width:${hl?36:28}px;height:${hl?36:28}px;border-radius:50%;background:${col};border:3px solid #fff;box-shadow:0 3px 12px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;cursor:pointer"><div style="width:6px;height:6px;border-radius:50%;background:#fff"></div></div>`,
        iconSize:[hl?36:28,hl?36:28],iconAnchor:[hl?18:14,hl?18:14]});
      const mk=L.marker([lat,lng],{icon}).addTo(map.current);
      if (!mini) {
        mk.bindTooltip(`<div style="font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600">${s.name}</div>`,{direction:"top",offset:[0,-10]});
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
function SalonCard({ salon, onClick, lang }) {
  const t=T[lang]; const [hov,setHov]=useState(false);
  const prods=salon._products||[];
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:"#fff",borderRadius:12,overflow:"hidden",transition:"transform 0.25s,box-shadow 0.25s",transform:hov?"translateY(-3px)":"none",boxShadow:hov?"0 12px 40px rgba(0,0,0,0.12)":"0 2px 12px rgba(0,0,0,0.06)",cursor:"pointer"}}>
      <CardImg salon={salon} onClick={()=>onClick(salon)} />
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
                  <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"8px",color:"#888",margin:0,lineHeight:1.2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.brand}</p>
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
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            {[{label:"Address",val:`📍 ${salon.address}`},{label:"Contact",val:salon.instagram?<a href={`https://instagram.com/${salon.instagram.replace("@","")}`} target="_blank" rel="noopener noreferrer" style={{color:"#b85c5c",textDecoration:"none"}}>📸 {salon.instagram}</a>:(salon.google_maps_url?<a href={salon.google_maps_url} target="_blank" rel="noopener noreferrer" style={{color:"#b85c5c",textDecoration:"none"}}>🗺 Maps</a>:"—")}].map(({label,val})=>(
              <div key={label} style={{background:"#fff",border:"1px solid #ede8e2",padding:"11px 14px",borderRadius:8}}>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"9px",color:"#bbb",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:3}}>{label}</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#444"}}>{val}</div>
              </div>
            ))}
            {salon.salon_bio&&<div style={{background:"#fff",border:"1px solid #ede8e2",padding:"11px 14px",borderRadius:8,gridColumn:"1/-1"}}>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"9px",color:"#bbb",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:3}}>About</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#555",lineHeight:1.5}}>✦ {salon.salon_bio}</div>
            </div>}
          </div>
          {services.length>0&&<div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>{services.map(s=><span key={s} style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#666",background:"#fff",border:"1px solid #ede8e2",padding:"4px 12px",borderRadius:20}}>{s}</span>)}</div>}
          {prods.length>0&&(
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
                  return (
                    <div key={p.id} style={{background:"#fff",border:`1px solid ${border}`,overflow:"hidden",flexShrink:0,width:170,borderRadius:8}}>
                      <div style={{position:"relative",paddingBottom:"75%",overflow:"hidden"}}>
                        {img?<img src={img} alt={p.product_name} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}} />:<div style={{position:"absolute",inset:0,background:"#f5f0eb",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"30px"}}>✨</div>}
                        <div style={{position:"absolute",top:7,left:7,background:color,color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:"8px",fontWeight:800,letterSpacing:"1.5px",textTransform:"uppercase",padding:"3px 8px",borderRadius:4}}>{isNew?t.new_in:t.top_pick}</div>
                      </div>
                      <div style={{padding:"10px 12px 12px"}}>
                        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"9px",color,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",margin:"0 0 2px"}}>{p.brand}</p>
                        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#2a2a2a",margin:"0 0 4px",lineHeight:1.4}}>{p.product_name}</p>
                        {p.description&&<p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#999",margin:0,lineHeight:1.5}}>{p.description}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {salon.bookingUrl&&(
            <div style={{borderTop:"1px solid #ede8e2",paddingTop:18,marginBottom:18}}>
              <a href={salon.bookingUrl} target="_blank" rel="noopener noreferrer"
                style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,background:"#1a1a1a",color:"#f5f0eb",textDecoration:"none",padding:"14px 24px",fontFamily:"'DM Sans',sans-serif",fontSize:"11px",fontWeight:600,letterSpacing:"2px",textTransform:"uppercase",width:"100%",borderRadius:8,transition:"background 0.2s"}}
                onMouseEnter={e=>e.currentTarget.style.background="#b85c5c"}
                onMouseLeave={e=>e.currentTarget.style.background="#1a1a1a"}>
                <span>{t.book}</span>
                {salon.bookingPlatform&&<span style={{fontSize:"10px",color:"#888",fontWeight:400}}>{t.via} {salon.bookingPlatform}</span>}
                <span style={{marginLeft:"auto"}}>→</span>
              </a>
            </div>
          )}
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

// ── PRODUCT MODAL ─────────────────────────────────────────────────────────────
function ProductModal({ prod, salonsWithProd, onClose, onSalonClick, lang }) {
  if (!prod) return null;
  const t=T[lang]; const img=getProdImg(prod);
  const isNew=prod._badge==="new"; const color=isNew?"#c9a96e":"#b85c5c";
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(8,6,4,0.82)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#faf7f4",maxWidth:480,width:"100%",borderRadius:16,overflow:"hidden",boxShadow:"0 48px 120px rgba(0,0,0,0.4)",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{position:"relative",paddingBottom:"65%",overflow:"hidden"}}>
          {img?<img src={img} alt={prod.product_name} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}} />:<div style={{position:"absolute",inset:0,background:"#f5f0eb",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"48px"}}>✨</div>}
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.5) 0%,transparent 50%)"}} />
          <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"rgba(0,0,0,0.4)",color:"#fff",border:"none",width:32,height:32,borderRadius:"50%",cursor:"pointer",fontSize:"16px",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          <div style={{position:"absolute",bottom:14,left:14,background:color,color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:"9px",fontWeight:800,letterSpacing:"1.5px",textTransform:"uppercase",padding:"4px 12px",borderRadius:4}}>{isNew?t.new_in:t.top_pick}</div>
        </div>
        <div style={{padding:"24px 26px 28px"}}>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",margin:"0 0 4px"}}>{prod.brand}</p>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"26px",fontWeight:600,color:"#1a1a1a",margin:"0 0 6px",lineHeight:1.2}}>{prod.product_name}</h2>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#aaa",margin:"0 0 14px"}}>{prod.category}</p>
          {prod.description&&<p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"13px",color:"#666",lineHeight:1.75,margin:"0 0 20px"}}>{prod.description}</p>}
          {/* price */}
          {prod.price_customer&&<div style={{background:"#fff",border:"1px solid #ede8e2",padding:"12px 16px",borderRadius:8,marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#888"}}>Price</span>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"22px",color:"#1a1a1a",fontWeight:600}}>€{prod.price_customer}</span>
          </div>}
          {/* salons */}
          {salonsWithProd.length>0&&(
            <div>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#b85c5c",letterSpacing:"2px",textTransform:"uppercase",fontWeight:700,margin:"0 0 10px"}}>✦ {t.find_in_salon}</p>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {salonsWithProd.map(s=>{
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
                        <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"15px",fontWeight:600,color:"#1a1a1a",margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.name}</p>
                        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#aaa",margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.address}</p>
                      </div>
                      <span style={{color:"#ccc",fontSize:"16px",flexShrink:0}}>›</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
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
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:3000,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#faf7f4",width:"100%",maxWidth:600,borderRadius:"16px 16px 0 0",maxHeight:"88vh",overflow:"auto",boxShadow:"0 -8px 40px rgba(0,0,0,0.15)"}}>
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
function BottomSheet({ salons, loading, onSalonClick, lang }) {
  const t=T[lang];
  const [state,setState]=useState("peek"); // closed | peek | open
  const [pinned,setPinned]=useState(null);
  const startY=useRef(null);
  const H={ closed:72, peek:240, open:window.innerHeight*0.75 };

  // expose setPinned for map
  BottomSheet._setPinned = (s) => { setPinned(s); setState("peek"); };

  const onTouchStart=e=>{ startY.current=e.touches[0].clientY; };
  const onTouchEnd=e=>{
    const dy=startY.current-e.changedTouches[0].clientY;
    if (dy>40) setState(s=>s==="closed"?"peek":"open");
    else if (dy<-40) setState(s=>s==="open"?"peek":"closed");
  };

  return (
    <div style={{position:"absolute",bottom:0,left:0,right:0,height:H[state],background:"#faf7f4",borderRadius:"16px 16px 0 0",boxShadow:"0 -4px 24px rgba(0,0,0,0.15)",transition:"height 0.3s cubic-bezier(0.32,0.72,0,1)",zIndex:100,display:"flex",flexDirection:"column"}}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* handle */}
      <div style={{padding:"12px 0 8px",display:"flex",justifyContent:"center",flexShrink:0,cursor:"pointer"}}
        onClick={()=>setState(s=>s==="open"?"peek":s==="peek"?"closed":"peek")}>
        <div style={{width:36,height:4,borderRadius:2,background:"#ddd"}} />
      </div>
      {/* pinned preview */}
      {pinned&&state!=="open"&&(
        <div onClick={()=>onSalonClick(pinned)}
          style={{margin:"0 14px 10px",background:"#fff",borderRadius:12,padding:"10px 12px",display:"flex",gap:12,alignItems:"center",boxShadow:"0 2px 12px rgba(0,0,0,0.08)",cursor:"pointer",flexShrink:0}}>
          <div style={{width:56,height:56,borderRadius:8,overflow:"hidden",flexShrink:0,background:"#1a1a1a"}}>
            {(()=>{const img=getSalonImg(pinned);return img?<img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"22px",color:"rgba(201,169,110,0.4)"}}>{pinned.name?.[0]}</span></div>;})()}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
              <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"15px",fontWeight:600,color:"#1a1a1a",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pinned.name}</h3>
              {pinned.salon_tier&&<TierBadge tier={pinned.salon_tier} size={12} />}
            </div>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#aaa",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pinned.address}</p>
          </div>
          <span style={{color:"#ccc",fontSize:"16px"}}>›</span>
        </div>
      )}
      {/* count */}
      {state!=="closed"&&!pinned&&<p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#aaa",margin:"0 16px 8px",flexShrink:0}}>{salons.length} {t.salons_count}</p>}
      {/* list */}
      {state==="open"&&(
        <div style={{flex:1,overflowY:"auto",padding:"0 14px 24px"}}>
          {loading?<div style={{textAlign:"center",padding:"40px 0",fontFamily:"'Cormorant Garamond',serif",fontSize:"18px",color:"#ccc"}}>{t.loading}</div>
           :salons.length===0?<div style={{textAlign:"center",padding:"40px 0",fontFamily:"'Cormorant Garamond',serif",fontSize:"18px",color:"#ccc"}}>{t.no_salons}</div>
           :<div style={{display:"flex",flexDirection:"column",gap:14}}>{salons.map((s,i)=><div key={s.id} style={{animation:`fadeUp 0.35s ease ${i*0.03}s both`}}><SalonCard salon={s} onClick={onSalonClick} lang={lang} /></div>)}</div>}
        </div>
      )}
      {/* peek horizontal */}
      {state==="peek"&&!pinned&&(
        <div style={{flex:1,overflowX:"auto",display:"flex",gap:12,padding:"0 14px 16px",alignItems:"flex-start"}}>
          {loading?<div style={{display:"flex",alignItems:"center",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",color:"#aaa"}}>{t.loading}</div>
           :salons.slice(0,10).map(s=>{
            const img=getSalonImg(s);
            return (
              <div key={s.id} onClick={()=>onSalonClick(s)} style={{flexShrink:0,width:150,background:"#fff",borderRadius:10,overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,0.08)",cursor:"pointer"}}>
                <div style={{paddingBottom:"60%",position:"relative",overflow:"hidden",background:"#1a1a1a"}}>
                  {img?<img src={img} alt={s.name} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}} />:<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"28px",color:"rgba(201,169,110,0.25)"}}>{s.name?.[0]}</span></div>}
                  {s.salon_tier&&<div style={{position:"absolute",top:6,right:6}}><TierBadge tier={s.salon_tier} size={12}/></div>}
                </div>
                <div style={{padding:"8px 10px 10px"}}>
                  <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"13px",fontWeight:600,color:"#1a1a1a",margin:"0 0 2px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.name}</p>
                  <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#bbb",margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.area||"Paris"}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── JOIN MODAL ────────────────────────────────────────────────────────────────
function JoinModal({ onClose, lang, salons }) {
  const t=T[lang];
  const [fn,setFn]=useState(""); const [em,setEm]=useState(""); const [sl,setSl]=useState("");
  const [st,setSt]=useState("idle");
  const submit=async()=>{
    if (!fn.trim()||!em.trim()) return; setSt("loading");
    try {
      const r=await fetch(`https://api.airtable.com/v0/${AT_BASE}/${TBL_MEMBERS}`,{method:"POST",headers:{Authorization:`Bearer ${AT_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({records:[{fields:{first_name:fn.trim(),email:em.trim(),favourite_salon:sl||undefined,joined_at:new Date().toISOString().split("T")[0],status:"active"}}]})});
      setSt(r.ok?"success":"error");
    } catch { setSt("error"); }
  };
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:4000,background:"rgba(8,6,4,0.82)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#faf7f4",maxWidth:420,width:"100%",borderRadius:16,overflow:"hidden",boxShadow:"0 48px 120px rgba(0,0,0,0.4)"}}>
        <div style={{background:"#0d0d0d",padding:"26px 26px 22px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-50,right:-50,width:180,height:180,borderRadius:"50%",border:"1px solid rgba(201,169,110,0.15)"}} />
          <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"rgba(255,255,255,0.1)",color:"#fff",border:"none",width:28,height:28,borderRadius:"50%",cursor:"pointer",fontSize:"15px",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#c9a96e",letterSpacing:"3px",textTransform:"uppercase",margin:"0 0 8px"}}>✦ The Beauty Pause</p>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"24px",fontWeight:400,color:"#f5f0eb",margin:"0 0 8px"}}>{t.join_title}</h2>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#777",lineHeight:1.6,margin:0}}>{t.join_sub}</p>
        </div>
        <div style={{padding:"22px 26px 26px"}}>
          {st==="success"?(
            <div style={{textAlign:"center",padding:"12px 0"}}>
              <div style={{fontSize:"32px",marginBottom:10}}>✦</div>
              <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"22px",fontWeight:400,color:"#1a1a1a",margin:"0 0 8px"}}>{t.join_success}</h3>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"13px",color:"#888",lineHeight:1.6,marginBottom:18}}>{t.join_success_sub}</p>
              <button onClick={onClose} style={{padding:"10px 24px",background:"#1a1a1a",color:"#f5f0eb",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"11px",fontWeight:600,letterSpacing:"2px",textTransform:"uppercase",borderRadius:8}}>Close</button>
            </div>
          ):(
            <>
              {[{l:t.join_name,v:fn,s:setFn,tp:"text"},{l:t.join_email,v:em,s:setEm,tp:"email"}].map(({l,v,s,tp})=>(
                <div key={l} style={{marginBottom:13}}>
                  <label style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#aaa",letterSpacing:"1.5px",textTransform:"uppercase",display:"block",marginBottom:5}}>{l}</label>
                  <input type={tp} value={v} onChange={e=>s(e.target.value)} style={{width:"100%",padding:"11px 14px",border:"1px solid #ede8e2",background:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",color:"#1a1a1a",outline:"none",borderRadius:8,transition:"border 0.2s"}} onFocus={e=>e.target.style.borderColor="#c9a96e"} onBlur={e=>e.target.style.borderColor="#ede8e2"} />
                </div>
              ))}
              <div style={{marginBottom:18}}>
                <label style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#aaa",letterSpacing:"1.5px",textTransform:"uppercase",display:"block",marginBottom:5}}>{t.join_salon}</label>
                <select value={sl} onChange={e=>setSl(e.target.value)} style={{width:"100%",padding:"11px 14px",border:"1px solid #ede8e2",background:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",color:sl?"#1a1a1a":"#aaa",outline:"none",borderRadius:8,cursor:"pointer",appearance:"none"}} onFocus={e=>e.target.style.borderColor="#c9a96e"} onBlur={e=>e.target.style.borderColor="#ede8e2"}>
                  <option value="">{t.join_salon_ph}</option>
                  {salons.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              {st==="error"&&<p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#b85c5c",margin:"0 0 12px"}}>{t.join_error}</p>}
              <button onClick={submit} disabled={!fn.trim()||!em.trim()||st==="loading"} style={{width:"100%",padding:"13px",background:(!fn.trim()||!em.trim())?"#ccc":"#1a1a1a",color:"#f5f0eb",border:"none",cursor:(!fn.trim()||!em.trim())?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"11px",fontWeight:600,letterSpacing:"2px",textTransform:"uppercase",borderRadius:8,transition:"background 0.2s"}} onMouseEnter={e=>{if(fn.trim()&&em.trim())e.target.style.background="#b85c5c";}} onMouseLeave={e=>{if(fn.trim()&&em.trim())e.target.style.background="#1a1a1a";}}>
                {st==="loading"?t.joining:t.join_submit}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


// ── SHARED DATA HOOK ──────────────────────────────────────────────────────────
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
function Nav({lang,setLang,onJoin}) {
  const navigate=useNavigate(); const location=useLocation();
  const isMobile=window.innerWidth<768; const t=T[lang];
  return (
    <nav style={{background:"#0d0d0d",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",position:"sticky",top:0,zIndex:500}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <button onClick={()=>navigate("/")} style={{background:"none",border:"none",cursor:"pointer",color:"#777",fontSize:"18px",lineHeight:1,padding:"4px 6px",transition:"color 0.2s"}} onMouseEnter={e=>e.currentTarget.style.color="#f5f0eb"} onMouseLeave={e=>e.currentTarget.style.color="#777"}>←</button>
        <div onClick={()=>navigate("/")} style={{cursor:"pointer"}}>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"15px",color:"#f5f0eb",letterSpacing:"2px",fontWeight:300}}>THE</span>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"15px",color:"#c9a96e",letterSpacing:"2px",fontWeight:600,marginLeft:5}}>BEAUTY PAUSE</span>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        {!isMobile&&<button onClick={onJoin} style={{padding:"6px 14px",background:"#c9a96e",color:"#0d0d0d",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"11px",fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",borderRadius:20}}>✦ {t.join}</button>}
        <div style={{display:"flex",border:"1px solid #333",borderRadius:20,overflow:"hidden"}}>
          {["en","fr"].map(l=><button key={l} onClick={()=>setLang(l)} style={{padding:"4px 9px",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"11px",fontWeight:600,color:lang===l?"#0d0d0d":"#777",background:lang===l?"#c9a96e":"transparent",transition:"all 0.2s",textTransform:"uppercase"}}>{l}</button>)}
        </div>
      </div>
    </nav>
  );
}

function MobileTabBar({lang,active}) {
  const navigate=useNavigate(); const t=T[lang];
  return (
    <div style={{background:"#fff",borderBottom:"1px solid #ede8e2",display:"flex",position:"sticky",top:56,zIndex:450}}>
      {[{path:"/salons",label:t.salons,icon:"🏪"},{path:"/products",label:t.products,icon:"✨"}].map(({path,label,icon})=>(
        <button key={path} onClick={()=>navigate(path)} style={{flex:1,padding:"9px 0",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"11px",fontWeight:active===path?600:400,color:active===path?"#b85c5c":"#aaa",background:"transparent",borderBottom:active===path?"2px solid #b85c5c":"2px solid transparent",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
          <span style={{fontSize:"15px"}}>{icon}</span>{label}
        </button>
      ))}
    </div>
  );
}

// ── LANDING PAGE ──────────────────────────────────────────────────────────────
function LandingPage({lang,setLang,salons,allProducts}) {
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
          {!isMobile&&<button onClick={()=>setShowJoin(true)} style={{padding:"7px 16px",background:"transparent",color:"#c9a96e",border:"1px solid rgba(201,169,110,0.4)",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"11px",fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase",borderRadius:20,transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.background="#c9a96e";e.currentTarget.style.color="#0d0d0d";}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#c9a96e";}}>✦ {t.join}</button>}
          <div style={{display:"flex",border:"1px solid #333",borderRadius:20,overflow:"hidden"}}>
            {["en","fr"].map(l=><button key={l} onClick={()=>setLang(l)} style={{padding:"5px 10px",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"11px",fontWeight:600,color:lang===l?"#0d0d0d":"#666",background:lang===l?"#c9a96e":"transparent",transition:"all 0.2s",textTransform:"uppercase"}}>{l}</button>)}
          </div>
        </div>
      </nav>

      {/* ① HERO — left text, right scrolling previews */}
      <section style={{background:"#0d0d0d",minHeight:"92vh",display:"flex",alignItems:"center",padding:`clamp(40px,6vw,80px) ${px}`,position:"relative",overflow:"hidden",gap:"clamp(32px,5vw,80px)"}}>
        <div style={{position:"absolute",top:-200,right:-100,width:700,height:700,borderRadius:"50%",border:"1px solid rgba(201,169,110,0.05)",pointerEvents:"none"}} />

        {/* LEFT: text */}
        <div style={{flexShrink:0,maxWidth:isMobile?"100%":"480px",width:isMobile?"100%":"45%",animation:"fadeUp 1s ease both"}}>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#c9a96e",letterSpacing:"4px",textTransform:"uppercase",marginBottom:20}}>{t.tagline}</p>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(38px,5.5vw,76px)",fontWeight:300,color:"#f5f0eb",lineHeight:1.05,marginBottom:20,whiteSpace:"pre-line"}}>{L.hero}</h1>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"clamp(14px,1.6vw,17px)",color:"#666",lineHeight:1.8,marginBottom:36}}>{L.sub}</p>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <button onClick={()=>navigate("/salons")} style={{padding:"14px 28px",background:"#f5f0eb",color:"#0d0d0d",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",fontWeight:700,letterSpacing:"1.5px",borderRadius:8,transition:"all 0.2s",whiteSpace:"nowrap"}} onMouseEnter={e=>e.target.style.background="#c9a96e"} onMouseLeave={e=>e.target.style.background="#f5f0eb"}>{L.cta1}</button>
            <button onClick={()=>navigate("/products")} style={{padding:"14px 28px",background:"transparent",color:"#f5f0eb",border:"1px solid rgba(255,255,255,0.18)",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",fontWeight:500,letterSpacing:"1.5px",borderRadius:8,transition:"all 0.2s",whiteSpace:"nowrap"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#c9a96e";e.currentTarget.style.color="#c9a96e";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.18)";e.currentTarget.style.color="#f5f0eb";}}>{L.cta2}</button>
          </div>
        </div>

        {/* RIGHT: scrolling salon + product rows (hidden on mobile) */}
        {!isMobile&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:16,overflow:"hidden",minWidth:0,animation:"fadeUp 1s ease 0.15s both"}}>
            {/* salon row */}
            <div>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#555",letterSpacing:"2px",textTransform:"uppercase",marginBottom:10}}>✦ {L.salon_title}</p>
              <div className="hide-scrollbar" style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:4}}>
                {previewSalons.map(s=>{
                  const img=getSalonImg(s);
                  return (
                    <div key={s.id} onClick={()=>navigate("/salons")} style={{flexShrink:0,width:200,background:"#151515",border:"1px solid #2a2520",borderRadius:10,overflow:"hidden",cursor:"pointer",transition:"all 0.2s"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor="#c9a96e";e.currentTarget.style.transform="translateY(-2px)";}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="#2a2520";e.currentTarget.style.transform="none";}}>
                      <div style={{paddingBottom:"55%",position:"relative",overflow:"hidden",background:"#1a1a1a"}}>
                        {img?<img src={img} alt={s.name} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}} />:<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"32px",color:"rgba(201,169,110,0.2)"}}>{s.name?.[0]}</span></div>}
                        <div style={{position:"absolute",top:7,left:7,background:"rgba(0,0,0,0.6)",color:"#f5f0eb",fontSize:"9px",fontFamily:"'DM Sans',sans-serif",fontWeight:600,letterSpacing:"1px",textTransform:"uppercase",padding:"2px 7px",borderRadius:20}}>{s.category}</div>
                        {s.salon_tier&&<div style={{position:"absolute",top:6,right:6}}><TierBadge tier={s.salon_tier} size={12}/></div>}
                      </div>
                      <div style={{padding:"9px 11px 10px"}}>
                        <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"13px",fontWeight:600,color:"#f5f0eb",margin:"0 0 3px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.name}</p>
                        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#555",margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.area||"Paris"}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* product row */}
            <div>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#555",letterSpacing:"2px",textTransform:"uppercase",marginBottom:10}}>✦ {L.prod_title}</p>
              <div className="hide-scrollbar" style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:4}}>
                {previewProds.map(p=>{
                  const isNew=p._badge==="new"; const color=isNew?"#c9a96e":"#b85c5c"; const img=getProdImg(p);
                  return (
                    <div key={p.id} onClick={()=>navigate("/products")} style={{flexShrink:0,width:140,background:"#151515",border:"1px solid #2a2520",borderRadius:10,overflow:"hidden",cursor:"pointer",transition:"all 0.2s"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=color;e.currentTarget.style.transform="translateY(-2px)";}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="#2a2520";e.currentTarget.style.transform="none";}}>
                      <div style={{paddingBottom:"90%",position:"relative",overflow:"hidden",background:"#1a1a1a"}}>
                        {img?<img src={img} alt={p.product_name} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}} />:<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px"}}>✨</div>}
                        <div style={{position:"absolute",top:6,left:6,background:color,color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:"7px",fontWeight:800,letterSpacing:"1px",textTransform:"uppercase",padding:"2px 7px",borderRadius:4}}>{isNew?t.new_in:t.top_pick}</div>
                      </div>
                      <div style={{padding:"8px 10px 10px"}}>
                        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"8px",color,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",margin:"0 0 2px"}}>{p.brand}</p>
                        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#e8e0d8",margin:0,lineHeight:1.3,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{p.product_name}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ② WHAT IS THIS */}
      <section style={{background:"#faf7f4",padding:`clamp(56px,7vw,96px) ${px}`}}>
        <div style={{maxWidth:640,animation:"fadeUp 0.8s ease both"}}>
          <Label>{L.what_title}</Label>
          <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(24px,3vw,36px)",fontWeight:300,color:"#1a1a1a",lineHeight:1.45}}>{L.what_body}</p>
        </div>
      </section>

      {/* ③ HOW IT WORKS */}
      <section style={{background:"#0d0d0d",padding:`clamp(56px,7vw,96px) ${px}`}}>
        <Label>{L.how_title}</Label>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:32,maxWidth:900}}>
          {L.steps.map((step,i)=>(
            <div key={i} style={{display:"flex",gap:20,alignItems:"flex-start",animation:`fadeUp 0.7s ease ${i*0.12}s both`}}>
              <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"52px",color:"rgba(201,169,110,0.2)",fontWeight:300,lineHeight:1,flexShrink:0,marginTop:-6}}>0{i+1}</span>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"15px",color:"#f5f0eb",fontWeight:400,lineHeight:1.6,margin:"8px 0 0"}}>{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ④ SALON PREVIEW */}
      <section style={{background:"#faf7f4",padding:`clamp(56px,7vw,96px) ${px}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:28,flexWrap:"wrap",gap:12}}>
          <Label>{L.salon_title}</Label>
          <button onClick={()=>navigate("/salons")} style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#b85c5c",background:"none",border:"none",cursor:"pointer",letterSpacing:"0.5px",fontWeight:600}}>{L.salon_cta}</button>
        </div>
        <div className="hide-scrollbar" style={{display:"flex",gap:18,overflowX:"auto",paddingBottom:4}}>
          {previewSalons.slice(0,6).map((s,i)=>{
            const img=getSalonImg(s); const prods=s._products||[];
            return (
              <div key={s.id} onClick={()=>navigate("/salons")}
                style={{flexShrink:0,width:260,background:"#fff",borderRadius:12,overflow:"hidden",cursor:"pointer",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",transition:"all 0.25s",animation:`fadeUp 0.5s ease ${i*0.07}s both`}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 12px 36px rgba(0,0,0,0.12)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,0.06)";}}>
                <div style={{position:"relative",paddingBottom:"56%",overflow:"hidden",background:"#1a1a1a"}}>
                  {img?<img src={img} alt={s.name} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}} />:<div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,#2a2a2a,#1a1a1a)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"44px",color:"rgba(201,169,110,0.2)"}}>{s.name?.[0]}</span></div>}
                  <div style={{position:"absolute",top:10,left:10,background:"rgba(0,0,0,0.6)",color:"#f5f0eb",fontSize:"10px",fontFamily:"'DM Sans',sans-serif",fontWeight:600,letterSpacing:"1px",textTransform:"uppercase",padding:"3px 9px",borderRadius:20}}>{s.category}</div>
                  {s.salon_tier&&<div style={{position:"absolute",top:10,right:10}}><TierBadge tier={s.salon_tier}/></div>}
                </div>
                <div style={{padding:"12px 14px 14px"}}>
                  <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"17px",fontWeight:600,color:"#1a1a1a",margin:"0 0 4px"}}>{s.name}</h3>
                  <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#bbb",margin:"0 0 8px"}}>{s.address}</p>
                  {prods.length>0&&<div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{prods.slice(0,2).map(p=>{const isNew=p._badge==="new";return<span key={p.id} style={{fontFamily:"'DM Sans',sans-serif",fontSize:"9px",color:isNew?"#a07832":"#b85c5c",background:isNew?"#fdf8ee":"#fdf0f0",padding:"2px 8px",borderRadius:12,fontWeight:600}}>{p.brand}</span>;})}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ⑤ PRODUCT PREVIEW */}
      <section style={{background:"#0d0d0d",padding:`clamp(56px,7vw,96px) ${px}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:16,flexWrap:"wrap",gap:12}}>
          <Label>{L.prod_title}</Label>
          <button onClick={()=>navigate("/products")} style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#c9a96e",background:"none",border:"none",cursor:"pointer",letterSpacing:"0.5px",fontWeight:600}}>{L.prod_cta}</button>
        </div>
        <div style={{background:"rgba(201,169,110,0.08)",border:"1px solid rgba(201,169,110,0.2)",borderRadius:8,padding:"10px 14px",marginBottom:20,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:"16px"}}>📱</span>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#888",margin:0,lineHeight:1.5}}>{L.prod_note}</p>
        </div>
        <div className="hide-scrollbar" style={{display:"flex",gap:14,overflowX:"auto",paddingBottom:4}}>
          {previewProds.slice(0,8).map((p,i)=>{
            const isNew=p._badge==="new"; const color=isNew?"#c9a96e":"#b85c5c"; const border=isNew?"#2a2520":"#2a1f1f"; const img=getProdImg(p);
            return (
              <div key={p.id} onClick={()=>navigate("/products")}
                style={{flexShrink:0,width:180,background:"#151515",border:`1px solid ${border}`,borderRadius:12,overflow:"hidden",cursor:"pointer",transition:"all 0.2s",animation:`fadeUp 0.5s ease ${i*0.05}s both`}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.borderColor=color;}}
                onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.borderColor=border;}}>
                <div style={{position:"relative",paddingBottom:"80%",overflow:"hidden"}}>
                  {img?<img src={img} alt={p.product_name} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}} />:<div style={{position:"absolute",inset:0,background:"#222",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"32px"}}>✨</div>}
                  <div style={{position:"absolute",top:8,left:8,background:color,color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:"8px",fontWeight:800,letterSpacing:"1.5px",textTransform:"uppercase",padding:"3px 9px",borderRadius:4}}>{isNew?t.new_in:t.top_pick}</div>
                </div>
                <div style={{padding:"11px 13px 13px"}}>
                  <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"9px",color,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",margin:"0 0 3px"}}>{p.brand}</p>
                  <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#e8e0d8",margin:"0 0 3px",lineHeight:1.4}}>{p.product_name}</p>
                  <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#555",margin:0}}>{p.category}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ⑥ JOIN CTA */}
      <section style={{background:"#faf7f4",padding:`clamp(56px,7vw,88px) ${px}`,textAlign:"center"}}>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#c9a96e",letterSpacing:"4px",textTransform:"uppercase",marginBottom:16}}>✦ Community</p>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(28px,4vw,48px)",fontWeight:300,color:"#1a1a1a",marginBottom:16,maxWidth:560,margin:"0 auto 16px"}}>{L.join_cta}</h2>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"14px",color:"#888",lineHeight:1.7,marginBottom:32,maxWidth:440,margin:"0 auto 32px"}}>{L.join_sub}</p>
        <button onClick={()=>setShowJoin(true)} style={{padding:"14px 36px",background:"#1a1a1a",color:"#f5f0eb",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",borderRadius:8,transition:"all 0.2s"}} onMouseEnter={e=>e.target.style.background="#b85c5c"} onMouseLeave={e=>e.target.style.background="#1a1a1a"}>✦ {L.join_cta}</button>
      </section>

      {/* FOOTER */}
      <footer style={{background:"#0d0d0d",padding:"32px clamp(20px,5vw,64px)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12,borderTop:"1px solid rgba(255,255,255,0.05)"}}>
        <div><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"14px",color:"#f5f0eb",letterSpacing:"3px",fontWeight:300}}>THE</span><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"14px",color:"#c9a96e",letterSpacing:"3px",fontWeight:600,marginLeft:5}}>BEAUTY PAUSE</span></div>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#444"}}>{t.footer}</p>
      </footer>

      {showJoin&&<JoinModal onClose={()=>setShowJoin(false)} lang={lang} salons={salons} />}
    </>
  );
}

// ── SALONS PAGE ───────────────────────────────────────────────────────────────
function SalonsPage({lang,setLang,salons,loading}) {
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
    if(visibleIds)r=r.filter(s=>visibleIds.includes(s.id));
    setFiltered(r);
  },[salons,sf,search,sortBy,visibleIds]);
  const areas=["All",...Array.from(new Set(salons.map(s=>s.area).filter(Boolean))).sort()];
  const brands=["All",...Array.from(new Set(salons.flatMap(s=>(s._products||[]).map(p=>p.brand)).filter(Boolean))).sort()];
  const afc=[sf.tier.length>0,sf.area!=="All",sf.brand!=="All",sf.categories.length>0,sf.kbeautyOnly].filter(Boolean).length;
  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0}html,body{background:#faf7f4;height:100%}@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:#c9a96e;border-radius:3px}.leaflet-tooltip{background:#fff;border:1px solid #ede8e2;border-radius:8px;padding:6px 10px}`}</style>
      <Nav lang={lang} setLang={setLang} onJoin={()=>setShowJoin(true)} />
      {isMobile&&<MobileTabBar lang={lang} active="/salons" />}
      {/* filter */}
      <div style={{background:"#fff",borderBottom:"1px solid #ede8e2",padding:"9px clamp(12px,3vw,20px)",display:"flex",alignItems:"center",gap:8,overflowX:"auto",position:"sticky",top:isMobile?100:56,zIndex:399,flexWrap:"nowrap"}}>
        <button onClick={()=>setShowFilter(true)} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 13px",border:`1.5px solid ${afc>0?"#1a1a1a":"#ede8e2"}`,background:afc>0?"#1a1a1a":"#fff",color:afc>0?"#fff":"#555",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",borderRadius:20,flexShrink:0,transition:"all 0.2s"}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
          {t.filter}{afc>0&&<span style={{background:"#c9a96e",color:"#0d0d0d",borderRadius:"50%",width:19,height:19,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:700}}>{afc}</span>}
        </button>
        <div style={{width:1,height:18,background:"#ede8e2",flexShrink:0}} />
        <button onClick={()=>setSf(f=>({...f,kbeautyOnly:!f.kbeautyOnly}))} style={{padding:"7px 13px",border:`1.5px solid ${sf.kbeautyOnly?"#b85c5c":"#ede8e2"}`,background:sf.kbeautyOnly?"#fdf0f0":"#fff",color:sf.kbeautyOnly?"#b85c5c":"#666",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",fontWeight:sf.kbeautyOnly?600:400,borderRadius:20,flexShrink:0,transition:"all 0.2s",whiteSpace:"nowrap"}}>✦ K-Beauty</button>
        {["Nail","Beauty","Hair","Spa"].map(cat=>{const a=sf.categories.includes(cat);return<button key={cat} onClick={()=>setSf(f=>({...f,categories:toggleArr(f.categories,cat)}))} style={{padding:"7px 13px",border:`1.5px solid ${a?"#1a1a1a":"#ede8e2"}`,background:a?"#1a1a1a":"#fff",color:a?"#fff":"#666",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",borderRadius:20,flexShrink:0,transition:"all 0.2s",whiteSpace:"nowrap"}}>{cat}</button>;})}
        <input placeholder={t.search_salon} value={search} onChange={e=>setSearch(e.target.value)} style={{padding:"7px 13px",border:"1px solid #ede8e2",background:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#555",outline:"none",borderRadius:20,width:isMobile?130:200,marginLeft:"auto",flexShrink:0}}/>
      </div>
      {/* content */}
      {isMobile?(
        <div style={{position:"relative",height:`calc(100vh - 56px - 44px - 44px)`,overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0}}>{lr?<SalonMap salons={salons} onPinClick={s=>{if(BottomSheet._setPinned)BottomSheet._setPinned(s);}} onBoundsChange={setVisibleIds} />:<div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",color:"#aaa"}}>{t.loading}</div>}</div>
          <BottomSheet salons={filtered} loading={loading} onSalonClick={setSelSalon} lang={lang} />
        </div>
      ):(
        <div style={{display:"flex",height:"calc(100vh - 56px - 44px)",overflow:"hidden"}}>
          <div style={{width:"52%",overflowY:"auto",padding:"20px 16px 40px 20px"}}>
            {loading?<div style={{textAlign:"center",padding:"60px 0",fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",color:"#ccc"}}>{t.loading}</div>:<>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#aaa",marginBottom:16}}>{filtered.length} {t.salons_count}</p>
              {filtered.length===0?<div style={{textAlign:"center",padding:"60px 0",fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",color:"#ccc"}}>{t.no_salons}</div>
              :<div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:20}}>
                {filtered.map((s,i)=><div key={s.id} style={{animation:`fadeUp 0.4s ease ${i*0.04}s both`}}><SalonCard salon={s} onClick={setSelSalon} lang={lang} /></div>)}
              </div>}
            </>}
          </div>
          <div style={{flex:1,position:"sticky",top:0,height:"100%"}}>{lr?<SalonMap salons={salons} onPinClick={setSelSalon} onBoundsChange={setVisibleIds} />:<div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",color:"#aaa"}}>{t.loading}</div>}</div>
        </div>
      )}
      {showFilter&&<FilterModal onClose={()=>setShowFilter(false)} lang={lang} filters={sf} setFilters={setSf} areas={areas} brands={brands} sortBy={sortBy} setSortBy={setSortBy} />}
      {showJoin&&<JoinModal onClose={()=>setShowJoin(false)} lang={lang} salons={salons} />}
      {selSalon&&<SalonModal salon={selSalon} onClose={()=>setSelSalon(null)} leafletReady={lr} lang={lang} />}
    </>
  );
}

// ── PRODUCTS PAGE ─────────────────────────────────────────────────────────────
function ProductsPage({lang,setLang,allProducts,salons,loading}) {
  const t=T[lang]; const isMobile=window.innerWidth<768;
  const [prodSearch,setProdSearch]=useState("");
  const [prodCat,setProdCat]=useState("All");
  const [prodBrand,setProdBrand]=useState("All");
  const [fp,setFp]=useState(allProducts);
  const [showJoin,setShowJoin]=useState(false);
  const [selProd,setSelProd]=useState(null);
  const [selSalon,setSelSalon]=useState(null);
  const [lr,setLr]=useState(!!window.L);
  useEffect(()=>{if(window.L){setLr(true);return;}const lnk=document.createElement("link");lnk.rel="stylesheet";lnk.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";document.head.appendChild(lnk);const s=document.createElement("script");s.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";s.onload=()=>setLr(true);document.head.appendChild(s);},[]);
  useEffect(()=>{let r=[...allProducts];if(prodCat!=="All")r=r.filter(p=>p.category===prodCat);if(prodBrand!=="All")r=r.filter(p=>p.brand===prodBrand);if(prodSearch)r=r.filter(p=>p.product_name?.toLowerCase().includes(prodSearch.toLowerCase())||p.brand?.toLowerCase().includes(prodSearch.toLowerCase()));setFp(r);},[allProducts,prodCat,prodBrand,prodSearch]);
  const cats=["All",...Array.from(new Set(allProducts.map(p=>p.category).filter(Boolean))).sort()];
  const brands=["All",...Array.from(new Set(allProducts.map(p=>p.brand).filter(Boolean))).sort()];
  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0}html,body{background:#faf7f4}@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:#c9a96e;border-radius:3px}`}</style>
      <Nav lang={lang} setLang={setLang} onJoin={()=>setShowJoin(true)} />
      {isMobile&&<MobileTabBar lang={lang} active="/products" />}
      {/* filter */}
      <div style={{background:"#fff",borderBottom:"1px solid #ede8e2",padding:"10px clamp(12px,3vw,20px)",display:"flex",gap:8,alignItems:"center",overflowX:"auto",flexWrap:"nowrap",position:"sticky",top:isMobile?100:56,zIndex:399}}>
        <input placeholder={t.search_product} value={prodSearch} onChange={e=>setProdSearch(e.target.value)} style={{padding:"7px 13px",border:"1px solid #ede8e2",background:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#555",outline:"none",borderRadius:20,minWidth:130,flexShrink:0}}/>
        <div style={{width:1,height:18,background:"#ede8e2",flexShrink:0}} />
        {cats.map(cat=>{const a=prodCat===cat;return<button key={cat} onClick={()=>setProdCat(cat)} style={{padding:"7px 13px",border:`1.5px solid ${a?"#1a1a1a":"#ede8e2"}`,background:a?"#1a1a1a":"#fff",color:a?"#fff":"#666",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",borderRadius:20,flexShrink:0,transition:"all 0.2s",whiteSpace:"nowrap"}}>{cat}</button>;})}
        <div style={{width:1,height:18,background:"#ede8e2",flexShrink:0}} />
        <select value={prodBrand} onChange={e=>setProdBrand(e.target.value)} style={{padding:"7px 13px",border:"1px solid #ede8e2",background:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#666",outline:"none",borderRadius:20,cursor:"pointer",flexShrink:0}}>
          {brands.map(b=><option key={b} value={b}>{b}</option>)}
        </select>
      </div>
      <main style={{maxWidth:1200,margin:"0 auto",padding:"24px clamp(12px,3vw,24px) 80px"}}>
        {loading?<div style={{textAlign:"center",padding:"60px 0",fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",color:"#ccc"}}>{t.loading}</div>
        :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:20}}>
          {fp.map((p,i)=>{
            const isNew=p._badge==="new"; const color=isNew?"#c9a96e":"#b85c5c"; const border=isNew?"#e8d9b8":"#f0d0d0"; const img=getProdImg(p);
            return (
              <div key={p.id} onClick={()=>setSelProd(p)} style={{background:"#fff",border:`1px solid ${border}`,overflow:"hidden",borderRadius:12,cursor:"pointer",transition:"all 0.2s",animation:`fadeUp 0.4s ease ${i*0.03}s both`}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 10px 30px rgba(0,0,0,0.1)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
                <div style={{position:"relative",paddingBottom:"80%",overflow:"hidden"}}>
                  {img?<img src={img} alt={p.product_name} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}} />:<div style={{position:"absolute",inset:0,background:"#f5f0eb",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"36px"}}>✨</div>}
                  <div style={{position:"absolute",top:8,left:8,background:color,color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:"8px",fontWeight:800,letterSpacing:"1.5px",textTransform:"uppercase",padding:"3px 9px",borderRadius:4}}>{isNew?t.new_in:t.top_pick}</div>
                </div>
                <div style={{padding:"12px 14px 14px"}}>
                  <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"9px",color,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",margin:"0 0 3px"}}>{p.brand}</p>
                  <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"13px",color:"#1a1a1a",margin:"0 0 4px",lineHeight:1.4,fontWeight:500}}>{p.product_name}</p>
                  <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#aaa",margin:"0 0 6px"}}>{p.category}</p>
                  {p.price_customer&&<p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"18px",color:"#1a1a1a",margin:"0 0 8px",fontWeight:600}}>€{p.price_customer}</p>}
                  <div style={{borderTop:"1px solid #f0ebe5",paddingTop:8}}>
                    <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"9px",color:"#bbb",letterSpacing:"1px",textTransform:"uppercase",margin:"0 0 4px"}}>📍 {t.available_at}</p>
                    {(p._salons||[]).slice(0,2).map(s=><p key={s.id} style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#666",margin:"0 0 1px"}}>→ {s.name}</p>)}
                    {(p._salons||[]).length>2&&<p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"#bbb",margin:0}}>+{p._salons.length-2} more</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>}
      </main>
      {showJoin&&<JoinModal onClose={()=>setShowJoin(false)} lang={lang} salons={salons} />}
      {selProd&&<ProductModal prod={selProd} salonsWithProd={selProd._salons||[]} onClose={()=>setSelProd(null)} onSalonClick={s=>setSelSalon(s)} lang={lang} />}
      {selSalon&&<SalonModal salon={selSalon} onClose={()=>setSelSalon(null)} leafletReady={lr} lang={lang} />}
    </>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [lang,setLang]=useState("en");
  const {salons,allProducts,loading}=useData();
  return (
    <Routes>
      <Route path="/" element={<LandingPage lang={lang} setLang={setLang} salons={salons} allProducts={allProducts} />} />
      <Route path="/salons" element={<SalonsPage lang={lang} setLang={setLang} salons={salons} loading={loading} />} />
      <Route path="/products" element={<ProductsPage lang={lang} setLang={setLang} allProducts={allProducts} salons={salons} loading={loading} />} />
      <Route path="*" element={<LandingPage lang={lang} setLang={setLang} salons={salons} allProducts={allProducts} />} />
    </Routes>
  );
}
