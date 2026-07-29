/**
 * VERCEL WORKER SCRIPT
 * This script handles individual number validation using Cliproxy and RapidAPI.
 * Host this on Vercel as a Serverless Function (e.g., api/validate.js)
 */
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { number, apiKey, rapidKey } = req.body;

  // Cliproxy Configuration from User
  const proxyHost = 'sg.cliproxy.io';
  const proxyPort = '3010';
  const proxyUser = 'ridolislam-region-US';
  const proxyPass = 'Ridol123';
  
  const proxyUrl = `http://${proxyUser}:${proxyPass}@${proxyHost}:${proxyPort}`;
  const agent = new HttpsProxyAgent(proxyUrl);

  try {
    const response = await axios.get(
      `https://apilayer-numverify-v1.p.rapidapi.com/validate?number=${number}&access_key=${apiKey}`,
      {
        httpsAgent: agent,
        proxy: false, 
        headers: {
          'x-rapidapi-key': rapidKey,
          'x-rapidapi-host': 'apilayer-numverify-v1.p.rapidapi.com'
        },
        timeout: 15000
      }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Worker Error:', error.message);
    return res.status(error.response?.status || 500).json({
      valid: false,
      number: number,
      error: error.message
    });
  }
};
