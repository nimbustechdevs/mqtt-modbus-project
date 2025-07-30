//TO PUBLISH MSG FROM MQTT TO PUTTY CONSOLE

const mqtt = require('mqtt');

// Connect to emqx broker
const client = mqtt.connect('mqtt://broker.emqx.io', {
  clientId: 'nimbus-subscriber-001',
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000
});

// The topic you want to listen to
const topic = 'test/command';

client.on('connect', () => {
  console.log('Connected to MQTT broker');

  // Subscribe to the topic
  client.subscribe(topic, { qos: 0 }, (err) => {
    if (err) {
      console.error('Subscribe error:', err);
    } else {
      console.log(`Subscribed to topic: ${topic}`);
    }
  });
});

// On receiving a message
client.on('message', (topic, message) => {
  console.log(`Message received on [${topic}]: ${message.toString()}`);
});

client.on('error', (err) => {
  console.error('Connection error:', err);
});