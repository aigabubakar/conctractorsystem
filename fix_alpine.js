const fs = require('fs');

function fixAlpineSvelte(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find all attributes like x-data="...", :class="...", @click="..." that contain { or }
  // We match attributeName="attributeValue"
  content = content.replace(/([a-zA-Z0-9:@\-\.]+)=("([^"]*?[{}][^"]*?)")/g, (match, attrName, attrValueQuoted, attrValue) => {
    // Escape backticks and ${} inside the attribute value
    const escapedValue = attrValue.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
    return `${attrName}={\`${escapedValue}\`}`;
  });

  // Also handle single-quoted attributes like x-data='...'
  content = content.replace(/([a-zA-Z0-9:@\-\.]+)=('([^']*?[{}][^']*?)')/g, (match, attrName, attrValueQuoted, attrValue) => {
    const escapedValue = attrValue.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
    return `${attrName}={\`${escapedValue}\`}`;
  });

  fs.writeFileSync(filePath, content);
}

fixAlpineSvelte('c:/Users/BTC/Desktop/contractorregistration/frontend/src/Sidebar.svelte');
fixAlpineSvelte('c:/Users/BTC/Desktop/contractorregistration/frontend/src/Header.svelte');
fixAlpineSvelte('c:/Users/BTC/Desktop/contractorregistration/frontend/src/RightSidebar.svelte');

console.log('Alpine bindings fixed for Svelte!');
