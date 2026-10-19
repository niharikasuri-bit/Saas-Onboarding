/**
 * A person in the unDraw manner: slim, small head, long dark legs, the top in
 * an accent colour, no outlines except where white needs one. Drawn once in a
 * local frame (feet at 0,0, about 82 px tall at scale 1) so every joint lines
 * up at any zoom. Arms are two-segment strokes (shoulder, elbow, hand).
 */

export const INK = '#2F2E41'; // hair, trousers, shoes
export const DEVICE = '#3F3D56'; // device outlines
export const GREY = '#E6E6E6';
export const GREY_2 = '#F2F2F2';

export type Pose = 'down' | 'point' | 'inject' | 'clipboard' | 'certificate' | 'cheer';

export type FigureProps = {
  shirt: string;
  skin: string;
  hair: string;
  pose?: Pose;
  coat?: boolean;
  trousers?: string;
};

const ARMS: Record<Pose, { back: string; front: string; backHand: [number, number]; frontHand: [number, number] }> = {
  down: { back: 'M-6.6 -63 L-9 -52.5 L-8.6 -42.5', front: 'M6.6 -63 L9 -52.5 L8.6 -42.5', backHand: [-8.6, -41.6], frontHand: [8.6, -41.6] },
  point: { back: 'M-6.6 -63 L-9 -52.5 L-8.6 -42.5', front: 'M6.6 -63 L12.6 -56 L20.4 -59.6', backHand: [-8.6, -41.6], frontHand: [21.4, -60] },
  inject: { back: 'M6.6 -63 L9 -52.5 L8.6 -42.5', front: 'M-5.4 -62 L-10.4 -52.6 L-15.6 -44.6', backHand: [8.6, -41.6], frontHand: [-16.4, -44] },
  clipboard: { back: 'M-6.6 -63 L-9 -54 L-5.6 -49.6', front: 'M6.6 -63 L9 -54 L5.6 -49.6', backHand: [-5.4, -49.4], frontHand: [5.4, -49.4] },
  certificate: { back: 'M-6.6 -63 L-10.4 -55 L-9.6 -50', front: 'M6.6 -63 L10.4 -55 L9.6 -50', backHand: [-9.4, -49.6], frontHand: [9.4, -49.6] },
  // both arms up in a V, celebrating
  cheer: { back: 'M-6.6 -63 L-12.6 -71 L-16.4 -80.6', front: 'M6.6 -63 L12.6 -71 L16.4 -80.6', backHand: [-16.8, -81.6], frontHand: [16.8, -81.6] },
};

