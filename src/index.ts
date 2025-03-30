#!/usr/bin/env node

import axios from "axios";
import dotenv from "dotenv";
import http from "http";

// Load environment variables
dotenv.config();

// Define color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

// Function to get Bitcoin price from CoinMarketCap API
async function getBitcoinPriceFromCMC() {
  try {
    // Check if API key is available
    const apiKey = process.env.COINMARKETCAP_API_KEY;
    if (!apiKey) {
      throw new Error(
        "COINMARKETCAP_API_KEY not found in environment variables"
      );
    }

    // Make request to CoinMarketCap API
    const response = await axios.get(
      "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest",
      {
        headers: {
          "X-CMC_PRO_API_KEY": apiKey,
        },
        params: {
          symbol: "BTC", // Bitcoin symbol
          convert: "USD", // Convert to USD
        },
      }
    );

    // Extract Bitcoin price data
    const btcData = response.data.data.BTC;
    const price = btcData.quote.USD.price;
    const percentChange24h = btcData.quote.USD.percent_change_24h;
    const marketCap = btcData.quote.USD.market_cap;
    const lastUpdated = btcData.quote.USD.last_updated;

    // Return formatted data
    return {
      price: price.toFixed(2),
      percent_change_24h: percentChange24h.toFixed(2),
      market_cap: marketCap.toFixed(2),
      last_updated: lastUpdated,
      source: "CoinMarketCap",
    };
  } catch (error: any) {
    // If there's an error, log it and throw
    console.error("CoinMarketCap API error:", error.message);
    throw error;
  }
}

// Function to get Bitcoin price from CoinGecko API
async function getBitcoinPriceFromCoinGecko() {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price",
      {
        params: {
          ids: "bitcoin",
          vs_currencies: "usd",
          include_market_cap: "true",
          include_24hr_change: "true",
          include_last_updated_at: "true",
        },
      }
    );

    const btcData = response.data.bitcoin;

    return {
      price: btcData.usd.toFixed(2),
      percent_change_24h: btcData.usd_24h_change.toFixed(2),
      market_cap: btcData.usd_market_cap.toFixed(2),
      last_updated: new Date(btcData.last_updated_at * 1000).toISOString(),
      source: "CoinGecko",
    };
  } catch (error: any) {
    console.error("CoinGecko API error:", error.message);
    throw error;
  }
}

// Main function to get Bitcoin price with fallback
async function getBitcoinPrice() {
  try {
    // First try CoinMarketCap with your API key
    return await getBitcoinPriceFromCMC();
  } catch (error) {
    console.log("Falling back to CoinGecko API...");
    try {
      // Fallback to CoinGecko if CoinMarketCap fails
      return await getBitcoinPriceFromCoinGecko();
    } catch (fallbackError: any) {
      console.error("All API attempts failed");
      throw new Error("Failed to fetch Bitcoin price");
    }
  }
}

// Function to display Bitcoin price data in the terminal
function displayBitcoinPrice(data: any) {
  console.log(
    `\n${colors.bright}${colors.yellow}Bitcoin (BTC) Price Information${colors.reset}\n`
  );
  console.log(
    `${colors.bright}Price:${colors.reset} ${colors.green}$${data.price} USD${colors.reset}`
  );

  // Format percent change with color based on positive/negative value
  const percentChangeColor =
    parseFloat(data.percent_change_24h) >= 0 ? colors.green : colors.red;
  const percentChangePrefix =
    parseFloat(data.percent_change_24h) >= 0 ? "+" : "";
  console.log(
    `${colors.bright}24h Change:${colors.reset} ${percentChangeColor}${percentChangePrefix}${data.percent_change_24h}%${colors.reset}`
  );

  console.log(
    `${colors.bright}Market Cap:${colors.reset} $${(
      parseFloat(data.market_cap) / 1e9
    ).toFixed(2)} Billion USD`
  );
  console.log(
    `${colors.bright}Last Updated:${colors.reset} ${new Date(
      data.last_updated
    ).toLocaleString()}`
  );
  console.log(
    `${colors.bright}Data Source:${colors.reset} ${colors.cyan}${data.source}${colors.reset}\n`
  );
}

