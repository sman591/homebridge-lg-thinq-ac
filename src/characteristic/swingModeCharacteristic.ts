import { CharacteristicEventTypes } from 'homebridge'
import type {
  Service,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  Characteristic,
  CharacteristicValue,
} from 'homebridge'

import { HomebridgeLgThinqPlatform } from '../platform'
import AbstractCharacteristic from './abstractCharacteristic'
import { GetDeviceResponse } from '../thinq/apiTypes'

type State =
  | typeof Characteristic.SwingMode.SWING_DISABLED
  | typeof Characteristic.SwingMode.SWING_ENABLED

type ApiValue = 0 | 100

export default class SwingModeCharacteristic extends AbstractCharacteristic<
  State,
  ApiValue,
  typeof Characteristic.SwingMode
> {
  constructor(
    platform: HomebridgeLgThinqPlatform,
    service: Service,
    deviceId: string,
  ) {
    super(platform, service, deviceId, platform.Characteristic.SwingMode)
    this.register()
  }

  register() {
    this.service
      .getCharacteristic(this.characteristic)
      .on(CharacteristicEventTypes.SET, this.handleSet.bind(this))
      .on(CharacteristicEventTypes.GET, this.handleGet.bind(this))
  }

  getStateFromApiValue(apiValue: ApiValue): State {
    switch (apiValue) {
      case 0:
        return this.characteristic.SWING_DISABLED
      case 100:
        return this.characteristic.SWING_ENABLED
      default:
        throw new Error('Unsupported API value: ' + JSON.stringify(apiValue))
    }
  }

  getApiValueFromState(state: State): ApiValue {
    switch (state) {
      case this.characteristic.SWING_DISABLED:
        return 0
      case this.characteristic.SWING_ENABLED:
        return 100
      default:
        throw new Error('Unsupported state: ' + JSON.stringify(state))
    }
  }

  handleUpdatedSnapshot(snapshot: GetDeviceResponse['result']['snapshot']) {
    try {
      const apiValue = snapshot['airState.wDir.vStep'] as ApiValue
      this.logDebug('handleUpdatedSnapshot', apiValue)
      this.cachedState = this.getStateFromApiValue(apiValue)
      this.service.updateCharacteristic(this.characteristic, this.cachedState)
    } catch (error) {
      this.logError('Error parsing state', error.toString())
    }
  }

  handleSet(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    this.logDebug('Triggered SET:', value)
    if (!this.thinqApi) {
      this.logError('API not initialized yet')
      return
    }

    const targetState = value as State

    if (targetState === this.cachedState) {
      // The air conditioner will make a sound every time this API is called.
      // To avoid unnecessary chimes, we'll optimistically skip sending the API call.
      this.logDebug('State equals cached state. Skipping.', targetState)
      callback(null, targetState)
      return
    }

    this.thinqApi
      .setSwingMode(this.deviceId, this.getApiValueFromState(targetState))
      .then(() => {
        this.cachedState = targetState
        callback(null, targetState)
      })
      .catch((error) => {
        this.logError('Failed to set state', targetState, error.toString())
        callback(error)
      })
  }

  handleGet(callback: CharacteristicGetCallback) {
    callback(null, this.cachedState)
  }
}
