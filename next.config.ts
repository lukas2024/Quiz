import type { NextConfig } from "next";

// Proxy handlera logowania Firebase na domenę aplikacji (Firebase:
// "redirect best practices"). Bez tego Chrome na iOS zapętla logowanie,
// bo handler działa na innej domenie (<projekt>.firebaseapp.com).
const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const nextConfig: NextConfig = {
  async rewrites() {
    if (!firebaseProjectId) {
      // Tylko nazwa zmiennej, nigdy wartość.
      console.warn(
        "Brak NEXT_PUBLIC_FIREBASE_PROJECT_ID – pomijam proxy /__/auth i /__/firebase.",
      );
      return [];
    }
    const firebaseHost = `https://${firebaseProjectId}.firebaseapp.com`;
    return [
      {
        source: "/__/auth/:path*",
        destination: `${firebaseHost}/__/auth/:path*`,
      },
      {
        source: "/__/firebase/:path*",
        destination: `${firebaseHost}/__/firebase/:path*`,
      },
    ];
  },
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
