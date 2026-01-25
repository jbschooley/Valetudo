import React, {FunctionComponent} from "react";
import {TimerPreActionControlProps} from "./types";
import {
    Checkbox,
    CircularProgress,
    FormControl,
    FormControlLabel,
    Grid2,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography
} from "@mui/material";
import {Capability, PresetSelectionState, usePresetSelectionsQuery} from "../../api";
import {presetFriendlyNames, sortPresets} from "../../presetUtils";


const PresetSelectionPreActionControl: FunctionComponent<{
    wasEnabled: boolean,
    params: Record<string, unknown>,
    setParams(valid: boolean, hasParams: boolean, newParams: Record<string, unknown>): void,

    capability: Capability.FanSpeedControl | Capability.WaterUsageControl | Capability.OperationModeControl,
    label: string
}> = ({
    wasEnabled,
    params,
    setParams,

    capability,
    label
}) => {
    const [enabled, setEnabled] = React.useState(wasEnabled);
    const [selectedPreset, setSelectedPreset] = React.useState<string>(params.value as string ?? "");

    const {
        isPending: presetsPending,
        isError: presetLoadError,
        data: presets,
    } = usePresetSelectionsQuery(capability);

    const filteredPresets = React.useMemo(() => {
        return sortPresets(
            presets?.filter(
                (x): x is Exclude<PresetSelectionState["value"], "custom"> => {
                    return x !== "custom";
                }
            ) ?? []
        );
    }, [presets]);

    const presetMenuItems = React.useMemo(() => {
        return filteredPresets.map((preset) => {
            return (
                <MenuItem key={preset} value={preset}>
                    {presetFriendlyNames[preset]}
                </MenuItem>
            );
        });
    }, [filteredPresets]);


    if (presetsPending) {
        return (
            <Grid2>
                <CircularProgress size={20} />
            </Grid2>
        );
    }

    if (presetLoadError) {
        return (
            <Grid2>
                <Typography color="error">Error loading {capability}</Typography>
            </Grid2>
        );
    }

    return (
        <Grid2
            container
            direction="row"
            sx={{
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.5rem"
            }}
        >
            <Grid2 sx={{minWidth: "9rem"}}>
                <FormControlLabel
                    sx={{userSelect: "none"}}
                    control={
                        <Checkbox
                            checked={enabled}
                            onChange={(e) => {
                                setEnabled(e.target.checked);

                                setParams(
                                    e.target.checked,
                                    //@ts-ignore
                                    filteredPresets.includes(selectedPreset),
                                    {value: selectedPreset}
                                );
                            }}
                        />
                    }
                    label={label}
                />
            </Grid2>
            <Grid2 sx={{flexGrow: 1, marginLeft: "1rem"}}>
                <FormControl sx={{width: "100%"}}>
                    <InputLabel id={"FanSpeedControlPreActionControl_presets_label"}>Preset</InputLabel>
                    <Select
                        labelId={"FanSpeedControlPreActionControl_presets_label"}
                        id={"FanSpeedControlPreActionControl_presets-select"}
                        label="Preset"
                        value={selectedPreset}
                        onChange={(e) => {
                            setSelectedPreset(e.target.value);

                            setParams(
                                enabled,
                                //@ts-ignore
                                filteredPresets.includes(e.target.value),
                                {value: e.target.value}
                            );
                        }}
                    >
                        {presetMenuItems}
                    </Select>
                </FormControl>
            </Grid2>
        </Grid2>
    );
};

export const FanSpeedControlPreActionControl: FunctionComponent<TimerPreActionControlProps> = ({
    wasEnabled,
    params,
    setParams
}) => {
    return (
        <PresetSelectionPreActionControl
            wasEnabled={wasEnabled}
            params={params}
            setParams={setParams}

            capability={Capability.FanSpeedControl}
            label={"Set Fan to"}
        />
    );
};

export const WaterUsageControlPreActionControl: FunctionComponent<TimerPreActionControlProps> = ({
    wasEnabled,
    params,
    setParams
}) => {
    return (
        <PresetSelectionPreActionControl
            wasEnabled={wasEnabled}
            params={params}
            setParams={setParams}

            capability={Capability.WaterUsageControl}
            label={"Set Water to"}
        />
    );
};

export const OperationModeControlPreActionControl: FunctionComponent<TimerPreActionControlProps> = ({
    wasEnabled,
    params,
    setParams
}) => {
    return (
        <PresetSelectionPreActionControl
            wasEnabled={wasEnabled}
            params={params}
            setParams={setParams}

            capability={Capability.OperationModeControl}
            label={"Set Mode to"}
        />
    );
};

export const CapabilitySettingPreActionControl: FunctionComponent<TimerPreActionControlProps> = ({
    wasEnabled,
    params,
    setParams
}) => {
    const [enabled, setEnabled] = React.useState(wasEnabled);

    // Serialize params to JSON for display
    const initialJson = React.useMemo(() => {
        if (params.capability && params.value) {
            return JSON.stringify({capability: params.capability, value: params.value}, null, 2);
        }
        return "";
    }, [params]);

    const [jsonValue, setJsonValue] = React.useState(initialJson);
    const [parseError, setParseError] = React.useState<string | null>(null);

    const validateAndUpdate = React.useCallback((json: string, isEnabled: boolean) => {
        if (!json.trim()) {
            setParseError(null);
            setParams(isEnabled, false, {});
            return;
        }

        try {
            const parsed = JSON.parse(json);

            // Validate structure
            if (typeof parsed !== "object" || !parsed.capability || !parsed.value) {
                setParseError("Must have 'capability' and 'value' keys");
                setParams(isEnabled, false, {});
                return;
            }

            setParseError(null);
            setParams(isEnabled, true, parsed);
        } catch {
            setParseError("Invalid JSON");
            setParams(isEnabled, false, {});
        }
    }, [setParams]);

    return (
        <Grid2
            container
            direction="column"
            sx={{
                padding: "0.5rem"
            }}
        >
            <Grid2>
                <FormControlLabel
                    sx={{userSelect: "none"}}
                    control={
                        <Checkbox
                            checked={enabled}
                            onChange={(e) => {
                                setEnabled(e.target.checked);
                                validateAndUpdate(jsonValue, e.target.checked);
                            }}
                        />
                    }
                    label="Custom Capability Setting"
                />
            </Grid2>
            <Grid2 sx={{marginTop: "0.5rem"}}>
                <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    maxRows={10}
                    label="Capability Setting (JSON)"
                    placeholder={'{"capability": "CarpetSensorModeControlCapability", "value": {"mode": "lift"}}'}
                    value={jsonValue}
                    error={!!parseError}
                    helperText={parseError || 'Format: {"capability": "CapabilityName", "value": {...}}'}
                    onChange={(e) => {
                        setJsonValue(e.target.value);
                        validateAndUpdate(e.target.value, enabled);
                    }}
                    sx={{
                        fontFamily: "monospace",
                        "& .MuiInputBase-input": {
                            fontFamily: "monospace",
                            fontSize: "0.875rem"
                        }
                    }}
                />
            </Grid2>
        </Grid2>
    );
};
