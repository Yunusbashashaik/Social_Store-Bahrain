const assetBase = import.meta.env.BASE_URL || "/";

export default function Logo({ className = "", showTagline = false, t }) {
  const name = t?.brandName || "Social Store";
  const tagline = t?.brandTagline || "Premium Subscriptions, Global Access.";
  return (
    <span className={`brand-logo ${className}`.trim()}>
      <img className="brand-mark" src={`${assetBase}logo.png`} alt="" aria-hidden="true" />
      <span className="brand-text">
        <span className="brand-wordmark">{name}</span>
        {showTagline ? <span className="brand-tagline">{tagline}</span> : null}
      </span>
    </span>
  );
}
