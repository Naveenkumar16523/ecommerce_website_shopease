import os
import re

html_files = [f for f in os.listdir('.') if f.endswith('.html') and f != 'nav.html']

resource_hints = """
  <!-- Resource Hints -->
  <link rel="preconnect" href="https://cdn.tailwindcss.com">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preconnect" href="https://images.unsplash.com">
  <link rel="dns-prefetch" href="https://ecommerce-website-shopease.vercel.app">

  <script src="https://cdn.tailwindcss.com" defer></script>
  <script>
    window.addEventListener('load', () => {
      if (window.tailwind) {
        window.tailwind.config = {
          theme: { extend: { colors: { clifford: '#da373d' } } }
        }
      }
    });
  </script>
  <script src="common.js?v=1.2" defer></script>
"""

nav_placeholder = """
  <!-- Shared Navigation Partial -->
  <div id="nav-placeholder"></div>
  <script>
    fetch('nav.html').then(r => r.text()).then(html => {
      document.getElementById('nav-placeholder').innerHTML = html;
      if (typeof updateAuthUI === 'function') updateAuthUI();
      if (typeof updateCartBadge === 'function') updateCartBadge();
    });
  </script>
"""

for filename in html_files:
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Update Head (Tailwind, Resource Hints, Common.js)
    # Remove old Tailwind script
    content = re.sub(r'<script.*tailwindcss.*?</script>', '', content, flags=re.IGNORECASE)
    # Remove old Tailwind config
    content = re.sub(r'<script>\s*// Suppress Tailwind CDN production warning.*?</script>', '', content, flags=re.DOTALL | re.IGNORECASE)
    # Remove old common.js
    content = re.sub(r'<script src="common.js\?v=1\.1".*?></script>', '', content, flags=re.IGNORECASE)
    
    # Insert new resource hints before </head> or after <link rel="icon"...>
    if '</head>' in content:
        content = content.replace('</head>', resource_hints + '</head>')
    
    # 2. Update Body (Nav Partial)
    # Identify the header and replace it
    # We look for <header>...</header> and replace with nav_placeholder
    content = re.sub(r'<header.*?>.*?</header>', nav_placeholder, content, flags=re.DOTALL | re.IGNORECASE)
    
    # Also remove any top banner if it exists outside the header (some files had it)
    content = re.sub(r'<div class="bg-black text-white text-center text-xs py-2 px-4 relative">.*?</div>', '', content, flags=re.DOTALL | re.IGNORECASE)
    
    # Remove mobile search bar if it exists
    content = re.sub(r'<div id="mobileSearchBar".*?>.*?</div>', '', content, flags=re.DOTALL | re.IGNORECASE)
    
    # Remove mobile sidebar if it exists
    content = re.sub(r'<div id="mobileSidebar".*?>.*?</div>', '', content, flags=re.DOTALL | re.IGNORECASE)

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"Processed {len(html_files)} files.")
