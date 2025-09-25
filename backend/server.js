const express = require('express')

require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3001

// Manual CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  
  next()
})

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

// Add a test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log('API Key Status:', process.env.PERPLEXITY_API_KEY ? 'LOADED ✅' : 'MISSING ❌')
})
