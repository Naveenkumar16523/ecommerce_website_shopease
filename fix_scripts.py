import os
import glob

# Search for all HTML files
html_files = glob.glob("*.html")

target = '<script src=\\"https://cdn.tailwindcss.com\\"></script><script>if(window.tailwind){window.tailwind.config={theme:{extend:{colors:{clifford:\\"#da373d\\"}}}}} </script>'
# Note: I need to check exactly what it looks like in the file.
# In checkout.html it looked like:
# <script src=\"https://cdn.tailwindcss.com\"></script><script>if(window.tailwind){window.tailwind.config={theme:{extend:{colors:{clifford:\"#da373d\"}}}}}</script>

# Let's try a more flexible replacement that finds the tailwind script and the broken script after it.

for filename in html_files:
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace the specific broken string
    # We saw: <script src=\"https://cdn.tailwindcss.com\"></script><script>if(window.tailwind){window.tailwind.config={theme:{extend:{}}}}</script>
    # or with the clifford thing.
    
    # Let's just fix the backslashes in script tags
    fixed_content = content.replace('src=\\"https://cdn.tailwindcss.com\\"', 'src="https://cdn.tailwindcss.com"')
    fixed_content = fixed_content.replace('\\"#da373d\\"', '"#da373d"')
    
    # Also remove the whole extra script if it's there
    # <script>if(window.tailwind){window.tailwind.config={theme:{extend:{}}}}</script>
    
    if fixed_content != content:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(fixed_content)
        print(f"Fixed {filename}")
