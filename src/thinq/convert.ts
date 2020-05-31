const modeValueMap = {
  cool: '0',
  heat: '1',
  fan: '2',
} as const
export function valueFromMode(
  mode: keyof typeof modeValueMap,
): '0' | '1' | '2' {
  return modeValueMap[mode]
}
export function modeFromValue(
  value: ReturnType<typeof valueFromMode>,
): keyof typeof modeValueMap {
  for (const key of Object.keys(modeValueMap)) {
    const safeKey = key as keyof typeof modeValueMap
    if (modeValueMap[safeKey] === value) {
      return safeKey
    }
  }
  throw new Error('Invalid value for modeFromValue: ' + JSON.stringify(value))
}
export function currentHeaterCoolerStateFromMode(
  mode: keyof typeof modeValueMap,
) {
  switch (mode) {
    case 'cool':
      // TODO: Refactor out of convert
      // Characteristic.CurrentHeaterCoolerState.COOLING
      return 3
    case 'heat':
      // TODO: Refactor out of convert
      // Characteristic.CurrentHeaterCoolerState.HEATING
      return 2
    case 'fan':
      // TODO: Refactor out of convert
      // Characteristic.CurrentHeaterCoolerState.IDLE
      return 1
    default:
      // TODO: Refactor out of convert
      // Characteristic.CurrentHeaterCoolerState.INACTIVE
      return 0
  }
}
export function targetHeaterCoolerStateFromMode(
  mode: keyof typeof modeValueMap,
) {
  switch (mode) {
    case 'cool':
      // TODO: Refactor out of convert
      // Characteristic.TargetHeaterCoolerState.COOL
      return 2
    case 'heat':
      // TODO: Refactor out of convert
      // Characteristic.TargetHeaterCoolerState.HEAT
      return 1
    case 'fan':
      // TODO: Refactor out of convert
      // Characteristic.TargetHeaterCoolerState.AUTO
      return 0
    default:
      // TODO: Refactor out of convert
      // Characteristic.TargetHeaterCoolerState.AUTO
      return 0
  }
}

const fanValueMap = {
  low: '2',
  medium: '4',
  high: '6',
} as const
export function valueFromFan(fan: keyof typeof fanValueMap): '2' | '4' | '6' {
  return fanValueMap[fan]
}
export function fanFromValue(
  value: ReturnType<typeof valueFromFan>,
): keyof typeof fanValueMap {
  for (const key of Object.keys(fanValueMap)) {
    const safeKey = key as keyof typeof fanValueMap
    if (fanValueMap[safeKey] === value) {
      return safeKey
    }
  }
  throw new Error('Invalid value for fanFromValue: ' + JSON.stringify(value))
}
export function rotationSpeedFromFan(fan: keyof typeof fanValueMap) {
  switch (fan) {
    case 'high':
      return 100
    case 'medium':
      return 66
    case 'low':
    default:
      return 33
  }
}
