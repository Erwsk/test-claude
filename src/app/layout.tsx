import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "ArtiDevis — devis et factures pour artisans",
  description:
    "Créez vos devis sur le chantier, transformez-les en facture en un clic et suivez vos règlements.",
};

const NAVIGATION = [
  { href: "/", label: "Tableau de bord", icone: "▦" },
  { href: "/devis", label: "Devis", icone: "✎" },
  { href: "/factures", label: "Factures", icone: "€" },
  { href: "/clients", label: "Clients", icone: "☺" },
  { href: "/parametres", label: "Réglages", icone: "⚙" },
] as const;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col md:flex-row">
          <header className="sans-impression border-b border-ardoise-200 bg-white px-4 py-3 md:w-56 md:shrink-0 md:border-r md:border-b-0 md:py-6">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="grid size-8 place-items-center rounded-lg bg-chantier-500 text-white">
                A
              </span>
              ArtiDevis
            </Link>
            <nav className="mt-6 hidden md:block">
              <ul className="space-y-1">
                {NAVIGATION.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ardoise-600 hover:bg-ardoise-100 hover:text-ardoise-900"
                    >
                      <span aria-hidden className="w-4 text-center">
                        {item.icone}
                      </span>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </header>

          <main className="flex-1 px-4 pt-6 pb-24 md:px-8 md:pb-10">{children}</main>

          {/* Barre de navigation basse : sur un chantier, on tient le téléphone d'une main. */}
          <nav className="sans-impression fixed inset-x-0 bottom-0 border-t border-ardoise-200 bg-white md:hidden">
            <ul className="flex">
              {NAVIGATION.map((item) => (
                <li key={item.href} className="flex-1">
                  <Link
                    href={item.href}
                    className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-ardoise-600"
                  >
                    <span aria-hidden className="text-base">
                      {item.icone}
                    </span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </body>
    </html>
  );
}
