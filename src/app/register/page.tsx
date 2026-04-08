"use client";

import {
  Anchor,
  Box,
  Button,
  Center,
  Divider,
  Grid,
  Group,
  Paper,
  PasswordInput,
  Select,
  Stack,
  Stepper,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconMail, IconPhone, IconTrain, IconUser } from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";

const stateList = [
  "Tamil Nadu",
  "Karnataka",
  "Kerala",
  "Andhra Pradesh",
  "Telangana",
  "Maharashtra",
  "Delhi",
  "West Bengal",
];

const cityMap: Record<string, string[]> = {
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Trichy"],
  Karnataka: ["Bangalore", "Mysore", "Mangalore", "Hubli", "Belgaum"],
  Kerala: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati"],
  Telangana: ["Hyderabad", "Warangal", "Karimnagar"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik"],
  Delhi: ["New Delhi", "Dwarka", "Noida"],
  "West Bengal": ["Kolkata", "Howrah", "Siliguri"],
};

export default function RegisterPage() {
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      fullName: "",
      gender: "",
      state: "",
      city: "",
      email: "",
      phone: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
    validate: (values) => {
      if (active === 0) {
        return {
          fullName: values.fullName.trim().length < 2 ? "Full name is required" : null,
          gender: !values.gender ? "Select gender" : null,
          state: !values.state ? "Select state" : null,
          city: !values.city ? "Select city" : null,
        };
      }
      if (active === 1) {
        return {
          email: !/^\S+@\S+\.\S+$/.test(values.email) ? "Valid email required" : null,
          phone: values.phone.length < 10 ? "Valid phone number required" : null,
          username: values.username.trim().length < 3 ? "Username must be 3+ chars" : null,
        };
      }
      if (active === 2) {
        return {
          password: values.password.length < 6 ? "Password must be 6+ characters" : null,
          confirmPassword: values.confirmPassword !== values.password ? "Passwords do not match" : null,
        };
      }
      return {};
    },
  });

  const nextStep = () => {
    const result = form.validate();
    if (!result.hasErrors) setActive((a) => Math.min(a + 1, 3));
  };

  const prevStep = () => setActive((a) => Math.max(a - 1, 0));

  const handleSubmit = async () => {
    const result = form.validate();
    if (!result.hasErrors) {
      setLoading(true);
      try {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: form.values.fullName,
            email: form.values.email,
            username: form.values.username,
            password: form.values.password,
            phone: form.values.phone,
            gender: form.values.gender,
            state: form.values.state,
            city: form.values.city,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          notifications.show({ title: "Registration failed", message: data.error ?? "Please try again", color: "red" });
        } else {
          notifications.show({ title: "Registration Successful!", message: "Welcome to Southzone Railway Update 🎉", color: "green" });
          setActive(3);
        }
      } catch {
        notifications.show({ title: "Error", message: "Network error, please try again", color: "red" });
      } finally {
        setLoading(false);
      }
    }
  };

  const cities = cityMap[form.values.state] ?? [];

  return (
    <Box
      className="min-h-screen flex items-center justify-center py-16 px-4"
      style={{ background: "var(--railway-gradient)" }}
    >
      <Paper radius="xl" shadow="xl" p="xl" w="100%" maw={520}>
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
        <Title order={2} ta="center" mb={4}>Create Account</Title>
        <Text c="dimmed" ta="center" size="sm" mb="xl">
          Join Southzone Railway Update for free
        </Text>

        <Stepper active={active} color="railwayPurple" size="sm" mb="xl">
          <Stepper.Step label="Profile" description="Personal info" />
          <Stepper.Step label="Contact" description="Email & phone" />
          <Stepper.Step label="Security" description="Set password" />
          <Stepper.Completed>
            <Center mt="xl">
              <Stack align="center" gap="md">
                <ThemeIcon size={64} radius="xl" color="green" variant="light">
                  <IconUser size={32} />
                </ThemeIcon>
                <Title order={3}>Account Created!</Title>
                <Text c="dimmed" ta="center">
                  Your free account is ready. Start tracking your trains.
                </Text>
                <Button
                  component={Link}
                  href="/login"
                  size="md"
                  radius="xl"
                  variant="gradient"
                  gradient={{ from: "#667eea", to: "#764ba2", deg: 135 }}
                >
                  Sign In Now
                </Button>
              </Stack>
            </Center>
          </Stepper.Completed>
        </Stepper>

        {active === 0 && (
          <Stack gap="md">
            <TextInput
              label="Full Name"
              placeholder="Your full name"
              leftSection={<IconUser size={16} />}
              {...form.getInputProps("fullName")}
            />
            <Select
              label="Gender"
              placeholder="Select gender"
              data={["Male", "Female", "Other", "Prefer not to say"]}
              {...form.getInputProps("gender")}
            />
            <Grid gutter="md">
              <Grid.Col span={6}>
                <Select
                  label="State"
                  placeholder="Select state"
                  data={stateList}
                  searchable
                  {...form.getInputProps("state")}
                  onChange={(v) => {
                    form.setFieldValue("state", v ?? "");
                    form.setFieldValue("city", "");
                  }}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Select
                  label="City"
                  placeholder="Select city"
                  data={cities}
                  searchable
                  disabled={!form.values.state}
                  {...form.getInputProps("city")}
                />
              </Grid.Col>
            </Grid>
          </Stack>
        )}

        {active === 1 && (
          <Stack gap="md">
            <TextInput
              label="Email Address"
              placeholder="your@email.com"
              leftSection={<IconMail size={16} />}
              {...form.getInputProps("email")}
            />
            <TextInput
              label="Phone Number"
              placeholder="+91 XXXXX XXXXX"
              leftSection={<IconPhone size={16} />}
              {...form.getInputProps("phone")}
            />
            <TextInput
              label="Username"
              placeholder="Choose a username"
              leftSection={<IconUser size={16} />}
              {...form.getInputProps("username")}
            />
          </Stack>
        )}

        {active === 2 && (
          <Stack gap="md">
            <PasswordInput
              label="Password"
              placeholder="Min 6 characters"
              description="Must include uppercase, number"
              {...form.getInputProps("password")}
            />
            <PasswordInput
              label="Confirm Password"
              placeholder="Repeat your password"
              {...form.getInputProps("confirmPassword")}
            />
          </Stack>
        )}

        {active < 3 && (
          <Group justify="space-between" mt="xl">
            <Button
              variant="subtle"
              color="gray"
              onClick={prevStep}
              disabled={active === 0}
              radius="xl"
            >
              Back
            </Button>
            {active < 2 ? (
              <Button
                onClick={nextStep}
                radius="xl"
                variant="gradient"
                gradient={{ from: "#667eea", to: "#764ba2", deg: 135 }}
              >
                Next Step
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                radius="xl"
                variant="gradient"
                gradient={{ from: "#667eea", to: "#764ba2", deg: 135 }}
                loading={loading}
              >
                Create Account
              </Button>
            )}
          </Group>
        )}

        {active < 3 && (
          <>
            <Divider my="md" label="Already have an account?" labelPosition="center" />
            <Group justify="center">
              <Anchor component={Link} href="/login" size="sm" fw={500} c="railwayPurple">
                Sign in here
              </Anchor>
            </Group>
          </>
        )}
      </Paper>
    </Box>
  );
}
