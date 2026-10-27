import glob
import re

files = sorted(glob.glob('public/sheets/*/*/*.html'))

for f in files:
    if 'studio_calligrafico_cinese' in f:
        print(f"Skipping custom app: {f}")
        continue
    
    with open(f, 'r', encoding='utf-8') as fp:
        content = fp.read()

    # 1. Clean any old injected style blocks
    content = re.sub(r'\s*<style\s+id="glossa-unified-sheet-style">.*?</style>', '', content, flags=re.DOTALL)
    content = re.sub(r'\s*<style id="mobile-readability-fix">.*?</style>', '', content, flags=re.DOTALL)

    # 2. Ensure meta viewport tag
    if 'name="viewport"' not in content:
        content = content.replace('<head>', '<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">')

    # 3. Add clean unified style ensuring bottom padding and mobile responsiveness
    unified_css = """
  <style id="glossa-unified-sheet-style">
    *, *:before, *:after { box-sizing: border-box; }
    html {
      -webkit-text-size-adjust: 100%;
      text-size-adjust: 100%;
      background-color: #ffffff;
      width: 100%;
      height: 100%;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.7;
      color: #1e242c;
      background-color: #ffffff;
      margin: 0 auto !important;
      max-width: 900px !important;
      padding: 24px 20px 100px 20px !important; /* Generous 100px bottom padding so content is NEVER cut off */
      font-size: 16px;
      min-height: 100%;
    }
    @media (max-width: 640px) {
      body {
        padding: 16px 14px 100px 14px !important;
        font-size: 15px;
      }
      h1 { font-size: 1.55rem !important; }
      h2 { font-size: 1.25rem !important; }
    }
    h1 {
      font-size: 1.85rem;
      font-weight: 700;
      color: #111827;
      margin-top: 0;
      margin-bottom: 12px;
      padding-bottom: 8px;
    }
    h2 {
      font-size: 1.35rem;
      font-weight: 600;
      color: #1f2937;
      margin-top: 1.8rem;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e5e7eb;
    }
    p {
      margin: 10px 0;
    }
    /* Horizontal scrolling container so tables NEVER overflow or get cut off */
    .table-container {
      width: 100% !important;
      max-width: 100% !important;
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
      margin: 18px 0 !important;
      border: 1px solid #d1d5db !important;
      border-radius: 6px !important;
      background-color: #ffffff !important;
    }
    table {
      width: 100% !important;
      min-width: 480px !important;
      border-collapse: collapse !important;
      margin: 0 !important;
      font-size: 14px !important;
    }
    th, td {
      border: 1px solid #e5e7eb !important;
      padding: 10px 12px !important;
      text-align: left !important;
      vertical-align: middle !important;
    }
    th {
      background-color: #f3f4f6 !important;
      font-weight: 600 !important;
      color: #374151 !important;
    }
    tr:nth-child(even) {
      background-color: #f9fafb !important;
    }
    .grid-cards, .grid-kana, .grid-types, .vs-box {
      display: grid !important;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)) !important;
      gap: 14px !important;
      margin: 18px 0 !important;
    }
    .mini-card {
      border: 1px solid #e5e7eb !important;
      border-radius: 6px !important;
      padding: 12px 14px !important;
      background-color: #ffffff !important;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04) !important;
    }
  </style>
"""
    if '</head>' in content:
        content = content.replace('</head>', f'{unified_css}\n</head>')

    with open(f, 'w', encoding='utf-8') as fp:
        fp.write(content)
    
    print(f"Updated: {f}")

print("Sheets updated with 100px bottom padding & responsive containment.")
