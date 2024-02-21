const { Router } = require("express");
const postgres = require("@vercel/postgres");
const notes = require("./notes.route");

const r = Router({ mergeParams: true });

r.use("/:id", notes);

r.get("/", async (req, res) => {
  await createTables();
  const user = req.params.user;
  const { rows } =
    await postgres.sql`SELECT notes.id, notes.content FROM users LEFT JOIN notes ON users.id = notes."userId" WHERE users.name=${user}`;
  return res.json(Object.values(rows));
});

r.post("/", async (req, res) => {
  console.log("IN POST");
  console.log(req.body);
  await createTables();
  const user = req.params.user;
  const { content } = req.body;

  if (content) {
    /* create a new user if that user doesn't already exist */
    await postgres.sql`INSERT INTO users (name) VALUES (${user}) ON CONFLICT DO NOTHING`;

    /* get the id of the newly created user */
    const {
      rows: [{ id }],
    } = await postgres.sql`SELECT id FROM users WHERE users.name=${user}`;

    /* create a new note for that user */
    await postgres.sql`INSERT INTO notes (content, "userId") VALUES (${content}, ${id})`;

    return res.json("Successfully created note");
  } else {
    return res.json("Note NOT created since content is missing.");
  }
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
