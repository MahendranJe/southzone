import { Box } from "@mantine/core";
import { TopNav } from "./TopNav";
import { Footer } from "./Footer";

interface MainLayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

export function MainLayout({ children, isAdmin = false }: MainLayoutProps) {
  return (
    <Box className="min-h-screen flex flex-col">
      <TopNav isAdmin={isAdmin} />
      <Box component="main" className="flex-1">
        {children}
      </Box>
      <Footer />
    </Box>
  );
}
