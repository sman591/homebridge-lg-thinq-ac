import type { Service, Characteristic } from 'homebridge'

import type { ThinqPlatformType } from '../thinq/apiTypes'
import { HomebridgeLgThinqPlatform } from '../platform'
import AbstractCharacteristic from './abstractCharacteristic'

type State =
  | typeof Characteristic.TargetHeaterCoolerState.COOL
  | typeof Characteristic.TargetHeaterCoolerState.HEAT
  | typeof Characteristic.TargetHeaterCoolerState.AUTO

type ApiValue = 0 | 1 | 2 | 4

export default class TargetHeaterCoolerStateCharacteristic extends AbstractCharacteristic<
  State,
  ApiValue,
  typeof Characteristic.TargetHeaterCoolerState
> {
  deviceSupportsHeat: boolean

  constructor(
    platform: HomebridgeLgThinqPlatform,
    service: Service,
    deviceId: string,
    thinqPlatform: ThinqPlatformType,
    deviceSupportsHeat = false,
  ) {
    super(
      platform,
      service,
      deviceId,
      thinqPlatform,
      platform.Characteristic.TargetHeaterCoolerState,
      'Set',
      'airState.opMode',
    )
    this.deviceSupportsHeat = deviceSupportsHeat

    if (this.deviceSupportsHeat) {
      this.logError(
        'Warning: Your model may support a "drying" or "dehumidification" mode. ' +
          'This is NOT natively supported by Homekit, and using it may show errors in Homebridge or cause temporary instability.',
      )
    }
  }

  getStateFromApiValue(apiValue: ApiValue): State {
    if (this.deviceSupportsHeat) {
      switch (apiValue) {
        case 0:
          return this.characteristic.COOL
        case 4:
          return this.characteristic.HEAT
        case 2:
          return this.characteristic.AUTO
        default:
          throw new Error('Unsupported API value: ' + JSON.stringify(apiValue))
      }
    } else {
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
  }

  getApiValueFromState(state: State): ApiValue {
    if (this.deviceSupportsHeat) {
      switch (state) {
        case this.characteristic.COOL:
          return 0
        case this.characteristic.HEAT:
          return 4
        case this.characteristic.AUTO:
          return 2
        default:
          throw new Error('Unsupported state: ' + JSON.stringify(state))
      }
    } else {
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
}
