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
}

const PADDING = { top: 16, right: 16, bottom: 24, left: 16 };

export default function PayoffDiagram({ points, domain, width = 320, height = 190 }: Props) {
  const innerW = width - PADDING.left - PADDING.right;
  const innerH = height - PADDING.top - PADDING.bottom;

  const pnlValues = points.map((p) => p.pnl);
  const maxAbsPnl = Math.max(Math.abs(Math.min(...pnlValues)), Math.abs(Math.max(...pnlValues)), 1);
  const yMin = -maxAbsPnl * 1.15;
  const yMax = maxAbsPnl * 1.15;

  const xForPrice = (price: number) =>
    PADDING.left + ((price - domain[0]) / (domain[1] - domain[0])) * innerW;
  const yForPnl = (pnl: number) => PADDING.top + ((yMax - pnl) / (yMax - yMin)) * innerH;

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
          x1={PADDING.left}
          y1={zeroY}
          x2={width - PADDING.right}
          y2={zeroY}
          stroke={color.inkFaint}
          strokeWidth={1}
          strokeDasharray="3,4"
        />
        <Polyline points={linePoints} fill="none" stroke={color.ink} strokeWidth={2.5} strokeLinejoin="round" />
        <SvgText x={PADDING.left} y={height - 6} fontSize={11} fontFamily={type.mono} fill={color.inkFaint}>
          {`$${domain[0].toFixed(0)}`}
        </SvgText>
        <SvgText
          x={width - PADDING.right}
          y={height - 6}
          fontSize={11}
          fontFamily={type.mono}
          fill={color.inkFaint}
          textAnchor="end"
        >
          {`$${domain[1].toFixed(0)}`}
        </SvgText>
      </Svg>
    </View>
  );
}
