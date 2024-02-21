const express = require("express");
const postgres = require("@vercel/postgres");
const cors = require("cors");
/* const { v4 } = require("uuid"); */
const user = require("./routes/user.route");

const app = express();

app.use("/:user", user);
app.use(cors());

app.get("/:id", async (req, res) => {
  await createTables();
  const id = req.params.id;
  const { rows } = await postgres.sql`SELECT * FROM notes WHERE id=${id}`;

  if (!rows.length) {
    return res.json({ error: "note not found" });
  }

  return res.json(rows[0]);
});

app.put("/:id", async (req, res) => {
  await createTables();
  const id = req.params.id;
  const { content } = JSON.parse(req.body);

  const { rowCount } =
    await postgres.sql`UPDATE notes SET content = ${content} WHERE id=${id}`;

  if (!rowCount) {
    return res.json({ error: "note not found" });
  }

  return res.json("Successfully edited the note.");
});

app.delete("/:id", async (req, res) => {
  await createTables();
  const id = req.params.id;

  const { rowCount } = await postgres.sql`DELETE FROM notes WHERE id=${id}`;

  if (!rowCount) {
    return res.json({ error: "note not found" });
  }

  return res.json("Successfully deleted the note.");
});

// default catch-all handler
app.all("*", (req, res) =>
  res.status(404).json({ message: "route not defined" })
);

/* app.get("/api", (req, res) => {
  const path = `/api/item/${v4()}`;
  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "s-max-age=1, stale-while-revalidate");
  res.end(`Hello! Go to item: <a href="${path}">${path}</a>`);
});

app.get("/api/item/:slug", (req, res) => {
  const { slug } = req.params;
  res.end(`Item: ${slug}`);
}); */

module.exports = app;

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
