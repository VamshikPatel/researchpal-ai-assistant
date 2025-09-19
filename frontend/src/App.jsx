import { useState, useRef, useEffect } from 'react'
import './App.css'

function App() {
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function handleAsk() {
    if (!query.trim() || loading) return
    
    const userMessage = { type: 'user', content: query, timestamp: Date.now() }
    setMessages(prev => [...prev, userMessage])
    setQuery('')
    setLoading(true)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
      
      const data = await response.json()
      
      const aiMessage = {
        type: 'ai',
        content: data.content || 'No response received',
        sources: data.sources || [],
        timestamp: Date.now()
      }
      
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      const errorMessage = {
        type: 'ai',
        content: 'Sorry, something went wrong. Please try again.',
        sources: [],
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, errorMessage])
    }
    setLoading(false)
  }

  async function handleSummarize(content) {
    if (loading) return
    
    const summaryQuery = `Please provide a concise summary of this: ${content}`
    setMessages(prev => [...prev, { type: 'user', content: 'Summarize this answer', timestamp: Date.now() }])
    setLoading(true)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: summaryQuery })
      })
      
      const data = await response.json()
      setMessages(prev => [...prev, {
        type: 'ai',
        content: data.content,
        sources: data.sources || [],
        timestamp: Date.now()
      }])
    } catch (error) {
      setMessages(prev => [...prev, {
        type: 'ai', 
        content: 'Failed to generate summary',
        sources: [],
        timestamp: Date.now()
      }])
    }
    setLoading(false)
  }

  async function handleQuiz(content) {
    if (loading) return
    
    const quizQuery = `Generate 5 quiz questions with answers based on this content: ${content}`
    setMessages(prev => [...prev, { type: 'user', content: 'Generate quiz questions', timestamp: Date.now() }])
    setLoading(true)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: quizQuery })
      })
      
      const data = await response.json()
      setMessages(prev => [...prev, {
        type: 'ai',
        content: data.content,
        sources: data.sources || [],
        timestamp: Date.now()
      }])
    } catch (error) {
      setMessages(prev => [...prev, {
        type: 'ai',
        content: 'Failed to generate quiz questions', 
        sources: [],
        timestamp: Date.now()
      }])
    }
    setLoading(false)
  }

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🔍</span>
            <span className="logo-text">ResearchPal</span>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>×</button>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-section">
            <button className="nav-item active">
              <span className="nav-icon">🏠</span>
              Home
            </button>
            <button className="nav-item">
              <span className="nav-icon">🔍</span>
              Discover
            </button>
            <button className="nav-item">
              <span className="nav-icon">📚</span>
              Library
            </button>
          </div>
          
          <div className="nav-section">
            <h3 className="nav-title">Recent</h3>
            {messages.filter(m => m.type === 'user').slice(-5).map((msg, idx) => (
              <button key={idx} className="recent-item">
                {msg.content.substring(0, 30)}...
              </button>
            ))}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="header">
          <button className="menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
          <div className="header-logo">
            <span className="logo-icon">🔍</span>
            <span>ResearchPal</span>
          </div>
        </header>

        {/* Chat Area */}
        <div className="chat-container">
          {messages.length === 0 ? (
            <div className="welcome-screen">
              <div className="welcome-content">
                <h1 className="welcome-title">What can I help you research today?</h1>
                <p className="welcome-subtitle">Get accurate, real-time answers with cited sources</p>
                
                <div className="suggested-queries">
                  <button className="suggestion-btn" onClick={() => setQuery("What are the latest developments in AI?")}>
                    What are the latest developments in AI?
                  </button>
                  <button className="suggestion-btn" onClick={() => setQuery("Explain quantum computing")}>
                    Explain quantum computing
                  </button>
                  <button className="suggestion-btn" onClick={() => setQuery("How does machine learning work?")}>
                    How does machine learning work?
                  </button>
                  <button className="suggestion-btn" onClick={() => setQuery("What is blockchain technology?")}>
                    What is blockchain technology?
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="messages">
              {messages.map((message, idx) => (
                <div key={idx} className={`message ${message.type}`}>
                  {message.type === 'user' ? (
                    <div className="user-message">
                      <div className="message-avatar">👤</div>
                      <div className="message-content">{message.content}</div>
                    </div>
                  ) : (
                    <div className="ai-message">
                      <div className="message-avatar ai-avatar">🤖</div>
                      <div className="ai-response">
                        <div className="message-content">{message.content}</div>
                        
                        {message.sources && message.sources.length > 0 && (
                          <div className="sources">
                            <h4>Sources:</h4>
                            {message.sources.map((source, sourceIdx) => (
                              <a key={sourceIdx} href={source} target="_blank" rel="noopener noreferrer" className="source-link">
                                {sourceIdx + 1}. {new URL(source).hostname}
                              </a>
                            ))}
                          </div>
                        )}
                        
                        <div className="message-actions">
                          <button className="action-btn" onClick={() => handleSummarize(message.content)}>
                            📝 Summarize
                          </button>
                          <button className="action-btn" onClick={() => handleQuiz(message.content)}>
                            ❓ Quiz Me
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {loading && (
                <div className="message ai">
                  <div className="ai-message">
                    <div className="message-avatar ai-avatar">🤖</div>
                    <div className="ai-response">
                      <div className="typing-indicator">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="search-section">
          <div className="search-container">
            <div className="search-box">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything..."
                onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
                disabled={loading}
                className="search-input"
              />
              <button 
                onClick={handleAsk} 
                disabled={loading || !query.trim()}
                className="search-btn"
              >
                {loading ? '⏳' : '↗'}
              </button>
            </div>
            <div className="search-footer">
              <span>Pro Search • Focus: All</span>
            </div>
          </div>
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)}></div>}
    </div>
  )
}

export default App
