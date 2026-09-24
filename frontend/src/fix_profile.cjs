const fs = require('fs');
let content = fs.readFileSync('Profile.svelte', 'utf8');
content = content.split("userRole === 'admin'").join("(userRole === 'admin' || userRole === 'super_admin')");
fs.writeFileSync('Profile.svelte', content);
console.log('Fixed Profile.svelte');
