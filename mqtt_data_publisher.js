// To publish msg from putty to mqtt.fx
// This script simulates a device publishing data to an MQTT broker


const mqtt = require('mqtt');

// Connect to mqtt.fx
const client = mqtt.connect('mqtt://broker.emqx.io', {
  clientId: 'nimbus-gateway-00ed1',
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000
});

const topic = 'nimbus/device001/data';

function generateData() {
  return {
    deviceId: 'nimbus-001',
    temperature: (25 + Math.random() * 5).toFixed(2),
    humidity: (40 + Math.random() * 20).toFixed(2),
    voltage: (220 + Math.random() * 5).toFixed(2),
    timestamp: new Date().toISOString(),
    status: 'OK'
  };
}


client.on('connect', () => {
  console.log('Connected to MQTT');

  setInterval(() => {
    const payload = JSON.stringify(generateData());
    client.publish(topic, payload, { qos: 0 }, (error) => {
      if (error) {
        console.error('Publish error:', error);
      } else {
        console.log('Data published:', payload);
      }
    });
  }, 5000);
});

client.on('error', (err) => {
  console.error('Connection Error:', err);
});

client.on('close', () => {
  console.log('Connection closed');
});
