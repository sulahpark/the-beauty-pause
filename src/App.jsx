<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>파리 런칭 위크 — The Beauty Pause</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml"/>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;600&family=DM+Sans:wght@400;600&family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{background:#0d0d0d;color:#f5f0eb;scroll-behavior:smooth}
:root{
  --gold:#c9a96e;--gdim:rgba(201,169,110,0.25);--gbg:rgba(201,169,110,0.08);
  --w:#f5f0eb;--w50:rgba(245,240,235,0.5);
  --dark:#0d0d0d;--mid:#faf7f4;--light:#fff;--bdr:#e8e0d8;
  --pad:clamp(24px,6vw,80px);--max:800px;
  --kr:'Noto Sans KR',sans-serif;--ss:'DM Sans',sans-serif;--cg:'Cormorant Garamond',serif
}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
nav{position:sticky;top:0;z-index:500;background:#0d0d0d;height:60px;display:flex;align-items:center;justify-content:space-between;padding:0 var(--pad);border-bottom:1px solid rgba(255,255,255,.07)}
.nl{display:flex;align-items:center;gap:5px;text-decoration:none}
.nl .t{font-family:var(--cg);font-size:15px;color:var(--w);letter-spacing:2px;font-weight:300}
.nl .b{font-family:var(--cg);font-size:15px;color:var(--gold);letter-spacing:2px;font-weight:600}
.nc{font-family:var(--ss);font-size:13px;font-weight:600;color:var(--gold);border:1px solid rgba(201,169,110,.5);padding:8px 20px;border-radius:24px;text-decoration:none}
.nc:hover{background:var(--gbg)}
.s{padding:80px var(--pad)}
.sd{background:var(--dark)}.sm{background:var(--mid)}.sl{background:var(--light)}
.inn{max-width:var(--max);margin:0 auto}
.inc{max-width:680px;margin:0 auto;text-align:center}
.badge{font-family:var(--ss);font-size:10px;color:var(--gold);letter-spacing:2.5px;text-transform:uppercase;font-weight:600;display:inline-block;margin-bottom:16px}
.div{width:36px;height:2px;background:var(--gold);margin:12px 0 28px}
.hd{font-family:var(--kr);font-size:clamp(20px,2.5vw,28px);font-weight:700;color:var(--w);margin:0 0 12px;line-height:1.4}
.hl{font-family:var(--kr);font-size:clamp(20px,2.5vw,28px);font-weight:700;color:#1a1a1a;margin:0 0 12px;line-height:1.4}
/* hero */
.hero{background:var(--dark);padding:96px var(--pad) 64px;animation:fadeUp .5s ease both}
.hero h1{font-family:var(--kr);font-size:clamp(28px,5vw,48px);font-weight:700;color:var(--w);line-height:1.3;margin:0 0 24px}
.hero h1 span{font-size:.55em;color:var(--w50);font-weight:400;display:block;margin-top:8px}
.hero p{font-family:var(--kr);font-size:16px;color:var(--w50);line-height:1.9;max-width:580px}
/* hero images */
.hi{background:var(--dark);padding:0 var(--pad) 64px}
.hig{display:grid;grid-template-columns:1fr 1fr;gap:8px;max-width:var(--max);margin:0 auto}
.him{border-radius:14px;overflow:hidden;line-height:0}
.him img{width:100%;aspect-ratio:1;object-fit:cover;display:block}
.his{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.hisi{border-radius:10px;overflow:hidden;line-height:0}
.hisi img{width:100%;aspect-ratio:1;object-fit:cover;display:block}
/* launch week */
.lw{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-top:32px}
.lwc{border:1px solid var(--bdr);border-radius:12px;padding:18px 14px;text-align:center;background:#f8f5f0}
.lwc .ic{font-size:20px;margin:0 0 8px;display:block}
.lwc p{font-family:var(--kr);font-size:12px;font-weight:600;color:#1a1a1a;margin:0}
/* flow */
.flow{margin-top:36px;display:flex;flex-direction:column;gap:12px}
.fr{border-radius:14px;padding:16px 20px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.frk{background:#eeeae4;border:1px solid var(--bdr)}
.frf{background:#e8e1d4;border:1px solid #c9a96e55}
.flbl{font-family:var(--ss);font-size:11px;font-weight:700;min-width:60px;flex-shrink:0}
.frk .flbl{color:#777}
.frf .flbl{color:#8a6d3b}
.fcells{display:flex;align-items:center;gap:0;flex-wrap:wrap}
.fb{border-radius:10px;padding:10px 14px;text-align:center;font-family:var(--kr);font-size:12px;font-weight:700;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:100px}
.fbl{background:#fff;border:1px solid var(--bdr);color:#1a1a1a}
.fbd{background:rgba(0,0,0,.08);border:1px solid #c9a96e55;color:#1a1a1a}
.fba{background:rgba(201,169,110,.2);border:2px solid var(--gold);color:#1a1a1a}
.fb small{font-size:10px;font-weight:400;color:#888}
.fa{color:#aaa;font-size:14px;padding:0 4px;flex-shrink:0}
.fag{color:var(--gold)}
/* check */
.cg{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;margin-top:28px}
.ci{display:flex;align-items:flex-start;gap:10px;margin-bottom:4px}
.tk{color:var(--gold);flex-shrink:0;margin-top:1px}
.ci p{font-family:var(--kr);font-size:14px;line-height:1.6;margin:0}
.cgd .ci p{color:rgba(255,255,255,.6)}
.cgl .ci p{color:#555}
/* compare */
.cpg{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:32px}
.cp{border-radius:16px;padding:28px 24px}
.cpo{background:var(--light);border:1px solid var(--bdr)}
.cpn{background:#111;border:1px solid rgba(201,169,110,.2)}
.cplbl{font-family:var(--ss);font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;margin:0 0 16px;display:block}
.cpo .cplbl{color:#999}.cpn .cplbl{color:var(--gold)}
.cpi{display:flex;align-items:flex-start;gap:8px;font-family:var(--kr);font-size:14px;margin-bottom:10px;line-height:1.5}
.cpix{flex-shrink:0;margin-top:1px;font-size:13px}
.cpo .cpi{color:#666}.cpo .cpix{color:#ccc}
.cpn .cpi{color:rgba(255,255,255,.75)}.cpn .cpix{color:var(--gold)}
/* why tbp */
.wtg{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-top:28px}
.wti{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:20px}
.wtic{color:var(--gold);font-size:18px;margin-bottom:10px}
.wti p{font-family:var(--kr);font-size:13px;color:rgba(255,255,255,.65);line-height:1.6;margin:0}
.wti strong{color:var(--w);font-weight:700}
/* tags */
.tl{display:flex;flex-wrap:wrap;gap:4px;margin-top:20px}
.tag{font-family:var(--kr);font-size:13px;color:var(--gold);background:var(--gbg);border:1px solid var(--gdim);padding:6px 16px;border-radius:20px}
/* why we do this */
.wh{font-family:var(--kr);font-size:clamp(20px,3vw,28px);font-weight:700;color:var(--w);margin:16px 0 24px;line-height:1.5}
.wp{font-family:var(--kr);font-size:15px;color:var(--w50);line-height:2;margin:0 0 16px}
.ctab{display:inline-flex;align-items:center;padding:16px 40px;background:linear-gradient(135deg,#c9a96e,#b8944d);color:var(--dark);font-family:var(--kr);font-size:15px;font-weight:700;border-radius:12px;text-decoration:none;box-shadow:0 6px 24px rgba(201,169,110,.35);margin-top:32px}
.ctab:hover{opacity:.88}
/* scroll top */
#st{display:none;position:fixed;bottom:28px;right:20px;width:44px;height:44px;border-radius:50%;background:var(--gold);color:var(--dark);border:none;cursor:pointer;font-size:18px;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,.3);z-index:999}
#st.v{display:flex}
/* footer */
footer{background:var(--dark);padding:32px var(--pad);border-top:1px solid rgba(255,255,255,.05)}
.ft{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;margin-bottom:20px}
.ftc{font-family:var(--ss);font-size:10px;color:#333;margin-top:4px}
.ftl{font-family:var(--ss);font-size:11px;color:#444;text-decoration:none}
.ftl:hover{color:var(--gold)}
.ftb{border-top:1px solid rgba(255,255,255,.05);padding-top:16px}
.ftb p{font-family:var(--ss);font-size:10px;color:#444;line-height:1.8}
@media(max-width:600px){
  .cg,.cpg{grid-template-columns:1fr}
  .hig{grid-template-columns:1fr}
  .fb{min-width:80px;font-size:11px;padding:8px 10px}
}
@media(prefers-reduced-motion:reduce){.hero{animation:none}}
</style>
</head>
<body>

<nav>
  <a href="/" class="nl"><span class="t">THE</span><span class="b">BEAUTY PAUSE</span></a>
  <a href="mailto:hello@thebeautypause.com" class="nc">문의하기</a>
</nav>

<!-- HERO dark -->
<section class="hero">
  <div class="inn">
    <span class="badge">✦ For Institutions &amp; Agencies</span>
    <h1>파리 런칭 위크<span>한국 뷰티 브랜드의 파리 오프라인 런칭 프로그램</span></h1>
    <p>더뷰티퍼즈(The Beauty Pause)는 파리의 실제 뷰티 살롱 네트워크를 통해 한국 뷰티 브랜드가 유럽 소비자와 만날 수 있는 오프라인 런칭 프로그램을 운영합니다.</p>
  </div>
</section>

<!-- HERO IMAGES dark -->
<section style="background:#0d0d0d;padding:0 clamp(24px,6vw,80px) 64px">
  <div style="max-width:800px;margin:0 auto">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div style="border-radius:14px;overflow:hidden;aspect-ratio:1;background:#ddd">
        <img src="/images/aurabeaute04.jpeg" alt="파리 살롱" draggable="false" style="width:100%;height:100%;object-fit:cover;display:block;pointer-events:none">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:8px">
        <div style="border-radius:10px;overflow:hidden;aspect-ratio:1;background:#ddd"><img src="/images/IMG_0189.jpeg" alt="" draggable="false" style="width:100%;height:100%;object-fit:cover;display:block;pointer-events:none"></div>
        <div style="border-radius:10px;overflow:hidden;aspect-ratio:1;background:#ddd"><img src="/images/IMG20260529105931.jpg" alt="" draggable="false" style="width:100%;height:100%;object-fit:cover;display:block;pointer-events:none"></div>
        <div style="border-radius:10px;overflow:hidden;aspect-ratio:1;background:#ddd"><img src="/images/IMG_0175.jpeg" alt="" draggable="false" style="width:100%;height:100%;object-fit:cover;display:block;pointer-events:none"></div>
        <div style="border-radius:10px;overflow:hidden;aspect-ratio:1;background:#ddd"><img src="/images/IMG_0183.jpeg" alt="" draggable="false" style="width:100%;height:100%;object-fit:cover;display:block;pointer-events:none"></div>
      </div>
    </div>
  </div>
</section>

<!-- PARIS LAUNCH WEEK light -->
<section class="s sl">
  <div class="inn">
    <span class="badge">✦ Paris Launch Week</span>
    <div class="div"></div>
    <h2 class="hl">파리에서 시작하는 브랜드 런칭 캠페인</h2>
    <p style="font-family:var(--kr);font-size:14px;color:#666;line-height:1.9;margin:0 0 10px;max-width:600px">선정된 브랜드는 2주 동안 파리의 참여 뷰티 살롱 10곳에서 동시에 소개됩니다.</p>
    <p style="font-family:var(--kr);font-size:14px;color:#666;line-height:1.9;margin:0 0 32px;max-width:600px">고객은 제품을 발견하고 QR을 통해 브랜드 정보를 확인하거나 이벤트에 참여하고, 브랜드의 구매 페이지까지 이동할 수 있습니다.</p>
    <div class="lw">
      <div class="lwc"><span class="ic">🏠</span><p>살롱 10곳</p></div>
      <div class="lwc"><span class="ic">📅</span><p>2주간 운영</p></div>
      <div class="lwc"><span class="ic">🎁</span><p>고객 참여 이벤트</p></div>
      <div class="lwc"><span class="ic">📸</span><p>SNS 콘텐츠</p></div>
      <div class="lwc"><span class="ic">🛍</span><p>구매 연결</p></div>
    </div>
  </div>
</section>

<!-- HOW IT WORKS mid -->
<section class="s sm">
  <div class="inn">
    <span class="badge">✦ How It Works</span>
    <div class="div"></div>
    <h2 class="hl">브랜드는 이렇게 유럽에서 소개됩니다.</h2>
    <p style="font-family:var(--kr);font-size:13px;color:#999;margin:8px 0 0">계약은 한국에서, 운영은 프랑스 법인이 직접 담당합니다.</p>
    <div class="flow">
      <div class="fr frk">
        <span class="flbl">🇰🇷 한국</span>
        <div class="fcells">
          <div class="fb fbl">한국 브랜드</div>
          <span class="fa">→</span>
          <div class="fb fbl">한국 법인 계약<small>더뷰티퍼즈 한국</small></div>
          <span class="fa">→</span>
          <div class="fb fbl">제품 발송</div>
        </div>
      </div>
      <div class="fr frf">
        <span class="flbl">🇫🇷 파리</span>
        <div class="fcells">
          <div class="fb fbd">프랑스 법인 운영<small>더뷰티퍼즈 프랑스</small></div>
          <span class="fa fag">→</span>
          <div class="fb fba">파리 살롱<small>네트워크</small></div>
          <span class="fa fag">→</span>
          <div class="fb fbd">유럽 고객</div>
          <span class="fa fag">→</span>
          <div class="fb fbd">QR →<small>이벤트/구매</small></div>
          <span class="fa fag">→</span>
          <div class="fb fbd">리포트</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- WHAT WE DO dark -->
<section class="s sd">
  <div class="inn">
    <span class="badge">✦ What We Do</span>
    <div class="div"></div>
    <h2 class="hd">더뷰티퍼즈가 담당합니다.</h2>
    <div class="cg cgd">
      <div class="ci"><span class="tk">✓</span><p>한국 법인 계약</p></div>
      <div class="ci"><span class="tk">✓</span><p>CPNP 지원 (필요 시)</p></div>
      <div class="ci"><span class="tk">✓</span><p>프랑스 법인 운영</p></div>
      <div class="ci"><span class="tk">✓</span><p>파리 살롱 네트워크 운영</p></div>
      <div class="ci"><span class="tk">✓</span><p>제품 설치 및 관리</p></div>
      <div class="ci"><span class="tk">✓</span><p>QR 제작 및 연결</p></div>
      <div class="ci"><span class="tk">✓</span><p>고객 참여 이벤트</p></div>
      <div class="ci"><span class="tk">✓</span><p>콘텐츠 제작</p></div>
      <div class="ci"><span class="tk">✓</span><p>운영 결과 리포트</p></div>
    </div>
  </div>
</section>

<!-- BRAND DELIVERABLES light -->
<section class="s sl">
  <div class="inn">
    <span class="badge">✦ Brand Deliverables</span>
    <div class="div"></div>
    <h2 class="hl">브랜드 결과물</h2>
    <div class="cg cgl">
      <div class="ci"><span class="tk">✓</span><p>어느 살롱에 배치되었는지</p></div>
      <div class="ci"><span class="tk">✓</span><p>현장 설치 사진</p></div>
      <div class="ci"><span class="tk">✓</span><p>브랜드 콘텐츠</p></div>
      <div class="ci"><span class="tk">✓</span><p>QR 스캔 수</p></div>
      <div class="ci"><span class="tk">✓</span><p>고객 참여 현황</p></div>
      <div class="ci"><span class="tk">✓</span><p>이벤트 결과</p></div>
      <div class="ci"><span class="tk">✓</span><p>구매 연결 현황</p></div>
    </div>
  </div>
</section>

<!-- WHY 더뷰티퍼즈 dark -->
<section class="s sd">
  <div class="inn">
    <span class="badge">✦ Why 더뷰티퍼즈</span>
    <div class="div"></div>
    <h2 class="hd">왜 더뷰티퍼즈여야 하나</h2>
    <div class="wtg">
      <div class="wti"><div class="wtic">🇰🇷</div><p><strong>한국 계약 가능</strong><br>한국 법인으로 계약 진행 — 해외 법인 설립 없이 바로 시작</p></div>
      <div class="wti"><div class="wtic">📍</div><p><strong>프랑스 현지 직접 운영</strong><br>파리에 기반한 팀이 살롱 입점부터 현장 관리까지 직접 담당</p></div>
      <div class="wti"><div class="wtic">💄</div><p><strong>파리 살롱 네트워크 보유</strong><br>파리 전역 뷰티 살롱과의 신뢰 관계 — 즉시 입점 가능</p></div>
      <div class="wti"><div class="wtic">📊</div><p><strong>데이터 기반 결과 리포트</strong><br>QR 스캔, 구매 연결 현황을 수치로 정리해서 제공</p></div>
    </div>
  </div>
</section>

<!-- FLEXIBLE mid -->
<section class="s sm">
  <div class="inn">
    <span class="badge">✦ Flexible Program</span>
    <div class="div"></div>
    <h2 class="hl">기관 사업 목적에 맞게 프로그램을 조정할 수 있습니다.</h2>
    <div class="tl">
      <span class="tag">참여 브랜드 수</span>
      <span class="tag">운영 기간</span>
      <span class="tag">살롱 수</span>
      <span class="tag">이벤트 방식</span>
      <span class="tag">콘텐츠 제작</span>
      <span class="tag">결과 리포트</span>
    </div>
  </div>
</section>

<!-- WHY THIS MODEL light -->
<section class="s sl">
  <div class="inn">
    <span class="badge">✦ Why This Model</span>
    <div class="div"></div>
    <h2 class="hl">기존 방식과 다른 점</h2>
    <div class="cpg">
      <div class="cp cpo">
        <span class="cplbl">기존 해외진출</span>
        <div class="cpi"><span class="cpix">✕</span>박람회 — 행사 후 연결 끊김</div>
        <div class="cpi"><span class="cpix">✕</span>유통사 계약 — 높은 진입장벽</div>
        <div class="cpi"><span class="cpix">✕</span>바이어 미팅 — 결과 불명확</div>
        <div class="cpi"><span class="cpix">✕</span>리테일 입점 — 긴 준비 기간</div>
      </div>
      <div class="cp cpn">
        <span class="cplbl">더뷰티퍼즈</span>
        <div class="cpi"><span class="cpix">✓</span>파리 살롱에서 실제 소비자 직접 노출</div>
        <div class="cpi"><span class="cpix">✓</span>QR로 브랜드 정보 및 구매 연결</div>
        <div class="cpi"><span class="cpix">✓</span>유통·리테일 이전 단계에서 반응 확인</div>
        <div class="cpi"><span class="cpix">✓</span>운영 결과 리포트 제공</div>
      </div>
    </div>
  </div>
</section>

<!-- WHY WE DO THIS dark -->
<section class="s sd" style="padding:88px var(--pad)">
  <div class="inc">
    <span class="badge">✦ Why We Do This</span>
    <h2 class="wh">해외 진출의 새로운 실행 방식을 제안합니다.</h2>
    <p class="wp">The Beauty Pause는 파리 현지에서 직접 운영하는 뷰티 살롱 네트워크를 기반으로 한국 브랜드가 유럽 소비자와 만날 수 있는 오프라인 프로그램을 운영합니다.</p>
    <p class="wp">현지 소비자 접점과 운영까지 포함하는 새로운 형태의 해외 마케팅 프로그램으로 활용할 수 있습니다.</p>
    <p class="wp">검토 후 궁금한 점이나, 함께 조정해볼 수 있는 운영 방식이 있다면 편하게 의견 주세요.</p>
    <a href="mailto:hello@thebeautypause.com" class="ctab">hello@thebeautypause.com</a>
  </div>
</section>

<button id="st" onclick="window.scrollTo({top:0,behavior:'smooth'})" aria-label="맨 위로">↑</button>

<footer>
  <div class="ft">
    <div>
      <div>
        <span style="font-family:var(--cg);font-size:15px;color:var(--w);letter-spacing:2px;font-weight:300">THE</span>
        <span style="font-family:var(--cg);font-size:15px;color:var(--gold);letter-spacing:2px;font-weight:600;margin-left:5px">BEAUTY PAUSE</span>
      </div>
      <p class="ftc">© 2025 The Beauty Pause</p>
    </div>
    <a href="mailto:hello@thebeautypause.com" class="ftl">Contact</a>
  </div>
  <div class="ftb">
    <p>주식회사 쏜다 · 대표자 박슬아 · 서울 강남구 테헤란로82길 15 (대치동, 디아이타워)<br>
    사업자등록번호 426-88-02305 · 통신판매업신고번호 2025-서울강남-00594<br>
    hello@thebeautypause.com</p>
  </div>
</footer>

<script>
const s=document.getElementById('st');
window.addEventListener('scroll',()=>s.classList.toggle('v',scrollY>600));
</script>
</body>
</html>
