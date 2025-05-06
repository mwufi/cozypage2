import { Space_Mono, Orbitron } from 'next/font/google';

const spaceMono = Space_Mono({
    weight: ['400', '700'],
    subsets: ['latin'],
    variable: '--font-space-mono',
});

const orbitron = Orbitron({
    weight: ['400', '500', '600', '700', '800', '900'],
    subsets: ['latin'],
    variable: '--font-orbitron',
});

export default function DemoLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className={`${spaceMono.variable} ${orbitron.variable}`}>
            {children}
        </div>
    );
} 