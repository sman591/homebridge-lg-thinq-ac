import type { Service, Characteristic } from 'homebridge'

import { HomebridgeLgThinqPlatform } from '../platform'
import AbstractCharacteristic from './abstractCharacteristic'

type State =
  | typeof Characteristic.TargetHeaterCoolerState.COOL
  | typeof Characteristic.TargetHeaterCoolerState.HEAT
  | typeof Characteristic.TargetHeaterCoolerState.AUTO

type ApiValue = 0 | 1 | 2

export default class TargetHeaterCoolerStateCharacteristic extends AbstractCharacteristic<
  State,
  ApiValue,
  typeof Characteristic.TargetHeaterCoolerState
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
      platform.Characteristic.TargetHeaterCoolerState,
      'Set',
      'airState.opMode',
    )
  }

  getStateFromApiValue(apiValue: ApiValue): State {
    switch (apiValue) {
      case 0:
        return this.characteristic.COOL
      case 1:
        return this.characteristic.HEAT
      case 2:
        return this.characteristic.AUTO
      default:
        throw new Error('Unsupported API value: ' + JSON.stringify(apiValue))
    }
  }

  getApiValueFromState(state: State): ApiValue {
    switch (state) {
      case this.characteristic.COOL:
        return 0
      case this.characteristic.HEAT:
        return 1
      case this.characteristic.AUTO:
        return 2
      default:
        throw new Error('Unsupported state: ' + JSON.stringify(state))
    }
  }
}
