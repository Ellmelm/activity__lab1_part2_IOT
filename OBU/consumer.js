let {
    setActiveStatus,
    setLatitude,
    setLongitude,
    setSpeed,
    setColor,
} = require('./obu.js');
const mqtt = require('mqtt')

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// setSpeed(number) : Use this function to set the vehicle's speed (km/hr), e.g. setSpeed(50)
// setActiveStatus(boolean) : Use this function to set the vehicle's online status (true=Active, false=Inactive), e.g. setActiveStatus(true)
// setLatitude(number), setLongitude(number) : Use these functions to set the vehicle's location
    // e.g. setLatitude(13.738044), setLongitude(100.529944)
// setColor(string) : Use this function to set the vehicle-pin's color, e.g. setColor("blue")
    // valid colors are "blue", "green", "red", "violet", "yellow", "no"

const BROKER = process.env.MQTT_BROKER || 'mqtt://127.0.0.1:1884';
const TOPIC = process.env.V2X_TOPIC || 'lithium-east-east-kitten'; // v2x_topic จาก Part 1

const client = mqtt.connect(BROKER, {
    clientId: 'obu_consumer_' + Math.random().toString(16).slice(3),
    clean: true,
    connectTimeout: 5000,
    reconnectPeriod: 1000,
});

client.on('connect', () => {
    console.log(`Consumer connected to MQTT broker ${BROKER}`);
    client.subscribe(`${TOPIC}/#`, { qos: 0 }, (err) => {
        if (err) console.error('Subscribe error:', err);
        else console.log(`Subscribed to ${TOPIC}/#`);
    });
});

client.on('message', (topic, message) => {
    let data;
    try {
        data = JSON.parse(message.toString());
    } catch (err) {
        console.error(`Invalid JSON on ${topic}:`, message.toString());
        return;
    }

    const subtopic = topic.split('/').pop(); // speed | heartbeat | route
    console.log(`Received ${topic}: ${message.toString()}`);

    switch (subtopic) {
        case 'speed':
            setSpeed(Number(data.speed));
            break;
        case 'heartbeat':
            setActiveStatus(data.heartbeat === true || data.heartbeat === 'true' || data.heartbeat === 'ACTIVE');
            break;
        case 'route':
            setLatitude(Number(data.latitude));
            setLongitude(Number(data.longitude));
            setColor(data.color);
            break;
        default:
            console.log(`Unknown topic: ${topic}`);
    }
});

client.on('error', (err) => console.error('MQTT error:', err));
client.on('offline', () => console.log('MQTT consumer offline'));
client.on('reconnect', () => console.log('MQTT consumer reconnecting...'));