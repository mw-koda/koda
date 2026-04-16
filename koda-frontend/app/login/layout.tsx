import '../globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'KODA - Login',
  description: 'Login to KODA',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}
