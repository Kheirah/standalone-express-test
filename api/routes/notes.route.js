const { Router } = require("express");
const postgres = require("@vercel/postgres");

const r = Router({ mergeParams: true });

r.get("/", async (req, res) => {
  await createTables();
  const user = req.params.user;
  const id = req.params.id;
  const { rows } =
    await postgres.sql`SELECT notes.content FROM users LEFT JOIN notes ON users.id = notes."userId" WHERE users.name=${user} AND notes.id=${id}`;
  return res.json(Object.values(rows));
});

r.put("/", async (req, res) => {
  await createTables();
  const user = req.params.user;
  const notesId = req.params.id;
  const { content } = req.body;

  if (content) {
    /* first check to see if we can find the user */
    const {
      rows: [{ id }],
    } = await postgres.sql`SELECT id FROM users WHERE users.name=${user}`;

    /* then use that user's id to update the requested note */
    const { rowCount } =
      await postgres.sql`UPDATE notes SET content = ${content} WHERE notes."userId"=${id} AND notes.id=${notesId}`;

    if (!rowCount) {
      return res.json({ error: "note not found" });
    }

    return res.json("Successfully edited note");
  } else {
    return res.json("Note NOT created since content is missing.");
  }
});

r.delete("/", async (req, res) => {
  console.log("IN DELETE");
  await createTables();
  const user = req.params.user;
  const notesId = req.params.id;

  /* first check to see if we can find the user */
  const {
    rows: [{ id }],
  } = await postgres.sql`SELECT id FROM users WHERE users.name=${user}`;

  /* then use that user's id to delete the requested note */
  const { rowCount } =
    await postgres.sql`DELETE FROM notes WHERE notes."userId"=${id} AND notes.id=${notesId}`;

  if (!rowCount) {
    return res.json({ error: "note not found" });
  }

  return res.json("Successfully deleted note");
});

module.exports = r;

async function createTables() {
  await postgres.sql`
      CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
      `;
  await postgres.sql`
        CREATE TABLE IF NOT EXISTS notes (
            id SERIAL PRIMARY KEY,
            content VARCHAR(255) NOT NULL,
            "userId" integer REFERENCES users (id),
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
}
