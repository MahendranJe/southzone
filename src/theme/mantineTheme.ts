import { createTheme, MantineColorsTuple, rem } from "@mantine/core";

const railwayPurple: MantineColorsTuple = [
  "#f3f0ff",
  "#e5dbff",
  "#d0bfff",
  "#b197fc",
  "#9775fa",
  "#845ef7",
  "#7950f2",
  "#7048e8",
  "#6741d9",
  "#5f3dc4",
];

const railwayIndigo: MantineColorsTuple = [
  "#edf2ff",
  "#e0e7ff",
  "#c7d2fe",
  "#a5b4fc",
  "#818cf8",
  "#6c7ee8",
  "#667eea",
  "#5a6fd6",
  "#4f63c2",
  "#4356ae",
];

export const mantineTheme = createTheme({
  primaryColor: "railwayPurple",
  colors: {
    railwayPurple,
    railwayIndigo,
  },
  fontFamily: "var(--font-geist-sans), Inter, sans-serif",
  fontFamilyMonospace: "var(--font-geist-mono), monospace",
  headings: {
    fontFamily: "var(--font-geist-sans), Inter, sans-serif",
    fontWeight: "700",
    sizes: {
      h1: { fontSize: rem(36) },
      h2: { fontSize: rem(28) },
      h3: { fontSize: rem(22) },
    },
  },
  defaultRadius: "md",
  shadows: {
    xs: "0 1px 3px rgba(102,126,234,0.08)",
    sm: "0 2px 8px rgba(102,126,234,0.12)",
    md: "0 4px 16px rgba(102,126,234,0.16)",
    lg: "0 8px 32px rgba(102,126,234,0.18)",
    xl: "0 16px 48px rgba(102,126,234,0.22)",
  },
  components: {
    Button: {
      defaultProps: {
        radius: "md",
      },
    },
    Card: {
      defaultProps: {
        radius: "lg",
        shadow: "sm",
      },
    },
    Paper: {
      defaultProps: {
        radius: "lg",
        shadow: "sm",
      },
    },
    Badge: {
      defaultProps: {
        radius: "sm",
      },
    },
    TextInput: {
      defaultProps: {
        radius: "md",
      },
    },
    PasswordInput: {
      defaultProps: {
        radius: "md",
      },
    },
    Select: {
      defaultProps: {
        radius: "md",
      },
    },
    Textarea: {
      defaultProps: {
        radius: "md",
      },
    },
    Notification: {
      defaultProps: {
        radius: "md",
      },
    },
  },
});
