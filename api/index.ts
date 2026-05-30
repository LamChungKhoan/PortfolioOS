import express from "express";
import https from "https";


  const app = express();
  const PORT = 3000;
  
  // Need to parse JSON body
  app.use(express.json());

  // Simple in-memory cache for prices to avoid rate limits
  const priceCache: Record<string, { price: number, timestamp: number }> = {};

  // Find stock price from VNDirect API or similar
  // Or TCBS API
  app.get("/api/stock/:symbol", (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    
    // Check cache (1 minute)
    if (priceCache[symbol] && Date.now() - priceCache[symbol].timestamp < 60 * 1000) {
      return res.json({ symbol, price: priceCache[symbol].price });
    }

    const to = Math.floor(Date.now() / 1000) + 86400; // Tomorrow
    const from = to - 86400 * 10; // Last 10 days
    const url = `https://services.entrade.com.vn/chart-api/v2/ohlcs/stock?from=${from}&to=${to}&symbol=${symbol}&resolution=1D`;

    https.get(url, (apiRes) => {
      let data = '';
      apiRes.on('data', chunk => data += chunk);
      apiRes.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed && parsed.c && parsed.c.length > 0) {
            // Get the latest bar's close price
            // DNSE API returns price in standard VND divided by 1000.
            // Example: FPT returns `75.1`. We multiply by 1000 to keep it consistent with our VND format.
            const closePrice = parsed.c[parsed.c.length - 1] * 1000;
            
            priceCache[symbol] = { price: closePrice, timestamp: Date.now() };
            res.json({ symbol, price: closePrice });
          } else {
            // Fallback VNDirect API
            fallbackToVND(symbol, res);
          }
        } catch (e) {
          fallbackToVND(symbol, res);
        }
      });
    }).on('error', () => {
      fallbackToVND(symbol, res);
    });
  });

  function fallbackToVND(symbol: string, res: express.Response) {
    const url = `https://finfo-api.vndirect.com.vn/v4/stock_prices?sort=-date&q=code:${symbol}&size=1`;
    https.get(url, (apiRes) => {
      let data = '';
      apiRes.on('data', chunk => data += chunk);
      apiRes.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed && parsed.data && parsed.data.length > 0) {
            const closePrice = parsed.data[0].adClose * 1000;
            priceCache[symbol] = { price: closePrice, timestamp: Date.now() };
            res.json({ symbol, price: closePrice });
          } else {
            res.status(404).json({ error: "Stock not found" });
          }
        } catch (e) {
          res.status(500).json({ error: "Failed to parse data" });
        }
      });
    }).on('error', () => {
      res.status(500).json({ error: "Network error" });
    });
  }

  // Vite middleware for development
  
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
