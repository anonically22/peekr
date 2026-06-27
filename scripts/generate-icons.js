const fs = require('fs');
const path = require('path');

// A 1x1 pixel solid #00FF88 PNG in base64 format for placeholder icons
const base64Icon = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5/hPwAIAgL/4d1j8wAAAABJRU5ErkJggg==";

const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

['icon16.png', 'icon48.png', 'icon128.png'].forEach(filename => {
  const filePath = path.join(publicDir, filename);
  fs.writeFileSync(filePath, Buffer.from(base64Icon, 'base64'));
  console.log(`Generated ${filePath}`);
});
