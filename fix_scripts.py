import os
import glob

html_files = glob.glob("*.html")

for filename in html_files:
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix the broken script tag
    # Problem: <script>console.warn = ...</script><script src=\"https://cdn.tailwindcss.com\"></script>
    
    fixed = content.replace('src=\\"https://cdn.tailwindcss.com\\"', 'src="https://cdn.tailwindcss.com"')
    fixed = fixed.replace('msg === \\"string\\"', 'msg === "string"')
    fixed = fixed.replace('msg.includes(\\"tailwindcss\\")', 'msg.includes("tailwindcss")')
    
    if fixed != content:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(fixed)
        print(f"Fixed {filename}")
