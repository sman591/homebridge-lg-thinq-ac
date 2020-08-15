import type { Service, Characteristic } from 'homebridge'
import type { LgAirConditionerPlatformAccessory } from '../platformAccessory'

import { HomebridgeLgThinqPlatform } from '../platform'
import AbstractCharacteristic from './abstractCharacteristic'

type State = number /** temperature in celcius */

type ApiValue = number /** temperature in celcius */

export default class CurrentTemperatureCharacteristic extends AbstractCharacteristic<
  State,
  ApiValue,
  typeof Characteristic.CoolingThresholdTemperature
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
      platform.Characteristic.CurrentTemperature,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore This won't be used for a read-only characteristic
      '',
      'airState.tempState.current',
    )
  }

  // Disable "set" control
  handleSet = undefined

  // API is never set, so this is not used
  getApiValueFromState(state: State): ApiValue {
    return state
  }

  getStateFromApiValue(apiValue: ApiValue): State {
    return this.getHomeKitCelsiusForLGAPICelsius(apiValue)
  }
}
