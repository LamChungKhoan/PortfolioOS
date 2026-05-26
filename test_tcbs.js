import https from 'https';

https.get('https://apipubaws.tcbs.com.vn/stock-insight/v1/stock/bars-long-term?ticker=FPT&type=stock&resolution=D&from=' + Math.floor(Date.now()/1000 - 86400 * 5) + '&to=' + Math.floor(Date.now()/1000), (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('TCBS:', data));
});
