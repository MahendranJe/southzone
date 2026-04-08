"use client";

import {
  Anchor,
  Box,
  Button,
  Center,
  Divider,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconLock, IconMail, IconTrain } from "@tabler/icons-react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: { email: "", password: "" },
    validate: {
      email: (v) => (v.trim().length < 3 ? "Enter your username or email" : null),
      password: (v) => (v.length < 6 ? "Password must be at least 6 characters" : null),
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    setLoading(true);
    const result = await signIn("credentials", {
      username: values.email,
      password: values.password,
      redirect: false,
    });
    setLoading(false);

    if (result?.error) {
      notifications.show({ title: "Login failed", message: "Invalid username or password", color: "red" });
    } else {
      notifications.show({ title: "Welcome back!", message: "Login successful", color: "green" });
      router.push("/");
      router.refresh();
    }
  });

  return (
    <Box
      className="min-h-screen flex items-center justify-center py-16 px-4"
      style={{ background: "var(--railway-gradient)" }}
    >
      <Paper radius="xl" shadow="xl" p="xl" w="100%" maw={420}>
        <Center mb="lg">
          <ThemeIcon
            size={56}
            radius="xl"
            variant="gradient"
            gradient={{ from: "#667eea", to: "#764ba2", deg: 135 }}
          >
            <IconTrain size={28} />
          </ThemeIcon>
        </Center>

        <Title order={2} ta="center" mb={4}>
          Welcome Back
        </Title>
        <Text c="dimmed" ta="center" size="sm" mb="xl">
          Sign in to your Southzone Railway account
        </Text>

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="Username or Email"
              placeholder="Enter your username or email"
              leftSection={<IconMail size={16} />}
              {...form.getInputProps("email")}
            />
            <PasswordInput
              label="Password"
              placeholder="Enter your password"
              leftSection={<IconLock size={16} />}
              {...form.getInputProps("password")}
            />

            <Button
              type="submit"
              fullWidth
              size="md"
              radius="xl"
              variant="gradient"
              gradient={{ from: "#667eea", to: "#764ba2", deg: 135 }}
              loading={loading}
            >
              Sign In
            </Button>
          </Stack>
        </form>

        <Divider my="md" label="Don't have an account?" labelPosition="center" />

        <Group justify="center">
          <Anchor component={Link} href="/register" size="sm" fw={500} c="railwayPurple">
            Create a free account
          </Anchor>
        </Group>
      </Paper>
    </Box>
  );
}
