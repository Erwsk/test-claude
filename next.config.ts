import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vérifie à la compilation que chaque <Link href> pointe vers une route existante.
  typedRoutes: true,
};

export default nextConfig;
