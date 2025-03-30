# Bitcoin Price MCP Server

A Model Context Protocol (MCP) server that provides Claude AI with real-time access to Bitcoin price data. This server allows Claude to fetch the current price of Bitcoin and related market information.

## Features

- Provides Claude with real-time Bitcoin price information
- Returns price in USD, 24-hour change percentage, and market cap
- Handles API calls to cryptocurrency data providers
- Automatic fallback between CoinMarketCap and CoinGecko APIs

## Prerequisites

- Node.js and npm installed
- A CoinMarketCap API key (get one at [pro.coinmarketcap.com](https://pro.coinmarketcap.com))
  - Note: If you don't have a CoinMarketCap API key, the tool will automatically use CoinGecko API instead

## Installation

```bash
# Clone this repository
git clone [your-repository-url]
cd btc-price-mcp

# Install dependencies
npm install

# Build the TypeScript code
npm run build
```

## Configuration

1. Copy the `.env.example` file to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your CoinMarketCap API key:
   ```
   COINMARKETCAP_API_KEY=your_api_key_here
   ```

## Using as CLI Tool

You can use this as a command-line tool to check Bitcoin prices:

```bash
# Using npm
npm start

# Or directly with node
node dist/index.js
```

You can also use the included batch files:

- `bt-price.bat` or `btc-price.bat`

## Integration with Claude Desktop

To integrate this MCP server with Claude Desktop:

1. Locate the Claude Desktop configuration file:

   - On Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - On macOS: `~/Library/Application\ Support/Claude/claude_desktop_config.json`
   - On Linux: `~/.config/Claude/claude_desktop_config.json`

2. Add the following configuration to the file:

```json
{
  "mcpServers": {
    "btc": {
      "command": "node",
      "args": ["<FULL_PATH_TO_YOUR_PROJECT>/dist/index.js"],
      "env": {
        "COINMARKETCAP_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Replace `<FULL_PATH_TO_YOUR_PROJECT>` with the absolute path to your project directory.

For example on Windows: `C:/Users/RITESH YADAV/Desktop/Lab/dist/index.js`

## Usage in Claude

Once configured, you can ask Claude about Bitcoin prices:

- "What's the current price of Bitcoin?"
- "How much has Bitcoin changed in the last 24 hours?"
- "What's the market cap of Bitcoin right now?"

## Development

This project is designed to work with the Model Context Protocol specification. You can modify the available tools or add new cryptocurrency endpoints by editing the `src/index.ts` file and rebuilding the project.

## License

MIT
