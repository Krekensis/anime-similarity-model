import fs from "fs";
import readline from "readline";

const JSON_FILE = "./datasets/anime_db.json";
const JSONL_FILE = "./datasets/anime_db_multi.jsonl";
const OUTPUT_FILE = "./datasets/anime_db_enriched.json";

/**
 * 1. Build MAL URL -> tags map from JSONL
 */
async function buildTagsMap() {
  const tagsMap = new Map();

  const rl = readline.createInterface({
    input: fs.createReadStream(JSONL_FILE),
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (!line.trim()) continue;

    const obj = JSON.parse(line);

    if (!obj.sources || !obj.tags) continue;

    for (const src of obj.sources) {
      if (src.startsWith("https://myanimelist.net/anime/")) {
        tagsMap.set(src, obj.tags);
      }
    }
  }

  return tagsMap;
}

/**
 * 2. Enrich anime_db.json
 */
async function enrichAnimeDB() {
  console.log("Building tag lookup from JSONL...");
  const tagsMap = await buildTagsMap();
  console.log(`Loaded ${tagsMap.size} MAL → tags mappings`);

  const animeDB = JSON.parse(fs.readFileSync(JSON_FILE, "utf8"));

  let matched = 0;

  for (const anime of animeDB) {
    if (!anime.anime_id) continue;

    const malUrl = `https://myanimelist.net/anime/${anime.anime_id}`;
    const tags = tagsMap.get(malUrl);

    if (tags) {
      anime.themes = tags;
      matched++;
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(animeDB, null, 2));
  console.log(`Done. Updated ${matched} anime entries.`);
}

enrichAnimeDB().catch(console.error);
