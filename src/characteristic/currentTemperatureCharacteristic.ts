import type { Service, Characteristic } from 'homebridge'

import type { ThinqPlatformType } from '../thinq/apiTypes'
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
    deviceId: string,
    thinqPlatform: ThinqPlatformType,
  ) {
    super(
      platform,
      service,
      deviceId,
      thinqPlatform,
      platform.Characteristic.CurrentTemperature,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore This won't be used for a read-only characteristic
      '',
      'airState.tempState.current',
    )
  }

  // Disable "set" control
  handleSet = undefined

  getStateFromApiValue(apiValue: ApiValue): State {
    return apiValue
  }

  getApiValueFromState(state: State): ApiValue {
    return state
  }
}
