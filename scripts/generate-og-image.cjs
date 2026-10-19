// Generates the 1200x630 Open Graph / Twitter social preview card for Guess the Price.
// Embeds the Docallisme signature font and real product photos as base64 in SVG, then
// renders to crisp PNGs using sharp.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function fetchBase64(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const mime = res.headers.get('content-type') || (url.includes('.webp') ? 'image/webp' : 'image/jpeg');
  return `data:${mime};base64,${buf.toString('base64')}`;
}

async function main() {
  console.log('Fetching product thumbnails...');
  const [clothB64, leicaB64, iphoneB64] = await Promise.all([
    fetchBase64('https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/MLH74?wid=400&hei=400&fmt=jpeg&qlt=85'),
    fetchBase64('https://leica-store.in/cdn/shop/files/19080_Leica_Q3_front_1000x1000_1000x1000_b7a5755e-5c12-4c2f-8216-5b9a4e46cd5b.webp?v=1691223719&width=400'),
    fetchBase64('https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-duo-finish-unselect-gallery-2-202609_GEO_EMEA?wid=480&hei=400&fmt=jpeg&qlt=85'),
  ]);

  const fontPath = path.resolve('public/fonts/docallismeonstreet.otf');
  const fontB64 = fs.readFileSync(fontPath).toString('base64');

  // Wavy path for the IDE squiggly line under "agents"
  // Wave: M0,3 Q2.5,0 5,3 T10,3 T15,3 T20,3 T25,3 T30,3 T35,3 T40,3 T45,3 T50,3 T55,3 T60,3 T65,3 T70,3 T75,3 T80,3
  const squigglyD = 'M0,3 ' + Array.from({ length: 16 }, (_, i) => {
    const x1 = (i * 2 + 1) * 2.5;
    const x2 = (i * 2 + 2) * 2.5;
    return i === 0 ? `Q${x1},0 ${x2},3` : `T${x2},3`;
  }).join(' ');

  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @font-face {
        font-family: 'Docallisme';
        src: url('data:font/otf;base64,${fontB64}') format('opentype');
      }
      .font-doc { font-family: 'Docallisme', sans-serif; }
      .font-sans { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
      .font-mono { font-family: ui-monospace, SFMono-Regular, 'JetBrains Mono', Menlo, Consolas, monospace; }
    </style>

    <!-- Background radial glow -->
    <radialGradient id="bgGlow" cx="45%" cy="-10%" r="90%">
      <stop offset="0%" stop-color="#432bb3"/>
      <stop offset="35%" stop-color="#2a1a70"/>
      <stop offset="70%" stop-color="#150f38"/>
      <stop offset="100%" stop-color="#0b081e"/>
    </radialGradient>

    <!-- Coin 3D gradient -->
    <radialGradient id="coinGrad" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#ffe699"/>
      <stop offset="45%" stop-color="#ffb703"/>
      <stop offset="100%" stop-color="#d97706"/>
    </radialGradient>

    <!-- Card shadow -->
    <filter id="cardShadow" x="-15%" y="-15%" width="130%" height="135%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#050314" flood-opacity="0.45"/>
    </filter>

    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="35"/>
    </filter>
  </defs>

  <!-- Deep background -->
  <rect width="1200" height="630" fill="url(#bgGlow)"/>

  <!-- Ambient glow orbs -->
  <circle cx="160" cy="180" r="140" fill="#ffb703" opacity="0.12" filter="url(#softGlow)"/>
  <circle cx="950" cy="280" r="220" fill="#38bdf8" opacity="0.10" filter="url(#softGlow)"/>
  <circle cx="1080" cy="480" r="160" fill="#a855f7" opacity="0.08" filter="url(#softGlow)"/>

  <!-- Subtle star particles (inspired by sc136-github-io) -->
  <g fill="#ffb703" opacity="0.45">
    <circle cx="85" cy="70" r="1.5"/>
    <circle cx="340" cy="45" r="1"/>
    <circle cx="560" cy="110" r="2"/>
    <circle cx="1120" cy="80" r="1.5"/>
    <circle cx="610" cy="380" r="1.5"/>
    <circle cx="1150" cy="540" r="1.2"/>
    <polygon points="1135,140 1137,145 1142,147 1137,149 1135,154 1133,149 1128,147 1133,145" fill="#38bdf8" opacity="0.75"/>
    <polygon points="75,340 77,344 81,345 77,347 75,351 73,347 69,345 73,344" fill="#ffb703" opacity="0.6"/>
    <polygon points="570,520 572,523 576,524 572,525 570,529 568,525 564,524 568,523" fill="#38bdf8" opacity="0.5"/>
  </g>

  <!-- ================= LEFT COLUMN ================= -->
  <g transform="translate(80, 0)">

    <!-- Category Pill Badge -->
    <g transform="translate(0, 78)">
      <rect width="265" height="30" rx="15" fill="#ffb703" fill-opacity="0.14" stroke="#ffb703" stroke-opacity="0.45" stroke-width="1.2"/>
      <text x="132" y="20" class="font-mono" font-size="11.5" font-weight="700" fill="#ffd166" letter-spacing="1.5" text-anchor="middle">
        RETAIL PRICE GAME · 10 ROUNDS
      </text>
    </g>

    <!-- Logo Coin + Main Title -->
    <g transform="translate(0, 132)">
      <!-- 3D Coin Badge -->
      <g transform="translate(0, 0) rotate(-6)">
        <circle cx="36" cy="40" r="36" fill="#a15800" opacity="0.55"/>
        <circle cx="36" cy="36" r="36" fill="url(#coinGrad)"/>
        <circle cx="36" cy="36" r="32" fill="none" stroke="#ffeaa7" stroke-width="2" opacity="0.75"/>
        <text x="36" y="47" class="font-sans" font-size="38" font-weight="900" fill="#2d1c00" text-anchor="middle">₹</text>
      </g>

      <!-- Title lines -->
      <text x="96" y="32" class="font-sans" font-size="52" font-weight="900" fill="#ffffff" letter-spacing="-1">Guess the</text>
      <text x="96" y="85" class="font-sans" font-size="62" font-weight="900" fill="#ffb703" letter-spacing="-1.5">Price</text>
    </g>

    <!-- Subtitle -->
    <g transform="translate(0, 252)">
      <text x="0" y="0" class="font-sans" font-size="20" font-weight="500" fill="#e0dbf5" letter-spacing="-0.2">
        See the product. Guess the real cost.
      </text>
      <text x="0" y="28" class="font-sans" font-size="16" font-weight="400" fill="#aba3d6" letter-spacing="-0.1">
        From a ₹1,080 polishing cloth to a ₹7.15L Leica.
      </text>
      <text x="0" y="52" class="font-sans" font-size="16" font-weight="400" fill="#aba3d6" letter-spacing="-0.1">
        How well do you really know the shelf?
      </text>
    </g>

    <!-- Mode Pills -->
    <g transform="translate(0, 342)">
      <!-- Pill 1: Options -->
      <g transform="translate(0, 0)">
        <rect width="215" height="52" rx="14" fill="#fffdf7" filter="url(#cardShadow)"/>
        <rect width="215" height="52" rx="14" fill="none" stroke="#e4dfcf" stroke-width="1"/>
        <text x="16" y="25" class="font-sans" font-size="14" font-weight="800" fill="#1d1838">🎯 Pick the price</text>
        <text x="16" y="42" class="font-sans" font-size="11.5" font-weight="600" fill="#5f5983">4 options · 100 pts</text>
      </g>
      <!-- Pill 2: Exact guess -->
      <g transform="translate(228, 0)">
        <rect width="215" height="52" rx="14" fill="#fffdf7" filter="url(#cardShadow)"/>
        <rect width="215" height="52" rx="14" fill="none" stroke="#e4dfcf" stroke-width="1"/>
        <text x="16" y="25" class="font-sans" font-size="14" font-weight="800" fill="#1d1838">⌨️ Exact guess</text>
        <text x="16" y="42" class="font-sans" font-size="11.5" font-weight="600" fill="#5f5983">Scored by closeness · 1K pts</text>
      </g>
    </g>

    <!-- Live Buy Link Feature Badge -->
    <g transform="translate(0, 420)">
      <rect width="443" height="38" rx="10" fill="#ffffff" fill-opacity="0.06" stroke="#ffffff" stroke-opacity="0.16" stroke-width="1"/>
      <text x="16" y="24" class="font-mono" font-size="12" font-weight="600" fill="#7dd3fc">
        🛍️ Instant store buy link revealed after every round
      </text>
    </g>

    <!-- Footer credit (SC & his agents signature) -->
    <g transform="translate(0, 520)">
      <text x="0" y="24" class="font-sans" font-size="15" font-weight="500" fill="#938abf">orchestrated by</text>

      <!-- SC in Docallisme signature font -->
      <text x="122" y="28" class="font-doc" font-size="28" font-weight="400" fill="#ffb703" letter-spacing="1">SC</text>

      <text x="168" y="24" class="font-sans" font-size="15" font-weight="500" fill="#938abf">&amp; his</text>

      <!-- agents in cyan monospace with squiggly wave -->
      <g transform="translate(215, 6)">
        <text x="0" y="18" class="font-mono" font-size="16" font-weight="700" fill="#38bdf8" letter-spacing="0.5">agents</text>
        <path d="${squigglyD}" transform="translate(0, 23)" fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-linecap="round"/>
      </g>

      <!-- Domain slug -->
      <text x="0" y="58" class="font-mono" font-size="13" font-weight="500" fill="#ffffff" fill-opacity="0.45" letter-spacing="0.5">
        guess-the-price-can-u.vercel.app
      </text>
    </g>

  </g>

  <!-- ================= RIGHT COLUMN: 3D FLOATING PRODUCT CARDS ================= -->
  <!-- Card 1: Apple Polishing Cloth (Top, rotated -2.8deg) -->
  <g transform="translate(710, 58) rotate(-2.8 220 70)">
    <rect width="420" height="135" rx="18" fill="#fffdf7" filter="url(#cardShadow)"/>
    <rect width="420" height="135" rx="18" fill="none" stroke="#e4dfcf" stroke-width="1.2"/>

    <!-- Product thumbnail container -->
    <rect x="16" y="16" width="103" height="103" rx="14" fill="#ffffff" stroke="#ede8d8" stroke-width="1"/>
    <image x="21" y="21" width="93" height="93" href="${clothB64}" preserveAspectRatio="xMidYMid meet"/>

    <!-- Text content -->
    <g transform="translate(132, 28)">
      <rect x="0" y="0" width="88" height="20" rx="10" fill="#f2eee2"/>
      <text x="44" y="14" class="font-sans" font-size="10" font-weight="800" fill="#5f5983" letter-spacing="0.6" text-anchor="middle">ACCESSORIES</text>

      <text x="0" y="42" class="font-sans" font-size="18.5" font-weight="800" fill="#1d1838">Apple Polishing Cloth</text>
      <text x="0" y="60" class="font-sans" font-size="12" font-weight="500" fill="#716b94">Cleans nano-texture displays</text>

      <g transform="translate(0, 72)">
        <text x="0" y="18" class="font-sans" font-size="20" font-weight="900" fill="#14935a">₹1,080</text>
        <rect x="74" y="2" width="108" height="20" rx="10" fill="#e0f6ea"/>
        <text x="128" y="16" class="font-sans" font-size="10.5" font-weight="800" fill="#14935a" text-anchor="middle">Yes, for a cloth!</text>
      </g>
    </g>
  </g>

  <!-- Card 2: Leica Q3 (Middle, rotated 2.2deg) -->
  <g transform="translate(725, 222) rotate(2.2 225 80)">
    <rect width="430" height="145" rx="18" fill="#fffdf7" filter="url(#cardShadow)"/>
    <rect width="430" height="145" rx="18" fill="none" stroke="#e4dfcf" stroke-width="1.2"/>

    <!-- Product thumbnail container -->
    <rect x="16" y="16" width="113" height="113" rx="14" fill="#ffffff" stroke="#ede8d8" stroke-width="1"/>
    <image x="21" y="21" width="103" height="103" href="${leicaB64}" preserveAspectRatio="xMidYMid meet"/>

    <!-- Text content -->
    <g transform="translate(142, 30)">
      <rect x="0" y="0" width="94" height="20" rx="10" fill="#f2eee2"/>
      <text x="47" y="14" class="font-sans" font-size="10" font-weight="800" fill="#5f5983" letter-spacing="0.6" text-anchor="middle">CAMERA GEAR</text>

      <text x="0" y="44" class="font-sans" font-size="19" font-weight="800" fill="#1d1838">Leica Q3 (Black)</text>
      <text x="0" y="63" class="font-sans" font-size="12" font-weight="500" fill="#716b94">Full-frame 60 MP compact · 28mm f/1.7</text>

      <g transform="translate(0, 76)">
        <text x="0" y="20" class="font-sans" font-size="22" font-weight="900" fill="#d97706">₹7,15,000</text>
        <rect x="110" y="3" width="96" height="21" rx="10" fill="#fef3c7"/>
        <text x="158" y="17" class="font-sans" font-size="10.5" font-weight="800" fill="#b45309" text-anchor="middle">A compact!?</text>
      </g>
    </g>
  </g>

  <!-- Card 3: Apple iPhone Duo, 2 TB (Bottom, rotated -1.4deg) -->
  <g transform="translate(705, 396) rotate(-1.4 225 80)">
    <rect width="435" height="142" rx="18" fill="#fffdf7" filter="url(#cardShadow)"/>
    <rect width="435" height="142" rx="18" fill="none" stroke="#e4dfcf" stroke-width="1.2"/>

    <!-- Product thumbnail container -->
    <rect x="16" y="16" width="110" height="110" rx="14" fill="#ffffff" stroke="#ede8d8" stroke-width="1"/>
    <image x="21" y="21" width="100" height="100" href="${iphoneB64}" preserveAspectRatio="xMidYMid meet"/>

    <!-- Text content -->
    <g transform="translate(140, 28)">
      <rect x="0" y="0" width="88" height="20" rx="10" fill="#f2eee2"/>
      <text x="44" y="14" class="font-sans" font-size="10" font-weight="800" fill="#5f5983" letter-spacing="0.6" text-anchor="middle">ELECTRONICS</text>

      <text x="0" y="44" class="font-sans" font-size="19" font-weight="800" fill="#1d1838">Apple iPhone Duo, 2 TB</text>
      <text x="0" y="63" class="font-sans" font-size="12" font-weight="500" fill="#716b94">7.6″ folding Super Retina XDR</text>

      <g transform="translate(0, 76)">
        <text x="0" y="20" class="font-sans" font-size="22" font-weight="900" fill="#d97706">₹4,49,900</text>
        <rect x="110" y="3" width="98" height="21" rx="10" fill="#fff1f2"/>
        <text x="159" y="17" class="font-sans" font-size="10.5" font-weight="800" fill="#e11d48" text-anchor="middle">Car price tag</text>
      </g>
    </g>
  </g>

</svg>`;

  console.log('Rendering 1200x630 PNG via sharp...');
  const pngBuffer = await sharp(Buffer.from(svg))
    .png({ quality: 95, compressionLevel: 8 })
    .toBuffer();

  const targets = [
    'app/opengraph-image.png',
    'app/twitter-image.png',
    'public/og-image.png',
  ];

  for (const t of targets) {
    fs.writeFileSync(path.resolve(t), pngBuffer);
    console.log(`✓ Wrote ${t} (${(pngBuffer.length / 1024).toFixed(1)} KB)`);
  }
  console.log('Done!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
