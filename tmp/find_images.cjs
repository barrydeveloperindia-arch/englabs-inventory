const https = require('https');
https.get('https://unsplash.com/s/photos/paint-can', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const matches = data.match(/https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9\-]+\?q=80/g);
    console.log("PAINT CANS:", matches ? matches.slice(0, 3) : "No matches");
  });
});
https.get('https://unsplash.com/s/photos/chemical-bottle', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const matches = data.match(/https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9\-]+\?q=80/g);
    console.log("CHEMICALS:", matches ? matches.slice(0, 3) : "No matches");
  });
});
