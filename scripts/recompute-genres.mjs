// Recomputes every catalog work's genres with the current mapping in src/lib/catalog/genres.ts.
// Works matched to Open Library missing stored subjects get them fetched first.
// Usage: npm run catalog:genres            (writes changes)
//        npm run catalog:genres -- --dry   (prints what would change)
import { config } from "dotenv";
import postgres from "postgres";
import { normalizeGenres } from "../src/lib/catalog/genres.ts";

config({ path: [".env.local", ".env"] });
const dry = process.argv.includes("--dry");
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
const USER_AGENT = `Shelfie/0.1 (${process.env.OPENLIBRARY_CONTACT ?? "https://github.com/divyadhimaan/shelfie"})`;

async function fetchSubjects(olWorkId) {
  const response = await fetch(`https://openlibrary.org/works/${olWorkId}.json`, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Open Library ${response.status}`);
  const work = await response.json();
  return work.subjects ?? [];
}

const works = await sql`
  select w.id, w.title, w.ol_work_id, w.subjects, w.genres,
    coalesce((select array_agg(distinct t) from user_books ub, unnest(ub.tags) t where ub.work_id = w.id), '{}') as shelves
  from works w order by w.title`;

let changed = 0;
for (const work of works) {
  let subjects = work.subjects;
  if (subjects.length === 0 && work.ol_work_id) {
    try {
      subjects = await fetchSubjects(work.ol_work_id);
      if (!dry) await sql`update works set subjects = ${subjects} where id = ${work.id}`;
    } catch (error) {
      console.warn(`  skipped subjects for "${work.title}": ${error.message}`);
    }
  }
  const genres = normalizeGenres(subjects, work.shelves);
  if (genres.join("|") !== work.genres.join("|")) {
    changed++;
    console.log(
      `${work.title}: ${work.genres.join(", ") || "(none)"}  ->  ${genres.join(", ") || "(none)"}`,
    );
    if (!dry) await sql`update works set genres = ${genres} where id = ${work.id}`;
  }
}
console.log(`\n${changed} of ${works.length} works ${dry ? "would change" : "updated"}.`);
await sql.end();
