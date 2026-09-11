import { useEffect } from "react";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function revealNow(el) {
  el.classList.add("is-visible");
}

export default function ScrollReveal() {
  useEffect(() => {
    const reduced = prefersReducedMotion();
    const seen = new WeakSet();

    const revealAll = () => {
      document.querySelectorAll("[data-reveal]").forEach(revealNow);
    };

    if (reduced || typeof IntersectionObserver === "undefined") {
      revealAll();
      return undefined;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          revealNow(entry.target);
          io.unobserve(entry.target);
        });
      },
      {
        threshold: 0.14,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    const watch = (root) => {
      const nodes =
        root instanceof Element && root.hasAttribute("data-reveal")
          ? [root, ...root.querySelectorAll("[data-reveal]")]
          : [...(root.querySelectorAll?.("[data-reveal]") || [])];
      nodes.forEach((el) => {
        if (seen.has(el) || el.classList.contains("is-visible")) return;
        seen.add(el);
        io.observe(el);
      });
    };

    watch(document);

    const mo = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) watch(node);
        });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
