import { Moon, Sun } from "lucide-react"
import { useTheme } from "./theme-provider"
import { useEffect, useState, useRef } from "react"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light"
    
    if (!document.startViewTransition) {
      setTheme(newTheme)
      return
    }

    const button = buttonRef.current
    if (button) {
      const rect = button.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2
      
      const xPercent = (x / window.innerWidth) * 100
      const yPercent = (y / window.innerHeight) * 100
      
      document.documentElement.style.setProperty('--click-x', `${xPercent}%`)
      document.documentElement.style.setProperty('--click-y', `${yPercent}%`)
    }

    await document.startViewTransition(() => {
      setTheme(newTheme)
    }).ready
  }

  if (!mounted) {
    return null
  }

  return (
    <>
      <style>{`
        @keyframes circle-blur-in {
          from {
            clip-path: circle(0% at var(--click-x, 90%) var(--click-y, 5%));
            filter: blur(10px);
          }
          to {
            clip-path: circle(150% at var(--click-x, 90%) var(--click-y, 5%));
            filter: blur(0px);
          }
        }

        @keyframes circle-blur-out {
          from {
            clip-path: circle(150% at var(--click-x, 90%) var(--click-y, 5%));
            filter: blur(0px);
          }
          to {
            clip-path: circle(0% at var(--click-x, 90%) var(--click-y, 5%));
            filter: blur(10px);
          }
        }

        ::view-transition-old(root) {
          animation: circle-blur-out 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        ::view-transition-new(root) {
          animation: circle-blur-in 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @media (max-width: 640px) {
          button[aria-label="Toggle theme"] {
            top: 1rem !important;
            right: 1rem !important;
            width: 2.25rem !important;
            height: 2.25rem !important;
          }

          button[aria-label="Toggle theme"] svg {
            width: 1.125rem !important;
            height: 1.125rem !important;
          }
        }
      `}</style>
      
      <button
        ref={buttonRef}
        onClick={toggleTheme}
        className="fixed top-6 right-6 z-50 inline-flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200 hover:opacity-80 active:scale-95"
        aria-label="Toggle theme"
        style={{
          background: 'transparent',
          border: 'none',
          padding: '0.5rem',
          cursor: 'pointer'
        }}
      >
        {/* Sun Icon - Visible in Light Mode */}
        <Sun 
          className="h-5 w-5 transition-all duration-300"
          style={{
            opacity: theme === 'dark' ? 0 : 1,
            transform: theme === 'dark' ? 'scale(0) rotate(90deg)' : 'scale(1) rotate(0deg)',
            position: 'absolute',
            color: 'currentColor'
          }}
          strokeWidth={2}
        />
        
        {/* Moon Icon - Visible in Dark Mode */}
        <Moon 
          className="h-5 w-5 transition-all duration-300"
          style={{
            opacity: theme === 'dark' ? 1 : 0,
            transform: theme === 'dark' ? 'scale(1) rotate(0deg)' : 'scale(0) rotate(-90deg)',
            position: 'absolute',
            color: 'currentColor'
          }}
          strokeWidth={2}
        />
      </button>
    </>
  )
}