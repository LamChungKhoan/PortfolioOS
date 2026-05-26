import https from 'https';

https.get('https://finfo-api.vndirect.com.vn/v4/ratios?q=code:HPG', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(data.substring(0, 500));
  });
}).on('error', (err) => {
  console.error(err);
});
