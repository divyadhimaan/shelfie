// Used in meta tags and schema. Set NEXT_PUBLIC_SITE_URL once there's a custom domain;
// until then Vercel's production URL is used, and localhost in development.
const baseURL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

const description =
  "Track your reading, import your Goodreads history, and share your Year in Books as Instagram-ready cards.";

// metadata for pages
const meta = {
  home: {
    path: "/",
    title: "Shelfie — your year in books",
    description,
    robots: "index,follow",
  },
  library: { path: "/library", title: "Library · Shelfie", description },
  import: { path: "/import", title: "Import from Goodreads · Shelfie", description },
  stats: { path: "/stats", title: "Reading stats · Shelfie", description },
  wrap: { path: "/wrap", title: "Year Shelfie · Shelfie", description },
};

// default schema data
const schema = {
  logo: "",
  type: "Organization",
  name: "Shelfie",
  description,
  email: "",
};

export { meta, schema, baseURL };
