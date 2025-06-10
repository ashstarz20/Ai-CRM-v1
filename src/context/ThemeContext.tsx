// import React, {
//   createContext,
//   useContext,
//   useState,
//   useEffect,
//   ReactNode,
// } from "react";

// interface ThemeContextType {
//   isDarkMode: boolean;
//   toggleTheme: () => void;
// }

// const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
//   children,
// }) => {
//   const [isDarkMode, setIsDarkMode] = useState(() => {
//     // Only run in browser environment
//     if (typeof window === 'undefined') return false;
    
//     const savedTheme = localStorage.getItem("theme");
//     if (savedTheme) return savedTheme === "dark";
    
//     return window.matchMedia("(prefers-color-scheme: dark)").matches;
//   });

//   useEffect(() => {
//     // Only run in browser environment
//     if (typeof window === 'undefined') return;
    
//     const html = document.documentElement;
//     if (isDarkMode) {
//       html.classList.add("dark");
//       localStorage.setItem("theme", "dark");
//     } else {
//       html.classList.remove("dark");
//       localStorage.setItem("theme", "light");
//     }
//   }, [isDarkMode]);

//   const toggleTheme = () => {
//     setIsDarkMode((prev) => !prev);
//   };

//   return (
//     <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
//       {children}
//     </ThemeContext.Provider>
//   );
// };

// export const useTheme = () => {
//   const context = useContext(ThemeContext);
//   if (!context) {
//     throw new Error("useTheme must be used within a ThemeProvider");
//   }
//   return context;
// };

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Client-side only
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    setIsDarkMode(savedTheme 
      ? savedTheme === "dark" 
      : systemPrefersDark);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};