import type { Service, Characteristic } from 'homebridge'

import { HomebridgeLgThinqPlatform } from '../platform'
import AbstractCharacteristic from './abstractCharacteristic'

type State = number

type ApiValue = 2 | 4 | 6

export default class RotationSpeedCharacteristic extends AbstractCharacteristic<
  State,
  ApiValue,
  typeof Characteristic.RotationSpeed
> {
  constructor(
    platform: HomebridgeLgThinqPlatform,
    service: Service,
    deviceId: string,
  ) {
    super(
      platform,
      service,
      deviceId,
      platform.Characteristic.RotationSpeed,
      'Set',
      'airState.windStrength',
    )
  }

  getStateFromApiValue(apiValue: ApiValue): State {
    switch (apiValue) {
      case 2:
        // low
        return 33
      case 4:
        // medium
        return 66
      case 6:
        // high
        return 100
      default:
        throw new Error('Unsupported API value: ' + JSON.stringify(apiValue))
    }
  }

  getApiValueFromState(state: State): ApiValue {
    if (state > 90) {
      // high
      return 6
    } else if (state > 40) {
      // medium
      return 4
    } else {
      // low
      return 2
    }
  }
}
