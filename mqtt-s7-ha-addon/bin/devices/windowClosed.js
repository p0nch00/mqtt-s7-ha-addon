let sf = require("../service_functions.js");
let device = require("../device.js");

module.exports = class devWindowClosed extends device {
	constructor(plc, mqtt, config, mqtt_base) {
		super(plc, mqtt, config, mqtt_base);

		// add attributes spezific for a sensor
		// create attribute from config

		// state
		if (config.state) {
			// allow all supported types
			this.create_attribute(config.state, "", "state");
			this.attributes["state"].set_RW("r"); // readonly
		}

		// if a boolean adress is given
		// change the type from "sensor" to "binary_sensor"
		if (this.attributes["state"].type === "X" || this.attributes["state"].type === "Q") {
			this.type = "binary_sensor";
		}
	}

	send_discover_msg() {
		let info = {
			name: this.name,
		};

		if (this.attributes["state"]) {
			info.state_topic = this.attributes["state"].full_mqtt_topic;

			// optional unit_of_measurement
			if (this.attributes["state"].unit_of_measurement) {
				info.unit_of_measurement = this.attributes["state"].unit_of_measurement;
			}

			// if this sensor is binary
			if (this.type === "binary_sensor") {
				info.payload_on = "true";
				info.payload_off = "false";
			}
			info.device_class = "window"
		}

		super.send_discover_msg(info);
	}

//Invert data for sensor that is on if window closed
	rec_s7_data(attr, data) {
	    switch (data) {
			case "true":
			    data = "false";
			    break;
			case "false":
			    data = "true";
			    break;
		}
		super.rec_s7_data(attr, data);
	}


}
