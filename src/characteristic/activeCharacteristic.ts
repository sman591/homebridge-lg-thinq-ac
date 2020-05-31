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
    deviceId: string,
  ) {
    super(platform, service, deviceId, platform.Characteristic.Active)
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
      case 1:
        return this.characteristic.ACTIVE
      case 0:
        return this.characteristic.INACTIVE
      default:
        throw new Error('Unsupported API value: ' + JSON.stringify(apiValue))
    }
  }

  getApiValueFromState(): ApiValue {
    switch (this.cachedState) {
      case this.characteristic.ACTIVE:
        return 1
      case this.characteristic.INACTIVE:
        return 0
      default:
        throw new Error(
          'Unsupported state: ' + JSON.stringify(this.cachedState),
        )
    }
  }

  handleUpdatedSnapshot(snapshot: GetDeviceResponse['result']['snapshot']) {
    try {
      const apiValue = snapshot['airState.operation'] as ApiValue
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
      .setPower(this.deviceId, this.getApiValueFromState())
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
