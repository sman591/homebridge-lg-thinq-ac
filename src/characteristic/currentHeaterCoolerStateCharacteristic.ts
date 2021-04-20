import type { Service, Characteristic } from 'homebridge'

import { HomebridgeLgThinqPlatform } from '../platform'
import AbstractCharacteristic from './abstractCharacteristic'

type State =
  | typeof Characteristic.CurrentHeaterCoolerState.INACTIVE
  | typeof Characteristic.CurrentHeaterCoolerState.IDLE
  | typeof Characteristic.CurrentHeaterCoolerState.COOLING
  | typeof Characteristic.CurrentHeaterCoolerState.HEATING

type ApiValue = 0 | 1 | 2 | 4

export default class CurrentHeaterCoolerStateCharacteristic extends AbstractCharacteristic<
  State,
  ApiValue,
  typeof Characteristic.CurrentHeaterCoolerState
> {
  deviceSupportsHeat: boolean

  constructor(
    platform: HomebridgeLgThinqPlatform,
    service: Service,
    deviceId: string,
    deviceSupportsHeat = false,
  ) {
    super(
      platform,
      service,
      deviceId,
      platform.Characteristic.CurrentHeaterCoolerState,
      'Set',
      'airState.opMode',
    )
    this.deviceSupportsHeat = deviceSupportsHeat
  }

  handleSet = undefined

  getStateFromApiValue(apiValue: ApiValue): State {
    if (this.deviceSupportsHeat) {
      switch (apiValue) {
        case 0:
          return this.characteristic.COOLING
        case 4:
          return this.characteristic.HEATING
        case 2:
          return this.characteristic.IDLE
        default:
          throw new Error('Unsupported API value: ' + JSON.stringify(apiValue))
      }
    } else {
      switch (apiValue) {
        case 0:
          return this.characteristic.COOLING
        case 1:
          return this.characteristic.HEATING
        case 2:
          return this.characteristic.IDLE
        default:
          throw new Error('Unsupported API value: ' + JSON.stringify(apiValue))
      }
    }
  }

  getApiValueFromState(): ApiValue {
    return 0
  }
}
