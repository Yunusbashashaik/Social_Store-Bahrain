import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import { CartProvider } from "./cart/CartContext.jsx";
import { SettingsProvider } from "./context/SettingsContext.jsx";
import { COPY } from "./data/copy.js";
import ComplaintPage from "./pages/ComplaintPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import { applyTheme, readTheme } from "./theme.js";
import { useEffect, useState } from "react";

const LANG_KEY = "globalstores_lang";

function useLanguage() {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem(LANG_KEY);
    return saved === "ar" ? "ar" : "en";
  });

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang === "ar" ? "ar" : "en";
    document.body.classList.toggle("rtl", lang === "ar");
  }, [lang]);

  return [lang, setLang];
}

function useTheme() {
  const [theme, setThemeState] = useState(() => readTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = (next) => {
    setThemeState(applyTheme(next));
  };

  return [theme, setTheme];
}

export default function App() {
  const [lang, setLang] = useLanguage();
  const [theme, setTheme] = useTheme();
  const t = COPY[lang];

  return (
    <SettingsProvider>
      <CartProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route
              element={
                <Layout
                  lang={lang}
                  setLang={setLang}
                  theme={theme}
                  setTheme={setTheme}
                  t={t}
                />
              }
            >
              <Route index element={<HomePage lang={lang} t={t} />} />
              <Route path="complaint" element={<ComplaintPage t={t} />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </SettingsProvider>
  );
}
