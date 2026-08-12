import React from 'react';
import Svg, { Rect } from 'react-native-svg';

export function Logo({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Rect x={4} y={4} width={14} height={14} rx={2.5} fill="#4f8ef7" />
      <Rect x={22} y={4} width={14} height={14} rx={2.5} fill="#4f8ef7" opacity={0.45} />
      <Rect x={4} y={22} width={14} height={14} rx={2.5} fill="#4f8ef7" opacity={0.45} />
      <Rect x={22} y={22} width={14} height={14} rx={2.5} fill="#4f8ef7" opacity={0.2} />
    </Svg>
  );
}
