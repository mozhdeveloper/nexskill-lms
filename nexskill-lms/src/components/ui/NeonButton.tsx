import React from 'react';

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost';
    children: React.ReactNode;
}

const NeonButton: React.FC<NeonButtonProps> = ({
    variant = 'primary',
    children,
    className = '',
    ...props
}) => {
    const baseStyles = "px-6 py-2 rounded-full font-semibold transition-all duration-300 transform active:scale-95";

    const variants = {
        primary: `
      bg-gradient-to-r from-[color:var(--color-brand-neon)] to-[color:var(--color-brand-electric)]
      text-[color:var(--text-on-neon)] shadow-[0_0_15px_rgba(34,197,94,0.4)]
      hover:shadow-[0_0_25px_rgba(34,197,94,0.6)] hover:brightness-110
    `,
        secondary: `
      bg-transparent border-2 border-[color:var(--color-brand-electric)] text-[color:var(--color-brand-electric)]
      hover:bg-[color:var(--color-brand-electric)] hover:text-white
      hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]
    `,
        ghost: `
      bg-transparent text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]
      hover:bg-[var(--bg-secondary)]
    `
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default NeonButton;
