const fs = require('fs');

// Simple SVG to PNG conversion using canvas API
function createSVG(size) {
  const scale = size / 128;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128">
    <!-- Background -->
    <rect width="128" height="128" rx="20" fill="#3498db"/>
    
    <!-- Checkmark -->
    <path d="M 28 64 L 52 88 L 100 40" 
          stroke="white" 
          stroke-width="12" 
          fill="none" 
          stroke-linecap="round" 
          stroke-linejoin="round"/>
    
    <!-- Task lines -->
    <line x1="32" y1="32" x2="96" y2="32" 
          stroke="white" 
          stroke-width="8" 
          stroke-linecap="round" 
          opacity="0.6"/>
    
    <line x1="32" y1="48" x2="80" y2="48" 
          stroke="white" 
          stroke-width="8" 
          stroke-linecap="round" 
          opacity="0.6"/>
  </svg>`;
}

// Save SVG files
const sizes = [16, 32, 48, 128];

sizes.forEach(size => {
  const svg = createSVG(size);
  const filename = size === 128 ? 'icon.svg' : `icon${size}.svg`;
  fs.writeFileSync(filename, svg);
  console.log(`Generated ${filename}`);
});

console.log('\nSVG icons generated successfully!');
console.log('Note: To convert to PNG, you can use:');
console.log('1. Open generate-icon.html in a browser');
console.log('2. Or use an online SVG to PNG converter');
console.log('3. Or use Chrome extension to load the SVG directly');
