const powerStateValueMap = {
  on: '1',
  off: '0',
} as const
export function valueFromPowerState(
  powerState: keyof typeof powerStateValueMap,
): '1' | '0' {
  return powerStateValueMap[powerState]
}
export function powerStateFromValue(
  value: ReturnType<typeof valueFromPowerState>,
): keyof typeof powerStateValueMap {
  for (const key of Object.keys(powerStateValueMap)) {
    const safeKey = key as keyof typeof powerStateValueMap
    if (powerStateValueMap[safeKey] === value) {
      return safeKey
    }
  }
  throw new Error('invalid')
}

const modeValueMap = {
  cool: '0',
  dry: '1',
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
  throw new Error('invalid')
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
  throw new Error('invalid')
}
