const ModbusRTU = require("modbus-serial");
const mqtt = require("mqtt");
const fs = require("fs");

// Load Modbus Config
const config = JSON.parse(fs.readFileSync("config.json", "utf-8"));

// Modbus Client Setup
const modbusClient = new ModbusRTU();
const serialPort = "/dev/ttyAMA0";
const baudRate = 9600;

// MQTT Client Setup
const mqttClient = mqtt.connect("mqtt://broker.emqx.io", {
  port: 1883,
  clientId: "wpc-receiver",
  reconnectPeriod: 1000
});

const topic = "nimbus/weather/data";

// MQTT Events
mqttClient.on("connect", () => {
  console.log(" MQTT connected");
  mqttClient.subscribe(topic, () => console.log(`Subscribed to topic: ${topic}`));
});

mqttClient.on("error", (err) => console.error("MQTT Error:", err));
mqttClient.on("close", () => console.log("MQTT connection closed"));
mqttClient.on("reconnect", () => console.log("Reconnecting to MQTT..."));

// Handle incoming MQTT messages
mqttClient.on("message", async (topic, message) => {
  console.log("Received JSON:", message.toString());

  try {
    const payload = JSON.parse(message);

    for (const [key, value] of Object.entries(payload)) {
      if (config[key]) {
        const { slaveId, registerType, registerAddress } = config[key];
        console.log(`Processing key: ${key}, value: ${value}`);

        await writeToModbus(slaveId, registerType, registerAddress, value);

        // delay added beacause modbus can not read all values at a time
        await new Promise(res => setTimeout(res, 1000));
      } else {
        console.warn(`No Modbus config for key: ${key}`);
      }
    }

    console.log("Finished parsing all keys");
  } catch (err) {
    console.error("JSON Parse Error:", err.message);
  }
});

// Connect to Modbus
async function connectModbus() {
  try {
    await modbusClient.connectRTUBuffered(serialPort, {
      baudRate,
      parity: "none",
      stopBits: 1,
      dataBits: 8
    });
    console.log("Modbus Serial Connected");
  } catch (err) {
    console.error("Modbus Connection Error:", err.message);
    process.exit(1);
  }
}

// Write Data to Modbus
async function writeToModbus(slaveId, registerType, address, value) {
  modbusClient.setID(slaveId);
  const intValue = parseInt(value);

  try {
    if (registerType === "holding") {
      await modbusClient.writeRegister(address, intValue);
      console.log(`Wrote ${intValue} to Holding Register ${address} on Slave ${slaveId}`);
    } else {
      console.warn(`Unsupported register type: ${registerType}`);
    }
  } catch (err) {
    console.error(`Failed to write to register ${address}:`, err.message);
  }
}

connectModbus();

