import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["nodemailer"],
  },
  async redirects() {
    // Page routes only — do not catch /api/fleet/*
    const partnerPages = [
      "signup",
      "dashboard",
      "assign",
      "drivers",
      "bookings",
      "payments",
      "settings",
    ];

    return [
      {
        source: "/fleet",
        destination: "/partner",
        permanent: true,
      },
      {
        source: "/fleet-onboarding",
        destination: "/partner",
        permanent: true,
      },
      ...partnerPages.map((page) => ({
        source: `/fleet/${page}`,
        destination: `/partner/${page}`,
        permanent: true,
      })),
      ...partnerPages.map((page) => ({
        source: `/fleet/${page}/:path*`,
        destination: `/partner/${page}/:path*`,
        permanent: true,
      })),
    ];
  },
};

export default withPWA(nextConfig);
