const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// =====================================================
// MOBILE WEBSITE
// =====================================================

const mobilePath = path.join(__dirname, "../mobile");

console.log("Serving Mobile Folder:");
console.log(mobilePath);

app.use("/mobile", express.static(mobilePath));


// =====================================================
// WORKER DATA
// =====================================================

let worker = {
    workerId: "W001",
    mq5: 0,
    mq135: 0,
    temperature: 0,
    humidity: 0,
    latitude: 0,
    longitude: 0,
    battery: 0
};


// =====================================================
// ESP8266 SENSOR DATA
// =====================================================

app.post("/api/sensors", (req, res) => {

    worker.workerId = req.body.workerId || "W001";

    worker.mq5 = req.body.mq5;
    worker.mq135 = req.body.mq135;
    worker.temperature = req.body.temperature;
    worker.humidity = req.body.humidity;

    console.log("Sensor Updated");
    console.log(worker);

    res.json({
        success: true
    });
});


// =====================================================
// MOBILE GPS DATA
// =====================================================

app.post("/api/location", (req, res) => {

    worker.latitude = req.body.latitude;
    worker.longitude = req.body.longitude;
    worker.battery = req.body.battery;

    console.log("Location Updated");
    console.log(worker);

    res.json({
        success: true
    });
});


// =====================================================
// DASHBOARD API
// =====================================================

app.get("/api/worker", (req, res) => {

    res.json(worker);

});


// =====================================================
// TEST ROUTE
// =====================================================

app.get("/", (req, res) => {

    res.send("SafetyWatch Pro Backend is Running!");

});


// =====================================================
// START SERVER
// =====================================================

app.listen(5000, "0.0.0.0", () => {

    console.log("==================================");
    console.log(" SafetyWatch Pro Backend Running");
    console.log(" http://localhost:5000");
    console.log(" Network: http://10.56.215.54:5000");
    console.log("==================================");

});