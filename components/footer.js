const remingoatLinks = [
  {
    url: "https://theremingoat.com",
    name: "TheRemingoat.com",
  },
  {
    url: "https://www.patreon.com/theremingoat",
    name: "Patreon",
  },
];

const projectLinks = [
  {
    url: "https://milktooth.nu",
    name: "Milktooth",
  },
  {
    url: "https://github.com/k-milktooth/remingoat-gpt/",
    name: "Source code",
  },
  {
    url: "https://discord.gg/hrDW39FpHx",
    name: "Discord",
  },
  {
    url: "https://donate.stripe.com/fZebME240bbcf0A5kD",
    name: "Support this project",
  },
];

export default function Footer() {
  return (
    <footer className="mt-4 grid grid-cols-2 py-4 text-sm font-semibold">
      <div>
        <div className="grid gap-1">
          {remingoatLinks.map((link) => (
            <a
              key={link.url}
              href={link.url}
              className="hover:opacity-50"
              target="_blank"
            >
              {link.name} ↗
            </a>
          ))}
        </div>
      </div>
      <div>
        <div className="grid gap-1 justify-self-end text-right">
          {projectLinks.map((link) => (
            <a
              key={link.url}
              href={link.url}
              className="hover:opacity-50"
              target="_blank"
            >
              {link.name} ↗
            </a>
          ))}
        </div>
      </div>

      <div className="justify-self-end"></div>
    </footer>
  );
}
