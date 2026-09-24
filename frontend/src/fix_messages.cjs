const fs = require('fs');

const fixFile = (path) => {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/role === 'admin'/g, "(role === 'admin' || role === 'super_admin')");
  fs.writeFileSync(path, content);
};

fixFile('Messages.svelte');
console.log('Fixed Messages.svelte');
