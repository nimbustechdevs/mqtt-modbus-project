//Code Usecase- 
// MQTT publisher-external device or  will publish the data in Robusted JSON format through MQTT Broker
//                  -----MQTT Client
// WPC-632/gatwway |           | 
//                  -----Modbus Master
//                             |
//                             |
//                         LAN/RS485
//                             |
//                          Device


const ModbusRTU = require("modbus-serial");
const mqtt = require("mqtt");
const fs = require("fs");


const modbusClient = new ModbusRTU();
const serialPort = "/dev/ttyAMA0";
const slaveId = 1;

const config = JSON.parse(fs.readFileSync("modbus-config.json", "utf-8"));

const topic = "nimbus/weather/data";

const client = mqtt.connect("mqtt://emqx.io", {
    port: "",
    clientId: "WPC-gateway-reciever",
    userName: "nimbustech",
    password: "nimbus@123",
    reconnectPeriod: 1000
} )

mqttClient.on("connect", () => {
  console.log("MQTT connected");
  mqttClient.subscribe(topic, () => {
    console.log("Subscribed to topic:", topic);
  });
});

mqttClient.on("error", (err) => console.error("MQTT Error:", err));
mqttClient.on("close", () => console.log("MQTT connection closed"));
mqttClient.on("reconnect", () => console.log("Reconnecting to MQTT..."));

// === MQTT Message Handler ===
mqttClient.on("message", async (topic, message) => {
  console.log("Received JSON:", message.toString());
  try {
    const payload = JSON.parse(message);
    for (const [key, value] of Object.entries(payload)) {
      if (config[key]) {
        const { slaveId, registerType, registerAddress } = config[key];
        await writeToModbus(slaveId, registerType, registerAddress, value);
      } else {
        console.warn(`No Modbus config for key: ${key}`);
      }
    }
  } catch (err) {
    console.error("JSON Parse or Modbus Write Error:", err.message);
  }
});

// === Connect to Modbus Serial Port ===
async function connectModbus() {
  try {
    await modbusClient.connectRTUBuffered(serialPort, {
      baudRate: 9600, 
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

// === Modbus Write Function ===
async function writeToModbus(slaveId, registerType, address, value) {
  modbusClient.setID(slaveId);
  const intValue = parseInt(value);

  try {
    if (registerType === "holding") {
      await modbusClient.writeRegister(address, intValue);
      console.log(`Wrote ${intValue} to Holding Register ${address}`);
    } else {
      console.warn(`Unsupported register type: ${registerType}`);
    }
  } catch (err) {
    console.error(`Failed to write to register ${address}:`, err.message);
  }
}

// === Initialize Modbus Connection ===
connectModbus();
