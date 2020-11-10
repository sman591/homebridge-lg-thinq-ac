import type {
  Service,
  Characteristic,
  CharacteristicValue,
  CharacteristicSetCallback,
} from 'homebridge'

import { LgAirConditionerPlatformAccessory } from '../platformAccessory'
import { HomebridgeLgThinqPlatform } from '../platform'
import AbstractCharacteristic from './abstractCharacteristic'

type State = number /** temperature in celcius */

type ApiValue = number /** temperature in celcius */

type Mode = 'cool' | 'heat'

const TEMPERATURE_MAX_VALUE_C = 30
const TEMPERATURE_MIN_VALUE_C = 16

/**
 * The air conditioner will report a single API "target temperature", while Homekit
 * supports a target temperature for both heat & cool simultaneously.
 * To support this, we still emit two characteristics, but only accept "set" commands
 * depending on the current targetState of the appliance.
 */
export default class AbstractSplithresholdCharacteristic extends AbstractCharacteristic<
  State,
  ApiValue,
  typeof Characteristic.CoolingThresholdTemperature
> {
  mode: Mode

  constructor(
    platform: HomebridgeLgThinqPlatform,
    service: Service,
    device: LgAirConditionerPlatformAccessory,
    mode: Mode,
  ) {
    super(
      platform,
      service,
      device,
      mode === 'cool'
        ? platform.Characteristic.CoolingThresholdTemperature
        : platform.Characteristic.HeatingThresholdTemperature,
      'Set',
      'airState.tempState.target',
    )

    this.mode = mode
    service
      .getCharacteristic(this.characteristic)
      // min/max as defined in product manual
      .setProps({
        minValue: TEMPERATURE_MIN_VALUE_C,
        maxValue: TEMPERATURE_MAX_VALUE_C,
        minStep: 0.5,
      })
  }

  handleSet?(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    if (super.handleSet) {
      super.handleSet(value, callback)
    }
  }

  getStateFromApiValue(apiValue: ApiValue): State {
    return this.getHomeKitCelsiusForLGAPICelsius(apiValue)
  }

  getApiValueFromState(state: State): ApiValue {
    return this.getLGAPICelsiusForHomeKitCelsius(state)
  }
}
