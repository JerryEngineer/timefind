import express from "express";
import { customAlphabet } from "nanoid";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import http from "node:http";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { WebSocketServer, WebSocket } from "ws";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const PORT = 3001;

// nanoid's default URL-safe alphabet, at 6 chars: 64^6 (~68.7B) combinations
const generateId = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_", 6);

await fs.mkdir(DATA_DIR, { recursive: true });

function eventPath(id) {
  return path.join(DATA_DIR, `${id}.json`);
}

async function readEvent(id) {
  try {
    const raw = await fs.readFile(eventPath(id), "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}

async function writeEvent(event) {
  await fs.writeFile(eventPath(event.id), JSON.stringify(event, null, 2));
}

async function generateUniqueId() {
  let id = generateId();
  while (await readEvent(id)) {
    id = generateId();
  }
  return id;
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const hashBuffer = Buffer.from(hash, "hex");
  const suppliedBuffer = scryptSync(password, salt, 64);
  return hashBuffer.length === suppliedBuffer.length && timingSafeEqual(hashBuffer, suppliedBuffer);
}

/** Strips the password hash before an event is ever sent to a client. */
function toPublicEvent(event) {
  const { passwordHash, ...rest } = event;
  return { ...rest, hasPassword: Boolean(passwordHash) };
}

/** Sends a 401 and returns false if the event is password-protected and the request doesn't prove access. */
function checkAccess(req, res, event) {
  if (!event.passwordHash) return true;
  const supplied = req.get("X-Event-Password");
  if (!supplied || !verifyPassword(supplied, event.passwordHash)) {
    res.status(401).json({ error: "Password required", passwordProtected: true });
    return false;
  }
  return true;
}

const app = express();
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });
const rooms = new Map(); // eventId -> Set<WebSocket>

wss.on("connection", async (ws, req) => {
  const url = new URL(req.url, "http://localhost");
  const eventId = url.searchParams.get("eventId");
  const event = eventId ? await readEvent(eventId) : null;
  if (!event) {
    ws.close();
    return;
  }
  if (event.passwordHash) {
    const supplied = url.searchParams.get("password");
    if (!supplied || !verifyPassword(supplied, event.passwordHash)) {
      ws.close();
      return;
    }
  }

  if (!rooms.has(eventId)) rooms.set(eventId, new Set());
  rooms.get(eventId).add(ws);

  ws.on("close", () => {
    const room = rooms.get(eventId);
    room?.delete(ws);
    if (room && room.size === 0) rooms.delete(eventId);
  });
});

function broadcast(eventId, event) {
  const room = rooms.get(eventId);
  if (!room) return;
  const payload = JSON.stringify(toPublicEvent(event));
  for (const client of room) {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  }
}

function isValidDateRange(range) {
  return (
    range &&
    typeof range.start === "string" &&
    typeof range.end === "string" &&
    range.start <= range.end
  );
}

function dateInRanges(date, ranges) {
  return ranges.some((r) => date >= r.start && date <= r.end);
}

app.post("/api/events", async (req, res) => {
  const { title, description, dateRanges, password } = req.body ?? {};
  if (!title || !Array.isArray(dateRanges) || dateRanges.length === 0 || !dateRanges.every(isValidDateRange)) {
    return res.status(400).json({ error: "title and a non-empty list of valid dateRanges are required" });
  }

  const id = await generateUniqueId();
  const event = {
    id,
    title,
    description: typeof description === "string" ? description : "",
    dateRanges,
    passwordHash: typeof password === "string" && password !== "" ? hashPassword(password) : null,
    createdAt: new Date().toISOString(),
    people: [
      { id: generateId(), name: "Person 1", selectedDates: [] },
      { id: generateId(), name: "Person 2", selectedDates: [] },
    ],
  };
  await writeEvent(event);
  res.status(201).json(toPublicEvent(event));
});

app.get("/api/events/:id", async (req, res) => {
  const event = await readEvent(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  if (!checkAccess(req, res, event)) return;
  res.json(toPublicEvent(event));
});

const MAX_PEOPLE = 50;

app.post("/api/events/:id/people", async (req, res) => {
  const event = await readEvent(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  if (!checkAccess(req, res, event)) return;

  if (event.people.length >= MAX_PEOPLE) {
    return res.status(400).json({ error: `An event can have at most ${MAX_PEOPLE} people` });
  }

  event.people.push({ id: generateId(), name: `Person ${event.people.length + 1}`, selectedDates: [] });
  await writeEvent(event);
  broadcast(req.params.id, event);
  res.status(201).json(toPublicEvent(event));
});

app.put("/api/events/:id/people/:personId", async (req, res) => {
  const { name, selectedDates } = req.body ?? {};
  if (typeof name !== "string" || !Array.isArray(selectedDates)) {
    return res.status(400).json({ error: "name and selectedDates are required" });
  }

  const event = await readEvent(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  if (!checkAccess(req, res, event)) return;

  const index = event.people.findIndex((p) => p.id === req.params.personId);
  if (index === -1) return res.status(404).json({ error: "Person not found" });

  event.people[index] = { id: req.params.personId, name, selectedDates };
  await writeEvent(event);
  broadcast(req.params.id, event);
  res.json(toPublicEvent(event));
});

app.delete("/api/events/:id/people/:personId", async (req, res) => {
  const event = await readEvent(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  if (!checkAccess(req, res, event)) return;

  if (event.people.length <= 1) {
    return res.status(400).json({ error: "An event must have at least one person" });
  }

  const index = event.people.findIndex((p) => p.id === req.params.personId);
  if (index === -1) return res.status(404).json({ error: "Person not found" });

  event.people.splice(index, 1);
  await writeEvent(event);
  broadcast(req.params.id, event);
  res.json(toPublicEvent(event));
});

app.put("/api/events/:id", async (req, res) => {
  const { title, description, dateRanges, password, removePassword } = req.body ?? {};
  if (!title || !Array.isArray(dateRanges) || dateRanges.length === 0 || !dateRanges.every(isValidDateRange)) {
    return res.status(400).json({ error: "title and a non-empty list of valid dateRanges are required" });
  }

  const event = await readEvent(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  if (!checkAccess(req, res, event)) return;

  event.title = title;
  event.description = typeof description === "string" ? description : "";
  event.dateRanges = dateRanges;
  if (typeof password === "string" && password !== "") {
    event.passwordHash = hashPassword(password);
  } else if (removePassword === true) {
    event.passwordHash = null;
  }
  event.people = event.people.map((p) => ({
    ...p,
    selectedDates: p.selectedDates.filter((d) => dateInRanges(d, dateRanges)),
  }));
  await writeEvent(event);
  broadcast(req.params.id, event);
  res.json(toPublicEvent(event));
});

app.use(express.static(path.join(__dirname, "dist")));

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

server.listen(PORT, () => {
  console.log(`timefind api listening on http://localhost:${PORT}`);
});