export function Figure({ shirt, skin, hair, pose = 'down', coat = false, trousers = INK }: FigureProps) {
  const top = coat ? '#FFFFFF' : shirt;
  const arm = ARMS[pose];
  const sleeve = (d: string) => (
    <>
      {coat && <path d={d} stroke="#D6D5D4" strokeWidth={5.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />}
      <path d={d} stroke={top} strokeWidth={coat ? 4.2 : 4.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  );
  return (
    <g>
      {/* back arm sits behind the body */}
      {sleeve(arm.back)}
      <circle cx={arm.backHand[0]} cy={arm.backHand[1]} r={2.2} fill={skin} />

      {/* shoes and trousers */}
      <path d="M-7.6 -0.2 C-7.6 -2.8 -6 -3.6 -4 -3.6 H-0.9 V-0.2 Z" fill={INK} />
      <path d="M7.6 -0.2 C7.6 -2.8 6 -3.6 4 -3.6 H0.9 V-0.2 Z" fill={INK} />
      <path d="M-6.2 -41.6 H6.2 L5.4 -3.2 H1.1 L0 -31 L-1.1 -3.2 H-5.4 Z" fill={trousers} />

      {/* slim torso with rounded shoulders */}
      <path d="M-8 -60.4 C-8 -64.4 -5.8 -66 -3 -66 H3 C5.8 -66 8 -64.4 8 -60.4 L7.2 -40.6 H-7.2 Z" fill={top} stroke={coat ? '#D6D5D4' : 'none'} strokeWidth={0.7} />
      {coat && (
        <>
          <path d="M-7.2 -41.4 L-8 -28.6 H8 L7.2 -41.4 Z" fill="#FFFFFF" stroke="#D6D5D4" strokeWidth={0.7} />
          <path d="M-2.8 -66 L0 -58.6 L2.8 -66 Z" fill={shirt} />
          <path d="M0 -58.6 V-28.6" stroke="#D6D5D4" strokeWidth={0.7} />
          <path d="M-3.6 -65.6 C-5.2 -60 -4.8 -55 -2.8 -52" stroke={DEVICE} strokeWidth={0.9} fill="none" strokeLinecap="round" />
          <circle cx={-2.6} cy={-51.2} r={1.4} fill={DEVICE} />
          <rect x={2.4} y={-55} width={3.6} height={2.8} rx={0.6} fill={GREY_2} stroke="#D6D5D4" strokeWidth={0.4} />
        </>
      )}

      {/* things held in front of the body */}
      {pose === 'clipboard' && (
        <>
          <rect x={-6} y={-59} width={12} height={15} rx={1.2} fill={DEVICE} />
          <rect x={-4.6} y={-57} width={9.2} height={11.6} rx={0.5} fill="#FFFFFF" />
          <path d="M-3 -53.6 H3 M-3 -51 H3 M-3 -48.4 H1" stroke={GREY} strokeWidth={0.9} strokeLinecap="round" />
        </>
      )}
      {pose === 'certificate' && (
        <>
          <rect x={-10.6} y={-61} width={21.2} height={15.4} rx={1} fill="#FFFFFF" stroke="#F2CDB8" strokeWidth={1.2} />
          <path d="M-7.4 -57.6 H5.6 M-7.4 -54.8 H1.4" stroke={GREY} strokeWidth={1} strokeLinecap="round" />
          <path d="M1.4 -50.2 L0.4 -46.8 L2 -47.6 L2.8 -46.2 L3.2 -49.4 M5 -50.2 L6 -46.8 L4.4 -47.6 L3.6 -46.2 L3.2 -49.4" fill="#C84C0E" />
          <circle cx={3.2} cy={-52} r={2.8} fill="#C84C0E" />
          <circle cx={3.2} cy={-52} r={1.6} fill="none" stroke="#FFFFFF" strokeWidth={0.5} />
        </>
      )}

      {/* front arm, then its hand on top */}
      {sleeve(arm.front)}
      <circle cx={arm.frontHand[0]} cy={arm.frontHand[1]} r={2.2} fill={skin} />
      {pose === 'inject' && (
        <g>
          <rect x={-27.8} y={-45.8} width={9.6} height={3.4} rx={0.7} fill="#FFFFFF" stroke="#0057BD" strokeWidth={0.7} />
          <rect x={-26.6} y={-45} width={4.6} height={1.8} fill="#0057BD" opacity={0.55} />
          <path d="M-18.2 -44.1 H-16.8 M-16.8 -46 V-42.2" stroke="#0057BD" strokeWidth={0.9} strokeLinecap="round" />
          <path d="M-27.8 -44.1 H-31.6" stroke="#6B7378" strokeWidth={0.6} strokeLinecap="round" />
        </g>
      )}

      {/* neck, head and hair */}
      <rect x={-1.8} y={-69.4} width={3.6} height={4.4} rx={1} fill={skin} />
      <circle cx={0} cy={-74.6} r={6.4} fill={skin} />
      <path d="M-6.7 -75 C-7.6 -82.6 -2.6 -83.6 0.4 -83.4 C4.6 -83.2 7.6 -80.8 6.7 -75 C5 -78 2.2 -79 -0.6 -78.6 C-3.4 -78.2 -5.4 -77 -6.7 -75 Z" fill={hair} />
    </g>
  );
}
