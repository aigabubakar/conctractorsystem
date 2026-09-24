import re

# Read template/index.html
with open('c:/Users/BTC/Desktop/contractorregistration/template/index.html', 'r', encoding='utf-8') as f:
    template_content = f.read()

# Extract deznav block
match = re.search(r'(<!--\s*\*\**\s*Sidebar start\s*\*\**-->\s*<div class="deznav">.*?<!--\s*\*\**\s*Sidebar end\s*\*\**-->)', template_content, re.DOTALL)
if not match:
    print("Could not find sidebar in template")
    exit(1)
    
sidebar_html = match.group(1)

# Fix javascript:void(0) which causes issues in Svelte
sidebar_html = sidebar_html.replace('javascript:void(0)', '#').replace('javascript:void()', '#')

# Read Sidebar.svelte
with open('c:/Users/BTC/Desktop/contractorregistration/frontend/src/Sidebar.svelte', 'r', encoding='utf-8') as f:
    svelte_content = f.read()

# Replace the existing sidebar block in Svelte with the template one
new_svelte_content = re.sub(r'<!--\s*\*\**\s*Sidebar start\s*\*\**-->.*?<!--\s*\*\**\s*Sidebar end\s*\*\**-->', sidebar_html, svelte_content, flags=re.DOTALL)

with open('c:/Users/BTC/Desktop/contractorregistration/frontend/src/Sidebar.svelte', 'w', encoding='utf-8') as f:
    f.write(new_svelte_content)

print("Successfully updated Sidebar.svelte")
