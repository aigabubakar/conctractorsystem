const fs = require('fs');

function extractBody(filename) {
    const html = fs.readFileSync(`./template/${filename}`, 'utf-8');
    const match = html.match(/<div class="content-body">([\s\S]*?)<\/div>\s*<!--\s*\*+\s*Content body end/);
    if (match) return match[1];
    return '';
}

const inbox = extractBody('email-inbox.html');
const compose = extractBody('email-compose.html');
const read = extractBody('email-read.html');

fs.writeFileSync('./frontend/src/mail_templates.txt', `--- INBOX ---\n${inbox}\n\n--- COMPOSE ---\n${compose}\n\n--- READ ---\n${read}`);
console.log('Extraction complete');
