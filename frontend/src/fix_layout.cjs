const fs = require('fs');
let content = fs.readFileSync('ContractorLayout.svelte', 'utf8');

// Replace fetch url
content = content.replace("fetch('/api/contractors/profile'", "fetch(import.meta.env.VITE_API_URL + '/api/contractors/me'");

// Replace data mapping
content = content.replace("contractor = data;", "contractor = data.data;\n              contractor.status = contractor.verification_status;");

fs.writeFileSync('ContractorLayout.svelte', content);
console.log('Fixed ContractorLayout.svelte');
