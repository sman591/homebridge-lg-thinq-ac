import type { Service, Characteristic } from 'homebridge'

import { HomebridgeLgThinqPlatform } from '../platform'
import { LgAirConditionerPlatformAccessory } from '../platformAccessory'

import AbstractCharacteristic from './abstractCharacteristic'

type State =
  | typeof Characteristic.Active.ACTIVE
  | typeof Characteristic.Active.INACTIVE

type ApiValue = 1 | 0

export default class ActiveCharacteristic extends AbstractCharacteristic<
  State,
  ApiValue,
  typeof Characteristic.Active
> {
  constructor(
    platform: HomebridgeLgThinqPlatform,
    service: Service,
    device: LgAirConditionerPlatformAccessory,
  ) {
    super(
      platform,
      service,
      device,
      platform.Characteristic.Active,
      'Operation',
      'airState.operation',
    )
  }

  getStateFromApiValue(apiValue: ApiValue): State {
    switch (apiValue) {
      case 1:
        return this.characteristic.ACTIVE
      case 0:
        return this.characteristic.INACTIVE
      default:
        throw new Error('Unsupported API value: ' + JSON.stringify(apiValue))
    }
  }

  getApiValueFromState(state: State): ApiValue {
    switch (state) {
      case this.characteristic.ACTIVE:
        return 1
      case this.characteristic.INACTIVE:
        return 0
      default:
        throw new Error('Unsupported state: ' + JSON.stringify(state))
    }
  }
}
