const { chula_route } = require('./static/chula_route.js');

// ================ Import necessary libraries ================
const mqtt = require('mqtt');

const BROKER = 'mqtt://127.0.0.1:1884';
const TOPIC = 'texas-magnesium-juliet-paris'; // v2x_topic จาก Part 1

const client = mqtt.connect(BROKER, {
	clientId: 'sensor_publisher_' + Math.random().toString(16).slice(3),
	clean: true,
	connectTimeout: 5000,
	reconnectPeriod: 1000,
});

client.on('connect', () => console.log('Publisher connected to MQTT broker'));
client.on('error', (err) => console.error('MQTT error:', err));
client.on('reconnect', () => console.log('Publisher reconnecting...'));

function publish(subtopic, payload) {
	const topic = `${TOPIC}/${subtopic}`;
	client.publish(topic, payload, { qos: 0, retain: false }, (err) => {
		if (err) console.error(`Error publishing to ${topic}:`, err);
		else console.log(`Published to ${topic}: ${payload}`);
	});
}
// ============================================================

let route_counter = 0;
let location_route = null;
let location_runner = null;
let activeStatus = false

process.on('message', async (message) => {
	const { type, value } = message;
	console.log('Message from parent:', type, value);
	if (type === 'speed') {
		// this section receives vehicle's speed (km/hr) from the frontend, e.g. 50
		// you should send a payload containing the value to the "<topic>/speed" topic

		// =================== Add your code below ========================
		publish('speed', JSON.stringify({ speed: Number(value) }));
		// ================================================================

	} else if (type === 'heartbeat') {
		// this section receives vehicle's active status from the frontend, e.g. ACTIVE, INACTIVE
		// the ACTIVE and INACTIVE must be converted to a boolean, ACTIVE=true and INACTIVE=false, before publishing
		// you should send a payload containing the value to the "<topic>/heartbeat" topic

		// =================== Add your code below ========================
		activeStatus = value === 'ACTIVE';
		publish('heartbeat', JSON.stringify({ heartbeat: activeStatus }));
		// ================================================================

	} else if (type === 'route') {
		// this section receives vehicle's position from the frontend
		// you must modify the "change_route" function below

		if (location_route) {
			clear_route();
		}
		if (value === 'chula') {
			change_route('chula', chula_route);
		}
	}
});

process.on('SIGTERM', () => {
	console.log('Received SIGTERM. Shutting down gracefully...');
	if (location_runner) {
		clearInterval(location_runner);
	}
	client.end();
	process.exit(0);
});

function change_route(route_name, position_route) {
	location_route = route_name;
	location_runner = setInterval(() => {

		// This section reads the lat, long, color from static/chula_route.js
		// e.g. latitude = 13.738044, longitude = 100.529944, color = red
		route_counter = (route_counter + 1) % chula_route.length;
		let msg = JSON.stringify({
			latitude: position_route[route_counter].latitude,
			longitude: position_route[route_counter].longitude,
			color: position_route[route_counter].color
		})

		// =================== Add your code below ========================
		// you should send a payload containing the latitude, longitude, and color to the "<topic>/route" topic
		publish('route', msg);
		// ================================================================
	}, 1000);
}

function clear_route() {
	clearInterval(location_runner);
	location_route = null;
	console.log('Cleared previous route');
}