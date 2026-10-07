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
      // Goodreads exports with long reviews can be several MB (limit enforced again in the action).
      bodySizeLimit: "11mb",
    },
  },
};

export default nextConfig;
