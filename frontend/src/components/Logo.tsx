import React from 'react';

export const Logo = ({ size = 24, color = "#FFFFFF" }: { size?: number, color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4L16 28L19 22L10 4H4Z" fill={color} opacity="0.6" />
    <path d="M28 4L16 28L13 22L22 4H28Z" fill={color} opacity="0.9" />
    <path d="M16 28L20 20H12L16 28Z" fill={color} opacity="1" />
  </svg>
);
