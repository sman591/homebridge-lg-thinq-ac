import { CharacteristicEventTypes } from 'homebridge'
import type {
  Service,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Characteristic as HomebridgeCharacteristic,
  CharacteristicValue,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  WithUUID,
} from 'homebridge'

import { HomebridgeLgThinqPlatform } from '../platform'
import type { GetDeviceResponse } from '../thinq/apiTypes'

export default abstract class AbstractCharacteristic<
  State extends CharacteristicValue,
  ApiValue extends string | number,
  Characteristic extends WithUUID<{
    new (): HomebridgeCharacteristic
  }> /** Comes from this.platform.Characteristic.____ */,
> {
  private platform: HomebridgeLgThinqPlatform
  private service: Service
  private deviceId: string
  private cachedState?: State
  characteristic: Characteristic /** Comes from this.platform.Characteristic.____ */
  private apiCommand: 'Set' | 'Operation'
  private apiDataKey: keyof GetDeviceResponse['result']['snapshot']

  get thinqApi() {
    return this.platform.thinqApi
  }

  constructor(
    platform: HomebridgeLgThinqPlatform,
    service: Service,
    deviceId: string,
    characteristic: Characteristic,
    apiCommand: 'Set' | 'Operation',
    apiDataKey: keyof GetDeviceResponse['result']['snapshot'],
  ) {
    this.platform = platform
    this.service = service
    this.deviceId = deviceId
    this.characteristic = characteristic
    this.apiCommand = apiCommand
    this.apiDataKey = apiDataKey

    if (this.handleSet) {
      // read-only characteristics won't have a handleSet
      this.service
        .getCharacteristic(this.characteristic)
        .on(CharacteristicEventTypes.SET, this.handleSet.bind(this))
    }
  }

  /** Transform Homebridge state to what the ThinQ API expects */
  abstract getStateFromApiValue(apiValue: ApiValue): State

  /** Transform the value from the ThinQ API to Homebridge state.
   * NOTE: This should make use of this.characteristic.____ enum values
   */
  abstract getApiValueFromState(state: State): ApiValue

  /** Take in an updated device snapshot */
  handleUpdatedSnapshot(snapshot: GetDeviceResponse['result']['snapshot']) {
    try {
      const apiValue = snapshot[this.apiDataKey] as ApiValue
      this.logDebug('handleUpdatedSnapshot', apiValue)
      this.cachedState = this.getStateFromApiValue(apiValue)
      this.service.updateCharacteristic(this.characteristic, this.cachedState)
    } catch (error) {
      this.logError('Error parsing state', `${error}`)
    }
  }

  /** Handle a "set" command from Homebridge to update this characteristic */
  handleSet?(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    this.logDebug('Triggered SET:', value)
    if (!this.thinqApi) {
      this.logError('API not initialized yet')
      return
    }

    // Double-transform the value
    const targetState = this.getStateFromApiValue(
      this.getApiValueFromState(value as State),
    )
    this.logDebug('targetState', targetState)

    if (targetState === this.cachedState) {
      // The air conditioner will make a sound every time this API is called.
      // To avoid unnecessary chimes, we'll optimistically skip sending the API call.
      this.logDebug('State equals cached state. Skipping.', targetState)
      callback(null)
      return
    }

    const apiValue = this.getApiValueFromState(targetState)

    this.thinqApi
      .sendCommand(this.deviceId, this.apiCommand, this.apiDataKey, apiValue)
      .then(() => {
        this.cachedState = targetState
        callback(null)
      })
      .catch((error) => {
        this.logError('Failed to set state', targetState, `${error}`)
        callback(error)
      })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logError(message: string, ...parameters: any[]) {
    this.platform.log.error(
      this.constructor.name + ': ' + message,
      ...parameters,
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logDebug(message: string, ...parameters: any[]) {
    this.platform.log.debug(
      this.constructor.name + ': ' + message,
      ...parameters,
    )
  }
}
