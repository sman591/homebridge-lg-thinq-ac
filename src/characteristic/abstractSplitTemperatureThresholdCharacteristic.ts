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
        minValue: 16,
        maxValue: 30,
        minStep: 0.5,
      })
  }

  handleSet?(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    if (this.device.lockTemperature) {
      // updating from cache when we're locked puts things back to where they were, essentially preventing edits
      this.device.updateCharacteristics(true)
    } else {
      if (super.handleSet) {
        super.handleSet(value, callback)
      }
    }
  }

  getStateFromApiValue(apiValue: ApiValue): State {
    // if we're "locked", i.e. in auto mode, show the full range of temperature to
    // show the user that we're not heating/cooling to any set point
    if (this.device.lockTemperature) {
      this.logDebug('Returning locked temperature values')
      if (this.mode === 'cool') {
        return 30
      } else {
        return 16
      }
    } else {
      return this.getHomeKitCelsiusForLGAPICelsius(apiValue)
    }
  }

  getApiValueFromState(state: State): ApiValue {
    return this.getLGAPICelsiusForHomeKitCelsius(state)
  }
}
