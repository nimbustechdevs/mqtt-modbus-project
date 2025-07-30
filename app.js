// CODE USECASE:- Device 1: Weather Monitoring System Measures: CO2, Temperature, Humidity, Rainfall, Sound level, etc.

//                Communicates using Modbus RTU over RS485

//                Device 2: WPS Gateway
//                Acts as:Modbus RTU Master (reads weather data via RS485)
//                        MQTT Client (publishes data to MQTT broker in JSON format)
//                        accessing it via PuTTY
//                        Node.js version limited to ≤ 10.x

//               Device 3: PC Connected to RS485 using a USB-RS485 converter
//                         Runs ModSim to simulate weather data
//                         Runs MQTT.fx to test MQTT data subscription 

const ModbusRTU = require("modbus-serial");
const mqtt = require("mqtt");


const modbusClient = new ModbusRTU();
const serialPort = "/dev/ttyAMA0";
const slaveId = 1;


const mqttClient = mqtt.connect("mqtt://broker.emqx.io", {
  clientId: "nimbus-gateway-001",
  clean: true,
  connectTimeout:4000,
  reconnectPeriod:1000
});

const mqttTopic = "nimbus/device001/data";


mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");
});

mqttClient.on("reconnect", () => {
  console.log("Reconnecting to MQTT broker...");
});

mqttClient.on("error", (err) => {
  console.error("MQTT error:", err);
});

mqttClient.on("close", () => {
  console.log("MQTT connection closed");
});


async function connectModbus() {
  try {
    await modbusClient.connectRTUBuffered(serialPort, {
      baudRate: 9600,
      parity: "none",
      stopBits: 1,
      dataBits: 8,
    });
    modbusClient.setID(slaveId);
    console.log("Connected to Modbus device");
  } catch (err) {
    console.error("Failed to connect Modbus:", err.message);
   process.exit(1)
  }
}

async function readAndPublish() {
  try {
    const data = await modbusClient.readHoldingRegisters(0, 6);
    const values = data.data;

    const payload = {
      CO2: values[0],
      temperature: values[1] / 100,
      humidity: values[2] / 10,
      sound_level: values[3],
      rainfall: values[4],
      light_intensity: values[5],
      timestamp: new Date().toISOString(),
    };

    console.log("Data:", payload);
    mqttClient.publish(mqttTopic, JSON.stringify(payload));
  } catch (err) {
    console.error("Modbus read failed:", err.message);
  }
}

(async () => {
  await connectModbus();
  setInterval(readAndPublish, 5000);
})();