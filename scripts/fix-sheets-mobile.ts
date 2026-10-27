import fs from 'fs';
import path from 'path';

const PUBLIC_SHEETS = path.resolve(process.cwd(), 'public', 'sheets');

function processDirectory(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.html') || entry.name.endsWith('.htm'))) {
      let content = fs.readFileSync(fullPath, 'utf-8');

      // 1. Ensure viewport meta tag exists
      if (!content.includes('name="viewport"')) {
        content = content.replace(
          /<head[^>]*>/i,
          `$& \n  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />`
        );
      }

      // 2. Ensure base mobile typography and responsive containment CSS exists in head
      const mobileCss = `
  <style id="mobile-readability-fix">
    *, *:before, *:after { box-sizing: border-box; }
    html {
      -webkit-text-size-adjust: 100%;
      text-size-adjust: 100%;
    }
    body {
      font-size: 17px !important;
      line-height: 1.7 !important;
      margin: 0 !important;
      padding: 16px 14px !important;
      color: #1a1a1a !important;
      max-width: 860px !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }
    h1 {
      font-size: 1.65rem !important;
      line-height: 1.25 !important;
      margin-top: 10px !important;
      margin-bottom: 12px !important;
    }
    h2 {
      font-size: 1.3rem !important;
      margin-top: 24px !important;
      margin-bottom: 10px !important;
    }
    table {
      width: 100% !important;
      max-width: 100% !important;
      border-collapse: collapse !important;
      margin: 16px 0 !important;
      font-size: 0.95rem !important;
      display: table !important;
    }
    th, td {
      padding: 8px 10px !important;
    }
    /* Responsive card grids on mobile */
    .grid-cards, .grid-types, .vs-box, .grid-kana {
      display: grid !important;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)) !important;
      gap: 12px !important;
    }
  </style>`;

      // Only add to Glossa's built-in sheets, DO NOT tamper with user's custom apps like studio_calligrafico_cinese!
      if (!entry.name.includes('studio_calligrafico') && !content.includes('id="mobile-readability-fix"')) {
        if (content.includes('</head>')) {
          content = content.replace('</head>', `${mobileCss}\n</head>`);
        }
      }

      fs.writeFileSync(fullPath, content, 'utf-8');
      console.log('Processed:', fullPath);
    }
  }
}

processDirectory(PUBLIC_SHEETS);
console.log('Mobile viewport and typography updated across sheets.');
