import fs from "fs";

const INPUT = "./datasets/anime_db_enriched.json";
const OUTPUT = "./datasets/anime_db_enriched_compact.json";

const data = JSON.parse(fs.readFileSync(INPUT, "utf8"));

const stream = fs.createWriteStream(OUTPUT);
stream.write("[\n");

data.forEach((obj, i) => {
  stream.write(JSON.stringify(obj));
  if (i !== data.length - 1) {
    stream.write(",\n");
  }
});

stream.write("\n]");
stream.end();

console.log("Done: one object per line, valid JSON.");
