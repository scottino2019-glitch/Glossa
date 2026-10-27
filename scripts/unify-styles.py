import glob
import re

files = sorted(glob.glob('public/sheets/*/*/*.html'))

for f in files:
    if 'studio_calligrafico_cinese' in f:
        print(f"Skipping calligraphy app: {f}")
        continue
    
    with open(f, 'r', encoding='utf-8') as fp:
        content = fp.read()

    # Determine language-specific accent color
    accent_color = '#334155'
    if 'cinese' in f:
        accent_color = '#c2410c'
    elif 'giapponese' in f:
        accent_color = '#1d4ed8'
    elif 'coreano' in f:
        accent_color = '#047857'
    elif 'russo' in f:
        accent_color = '#0369a1'
    elif 'arabo' in f:
        accent_color = '#b45309'
    elif 'tedesco' in f:
        accent_color = '#15803d'
    elif 'miei-fogli' in f:
        accent_color = '#7c3aed'

    # Remove all existing <style>...</style> tags
    content = re.sub(r'\s*<style.*?</style>', '', content, flags=re.DOTALL)

    # Clean viewport and head
    content = re.sub(r'<meta\s+name=["\']viewport["\'][^>]*>', '', content, flags=re.IGNORECASE)
    content = re.sub(r'<meta\s+charset=[^>]*>', '', content, flags=re.IGNORECASE)

    # Clean any table container duplicates
    content = re.sub(r'<div class="table-container">\s*(<table[\s\S]*?</table>)\s*</div>', r'\1', content)
    # Wrap every table cleanly
    content = re.sub(r'<table[\s\S]*?</table>', r'<div class="table-container">\n\g<0>\n</div>', content)

    # Unified pristine stylesheet
    pristine_style = f"""  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <style>
    :root {{
      --accent: {accent_color};
    }}
    *, *:before, *:after {{
      box-sizing: border-box;
    }}
    html {{
      -webkit-text-size-adjust: 100%;
      text-size-adjust: 100%;
      background-color: #ffffff;
      color: #1e242c;
    }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans SC", "Noto Sans JP", "Noto Sans KR", Arial, sans-serif;
      line-height: 1.75;
      color: #1e242c;
      background-color: #ffffff;
      margin: 0 auto;
      max-width: 900px;
      padding: 24px 20px 120px 20px;
      font-size: 16px;
    }}
    @media (max-width: 640px) {{
      body {{
        padding: 16px 14px 120px 14px;
        font-size: 15px;
      }}
      h1 {{ font-size: 1.55rem !important; }}
      h2 {{ font-size: 1.25rem !important; }}
    }}
    h1 {{
      font-size: 1.85rem;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--accent);
      line-height: 1.3;
    }}
    h2 {{
      font-size: 1.35rem;
      font-weight: 600;
      color: #1e293b;
      margin-top: 2rem;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e2e8f0;
      line-height: 1.35;
    }}
    h3 {{
      font-size: 1.15rem;
      font-weight: 600;
      color: #334155;
      margin-top: 1.4rem;
      margin-bottom: 8px;
    }}
    p {{
      margin: 10px 0;
    }}
    .badge {{
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 4px;
      background: #f1f5f9;
      color: var(--accent);
      border: 1px solid #e2e8f0;
      margin-bottom: 14px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }}
    .intro-box {{
      background: #f8fafc;
      border-left: 4px solid var(--accent);
      padding: 14px 18px;
      border-radius: 0 6px 6px 0;
      margin-bottom: 24px;
      font-size: 15px;
      color: #334155;
      line-height: 1.65;
    }}
    /* Asian and international typography styles */
    .cjk-char, .kana, .hangul {{
      font-size: 1.6rem;
      font-weight: 600;
      color: #0f172a;
      display: inline-block;
      vertical-align: middle;
      margin-right: 4px;
    }}
    .pinyin {{
      color: var(--accent);
      font-weight: 600;
      font-size: 0.95rem;
    }}
    .vocab-word {{
      font-weight: 600;
      color: var(--accent);
    }}
    /* Tables: beautifully contained, horizontally scrollable on mobile */
    .table-container {{
      width: 100%;
      max-width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      margin: 18px 0;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background-color: #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }}
    table {{
      width: 100%;
      min-width: 500px;
      border-collapse: collapse;
      margin: 0;
      font-size: 14.5px;
    }}
    th, td {{
      border: 1px solid #e2e8f0;
      padding: 11px 14px;
      text-align: left;
      vertical-align: middle;
    }}
    th {{
      background-color: #f8fafc;
      font-weight: 600;
      color: #334155;
      border-bottom: 2px solid #cbd5e1;
    }}
    tr:nth-child(even) {{
      background-color: #fcfdfe;
    }}
    tr:hover {{
      background-color: #f1f5f9;
    }}
    /* Cards and Grids */
    .grid-cards, .grid-kana, .grid-types, .vs-box {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 14px;
      margin: 18px 0;
    }}
    .mini-card {{
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 14px 16px;
      background-color: #ffffff;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }}
    .mini-card-head {{
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-bottom: 6px;
    }}
    .example-sentence {{
      font-size: 1.05rem;
      color: #1e242c;
      margin: 6px 0 2px 0;
      font-weight: 500;
    }}
    .example-trans {{
      font-size: 0.85rem;
      color: #64748b;
    }}
  </style>"""

    # Inject pristine_style inside head
    content = re.sub(r'<head>', f'<head>\n{pristine_style}', content, count=1)

    with open(f, 'w', encoding='utf-8') as fp:
        fp.write(content)

    print(f"Cleaned & styled perfectly: {f}")

print("All sheets successfully rebuilt with crystal clear typography!")
