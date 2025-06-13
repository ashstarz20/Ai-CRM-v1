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
//   const [isDarkMode, setIsDarkMode] = useState(false);
//   const [isReady, setIsReady] = useState(false);

//   useEffect(() => {
//     const initializeTheme = () => {
//       try {
//         const savedTheme = localStorage.getItem("theme");
//         const systemPrefersDark = window.matchMedia(
//           "(prefers-color-scheme: dark)"
//         ).matches;
        
//         setIsDarkMode(savedTheme ? savedTheme === "dark" : systemPrefersDark);
//       } catch (e) {
//         console.error("Error reading theme preferences:", e);
//       } finally {
//         setIsReady(true);
//       }
//     };

//     initializeTheme();
//   }, []);

//   useEffect(() => {
//     if (!isReady) return;

//     const applyTheme = () => {
//       try {
//         if (isDarkMode) {
//           document.documentElement.classList.add("dark");
//           localStorage.setItem("theme", "dark");
//         } else {
//           document.documentElement.classList.remove("dark");
//           localStorage.setItem("theme", "light");
//         }
//       } catch (e) {
//         console.error("Error applying theme:", e);
//       }
//     };

//     applyTheme();
//   }, [isDarkMode, isReady]);

//   const toggleTheme = () => setIsDarkMode(prev => !prev);

//   return (
//     <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
//       {isReady ? children : <div className="hidden">{children}</div>}
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
  const [isReady, setIsReady] = useState(false);

  // Read from localStorage and system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    const shouldUseDark =
      savedTheme === "dark" ||
      (!savedTheme && systemPrefersDark);

    setIsDarkMode(shouldUseDark);
    setIsReady(true);
  }, []);

  // Apply the dark class to <html> when ready
  useEffect(() => {
    if (!isReady) return;

    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode, isReady]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  // Prevent rendering until theme is applied
  if (!isReady) {
    return null; // Avoid layout shift and incorrect theming flash
  }

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
