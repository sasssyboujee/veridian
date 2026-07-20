import React from 'react';

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'feature' | 'pricing' | 'pricing-featured' | 'dashboard' | 'cream-band';
  children: React.ReactNode;
};

export const Card: React.FC<CardProps> = ({ className = '', children, ...props }) => {
  const baseClass = 'card-tech';

  return (
    <div className={`${baseClass} ${className}`} {...props}>
      {children}
    </div>
  );
};
