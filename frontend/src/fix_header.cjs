const fs = require('fs');
let c = fs.readFileSync('Header.svelte', 'utf-8');
c = c.replace(/javascript:void\(0\);?/g, '#');
c = c.replace(/<img(.*?)>/g, (match, p1) => {
    if (match.endsWith('/>')) return match;
    return `<img${p1}/>`;
});
c = c.replace(/<input(.*?)>/g, (match, p1) => {
    if (match.endsWith('/>')) return match;
    return `<input${p1}/>`;
});
if (!c.includes('<div class="chatbox">')) {
    c = c.replace('<!--**********************************\r\n    Header start', '<!-- Chatbox -->\r\n<div class="chatbox"></div>\r\n<!--**********************************\r\n    Header start');
    c = c.replace('<!--**********************************\n    Header start', '<!-- Chatbox -->\n<div class="chatbox"></div>\n<!--**********************************\n    Header start');
}
fs.writeFileSync('Header.svelte', c);
