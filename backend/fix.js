const fs = require('fs');
let content = fs.readFileSync('routes/adminRoutes.js', 'utf8');
content = content.split("if (req.user.role !== 'admin')").join("if (req.user.role !== 'admin' && req.user.role !== 'super_admin')");
fs.writeFileSync('routes/adminRoutes.js', content);
console.log('Fixed adminRoutes.js');
