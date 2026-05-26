const https = require('https');

https.get('https://apipubaws.tcbs.com.vn/tcanalysis/v1/ticker/HPG/overview', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(data);
  });
}).on('error', (err) => {
  console.error(err);
});
