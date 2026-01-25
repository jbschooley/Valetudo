const QuirksCapability = require("../../core/capabilities/QuirksCapability");
const SimpleToggleCapability = require("../../core/capabilities/SimpleToggleCapability");
const ValetudoTimerPreAction = require("./ValetudoTimerPreAction");

class ValetudoCapabilitySettingTimerPreAction extends ValetudoTimerPreAction {
    /**
     * @param {object} options
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {string} options.capabilityType
     * @param {object} options.value
     */
    constructor(options) {
        super(options);

        this.capabilityType = options.capabilityType;
        this.value = options.value;
    }

    async run() {
        if (this.value === undefined) {
            throw new Error("Missing value");
        }

        if (!this.robot.hasCapability(this.capabilityType)) {
            throw new Error(`Robot is missing the ${this.capabilityType}`);
        }

        const capability = this.robot.capabilities[this.capabilityType];

        // Handle toggle capabilities via {action: "enable"} or {action: "disable"}
        if (capability instanceof SimpleToggleCapability) {
            if (this.value.action === "enable") {
                return capability.enable();
            } else {
                return capability.disable();
            }
        }

        // Handle quirks via {id: "quirk_id", value: "quirk_value"}
        if (capability instanceof QuirksCapability) {
            return capability.setQuirkValue(this.value.id, this.value.value);
        }

        // For other capabilities, infer the setter from value object keys
        // e.g., {mode: "lift"} -> capability.setMode("lift")
        // e.g., {temperature: "hot"} -> capability.setTemperature("hot")
        const valueKeys = Object.keys(this.value);
        if (valueKeys.length === 1) {
            const paramName = valueKeys[0];
            const paramValue = this.value[paramName];
            const setterName = "set" + paramName.charAt(0).toUpperCase() + paramName.slice(1);

            if (typeof capability[setterName] === "function") {
                return capability[setterName](paramValue);
            }
        }

        throw new Error(`Capability ${this.capabilityType} does not support timer pre-actions or value format is invalid`);
    }
}

module.exports = ValetudoCapabilitySettingTimerPreAction;
