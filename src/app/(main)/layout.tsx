// (main) route group — uses the MainLayout with auth awareness
// In production this would check session/cookie and redirect to /login if not authenticated
export default function MainGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
