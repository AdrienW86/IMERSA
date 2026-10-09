/**
 * Logotype IMERSA : un angle de volume ouvert (trois arêtes d'un cube vues
 * en perspective) — l'entrée dans une nouvelle dimension — et un mot-symbole
 * aux capitales espacées.
 */
export function Logo({ className, title = "IMERSA" }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 168 20" className={className} role="img" aria-label={title} fill="none">
      <title>{title}</title>
      <g stroke="currentColor" strokeWidth="1.15" strokeLinecap="square">
        <path d="M9.5 2.2v8.2l-7 4.2M9.5 10.4l7 4.2" />
        <path d="M2.5 6.1l7-3.9 7 3.9" opacity="0.45" />
      </g>
      <text
        x="30"
        y="14.6"
        fill="currentColor"
        fontFamily="var(--font-sans), system-ui, sans-serif"
        fontSize="13"
        fontWeight="400"
        letterSpacing="7.2"
      >
        IMERSA
      </text>
    </svg>
  );
}
