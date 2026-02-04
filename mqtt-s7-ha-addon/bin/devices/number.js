let sf = require("../service_functions.js");
let device = require("../device.js");

module.exports = class devLightButton extends device {
    constructor(plc, mqtt, config, mqtt_base) {
        super(plc, mqtt, config, mqtt_base);

        // add attributes specific for a number
        // create attribute from config

        // number state
        if (config.state) {
            this.create_attribute(config.state, "BYTE", "state");
        }

    }

    send_discover_msg() {
        let info = {
            name: this.name,
        };

        if (this.attributes["state"]) {
            info.command_topic = this.attributes["state"].full_mqtt_topic + "/set";
            info.state_topic = this.attributes["state"].full_mqtt_topic;
            info.unit_of_measurement = this.attributes["state"].unit_of_measurement;
            info.step = this.attributes["state"].step;
            info.min = this.attributes["state"].min;
            info.max = this.attributes["state"].max;

        }

        super.send_discover_msg_override(info,"number");
    }

    rec_mqtt_data(attr, data) {
        data = "true"
        // call parent class method
        super.rec_mqtt_data(attr, data, (error) => {
            // callback function of attribute when write was finished
            super.rec_s7_data("state","true")
        });
    }


}
