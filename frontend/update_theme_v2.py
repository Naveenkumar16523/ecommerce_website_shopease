import os
import re

file_path = r"c:\Users\Welcome\OneDrive\Documents\E commerce website\frontend\src\pages\admin\AdminDashboard.jsx"

print("Reading file...")
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

print("Original length:", len(content))

# Replace backgrounds
content = content.replace("bg-[#080C14]", "bg-slate-50")
content = content.replace("bg-[#0D1321]", "bg-white")
content = content.replace("bg-[#0F121F]", "bg-white")
content = content.replace("bg-[#131622]", "bg-slate-50")

# Replace borders
content = content.replace("border-white/5", "border-slate-200")
content = content.replace("border-white/10", "border-slate-200")
content = content.replace("border-white/20", "border-slate-300")

# Replace text colors
content = content.replace("text-[#82889A]", "text-slate-500")
content = content.replace("text-gray-400", "text-slate-500")
content = content.replace("text-gray-500", "text-slate-500")
content = content.replace("text-white", "text-slate-900")

# Careful text-white replacements for buttons
content = content.replace("bg-admin-600 text-slate-900", "bg-admin-600 text-white")
content = content.replace("hover:bg-admin-700 text-slate-900", "hover:bg-admin-700 text-white")
content = content.replace("bg-red-500/20 text-red-500 hover:bg-red-500/30 text-slate-900", "bg-red-50 text-red-600 hover:bg-red-100 text-red-600")

# Replace cyber neon elements
content = content.replace("text-neonCyan", "text-admin-600")
content = content.replace("border-neonCyan/30", "border-admin-300")
content = content.replace("border-neonCyan/20", "border-admin-200")
content = content.replace("border-neonCyan", "border-admin-600")
content = content.replace("bg-neonCyan/5", "bg-admin-100")
content = content.replace("bg-neonCyan/10", "bg-admin-100")
content = content.replace("bg-neonCyan/20", "bg-admin-200")
content = content.replace("hover:bg-neonCyan/15", "hover:bg-admin-100")
content = content.replace("hover:bg-neonCyan/10", "hover:bg-admin-100")

# Glow effects to shadow
content = re.sub(r'shadow-\[0_0_[0-9]+px_rgba\([^)]+\)\]', 'shadow-md', content)
content = re.sub(r'\[text-shadow:[^\]]+\]', '', content)

print("New length:", len(content))

print("Writing file...")
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Theme updated successfully!")
