"use client";

import { Badge, Group, Text } from "@mantine/core";
import { useEffect, useState } from "react";

export function TatkalTimer() {
  const [timeLeft, setTimeLeft] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();

      // Tatkal booking: 10:00 AM for mail/express trains
      let targetHour = 10;
      let label = "Tatkal Opens at 10:00 AM";

      if (hours >= 10) {
        targetHour = 11; // next day scenario approximation
        label = "Tatkal Open Now!";
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }

      const targetSeconds = targetHour * 3600;
      const currentSeconds = hours * 3600 + minutes * 60 + seconds;
      const diff = targetSeconds - currentSeconds;

      if (diff <= 0) {
        setTimeLeft(label);
        return;
      }

      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setTimeLeft(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <Group gap="xs">
      <Badge
        color={isOpen ? "green" : "orange"}
        variant="filled"
        size="sm"
        radius="sm"
      >
        Tatkal
      </Badge>
      <Text size="xs" fw={600} c={isOpen ? "green" : "orange"}>
        {isOpen ? "OPEN NOW" : `Opens in ${timeLeft}`}
      </Text>
    </Group>
  );
}
