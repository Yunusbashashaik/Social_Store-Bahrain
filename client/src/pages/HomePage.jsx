import { useEffect, useMemo, useState } from "react";
import ServicesSection from "../components/ServicesSection.jsx";
import { UiIcon } from "../components/UiIcon.jsx";
import ViewPlansModal from "../components/ViewPlansModal.jsx";
import { SERVICES, fetchServices, filterServices } from "../data/catalog.js";
import { readLiveServices } from "../lib/liveStore.js";
import { wallpaperUrl } from "../data/serviceImages.js";

export default function HomePage({ lang, t }) {
  const [services, setServices] = useState(() => readLiveServices() || SERVICES);
  const [loadError, setLoadError] = useState("");
  const [plansService, setPlansService] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const wallpaper = wallpaperUrl();

  useEffect(() => {
    // Keep first paint at the hero — never auto-jump to Popular Subscriptions.
    if (window.location.hash === "#services" || window.location.hash === "#top") {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = (event) => {
      const fromEvent = event?.detail?.services;
      if (Array.isArray(fromEvent)) {
        if (!cancelled) {
          setServices(fromEvent);
          setLoadError("");
        }
        return;
      }
      fetchServices()
        .then((list) => {
          if (!cancelled) {
            setServices(list);
            setLoadError("");
          }
        })
        .catch(() => {
          if (!cancelled) {
            setLoadError(t.servicesLoadFallback);
          }
        });
    };
    load();
    window.addEventListener("gs:services-updated", load);
    return () => {
      cancelled = true;
      window.removeEventListener("gs:services-updated", load);
    };
  }, [t.servicesLoadFallback]);

  const headline = t.heroHeadlineParts || {
    before: t.heroHeadline,
    highlight: "",
    after: "",
  };

  const visibleServices = useMemo(
    () => filterServices(services, searchQuery),
    [services, searchQuery],
  );

  const scrollToServices = () => {
    document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="home-main">
      <section className="hero-banner" id="top">
        <div className="hero-banner-media" aria-hidden="true">
          <img
            className="hero-banner-photo"
            src={wallpaper}
            alt=""
            width={6400}
            height={3288}
            decoding="async"
            fetchPriority="high"
          />
        </div>
        <div className="container hero">
          <div className="hero-layout">
            <div className="hero-copy">
              <p className="hero-badge">
                <span aria-hidden="true">★</span> {t.heroBadge}
              </p>
              <h1>
                {headline.before}
                {headline.highlight ? (
                  <span className="hero-highlight">{headline.highlight}</span>
                ) : null}
                {headline.after}
              </h1>
              <p className="hero-tagline">{t.tagline}</p>
              <div className="hero-actions">
                <button type="button" className="btn btn-primary" onClick={scrollToServices}>
                  <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
                    <path
                      fill="currentColor"
                      d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 20 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
                    />
                  </svg>
                  {t.heroCta}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("gs:open-modal", { detail: "how" }),
                    )
                  }
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
                    <path fill="currentColor" d="M8 5v14l11-7z" />
                  </svg>
                  {t.navHowItWorks}
                </button>
              </div>
              <ul className="hero-trust">
                {t.heroTrust.map((item, index) => (
                  <li
                    key={item.title}
                    data-reveal
                    style={{ "--reveal-delay": `${180 + index * 90}ms` }}
                  >
                    <span className="hero-trust-icon" aria-hidden="true">
                      <UiIcon name={item.icon} />
                    </span>
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.body}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-bar-wrap" data-reveal>
        <div className="trust-bar container" aria-label={t.trustBarLabel}>
          {t.trustBarDetailed.map((item) => (
            <div key={item.title} className="trust-bar-item">
              <span className="trust-icon" aria-hidden="true">
                <UiIcon name={item.icon} />
              </span>
              <div>
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="catalog-band" id="services">
        <div className="container catalog">
          <div className="catalog-header" data-reveal>
            <h2>
              <span className="catalog-bar" aria-hidden="true" />
              {t.catalogTitle}
            </h2>
            <label className="catalog-search">
              <span className="visually-hidden">{t.catalogSearchLabel}</span>
              <svg className="catalog-search-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
                />
              </svg>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t.catalogSearchPlaceholder}
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                enterKeyHint="search"
              />
              {searchQuery ? (
                <button
                  type="button"
                  className="catalog-search-clear"
                  onClick={() => setSearchQuery("")}
                  aria-label={t.catalogSearchClear}
                >
                  ×
                </button>
              ) : null}
            </label>
          </div>
          {loadError ? <p className="catalog-note">{loadError}</p> : null}
          {visibleServices.length ? (
            <ServicesSection
              services={visibleServices}
              lang={lang}
              t={t}
              onViewPlans={setPlansService}
            />
          ) : (
            <p className="catalog-empty" role="status">
              {searchQuery.trim()
                ? t.catalogSearchEmpty.replace("{query}", searchQuery.trim())
                : t.catalogEmpty}
            </p>
          )}
        </div>
      </section>

      <section className="feature-bars container" aria-label={t.featureBarsLabel}>
        <div className="feature-bar feature-bar--dark" data-reveal>
          {t.featureBarDark.map((item) => (
            <div key={item.title} className="feature-bar-item">
              <span className="feature-bar-icon" aria-hidden="true">
                <UiIcon name={item.icon} />
              </span>
              <div>
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="feature-bar feature-bar--support" data-reveal>
          {t.featureBarSupport.map((item) => (
            <div key={item.title} className="feature-bar-item">
              <span className="feature-bar-icon" aria-hidden="true">
                <UiIcon name={item.icon} />
              </span>
              <div>
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {plansService ? (
        <ViewPlansModal
          service={plansService}
          lang={lang}
          t={t}
          onClose={() => setPlansService(null)}
        />
      ) : null}
    </main>
  );
}
