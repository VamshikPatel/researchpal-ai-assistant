const express = require('express')
const cors = require('cors')

require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3001

// Enhanced CORS configuration for Vercel deployment
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://researchpal.vercel.app'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Handle preflight requests explicitly
app.options('*', cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000', 
    'https://researchpal.vercel.app'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())

app.post('/api/ask', async (req, res) => {
  try {
    const { query } = req.body
    console.log('Received query:', query)
    
    const apiKey = process.env.PERPLEXITY_API_KEY;
    console.log('API Key:', apiKey ? 'Found' : 'Missing');
    
    if (!apiKey) {
      console.error('No API key found!')
      return res.status(500).json({ 
        content: 'Perplexity API key not configured',
        sources: []
      })
    }
    
    console.log('Making request to Perplexity...')
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful research assistant. Provide clear, well-cited answers.'
          },
          {
            role: 'user', 
            content: query
          }
        ]
      })
    })

    console.log('Perplexity Response Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Perplexity API Error Response:', errorText)
      throw new Error(`Perplexity API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('Perplexity response received successfully')
    
    res.json({
      content: data.choices[0].message.content,
      sources: []
    })
    
  } catch (error) {
    console.error('Full error details:', error)
    res.status(500).json({ 
      content: 'Sorry, something went wrong. Please try again.',
      sources: []
    })
  }
})

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'ResearchPal API is running!' })
})

// For local development
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    console.log('API Key Status:', process.env.PERPLEXITY_API_KEY ? 'LOADED ✅' : 'MISSING ❌')
  })
}

// Export for Vercel
module.exports = app