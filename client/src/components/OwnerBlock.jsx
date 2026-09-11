import { formatWhatsAppDisplay } from "../data/catalog.js";

export default function OwnerBlock({ label, text, numbers = [] }) {
  const phones = (Array.isArray(numbers) ? numbers : [])
    .map((num) => String(num || "").replace(/\D/g, ""))
    .filter(Boolean);
  if (!text && !phones.length) return null;
  return (
    <section className="owner-block">
      {label ? <p className="owner-block-label">{label}</p> : null}
      {text ? <p className="modal-owners">{text}</p> : null}
      {phones.length ? (
        <ul className="owner-block-numbers">
          {phones.map((num) => (
            <li key={num}>
              <a href={`https://wa.me/${num}`}>{formatWhatsAppDisplay(num)}</a>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
