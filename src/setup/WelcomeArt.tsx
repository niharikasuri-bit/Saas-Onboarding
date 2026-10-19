import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { DEVICE, Figure, GREY, GREY_2, INK, type FigureProps } from './Figure';

/**
 * Welcome illustration, in the unDraw manner (flat, one accent colour, dark
 * ink, light greys, thin ground lines). Hub and spoke: Complaints, Health
 * Campaigns and Licences and Permits each appear in their own corner, named;
 * then DIGIT appears in the centre and a beam travels from each service into
 * it, lighting that service's mark in the hub. Plays once (about 4.5 s),
 * replays on hover, has a play/pause button, and starts at the end for
 * reduced motion.
 */

const ORANGE = '#C84C0E';
const ORANGE_BG = '#FBEEE8';
const ORANGE_MID = '#F2CDB8';
const GREEN = '#00703C';
const GREEN_BG = '#E2F2EA';
const BLUE = '#0057BD';
const TEAL = '#0B4B66';
const GROUND = 432;

/** A person standing on the ground line at x. */
function Who({ x, s = 1.15, ...f }: FigureProps & { x: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${GROUND}) scale(${s})`}>
      <Figure {...f} />
    </g>
  );
}

/** A name tag under each scene, so it's clear what each one shows. */
function Label({ x, text }: { x: number; text: string }) {
  const w = text.length * 7.2 + 28;
  return (
    <g transform={`translate(${(x - w / 2).toFixed(1)} ${GROUND + 14})`}>
      <rect width={w} height={28} rx={14} fill="#FFFFFF" stroke={GREY} strokeWidth={1.2} />
      <text x={w / 2} y={18.4} textAnchor="middle" fontSize={13} fontWeight={700} fill={TEAL}>
        {text}
      </text>
    </g>
  );
}

/* ---------------------------------------------------------------- */
/* The three scenes                                                  */
/* ---------------------------------------------------------------- */

/** An officer holding up an issued licence, beside the framed original. */
function Licences() {
  return (
    <g>
      <path d="M48 432.5 H178" stroke={GREY} strokeWidth={2} strokeLinecap="round" />
      <path d="M118 432 L126 392 M152 432 L144 392" stroke={DEVICE} strokeWidth={2.4} strokeLinecap="round" />
      <rect x={106} y={338} width={58} height={62} rx={3} fill="#FFFFFF" stroke={DEVICE} strokeWidth={2.6} />
      <rect x={112} y={344} width={46} height={50} rx={1} fill="none" stroke={ORANGE_MID} strokeWidth={1.4} />
      <path d="M118 354 H146 M118 361 H150 M118 368 H140" stroke={GREY} strokeWidth={2.4} strokeLinecap="round" />
      <circle cx={143} cy={381} r={7} fill={ORANGE} />
      <circle cx={143} cy={381} r={4} fill="none" stroke="#FFFFFF" strokeWidth={1.2} />
      <path d="M139 386 L136.4 394 L140.6 391.6 L142.6 395 L143.4 388 M147 386 L149.6 394 L145.4 391.6 L143.4 395" fill={ORANGE} />
      <Who x={78} shirt={TEAL} skin="#8D5524" hair={INK} pose="certificate" />
      <Label x={110} text="Licences and Permits" />
    </g>
  );
}

/** A citizen pointing at the complaint they reported, now resolved. */
function Complaints() {
  return (
    <g>
      <path d="M266 432.5 H394" stroke={GREY} strokeWidth={2} strokeLinecap="round" />
      <rect x={322} y={330} width={52} height={102} rx={9} fill="#FFFFFF" stroke={DEVICE} strokeWidth={3} />
      <rect x={340} y={334.6} width={16} height={3} rx={1.5} fill={DEVICE} />
      <rect x={327.6} y={342} width={40.8} height={14} rx={2} fill={TEAL} />
      <path d="M331.4 346.4 H337 M331.4 349 H337 M331.4 351.6 H337" stroke="#FFFFFF" strokeWidth={1.1} strokeLinecap="round" />
      <rect x={340.4} y={347.4} width={16} height={3.2} rx={1.6} fill="#FFFFFF" opacity={0.9} />
      <rect x={327.6} y={361} width={40.8} height={22} rx={3} fill={ORANGE_BG} />
      <circle cx={337} cy={372} r={6} fill={ORANGE_MID} />
      <path d="M337 368 V373 M337 376 V376.4" stroke={ORANGE} strokeWidth={1.8} strokeLinecap="round" />
      <path d="M346 368.6 H364 M346 374.6 H358" stroke={GREY} strokeWidth={2.4} strokeLinecap="round" />
      <rect x={327.6} y={389} width={40.8} height={9} rx={4.5} fill={GREEN_BG} />
      <path d="M331.6 393.6 l2 2 l4 -4.4" stroke={GREEN} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M341 393.6 H364" stroke={GREEN} strokeWidth={2} strokeLinecap="round" />
      <rect x={327.6} y={414} width={40.8} height={10} rx={2} fill={ORANGE} />
      <Who x={296} shirt={ORANGE} skin="#F1C27D" hair="#5A3825" pose="point" />
      <Label x={330} text="Complaints" />
    </g>
  );
}

/** A doctor vaccinating a child, with the vaccine carrier beside them. */
function Health() {
  return (
    <g>
      <path d="M486 432.5 H612" stroke={GREY} strokeWidth={2} strokeLinecap="round" />
      <Who x={506} s={0.82} shirt="#F2B33D" skin="#8D5524" hair={INK} trousers="#3C6F85" />
      <Who x={550} shirt={GREEN} skin="#C68642" hair={INK} pose="inject" coat />
      <rect x={570} y={410} width={32} height={22} rx={3} fill={BLUE} />
      <rect x={568} y={406} width={36} height={6} rx={2} fill="#00479B" />
      <rect x={580} y={415} width={12} height={12} rx={2} fill="#FFFFFF" />
      <path d="M586 417.6 V424.4 M582.6 421 H589.4" stroke={BLUE} strokeWidth={2} strokeLinecap="round" />
      <Label x={546} text="Health Campaigns" />
    </g>
  );
}

/* ---------------------------------------------------------------- */
/* The DIGIT hub the three connect to                                */
/* ---------------------------------------------------------------- */

const HUB = { x: 320, y: 262 };

/** The three services, as small marks inside the hub. They fill in as each connects. */
function HubMark({ kind, cx, cy, on }: { kind: 'lnp' | 'cms' | 'hcm'; cx: number; cy: number; on: boolean }) {
  const c = on ? ORANGE : '#C5C5C5';
  return (
    <g>
      <circle cx={cx} cy={cy} r={13} fill={on ? ORANGE_BG : GREY_2} className="wa-fade" />
      {kind === 'lnp' && (
        <g className="wa-fade">
          <rect x={cx - 5.5} y={cy - 7} width={11} height={14} rx={1.6} fill={c} />
          <path d={`M${cx - 3} ${cy - 3} h6 M${cx - 3} ${cy} h6 M${cx - 3} ${cy + 3} h4`} stroke="#FFFFFF" strokeWidth={1.2} strokeLinecap="round" />
        </g>
      )}
      {kind === 'cms' && (
        <g className="wa-fade">
          <path d={`M${cx - 7} ${cy - 5.5} h14 a1.6 1.6 0 0 1 1.6 1.6 v7.8 a1.6 1.6 0 0 1 -1.6 1.6 h-7.6 l-4 3.2 v-3.2 h-2.4 a1.6 1.6 0 0 1 -1.6 -1.6 v-7.8 a1.6 1.6 0 0 1 1.6 -1.6z`} fill={c} />
          <path d={`M${cx} ${cy - 3} v3.6 M${cx} ${cy + 3} v0.3`} stroke="#FFFFFF" strokeWidth={1.5} strokeLinecap="round" />
        </g>
      )}
      {kind === 'hcm' && <path className="wa-fade" d={`M${cx - 2.4} ${cy - 7} h4.8 v4.6 h4.6 v4.8 h-4.6 v4.6 h-4.8 v-4.6 h-4.6 v-4.8 h4.6z`} fill={c} />}
    </g>
  );
}

function Hub({ lit, pulse, breathing }: { lit: number[]; pulse: number; breathing: boolean }) {
  const { x, y } = HUB;
  return (
    <g>
      {/* halo: one soft pulse each time a service connects */}
      <circle key={`p${pulse}`} cx={x} cy={y} r={92} fill={ORANGE} className={pulse ? 'wa-pulse' : ''} opacity={0} />
      {/* once everything is connected, the hub keeps a slow, quiet pulse (stops on Pause) */}
      {breathing && <circle cx={x} cy={y} r={92} fill={ORANGE} className="wa-breathe" opacity={0} />}
      <circle cx={x} cy={y} r={92} fill={ORANGE_BG} opacity={0.7} />
      <circle cx={x} cy={y} r={66} fill="#FFFFFF" opacity={0.85} />
      <rect x={x - 78} y={y - 50} width={156} height={100} rx={18} fill="#FFFFFF" stroke="#D6D5D4" strokeWidth={2} />
      <image href="/digit-logo.png" x={x - 46} y={y - 36} width={92} height={21.6} />
      <HubMark kind="lnp" cx={x - 36} cy={y + 20} on={lit.includes(0)} />
      <HubMark kind="cms" cx={x} cy={y + 20} on={lit.includes(1)} />
      <HubMark kind="hcm" cx={x + 36} cy={y + 20} on={lit.includes(2)} />
    </g>
  );
}

/* ---------------------------------------------------------------- */
/* Choreography                                                      */
/* ---------------------------------------------------------------- */

/**
 * 0 nothing · 1 Complaints · 2 Health · 3 Licences (each in its corner)
 * 4 the DIGIT hub appears · 5, 6, 7 a beam travels from each service into
 * the hub, which lights that service's mark and pulses once.
 */
type Phase = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
const LAST: Phase = 7;
const STEP_MS = [250, 600, 600, 700, 600, 650, 650]; // wait before each next phase

/*
 * Each scene is drawn on the shared ground line and moved into its corner.
 * `beam` runs from the scene to the edge of the hub; `mark` is which hub mark
 * it lights (0 Licences, 1 Complaints, 2 Health).
 */
const SCENES: { key: string; enter: number; at: string; node: ReactNode; beam: string; mark: number }[] = [
  {
    key: 'cms',
    enter: 1,
    at: 'translate(-236px, -250px) scale(0.86)',
    node: <Complaints />,
    beam: 'M156 170 C206 172 226 240 242 258',
    mark: 1,
  },
  {
    key: 'hcm',
    enter: 2,
    at: 'translate(2px, -250px) scale(0.86)',
    node: <Health />,
    beam: 'M486 170 C436 172 414 240 398 258',
    mark: 2,
  },
  {
    key: 'lnp',
    enter: 3,
    at: 'translate(212px, 52px) scale(0.86)',
    node: <Licences />,
    beam: 'M320 384 C320 356 320 334 320 312',
    mark: 0,
  },
];

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function place(phase: Phase, enter: number, at: string): CSSProperties {
  if (phase >= enter) return { transform: at, opacity: 1 };
  return { transform: `${at} translate(0px, 18px)`, opacity: 0 };
}

export function WelcomeArt() {
  const [phase, setPhase] = useState<Phase>(() => (reduced() ? LAST : 0));
  const [playing, setPlaying] = useState(() => !reduced());
  // Set when someone presses Pause, so hovering never restarts against their wishes.
  const [held, setHeld] = useState(false);
  const hoverTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!playing) return;
    if (phase >= LAST) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setPhase((p) => (p + 1) as Phase), STEP_MS[phase]);
    return () => clearTimeout(t);
  }, [playing, phase]);

  useEffect(() => () => window.clearTimeout(hoverTimer.current), []);

  const done = phase === LAST;
  const restart = () => {
    setPhase(0);
    setPlaying(true);
  };
  // Something is moving: the sequence, or the hub's pulse after it.
  const moving = playing || (done && !held && !reduced());
  const toggle = () => {
    window.clearTimeout(hoverTimer.current);
    if (moving) {
      setPlaying(false);
      setHeld(true);
    } else {
      setHeld(false);
      if (done) restart();
      else setPlaying(true); // carry on from where it stopped
    }
  };

  // Hovering the picture replays it, but only after a short pause on it, so
  // passing over on the way to the button doesn't trigger a replay.
  const onEnter = () => {
    window.clearTimeout(hoverTimer.current);
    if (held || playing || !done || reduced()) return;
    hoverTimer.current = window.setTimeout(restart, 450);
  };
  const onLeave = () => window.clearTimeout(hoverTimer.current);

  // Beams fire in order: Complaints, Health, Licences.
  const connected = Math.max(0, phase - 4); // 0..3
  const lit = SCENES.slice(0, connected).map((s) => s.mark);
  const hubStyle: CSSProperties =
    phase >= 4 ? { opacity: 1, transform: 'scale(1)' } : { opacity: 0, transform: 'scale(0.9)' };

  return (
    <div className="wa-wrap">
      <svg
        className="wa"
        viewBox="0 -10 640 540"
        role="img"
        aria-labelledby="wa-title"
        fontFamily="Roboto, sans-serif"
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        <title id="wa-title">
          Complaints, Health Campaigns and Licences and Permits each appear on their own, then each connects to DIGIT
          in the centre.
        </title>

        {/* soft backdrop shape, unDraw style */}
        <path d="M60 280 C60 130 200 30 330 36 C470 42 590 140 584 280 C578 410 470 470 320 470 C170 470 60 410 60 280 Z" fill={GREY_2} />
        <circle cx={600} cy={300} r={7} fill={ORANGE_MID} />
        <circle cx={40} cy={300} r={7} fill={ORANGE_MID} />

        <g className="wa-anim wa-hub" style={hubStyle}>
          <Hub lit={lit} pulse={connected} breathing={done && !held && !reduced()} />
        </g>

        {/* beams: a quiet track, then a light that travels into the hub */}
        {SCENES.map((s, i) => {
          const on = connected > i;
          return (
            <g key={s.key} className="wa-anim" style={{ opacity: phase >= 4 ? 1 : 0 }}>
              <path d={s.beam} stroke={on ? ORANGE : '#C5C5C5'} strokeWidth={2.6} strokeLinecap="round" strokeDasharray="0 7" fill="none" className="wa-fade-stroke" />
              {on && !reduced() && (
                <path d={s.beam} pathLength={100} stroke={ORANGE} strokeWidth={4} strokeLinecap="round" fill="none" className="wa-beam" />
              )}
            </g>
          );
        })}

        {SCENES.map((s) => (
          <g key={s.key} className="wa-anim wa-slot" style={place(phase, s.enter, s.at)}>
            {s.node}
          </g>
        ))}
      </svg>
      <button type="button" className="wa-play" aria-label={moving ? 'Pause animation' : 'Play animation'} onClick={toggle}>
        {moving ? (
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
            <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
            <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
            <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.2-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="currentColor" />
          </svg>
        )}
      </button>
    </div>
  );
}
