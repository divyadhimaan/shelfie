/** @type {import('next').NextConfig} */
const nextConfig = {
  sassOptions: {
    compiler: "modern",
    silenceDeprecations: ["legacy-js-api"],
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
