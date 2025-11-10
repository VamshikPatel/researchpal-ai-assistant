import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { useRef } from "react";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const buttonRef = useRef(null);

  const toggleTheme = (event) => {
    const newTheme = theme === "light" ? "dark" : "light";

    // Check if View Transition API is supported
    if (!document.startViewTransition) {
      setTheme(newTheme);
      return;
    }

    // Get button position for animation origin
    const rect = buttonRef.current.getBoundingClientRect();
    const x = window.innerWidth;
    const y = window.innerHeight / 250;

    // Calculate radius to cover entire viewport
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // Create animation keyframes
    const clipPath = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${endRadius}px at ${x}px ${y}px)`
    ];

    // Start the view transition
    const transition = document.startViewTransition(async () => {
      setTheme(newTheme);
    });

    // Wait for transition to be ready, then animate
    transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: clipPath },
        {
          duration: 600,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)"
        }
      );
    });
  };

  return (
    <Button
      ref={buttonRef}
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="relative"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}