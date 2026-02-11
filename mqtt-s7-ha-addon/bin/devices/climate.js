let sf = require("../service_functions.js");
let device = require("../device.js");

module.exports = class devLight extends device {
	constructor(plc, mqtt, config, mqtt_base) {
		super(plc, mqtt, config, mqtt_base);

		// add attributes spezific for a light
		// create attribute from config

		// binary on/off state ->  power_command_topic
		if (config.state) {
			this.create_attribute(config.state, "X", "state");
		}

		if (config.cooling_mode) {
			this.create_attribute(config.cooling_mode,"X","cooling_mode")
		}

		// current temperature
		if (config.current_temperature) {
			this.create_attribute(config.current_temperature, "REAL", "current_temperature");
			this.attributes["current_temperature"].set_RW("r");

			// if no update interval is defined, set it to 15 min
			if (this.attributes["current_temperature"].update_interval == 0)
				this.attributes["current_temperature"].update_interval = 900000; // 15 min
		}

		// target temperature
		if (config.target_temperature) {
			this.create_attribute(config.target_temperature, "REAL", "target_temperature");
			this.attributes["target_temperature"].set_RW("rw");
			this.attributes["target_temperature"].update_interval = 900000; // 15 min

		}

		this.lastUpdated = 0;
		this.coolingMode = false;
		this.valve = false;

		// Features for Future ...

		// binary mode true = heating, false = cooling ->  mode_command_topic
		// if (config.mode) {
		// 	this.create_attribute(config.mode, "X", "mode");
		// }

		// fan mode binary state on/off
		// if (config.fan_mode) {
		// 	this.create_attribute(config.fan_mode, "X", "fan_mode");
		// }
	}

	send_discover_msg() {
		let info = {
			name: this.name,
		};

		if (this.attributes["current_temperature"])
			info.current_temperature_topic = this.attributes["current_temperature"].full_mqtt_topic;

		if (this.attributes["state"]) {
			// add only command_topic if the attribute is allowed to write
			//if (this.attributes["state"].write_to_s7)
			//	info.power_command_topic = this.attributes["state"].full_mqtt_topic + "/set";
			info.mode_state_topic = this.attributes["state"].full_mqtt_topic;

			if (this.attributes["cooling_mode"]) {
				info.modes = ["off","heat","cool"];
			} else {
				info.modes = ["off","heat"];
			}
		}



		if (this.attributes["target_temperature"]) {
			// add only temperature_command_topic if the attribute is allowed to write
			info.temperature_command_topic = this.attributes["target_temperature"].full_mqtt_topic + "/set";

			// add only temperature_state_topic if attribute is allowed to read
			info.temperature_state_topic = this.attributes["target_temperature"].full_mqtt_topic;
		}

		super.send_discover_msg(info);
	}

	rec_s7_data(attr, data) {
	    if (attr === "current_temperature") {
	        data = Math.round(data * 10) / 10;
	    }
	    if (attr === "current_temperature" && this.lastUpdated + 300000 < Date.now()) {
	    	this.lastUpdated = Date.now();
	    	super.rec_s7_data(attr, data);
	    }

		if (this.attributes["cooling_mode"]) {
			if (attr == "cooling_mode") {
				this.coolingMode = data;
				if (data && this.valve) {
					super.rec_s7_data("state","cool");
				} else if (!data && this.valve) {
					super.rec_s7_data("state","heat");
				} else {
					super.rec_s7_data("state","off");
				}
			}

			if (attr == "state") {
				this.valve = data;
				if (data && this.coolingMode) {
					super.rec_s7_data("state","cool");
				} else if (data && !this.coolingMode) {
					super.rec_s7_data("state","heat");
				} else {
					super.rec_s7_data("state","off");
				}
			}
		} else {
			if (attr == "state") {
				if (data) {
					super.rec_s7_data("state","heat");
				} else {
					super.rec_s7_data("state","off");
				}
			}
		}




		if (attr === "target_temperature" && this.lastUpdated + 300000 < Date.now()) {
			this.lastUpdated = Date.now();
			super.rec_s7_data(attr, data);
		}
	}

	rec_mqtt_data(attr, data, cb) {
		super.rec_mqtt_data(attr, data, (error) => {
			// callback function of attribute when write was finished
			super.rec_s7_data("state",data)
		});
	}


}
