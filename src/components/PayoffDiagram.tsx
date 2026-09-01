import React from 'react';
import { View } from 'react-native';
import Svg, { Line, Polygon, Polyline, Text as SvgText } from 'react-native-svg';
import { Point } from '../lib/payoff';
import { color, type } from '../theme';

interface Props {
  points: Point[];
  domain: [number, number];
  width?: number;
  height?: number;
  /** Sparkline mode: tight padding, thinner stroke, no axis labels. For the
   * strategy-library rows where the shape is the only thing that matters. */
  compact?: boolean;
}

const PADDING = { top: 16, right: 16, bottom: 24, left: 16 };
const COMPACT_PADDING = { top: 5, right: 5, bottom: 5, left: 5 };

export default function PayoffDiagram({ points, domain, width = 320, height = 190, compact }: Props) {
  const pad = compact ? COMPACT_PADDING : PADDING;
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const pnlValues = points.map((p) => p.pnl);
  const maxAbsPnl = Math.max(Math.abs(Math.min(...pnlValues)), Math.abs(Math.max(...pnlValues)), 1);
  const yMin = -maxAbsPnl * 1.15;
  const yMax = maxAbsPnl * 1.15;

  const xForPrice = (price: number) => pad.left + ((price - domain[0]) / (domain[1] - domain[0])) * innerW;
  const yForPnl = (pnl: number) => pad.top + ((yMax - pnl) / (yMax - yMin)) * innerH;

  const zeroY = yForPnl(0);
  const linePoints = points.map((p) => `${xForPrice(p.price)},${yForPnl(p.pnl)}`).join(' ');

  // Area fill from the curve down/up to the zero line, so profit/loss regions
  // read at a glance without needing to trace the line.
  const areaPoints = [
    `${xForPrice(points[0].price)},${zeroY}`,
    ...points.map((p) => `${xForPrice(p.price)},${yForPnl(p.pnl)}`),
    `${xForPrice(points[points.length - 1].price)},${zeroY}`,
  ].join(' ');

  return (
    <View>
      <Svg width={width} height={height}>
        <Polygon points={areaPoints} fill={color.ink} fillOpacity={0.06} />
        <Line
          x1={pad.left}
          y1={zeroY}
          x2={width - pad.right}
          y2={zeroY}
          stroke={color.inkFaint}
          strokeWidth={1}
          strokeDasharray={compact ? '2,3' : '3,4'}
        />
        <Polyline
          points={linePoints}
          fill="none"
          stroke={color.ink}
          strokeWidth={compact ? 1.75 : 2.5}
          strokeLinejoin="round"
        />
        {!compact && (
          <>
            <SvgText x={pad.left} y={height - 6} fontSize={11} fontFamily={type.mono} fill={color.inkFaint}>
              {`$${domain[0].toFixed(0)}`}
            </SvgText>
            <SvgText
              x={width - pad.right}
              y={height - 6}
              fontSize={11}
              fontFamily={type.mono}
              fill={color.inkFaint}
              textAnchor="end"
            >
              {`$${domain[1].toFixed(0)}`}
            </SvgText>
          </>
        )}
      </Svg>
    </View>
  );
}
