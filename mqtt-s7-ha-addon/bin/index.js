#!/usr/bin/env node
'use strict';

let config = require('./config');

let mqtt_handler = require('./mqtt_handler.js');
let plc_handler = require('./plc.js');

let sf = require('./service_functions.js');
let deviceFactory = require('./deviceFactory.js');

let mqtt = mqtt_handler.setup(config.mqtt, mqttMsgParser, init);
let plc = plc_handler.setup(config.plc, init);

let devices = [];

function init() {
	if (mqtt_handler.isConnected() && plc_handler.isConnected()) {
		sf.debug("Initialize !");

		// set default config values if they arent set
		config.debug_level = config.debug_level || 2;

		config.update_time = config.update_time || 1000;
		config.temperature_interval = config.temperature_interval || 900000;

		config.mqtt_base = config.mqtt_base || "s7";
		config.retain_messages = config.retain_messages || false;

		config.discovery_prefix = config.discovery_prefix || "homeassistant";
		config.discovery_retain = config.discovery_retain || false;

		// namespace translation
        plc.setTranslationCB((topic) => {
            try {
                const topic_parts = topic.split('/');

                if (topic_parts.length < 4) {
                    console.error(`Invalid topic format: ${topic}`);
                    return null;
                }

                const deviceId = topic_parts[1];
                const attribute = topic_parts[2];
                const isSet = topic_parts[3] === "set";

                const device = devices[deviceId];
                if (!device) {
                    console.error(`Unknown device ID: ${deviceId}`);
                    return null;
                }

                const address = isSet
                    ? device.get_plc_set_address(attribute)
                    : device.get_plc_address(attribute);

                if (!address) {
                    console.error(`No PLC address found for ${topic}`);
                    return null;
                }

                return address;

            } catch (err) {
                console.error(`Error translating topic "${topic}":`, err);
                return null;
            }
        });


		// parse config and create devices
		if (config.devices != undefined) {

			// create for each config entry an object
			// and save it to the array
			config.devices.forEach((dev) => {
				let new_device = deviceFactory(devices, plc, mqtt, dev, config.mqtt_base);

				// perform discovery message
				new_device.discovery_topic = config.discovery_prefix;
				new_device.send_discover_msg();

				// save the new device in the array
				// with the mqtt base as the index
				devices[new_device.mqtt_name] = new_device;

				sf.debug("New device added: " + config.mqtt_base + "/" + new_device.mqtt_name);
			});
		} else {
			sf.error("No devices in config found !");
		}


		// start loop
		setInterval(() => {
			console.log("PLC Loop Run");
			plc_update_loop();
		}, config.update_time);

		// discovery broadcast loop
		setInterval(() => {
			for (let dev in devices) {
				devices[dev].send_discover_msg();
			}
		}, 300000); // 5 min

	} else {
		setTimeout(() => {
			if (!mqtt_handler.isConnected() || !plc_handler.isConnected()) {
				sf.error("Connection Timeout");
			}
		}, 5000)
	}
}

function mqttMsgParser(topic, msg) {
	let topic_parts = topic.split('/');

	// check if the topic is in the mqtt_base
	if (topic_parts[0] == config.mqtt_base) {
		let device = topic_parts[1];
		let attribute = topic_parts[2];

		// if device exists
		if (devices[device]) {

			// give all data to device
			devices[device].rec_mqtt_data(attribute, msg);
		}
	}
}


function plc_update_loop() {
    console.log("4u8n2nuv23tv")
	plc.readAllItems((err, readings) => {
		if (err) {
			sf.debug("Error while reading from PLC !");
			return;
		}
		console.log(readings)

		// publish all data
		for (var topic in readings) {
			let topic_parts = topic.split('/');
			let device = topic_parts[1];
			let attribute = topic_parts[2];

			console.log(readings[topic])

			// if device exists
			if (devices[device]) {
				// give all data to device
				devices[device].rec_s7_data(attribute, readings[topic]);
			}
		}

	});
}
