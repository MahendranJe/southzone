import {
  Anchor,
  Box,
  Container,
  Divider,
  Group,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import {
  IconBrandInstagram,
  IconBrandWhatsapp,
} from "@tabler/icons-react";
import Image from "next/image";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Train Updates", href: "/trains" },
  { label: "Alerts", href: "/alerts" },
  { label: "Notifications", href: "/notifications" },
];

export function Footer() {
  return (
    <Box
      component="footer"
      py={{ base: "md", md: "lg" }}
      mt="auto"
      style={{ background: "var(--railway-gradient)" }}
    >
      <Container size="xl">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          {/* Brand */}
          <Stack gap="xs" maw={300}>
            <Group gap="xs">
              <Image
                src="/logo.png"
                alt="Southzone Railway Update"
                width={36}
                height={36}
                style={{ borderRadius: "50%", objectFit: "cover" }}
              />
              <Text fw={800} c="white">
                Southzone Railway Update
              </Text>
            </Group>
            <Text size="sm" c="rgba(255,255,255,0.75)">
              Real-time train schedule updates and alerts for South Zone Railway passengers.
            </Text>
            {/* Social Links */}
            <Group gap="xs" mt={4}>
              <Anchor
                href="https://whatsapp.com/channel/0029Va6gl6EFcow4AOH5UC3i"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ThemeIcon
                  size="md"
                  radius="xl"
                  style={{ background: "rgba(255,255,255,0.15)", cursor: "pointer" }}
                >
                  <IconBrandWhatsapp size={16} color="white" />
                </ThemeIcon>
              </Anchor>
              <Anchor
                href="https://www.instagram.com/southzone_railwayupdate?igsh=MTFmbnczNGhzN2hmZQ=="
                target="_blank"
                rel="noopener noreferrer"
              >
                <ThemeIcon
                  size="md"
                  radius="xl"
                  style={{ background: "rgba(255,255,255,0.15)", cursor: "pointer" }}
                >
                  <IconBrandInstagram size={16} color="white" />
                </ThemeIcon>
              </Anchor>
            </Group>
          </Stack>

          {/* Quick Links */}
          <Stack gap="xs">
            <Text fw={600} size="sm" c="white">Quick Links</Text>
            {quickLinks.map((l) => (
              <Anchor
                key={l.label}
                href={l.href}
                size="sm"
                c="rgba(255,255,255,0.75)"
                underline="hover"
              >
                {l.label}
              </Anchor>
            ))}
          </Stack>

          {/* Follow Us */}
          <Stack gap="xs">
            <Text fw={600} size="sm" c="white">Follow Us</Text>
            <Anchor
              href="https://whatsapp.com/channel/0029Va6gl6EFcow4AOH5UC3i"
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              c="rgba(255,255,255,0.75)"
              underline="hover"
            >
              WhatsApp Channel
            </Anchor>
            <Anchor
              href="https://www.instagram.com/southzone_railwayupdate?igsh=MTFmbnczNGhzN2hmZQ=="
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              c="rgba(255,255,255,0.75)"
              underline="hover"
            >
              Instagram Page
            </Anchor>
          </Stack>
        </Group>

        <Divider my={10} color="rgba(255,255,255,0.2)" />
        <Text size="sm" fw={600} c="white" ta="center" mb={4}>
          This website is not affiliated with Indian Railways. Information is for reference only.
        </Text>
        <Text size="xs" c="rgba(255,255,255,0.6)" ta="center">
          © {new Date().getFullYear()} SouthzoneRailwayUpdate · 
        </Text>
      </Container>
    </Box>
  );
}

