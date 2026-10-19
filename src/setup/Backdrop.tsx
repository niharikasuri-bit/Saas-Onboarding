/**
 * Sign-up and log-in backdrop: no pictures, just brand light. Two soft glows
 * (Primary 1 and Primary 2) and a fine dot grid that fades towards the edges.
 * Decorative only: hidden from assistive tech.
 */

export function Backdrop() {
  return (
    <div className="bg" aria-hidden="true">
      <span className="bg-glow is-orange" />
      <span className="bg-glow is-teal" />
      <span className="bg-dots" />
    </div>
  );
}
