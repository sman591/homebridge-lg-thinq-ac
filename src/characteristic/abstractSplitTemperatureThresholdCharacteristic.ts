import type { Service, Characteristic } from 'homebridge'

import type { GetDeviceResponse, ThinqPlatformType } from '../thinq/apiTypes'
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
  localPlatform: HomebridgeLgThinqPlatform
  localService: Service

  constructor(
    platform: HomebridgeLgThinqPlatform,
    service: Service,
    deviceId: string,
    thinqPlatform: ThinqPlatformType,
    mode: Mode,
  ) {
    super(
      platform,
      service,
      deviceId,
      thinqPlatform,
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
      .setProps({ minValue: 16, maxValue: 30, minStep: 0.5 })
    // Usually these would be private, but this is a special characteristic
    // that needs these
    this.localPlatform = platform
    this.localService = service
  }

  // Override default handleUpdatedSnapshot() to ignore based on mode
  handleUpdatedSnapshot(snapshot: GetDeviceResponse['result']['snapshot']) {
    const targetState = this.localService.getCharacteristic(
      this.localPlatform.Characteristic.TargetHeaterCoolerState,
    ).value
    const requiredState =
      this.mode === 'cool'
        ? this.localPlatform.Characteristic.TargetHeaterCoolerState.COOL
        : this.localPlatform.Characteristic.TargetHeaterCoolerState.HEAT
    if (targetState !== requiredState) {
      this.logDebug(
        `Target state is not "${this.mode}", ignoring snapshot update`,
      )
    }
    super.handleUpdatedSnapshot(snapshot)
  }

  getStateFromApiValue(apiValue: ApiValue): State {
    return apiValue
  }

  getApiValueFromState(state: State): ApiValue {
    return state
  }
}
