import React from 'react';

export const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({
  width = 18,
  height = 18,
  stroke = 'currentColor',
  strokeWidth = 2,
  fill = 'none',
  viewBox = '0 0 24 24',
  ...props
}) => (
  <svg
    width={width}
    height={height}
    viewBox={viewBox}
    fill={fill}
    stroke={stroke}
    strokeWidth={strokeWidth}
    {...props}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
