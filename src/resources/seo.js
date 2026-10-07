// IMPORTANT: Replace with the production domain once it's registered - it's used in meta tags and schema
const baseURL = "https://shelfie.app";

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
