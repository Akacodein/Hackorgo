const KNOWN_PLATFORMS: Record<string, string> = {
  "unstop.com": "Unstop",
  "hack2skill.com": "Hack2Skill",
  "hackquest.io": "HackQuest",
  "devfolio.co": "Devfolio",
  "devpost.com": "Devpost",
  "mlh.io": "MLH",
};

export function derivePlatform(link: string): { name: string; domain: string } {
  let hostname: string;
  try {
    hostname = new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return { name: "Other", domain: "" };
  }

  if (KNOWN_PLATFORMS[hostname]) {
    return { name: KNOWN_PLATFORMS[hostname], domain: hostname };
  }

  // Unknown platform — turn "example-events.com" into "Example Events"
  // so there's still a sensible label instead of a raw domain.
  const label = hostname.split(".")[0].replace(/[-_]/g, " ");
  const name = label.replace(/\b\w/g, (c) => c.toUpperCase());
  return { name, domain: hostname };
}
