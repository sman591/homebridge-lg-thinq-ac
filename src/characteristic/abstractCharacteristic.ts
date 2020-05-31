import type {
  Service,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Characteristic as HomebridgeCharacteristic,
  CharacteristicValue,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
} from 'homebridge'

import { HomebridgeLgThinqPlatform } from '../platform'
import type { GetDeviceResponse } from '../thinq/apiTypes'

export default abstract class AbstractCharacteristic<
  State extends CharacteristicValue,
  ApiValue extends string | number | boolean | undefined | null,
  Characteristic extends typeof HomebridgeCharacteristic /** comes from this.platform.Characteristic.____ */
> {
  private platform: HomebridgeLgThinqPlatform
  service: Service
  deviceId: string
  cachedState?: State
  characteristic: Characteristic /** comes from this.platform.Characteristic.____ */

  get thinqApi() {
    return this.platform.thinqApi
  }

  constructor(
    platform: HomebridgeLgThinqPlatform,
    service: Service,
    deviceId: string,
    characteristic: Characteristic,
  ) {
    this.platform = platform
    this.service = service
    this.deviceId = deviceId
    this.characteristic = characteristic
  }

  abstract register(): void

  abstract getStateFromApiValue(apiValue: ApiValue): State
  abstract getApiValueFromState(state: State): ApiValue

  /** Take in an updated device snapshot */
  abstract handleUpdatedSnapshot(
    snapshot: GetDeviceResponse['result']['snapshot'],
  ): void

  /** Handle a "set" command from Homebridge to update this characteristic */
  abstract handleSet(
    value: CharacteristicValue,
    callback: CharacteristicSetCallback,
  ): void

  /** Handle a "get" command from Homebridge */
  abstract handleGet(callback: CharacteristicGetCallback): void

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
