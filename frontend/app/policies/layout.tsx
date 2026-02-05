import { AppLayout } from '@/components/layout/AppLayout';

export default function PoliciesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
