const express = require('express');
const axios = require('axios');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(express.json());

// Enable CORS in development only
if (process.env.NODE_ENV !== 'production') {
  app.use(cors());
}

// --- Article Scraping Endpoint ---
app.post('/scrape', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const articleResponse = await axios.get(url);
    const dom = new JSDOM(articleResponse.data, { url });
    const article = new Readability(dom.window.document).parse();

    if (article && article.textContent) {
      res.json({ content: article.textContent });
    } else {
      res.status(500).json({ error: 'Could not extract article content.' });
    }
  } catch (error) {
    console.error('Error scraping article:', error.message);
    res.status(500).json({ error: 'Failed to scrape the article.' });
  }
});

// --- Serve Vite Frontend (Production Only) ---
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  console.log('Serving static from:', distPath);

  app.use(express.static(distPath));

  // Catch-all for SPA routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// --- Start the Server (Only Once!) ---
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});