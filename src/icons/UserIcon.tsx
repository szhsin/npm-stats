import React from 'react';

export const UserIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({
  width = 16,
  height = 16,
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
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
