import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'on-dark';
  size?: 'lg' | 'md' | 'sm';
  children: React.ReactNode;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
    let baseClass = 'button-primary-tech';
    if (variant === 'secondary') baseClass = 'button-outline-tech';
    if (variant === 'on-dark') baseClass = 'button-outline-tech';

    // In a full implementation, we'd handle sizes and exact CSS mappings better
    return (
      <button ref={ref} className={`${baseClass} size-${size} ${className}`} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
