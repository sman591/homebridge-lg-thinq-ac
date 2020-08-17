import { CharacteristicEventTypes } from 'homebridge'
import type {
  Service,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Characteristic as HomebridgeCharacteristic,
  CharacteristicValue,
  CharacteristicChange,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  WithUUID,
} from 'homebridge'

import { HomebridgeLgThinqPlatform } from '../platform'
import type { LgAirConditionerPlatformAccessory } from '../platformAccessory'
import type { GetDeviceResponse } from '../thinq/apiTypes'

type Unpacked<T> = T extends (infer U)[] ? U : T

export default abstract class AbstractCharacteristic<
  State extends CharacteristicValue,
  ApiValue extends string | number,
  Characteristic extends WithUUID<{
    new (): HomebridgeCharacteristic
  }> /** Comes from this.platform.Characteristic.____ */
> {
  protected platform: HomebridgeLgThinqPlatform
  protected service: Service
  protected device: LgAirConditionerPlatformAccessory
  protected characteristic: Characteristic /** Comes from this.platform.Characteristic.____ */

  private cachedState?: State

  private apiCommand: 'Set' | 'Operation'
  private apiDataKey: keyof GetDeviceResponse['result']['snapshot']

  get thinqApi() {
    return this.platform.thinqApi
  }

  constructor(
    platform: HomebridgeLgThinqPlatform,
    service: Service,
    device: LgAirConditionerPlatformAccessory,
    characteristic: Characteristic,
    apiCommand: 'Set' | 'Operation',
    apiDataKey: keyof GetDeviceResponse['result']['snapshot'],
  ) {
    this.platform = platform
    this.service = service
    this.device = device
    this.characteristic = characteristic
    this.apiCommand = apiCommand
    this.apiDataKey = apiDataKey

    this.service
      .getCharacteristic(this.characteristic)
      .on(CharacteristicEventTypes.GET, this.handleGet.bind(this))

    if (this.handleSet) {
      // read-only characteristics won't have a handleSet
      this.service
        .getCharacteristic(this.characteristic)
        .on(CharacteristicEventTypes.SET, this.handleSet.bind(this))
    }

    if (this.handleChange) {
      this.service
        .getCharacteristic(this.characteristic)
        .on(CharacteristicEventTypes.CHANGE, this.handleChange.bind(this))
    }
  }

  /** Transform Homebridge state to what the ThinQ API expects */
  abstract getStateFromApiValue(apiValue: ApiValue): State

  /** Transform the value from the ThinQ API to Homebridge state.
   * NOTE: This should make use of this.characteristic.____ enum values
   */
  abstract getApiValueFromState(state: State): ApiValue

  getUUID(): string {
    return this.characteristic.UUID
  }

  /** Take in an updated device snapshot */
  handleUpdatedSnapshot(
    snapshot: Unpacked<GetDeviceResponse['result']['snapshot']>,
  ) {
    try {
      this.logDebug('HandleSnapshot for ' + this.characteristic.name)

      const apiValue = snapshot[this.apiDataKey] as ApiValue
      this.logDebug('handleUpdatedSnapshot', apiValue)

      this.cachedState = this.getStateFromApiValue(apiValue)
      this.service.updateCharacteristic(this.characteristic, this.cachedState)
    } catch (error) {
      this.logError('Error parsing state', error.toString())
    }
  }

  /** Handle a "change" command from Homebridge to update this characteristic */
  handleChange?(value: CharacteristicChange) {
    this.logDebug('Triggered CHANGE:', value.newValue)
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

    // The air conditioner will make a sound every time this API is called.
    // To avoid unnecessary chimes, we'll optimistically skip sending the API call.
    if (targetState === this.cachedState) {
      this.logDebug('State equals cached state. Skipping.', targetState)
      callback(null, targetState)
      return
    }

    const apiValue = this.getApiValueFromState(targetState)

    this.thinqApi
      .sendCommand(
        this.device.getDeviceId() || '',
        this.apiCommand,
        this.apiDataKey,
        apiValue,
      )
      .then(() => {
        this.cachedState = targetState
        callback(null, targetState)
      })
      .catch((error) => {
        this.logError('Failed to set state', targetState, error.toString())
        callback(error)

        // put UI back to where it was before
        this.device.updateCharacteristics(true)
      })
  }

  /** Handle a "get" command from Homebridge */
  handleGet(callback: CharacteristicGetCallback) {
    callback(null, this.cachedState)
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

  deviceUsesFahrenheit(): boolean {
    return this.device.getDevice().countryCode.startsWith('US')
  }

  roundHalf(r: number): number {
    return Math.round(r * 2) / 2
  }

  /* 
  LG Air Conditioners use a lookup table to go between Celsius and Farenheit, which we request from the 
  LG servers as part of the GetDashboard call. There are two tables, CelToFah and FahToCel, which are *not* 
  inverses of each other (unfortunately). 

  These tables are the same as the units use, so if you want your results to match what they physically display,
  you need to use the lookup tables. 

  HomeKit's API uses Celsius as its standard unit, regardless of whether the user sees Farenheit on the UI or not--that is,
  conversion happens on the iPhone. 

  Thus, to ensure the temperatures on the app and the unit match, we have to convert to Farenheit, 
  then back to Celsius for HomeKit, the latter conversion using the classic (5/9) - 32 math. 

  We do all this only if the user sees Farenheit, as I *think* this issue is moot if the units show celsius? A non-US user to confirm.
  */
  getHomeKitCelsiusForLGAPICelsius(_celsius: number): number {
    if (!this.deviceUsesFahrenheit()) {
      return _celsius
    }

    const LGCelsius = this.roundHalf(_celsius)    
    const LGCelsiusToF:Partial<Record<string, number>> = this.device.getModelInfo().Value.TempCelToFah
      .value_mapping
      const LGFarenheit = LGCelsiusToF[LGCelsius]
    
      if(LGFarenheit === undefined) {
      this.logError('getHomeKitCelsiusForLGAPICelsius input temperature ' + _celsius + ' was not found in LG mapping table')
      return _celsius
    }
    
    const HKCelsius = this.roundHalf((LGFarenheit - 32) * (5 / 9))
    this.logDebug(
      'getHomeKitCelsiusForLGAPICelsius in=' + _celsius + ' out=' + HKCelsius,
    )
    return HKCelsius   
  }

  // inverse of the above
  getLGAPICelsiusForHomeKitCelsius(_celsius: number): number {
    if (!this.deviceUsesFahrenheit()) {
      return _celsius
    }

    const HKCelsiusInFarenheit: number = Math.round(_celsius * (9 / 5) + 32)
    const LGCelsiusToF = this.device.getModelInfo().Value.TempCelToFah
      .value_mapping

    for (const LGCelsius in LGCelsiusToF) {
      const LGFarenheit = LGCelsiusToF[LGCelsius]

      if (LGFarenheit === HKCelsiusInFarenheit) {
        this.logDebug(
          'getLGAPICelsiusForHomeKitCelsius in=' +
            _celsius +
            ' out=' +
            LGCelsius,
        )

        return Number(LGCelsius)
      }
    }

    this.logError("Value " + _celsius + " wasn't found in the LG mapping table.")
    return _celsius
  }
}
