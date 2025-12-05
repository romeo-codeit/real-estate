// Seed major cryptos into Sanity with real data from CoinGecko
require('dotenv').config();
const { createClient } = require('@sanity/client');

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-01-01',
});

const cryptoIds = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', description: 'The original cryptocurrency, decentralized digital money.', riskLevel: 'High', expectedROI: 120, minInvestment: 50, logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', description: 'Smart contract platform powering DeFi and NFTs.', riskLevel: 'High', expectedROI: 100, minInvestment: 30, logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
  { id: 'tether', symbol: 'USDT', name: 'Tether', description: 'Stablecoin pegged to the US Dollar.', riskLevel: 'Low', expectedROI: 5, minInvestment: 10, logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png' },
  { id: 'binancecoin', symbol: 'BNB', name: 'Binance Coin', description: 'Native token of Binance exchange and BSC.', riskLevel: 'Medium', expectedROI: 80, minInvestment: 25, logo: 'https://cryptologos.cc/logos/binance-coin-bnb-logo.png' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', description: 'Fast and scalable digital payment protocol.', riskLevel: 'Medium', expectedROI: 70, minInvestment: 15, logo: 'https://cryptologos.cc/logos/xrp-xrp-logo.png' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', description: 'Proof-of-stake blockchain platform for smart contracts.', riskLevel: 'Medium', expectedROI: 90, minInvestment: 10, logo: 'https://cryptologos.cc/logos/cardano-ada-logo.png' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', description: 'High-performance blockchain for decentralized apps.', riskLevel: 'High', expectedROI: 180, minInvestment: 20, logo: 'https://cryptologos.cc/logos/solana-sol-logo.png' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', description: 'Meme cryptocurrency started as a joke.', riskLevel: 'High', expectedROI: 150, minInvestment: 5, logo: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png' },
  { id: 'polygon', symbol: 'MATIC', name: 'Polygon', description: 'Ethereum scaling solution and multi-chain ecosystem.', riskLevel: 'High', expectedROI: 210, minInvestment: 15, logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', description: 'Interoperable blockchain network connecting multiple chains.', riskLevel: 'High', expectedROI: 160, minInvestment: 20, logo: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.png' },
  { id: 'litecoin', symbol: 'LTC', name: 'Litecoin', description: 'Peer-to-peer cryptocurrency for faster transactions.', riskLevel: 'Medium', expectedROI: 60, minInvestment: 10, logo: 'https://cryptologos.cc/logos/litecoin-ltc-logo.png' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', description: 'Decentralized oracle network for smart contracts.', riskLevel: 'High', expectedROI: 140, minInvestment: 15, logo: 'https://cryptologos.cc/logos/chainlink-link-logo.png' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', description: 'High-throughput platform for decentralized apps.', riskLevel: 'High', expectedROI: 190, minInvestment: 20, logo: 'https://cryptologos.cc/logos/avalanche-avax-logo.png' },
  { id: 'uniswap', symbol: 'UNI', name: 'Uniswap', description: 'Decentralized exchange protocol on Ethereum.', riskLevel: 'High', expectedROI: 130, minInvestment: 10, logo: 'https://cryptologos.cc/logos/uniswap-uni-logo.png' },
];

async function fetchCryptoData() {
  const ids = cryptoIds.map(c => c.id).join(',');
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}`;
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

async function seedCryptos() {
  const apiData = await fetchCryptoData();

  const cryptos = cryptoIds.map(crypto => {
    const api = apiData.find(d => d.id === crypto.id);
    return {
      _type: 'crypto',
      symbol: crypto.symbol,
      name: crypto.name,
      price: api ? api.current_price : 0,
      description: crypto.description,
      change24h: api ? api.price_change_percentage_24h : 0,
      expectedROI: crypto.expectedROI,
      riskLevel: crypto.riskLevel,
      minInvestment: crypto.minInvestment,
      marketCap: api ? api.market_cap : 0,
      logo: {
        url: crypto.logo,
      },
    };
  });

  for (const crypto of cryptos) {
    try {
      const result = await sanity.createOrReplace({
        _id: `crypto-${crypto.symbol}`,
        ...crypto,
      });
      console.log(`Seeded: ${crypto.symbol} ${result._id}`);
    } catch (error) {
      console.error(`Error seeding ${crypto.symbol}:`, error.message);
    }
  }
}

seedCryptos();
