/** @type {import('next').NextConfig} */
const nextConfig = {
  sassOptions: {
    compiler: "modern",
    silenceDeprecations: ["legacy-js-api"],
  },
  // Share-card fonts are read from node_modules at runtime; make sure deployments include them.
  outputFileTracingIncludes: {
    "/api/wrap/**": ["./node_modules/@fontsource/fraunces/files/*.woff", "./node_modules/@fontsource/geist/files/*.woff"],
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "covers.openlibrary.org" }],
  },
  experimental: {
    serverActions: {
      // Just above the 4 MB file limit enforced in the action; Vercel caps bodies at 4.5 MB.
      bodySizeLimit: "4.5mb",
    },
  },
};

export default nextConfig;
