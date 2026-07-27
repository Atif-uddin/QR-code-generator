const { createCanvas } = require('@napi-rs/canvas');
try {
  const canvas = createCanvas(100, 100);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'red';
  ctx.fillRect(0, 0, 50, 50);
  console.log('Success! Buffer size:', canvas.toBuffer('image/png').length);
} catch (e) {
  console.error('Failed:', e);
}
