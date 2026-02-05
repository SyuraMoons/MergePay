import { AppLayout } from '@/components/layout/AppLayout';

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
