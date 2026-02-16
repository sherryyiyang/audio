const http = require("http");
const fs = require("fs");
const path = require("path");
const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  if (req.url === "/" || req.url === "/index.html") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(fs.readFileSync(path.join(__dirname, "index.html")));
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

const wss = new WebSocketServer({ server });
const clients = new Set();

wss.on("connection", (ws) => {
  if (clients.size >= 2) {
    ws.close(1013, "Room is full");
    return;
  }

  clients.add(ws);
  console.log(`User joined (${clients.size}/2)`);
  broadcast({ type: "count", count: clients.size });

  ws.on("message", (data) => {
    for (const client of clients) {
      if (client !== ws && client.readyState === 1) {
        client.send(data.toString());
      }
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log(`User left (${clients.size}/2)`);
    broadcast({ type: "count", count: clients.size });
  });
});

function broadcast(msg) {
  const data = JSON.stringify(msg);
  for (const client of clients) {
    if (client.readyState === 1) client.send(data);
  }
}

server.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
