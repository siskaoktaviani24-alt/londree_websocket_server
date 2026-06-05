const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = 3000;

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("owner:join", (data) => {
    const ownerId = data.ownerId;

    if (!ownerId) {
      console.log("owner:join gagal, ownerId kosong");
      return;
    }

    socket.join(`owner_${ownerId}`);
    console.log(`Owner ${ownerId} joined room owner_${ownerId}`);
  });

  socket.on("customer:join", (data) => {
    const customerId = data.customerId;

    if (!customerId) {
      console.log("customer:join gagal, customerId kosong");
      return;
    }

    socket.join(`customer_${customerId}`);
    console.log(`Customer ${customerId} joined room customer_${customerId}`);
  });

  socket.on("order:new", (data) => {
    console.log("Pesanan baru diterima:", data);

    const ownerId = data.ownerId;

    if (!ownerId) {
      console.log("order:new gagal, ownerId kosong");
      return;
    }

    socket.to(`owner_${ownerId}`).emit("order:received", {
      orderId: data.orderId,
      ownerId: data.ownerId,
      customerId: data.customerId,
      laundryId: data.laundryId,
      customerName: data.customerName,
      message: data.message || "Ada pesanan baru masuk",
      timestamp: new Date().toISOString(),
    });

    console.log(`Pesanan baru dikirim ke owner_${ownerId}`);
  });

  socket.on("order:status_changed", (data) => {
    console.log("Status pesanan berubah:", data);

    const customerId = data.customerId;

    if (!customerId) {
      console.log("order:status_changed gagal, customerId kosong");
      return;
    }

    socket.to(`customer_${customerId}`).emit("order:status_updated", {
      orderId: data.orderId,
      customerId: data.customerId,
      status: data.status,
      message: data.message || "Status pesanan diperbarui",
      timestamp: new Date().toISOString(),
    });

    console.log(`Update status dikirim ke customer_${customerId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("Londree WebSocket Server is running.");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Londree WebSocket Server running on port ${PORT}`);
});