/** Mapping from { (thinq2 key) : (thinq1 key) } */
export const TranslationCharacteristics = {
  'airState.windStrength': 'WindStrength',
  'airState.tempState.current': 'TempCur',
  'airState.tempState.target': 'TempCfg',
  'airState.opMode': 'OpMode',
  'airState.operation': 'Operation',
  'airState.wDir.vStep': 'WDirVStep',
} as const

export function translateCommandValue(
  thinq1key: typeof TranslationCharacteristics[keyof typeof TranslationCharacteristics],
  value: string | number,
): string | Record<string, unknown> {
  if (thinq1key === 'Operation') {
    return value ? 'Start' : 'Stop'
  }
  return {
    [thinq1key]: value,
  }
}
