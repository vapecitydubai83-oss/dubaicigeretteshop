import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
  async redirects() {
    return [
      // removed 2026-11-06: no usable photo (owner)
      { source: "/product/buy-iqos-terea-purple-menthol-japan-berry-cooling-fusion", destination: "/category/iqos-terea", permanent: true },
      { source: "/product/heets-lono-unburned-herbal-stick", destination: "/category/iqos-terea", permanent: true },
      { source: "/product/heets-silver-selection", destination: "/category/iqos-terea", permanent: true },
      { source: "/product/iqos-terea-japan-fusion-menthol", destination: "/category/iqos-terea", permanent: true },
      { source: "/product/iqos-terea-japan-tropical-menthol", destination: "/category/iqos-terea", permanent: true },
      { source: "/product/iqos-terea-regular-japan", destination: "/category/iqos-terea", permanent: true },
      { source: "/product/iqos-terea-provence-pearl-kyrgyzstan", destination: "/category/vapes", permanent: true },
      { source: "/product/iqos-terea-twilight-pearl-kyrgyzstan", destination: "/category/vapes", permanent: true },
      { source: "/product/sprk-vapor-v4-pod-iced-watermelon", destination: "/category/vapes", permanent: true },
      { source: "/product/terea-zing-wave-kyrgyzstan-green-zing", destination: "/category/vapes", permanent: true },
      // duplicate listing retired 2026-11-06; same product
      {
        source: "/product/best-vaporesso-vibe-pod-kit-in",
        destination: "/product/vaporesso-vibe-pod-kit",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
