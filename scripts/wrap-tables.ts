import fs from 'fs';
import path from 'path';

const SHEETS_ROOT = path.resolve(process.cwd(), 'public', 'sheets');

function processDir(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.html') || entry.name.endsWith('.htm'))) {
      fixHtmlFile(fullPath);
    }
  }
}

function fixHtmlFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Add responsive containment style if not present
  const stylePatch = `
    *, *::before, *::after { box-sizing: border-box !important; }
    html, body { max-width: 100% !important; overflow-x: hidden !important; word-wrap: break-word !important; }
    body { padding: 24px 20px !important; margin: 0 auto !important; max-width: 920px !important; }
    .table-responsive { width: 100% !important; max-width: 100% !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; margin: 1.5em 0 !important; border: 1px solid #d4d8e0 !important; border-radius: 6px !important; background: #fff !important; }
    .table-responsive table { width: 100% !important; margin: 0 !important; border: none !important; border-collapse: collapse !important; }
    table { width: 100% !important; max-width: 100% !important; border-collapse: collapse !important; }
    th, td { word-break: normal !important; overflow-wrap: break-word !important; }
    .grid-cards, .grid-kana, .grid-types, .vs-box { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)) !important; gap: 12px !important; max-width: 100% !important; }
    pre, code { max-width: 100% !important; overflow-x: auto !important; white-space: pre-wrap !important; word-break: break-all !important; }
  `;

  // Inject into <style> if present, or add <style>
  if (content.includes('</style>')) {
    content = content.replace('</style>', `${stylePatch}\n  </style>`);
  } else if (content.includes('</head>')) {
    content = content.replace('</head>', `<style>${stylePatch}</style>\n</head>`);
  }

  // Wrap all <table> that are not already inside .table-responsive
  // Simple regex to wrap table tags
  content = content.replace(/(?<!<div class="table-responsive">[\s\S]{0,50})<table([\s\S]*?)<\/table>/gi, (match) => {
    if (match.includes('class="table-responsive"')) return match;
    return `<div class="table-responsive">\n<table${match.slice(6)}`;
  });

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Fixed containment in:', filePath.replace(SHEETS_ROOT, ''));
}

processDir(SHEETS_ROOT);
console.log('All public HTML sheets updated with responsive table containment!');
