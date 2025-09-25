const express = require('express')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3001

// Request timeout middleware (prevent hanging requests)
app.use((req, res, next) => {
  res.setTimeout(25000, () => {
    res.status(408).json({ 
      content: 'Request timeout. Please try again.',
      sources: []
    })
  })
  next()
})

// Enhanced CORS middleware with error handling
app.use((req, res, next) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Max-Age', '86400') // Cache preflight for 24 hours
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end()
      return
    }
    
    next()
  } catch (error) {
    console.error('CORS middleware error:', error)
    res.status(500).json({ 
      content: 'Server configuration error. Please try again.',
      sources: []
    })
  }
})

// Body parser with size limit and error handling
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf
  }
}))

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  next()
})

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// Test route with comprehensive response
app.get('/api/test', (req, res) => {
  try {
    res.status(200).json({ 
      message: 'Backend is working perfectly!',
      timestamp: new Date().toISOString(),
      apiKeyConfigured: !!process.env.PERPLEXITY_API_KEY,
      cors: 'enabled',
      status: 'success'
    })
  } catch (error) {
    console.error('Test route error:', error)
    res.status(500).json({ 
      message: 'Test route failed',
      error: error.message 
    })
  }
})

// Main API route with comprehensive error handling
app.post('/api/ask', async (req, res) => {
  try {
    // Input validation
    const { query } = req.body
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ 
        content: 'Please provide a valid query.',
        sources: []
      })
    }

    if (query.length > 5000) {
      return res.status(400).json({ 
        content: 'Query is too long. Please keep it under 5000 characters.',
        sources: []
      })
    }

    console.log('Received query:', query.substring(0, 100) + '...')
    
    // API key validation
    const apiKey = process.env.PERPLEXITY_API_KEY
    
    if (!apiKey || apiKey.length < 10) {
      console.error('Invalid or missing API key')
      return res.status(500).json({ 
        content: 'Server configuration error. API key not properly configured.',
        sources: []
      })
    }
    
    console.log('API Key status: Found and valid')
    console.log('Making request to Perplexity API...')
    
    // API request with timeout and better error handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000) // 20s timeout
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'ResearchPal/1.0'
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful research assistant. Provide clear, well-cited answers with proper sources.'
          },
          {
            role: 'user', 
            content: query.trim()
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    console.log('Perplexity API Response Status:', response.status)
    
    // Handle different response status codes
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Perplexity API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      
      if (response.status === 401) {
        return res.status(500).json({ 
          content: 'API authentication failed. Please contact support.',
          sources: []
        })
      } else if (response.status === 429) {
        return res.status(429).json({ 
          content: 'Too many requests. Please wait a moment and try again.',
          sources: []
        })
      } else if (response.status === 400) {
        return res.status(400).json({ 
          content: 'Invalid request. Please rephrase your query.',
          sources: []
        })
      } else {
        return res.status(500).json({ 
          content: `External API error (${response.status}). Please try again later.`,
          sources: []
        })
      }
    }

    const data = await response.json()
    console.log('Perplexity response received successfully')
    
    // Validate response structure
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response structure from Perplexity:', data)
      return res.status(500).json({ 
        content: 'Invalid response from AI service. Please try again.',
        sources: []
      })
    }
    
    const content = data.choices[0].message.content
    
    if (!content || content.trim().length === 0) {
      return res.status(500).json({ 
        content: 'Empty response from AI service. Please try a different query.',
        sources: []
      })
    }
    
    // Successful response
    res.status(200).json({
      content: content,
      sources: data.citations || [],
      timestamp: new Date().toISOString(),
      model: data.model || 'sonar-pro'
    })
    
  } catch (error) {
    console.error('API route error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    // Handle different error types
    if (error.name === 'AbortError') {
      return res.status(408).json({ 
        content: 'Request timed out. Please try again with a shorter query.',
        sources: []
      })
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        content: 'External service unavailable. Please try again later.',
        sources: []
      })
    } else {
      return res.status(500).json({ 
        content: 'An unexpected error occurred. Please try again.',
        sources: [],
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }
})

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableRoutes: ['/health', '/api/test', '/api/ask']
  })
})

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  })
  
  if (res.headersSent) {
    return next(error)
  }
  
  res.status(error.status || 500).json({ 
    content: 'A server error occurred. Please try again.',
    sources: [],
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  })
})

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  process.exit(0)
})

// Export for Vercel
module.exports = app

// Start server only in local development
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
    console.log(`📊 Health check: http://localhost:${PORT}/health`)
    console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`)
    console.log(`🔑 API Key Status: ${process.env.PERPLEXITY_API_KEY ? 'LOADED ✅' : 'MISSING ❌'}`)
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  })
}

