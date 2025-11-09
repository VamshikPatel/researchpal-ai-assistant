import { useState } from 'react';
import './App.css';
import { ThemeProvider } from './components/theme-provider';
import { ModeToggle } from './components/mode-toggle';
import { Spinner } from './components/ui/spinner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Function to remove markdown formatting
const removeMarkdown = (text) => {
  if (!text) return '';
  
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/``````/g, '')
    .replace(/^#+\s+(.+?)$/gm, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/\[\d+\]/g, '');
};

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/search`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search failed:', error);
      setError('Failed to fetch results. Please try again.');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="researchpal-theme">
      <div className="app">
        <ModeToggle />
        
        <div className="container">
          <header className="hero">
            <h1 className="brand-title">ResearchPal</h1>
            <p className="tagline">Navigate the depths of knowledge with precision</p>
          </header>

          <main className="search-section">
            {/* Input compatible with both themes */}
            <form onSubmit={handleSearch} className="w-full max-w-4xl mx-auto mb-8">
              <div className="relative w-full bg-muted/40 dark:bg-muted/40 hover:bg-muted/60 dark:hover:bg-muted/60 rounded-xl border border-border/50 p-2 transition-all duration-200 focus-within:bg-background focus-within:dark:bg-card focus-within:border-primary/50 focus-within:shadow-lg focus-within:ring-2 focus-within:ring-primary/20">
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask anything. Type @ for mentions"
                    disabled={loading}
                    className="flex-1 border-0 bg-transparent text-base h-12 pl-4 focus-visible:ring-0 focus-visible:ring-offset-0"
                    autoFocus
                  />
                  <Button 
                    type="submit" 
                    disabled={loading}
                    size="icon"
                    className="h-10 w-10 rounded-lg shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {loading ? (
                      <Spinner className="h-5 w-5" />
                    ) : (
                      <svg 
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14m-7-7l7 7-7 7" />
                      </svg>
                    )}
                  </Button>
                </div>
              </div>
            </form>

            {error && (
              <div className="error-message mb-4">
                <p>{error}</p>
              </div>
            )}

            {results && (
              <div className="results mb-6">
                <div className="result-card">
                  <h3 className="result-title">Answer</h3>
                  <div className="result-content">
                    {removeMarkdown(results.content || results.answer || results.choices?.[0]?.message?.content) || 'No answer available'}
                  </div>
                  {results.sources && results.sources.length > 0 && (
                    <div className="citations">
                      <h4>Sources</h4>
                      {results.sources.map((cite, idx) => (
                        <a 
                          key={idx} 
                          href={cite} 
                          className="citation-link" 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          [{idx + 1}] {cite}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!results && !loading && (
              <div className="empty-state">
                <p>Start exploring by asking a question</p>
              </div>
            )}
          </main>

          <footer className="footer">
            <p>Powered by curiosity · Built with precision</p>
          </footer>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;