// Define MCP schema version 2.0 format
const mcp = {
  schemaVersion: "2.0",
  tools: {
    "get-bitcoin-price": {
      description: "Get the current price of Bitcoin (BTC) in USD",
      input: {
        type: "object",
        properties: {},
        required: [],
      },
      output: {
        type: "object",
        properties: {
          price: {
            type: "string",
            description: "Current price of Bitcoin in USD",
          },
          percent_change_24h: {
            type: "string",
            description: "24-hour percent change in Bitcoin price",
          },
          market_cap: {
            type: "string",
            description: "Current market cap of Bitcoin in USD",
          },
          last_updated: {
            type: "string",
            description: "Timestamp of when the price was last updated",
          },
          source: {
            type: "string",
            description: "Data source (CoinMarketCap or CoinGecko)",
          },
        },
        required: [
          "price",
          "percent_change_24h",
          "market_cap",
          "last_updated",
          "source",
        ],
      },
    },
  },
};

// Check if running directly or as part of MCP server
const isMCPServer = process.argv.includes("--mcp-server");

if (isMCPServer) {
  // MCP server implementation
  const server = http.createServer(async (req, res) => {
    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS, POST, GET");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Handle preflight request
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // Log all requests for debugging
    console.log(`Received ${req.method} request for ${req.url}`);

    // Handle SSE connection requests with proper format for Cursor
    if (req.method === "GET" && req.url === "/events") {
      // Set up SSE headers
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      // Send initial schema message - this is the format Cursor expects
      res.write(`data: ${JSON.stringify(mcp)}\n\n`);

      // Keep the connection alive with heartbeats
      const heartbeatInterval = setInterval(() => {
        res.write(`:heartbeat\n\n`);
      }, 30000);

      // Handle client disconnect
      req.on("close", () => {
        console.log("SSE connection closed");
        clearInterval(heartbeatInterval);
      });

      return;
    }

    // Standard JSON API endpoints for discovery and tool execution
    if (req.method === "GET" && req.url === "/") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(mcp));
      return;
    }

    // Handle health check
    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "healthy" }));
      return;
    }

    // Handle execution requests
    if (req.method === "POST" && req.url === "/execute") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          // Parse the request
          const request = JSON.parse(body);
          console.log("Received request:", request);

          // Handle Bitcoin price request
          if (request.name === "get-bitcoin-price") {
            // Get the price data
            const bitcoinData = await getBitcoinPrice();

            // Send the response
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                result: bitcoinData,
              })
            );
          } else {
            // Unknown tool
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                error: {
                  message: `Unknown tool: ${request.name}`,
                },
              })
            );
          }
        } catch (error: any) {
          // Handle errors
          console.error("Error processing request:", error);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: {
                message: error.message,
              },
            })
          );
        }
      });
    } else {
      // Handle invalid requests
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: {
            message: "Not found",
          },
        })
      );
    }
  });

  // Start the MCP server
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Bitcoin Price MCP server listening on port ${PORT}`);
    console.log(`Available tools:`);
    console.log(
      `- get-bitcoin-price: Get the current price of Bitcoin (BTC) in USD`
    );
    console.log(
      `\nServer is ready for Cursor connections at http://localhost:${PORT}/events`
    );
  });

  // Handle server shutdown
  process.on("SIGINT", () => {
    console.log("Shutting down server...");
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  });
} else {
  // CLI mode - display Bitcoin price in the terminal
  console.log("Fetching Bitcoin price data...");
  getBitcoinPrice()
    .then((data) => {
      displayBitcoinPrice(data);
    })
    .catch((error) => {
      console.error(`${colors.red}Error:${colors.reset} ${error.message}`);
      process.exit(1);
    });
}
