import type { Service, Characteristic } from 'homebridge'
import type { LgAirConditionerPlatformAccessory } from '../platformAccessory'

import { HomebridgeLgThinqPlatform } from '../platform'
import AbstractCharacteristic from './abstractCharacteristic'

type State = number

type ApiValue = 0 | 1

export default class FilterChangeCharacteristic extends AbstractCharacteristic<
  State,
  ApiValue,
  typeof Characteristic.FilterChangeIndication
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
      platform.Characteristic.FilterChangeIndication,
      'Operation',
      'airState.filterMngStates.useTime',
    )
  }

  getStateFromApiValue(apiValue: ApiValue): State {
    return Number(apiValue) === 0 ? 1 : 0
  }

  handleSet = undefined

  getApiValueFromState(state: State): ApiValue {
    return Number(state) === 0 ? 1 : 0
  }
}
