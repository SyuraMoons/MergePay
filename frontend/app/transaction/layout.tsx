import { AppLayout } from '@/components/layout/AppLayout';

export default function TransactionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
