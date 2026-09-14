import React from "react";

export const MoonIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({
  width = 16,
  height = 16,
  stroke = "currentColor",
  strokeWidth = 2,
  fill = "none",
  viewBox = "0 0 24 24",
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
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);
