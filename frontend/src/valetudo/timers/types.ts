export interface TimerActionControlProps {
    disabled: boolean;
    params: Record<string, unknown>;
    setParams(newParams: Record<string, unknown>): void;
}

export interface TimerPreActionControlProps {
    wasEnabled: boolean;
    params: Array<Record<string, unknown>>;
    setParams(valid: boolean, hasParams: boolean, newParams: Array<Record<string, unknown>>): void;
}
