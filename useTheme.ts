import { useEffect } from "react";

type Theme = "light";

export function useTheme() {
  const theme: Theme = "light";

  useEffect(() => {
    // Always remove dark class to ensure light mode
    document.documentElement.classList.remove("dark");
  }, []);

  const toggleTheme = () => {
    // No-op: always light mode
  };

  const setTheme = () => {
    // No-op: always light mode
  };

  return { theme, setTheme, toggleTheme };
}
