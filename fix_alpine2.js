const fs = require('fs');

function fixAlpineSvelte(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace @event="handler" with x-on:event="handler"
  content = content.replace(/\s@([a-zA-Z0-9.\-]+)=/g, ' x-on:$1=');

  fs.writeFileSync(filePath, content);
}

fixAlpineSvelte('c:/Users/BTC/Desktop/contractorregistration/frontend/src/Sidebar.svelte');
fixAlpineSvelte('c:/Users/BTC/Desktop/contractorregistration/frontend/src/Header.svelte');
fixAlpineSvelte('c:/Users/BTC/Desktop/contractorregistration/frontend/src/RightSidebar.svelte');

console.log('Alpine @ bindings replaced with x-on: for Svelte!');
