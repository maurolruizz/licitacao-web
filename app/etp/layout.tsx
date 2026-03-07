/** Segment config: evita prerender estático. Esta rota depende de query (id, regime) e localStorage em runtime. */
export const dynamic = 'force-dynamic';

export default function EtpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
