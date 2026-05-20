const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'admin', 'AdminDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Backgrounds
content = content.replace(/bg-\[#080C14\]/g, "bg-admin-50");
content = content.replace(/bg-\[#0D1321\]/g, "bg-white");
content = content.replace(/bg-\[#0F121F\]/g, "bg-white");
content = content.replace(/bg-\[#131622\]/g, "bg-admin-50");

// Borders
content = content.replace(/border-white\/5/g, "border-admin-200");
content = content.replace(/border-white\/10/g, "border-admin-200");
content = content.replace(/border-white\/20/g, "border-admin-300");

// Text colors
content = content.replace(/text-\[#82889A\]/g, "text-slate-500");
content = content.replace(/text-gray-400/g, "text-slate-500");
content = content.replace(/text-gray-500/g, "text-slate-500");

// Careful text-white
content = content.replace(/text-white/g, "text-slate-900");
content = content.replace(/bg-admin-600 text-slate-900/g, "bg-admin-600 text-white");
content = content.replace(/hover:bg-admin-700 text-slate-900/g, "hover:bg-admin-700 text-white");
content = content.replace(/bg-red-500\/20 text-red-500 hover:bg-red-500\/30 text-slate-900/g, "bg-red-50 text-red-600 hover:bg-red-100 text-red-600");

// Cyber Neon Elements
content = content.replace(/text-neonCyan/g, "text-admin-600");
content = content.replace(/border-neonCyan\/30/g, "border-admin-300");
content = content.replace(/border-neonCyan\/20/g, "border-admin-200");
content = content.replace(/border-neonCyan/g, "border-admin-600");
content = content.replace(/bg-neonCyan\/5/g, "bg-admin-100");
content = content.replace(/bg-neonCyan\/10/g, "bg-admin-100");
content = content.replace(/bg-neonCyan\/20/g, "bg-admin-200");
content = content.replace(/hover:bg-neonCyan\/15/g, "hover:bg-admin-100");
content = content.replace(/hover:bg-neonCyan\/10/g, "hover:bg-admin-100");

// Glow effects
content = content.replace(/shadow-\[0_0_[0-9]+px_rgba\([^)]+\)\]/g, 'shadow-md');

// Text shadows
content = content.replace(/\[text-shadow:[^\]]+\]/g, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Theme updated successfully!");
