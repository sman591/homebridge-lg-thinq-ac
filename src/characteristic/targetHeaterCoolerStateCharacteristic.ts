import type { Service, Characteristic, CharacteristicChange } from 'homebridge'
import { GetDeviceResponse } from '../thinq/apiTypes'

import { HomebridgeLgThinqPlatform } from '../platform'
import type { LgAirConditionerPlatformAccessory } from '../platformAccessory'

import AbstractCharacteristic from './abstractCharacteristic'

type State =
  | typeof Characteristic.TargetHeaterCoolerState.COOL
  | typeof Characteristic.TargetHeaterCoolerState.HEAT
  | typeof Characteristic.TargetHeaterCoolerState.AUTO

type ApiValue = 0 | 1 | 2 | 4 | 8

export default class TargetHeaterCoolerStateCharacteristic extends AbstractCharacteristic<
  State,
  ApiValue,
  typeof Characteristic.TargetHeaterCoolerState
> {
  deviceSupportsHeat: boolean
  useEcoMode: boolean

  constructor(
    platform: HomebridgeLgThinqPlatform,
    service: Service,
    device: LgAirConditionerPlatformAccessory,
    deviceSupportsHeat = false,
    useEcoMode = false,
  ) {
    super(
      platform,
      service,
      device,
      platform.Characteristic.TargetHeaterCoolerState,
      'Set',
      'airState.opMode',
    )
    this.deviceSupportsHeat = deviceSupportsHeat
    this.useEcoMode = useEcoMode

    if (this.deviceSupportsHeat) {
      this.logError(
        'Warning: Your model may support a "drying" or "dehumidification" mode. ' +
          'This is NOT natively supported by Homekit, and using it may show errors in Homebridge or cause temporary instability.',
      )
    }
  }

  handleUpdatedSnapshot(snapshot: GetDeviceResponse['result']['snapshot']) {
    super.handleUpdatedSnapshot(snapshot)
  }

  handleChange(v: CharacteristicChange) {
    // refresh UI each time the mode changes since the temperature can change when the mode is switched
    this.device.updateCharacteristics()
  }

  getStateFromApiValue(apiValue: ApiValue): State {
    if (this.deviceSupportsHeat) {
      switch (apiValue) {
        case 8:
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
        case 8:
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
          return this.useEcoMode === true ? 8 : 0
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
          return this.useEcoMode === true ? 8 : 0
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
