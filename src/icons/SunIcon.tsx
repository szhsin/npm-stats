import React from 'react';

export const SunIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({
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
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);
