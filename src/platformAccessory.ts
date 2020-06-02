import { CharacteristicEventTypes } from 'homebridge'
import type {
  Service,
  PlatformAccessory,
  CharacteristicValue,
  CharacteristicSetCallback,
} from 'homebridge'

import { HomebridgeLgThinqPlatform } from './platform'
import {
  modeFromValue,
  currentHeaterCoolerStateFromMode,
  targetHeaterCoolerStateFromMode,
} from './thinq/convert'
import { GetDashboardResponse } from './thinq/apiTypes'
import ActiveCharacteristic from './characteristic/activeCharacteristic'
import AbstractCharacteristic from './characteristic/abstractCharacteristic'
import SwingModeCharacteristic from './characteristic/swingModeCharacteristic'
import RotationSpeedCharacteristic from './characteristic/rotationSpeedCharacteristic'
import CoolingThresholdTemperatureCharacteristic from './characteristic/coolingThresholdTemperatureCharacteristic'
import HeatingThresholdTemperatureCharacteristic from './characteristic/heatingThresholdTemperatureCharacteristic'

type Unpacked<T> = T extends (infer U)[] ? U : T

type cachedStateConfig = {
  currentTemperature: number | null
  mode: 'cool' | 'heat' | 'fan' | null
}

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class LgAirConditionerPlatformAccessory {
  private service: Service
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private characteristics: Array<AbstractCharacteristic<any, any, any>>

  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */
  private cachedState: cachedStateConfig = {
    currentTemperature: null,
    mode: null,
  }

  getDevice(): Unpacked<GetDashboardResponse['result']['item']> | undefined {
    return this.accessory.context.device
  }

  getDeviceId() {
    return this.getDevice()?.deviceId
  }

  constructor(
    private readonly platform: HomebridgeLgThinqPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    // set accessory information
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(
        this.platform.Characteristic.Manufacturer,
        'LG Electronics',
      )
      .setCharacteristic(
        this.platform.Characteristic.Model,
        this.getDevice()?.modelName || 'Not available',
      )
      .setCharacteristic(
        this.platform.Characteristic.Name,
        this.getDevice()?.alias || 'Not available',
      )

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.service =
      this.accessory.getService(this.platform.Service.HeaterCooler) ??
      this.accessory.addService(this.platform.Service.HeaterCooler)

    // To avoid "Cannot add a Service with the same UUID another Service without also defining a unique 'subtype' property." error,
    // when creating multiple services of the same type, you need to use the following syntax to specify a name and subtype id:
    // this.accessory.getService('NAME') ?? this.accessory.addService(this.platform.Service.Lightbulb, 'NAME', 'USER_DEFINED_SUBTYPE');

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    const deviceId = this.getDeviceId()!
    this.characteristics = [
      new ActiveCharacteristic(this.platform, this.service, deviceId),
      new SwingModeCharacteristic(this.platform, this.service, deviceId),
      new RotationSpeedCharacteristic(this.platform, this.service, deviceId),
      new CoolingThresholdTemperatureCharacteristic(
        this.platform,
        this.service,
        deviceId,
      ),
      new HeatingThresholdTemperatureCharacteristic(
        this.platform,
        this.service,
        deviceId,
      ),
      // new TargetHeaterCoolerStateCharacteristic(
      //   this.platform,
      //   this.service,
      //   deviceId,
      // ),
    ]

    // // create handlers for required characteristics
    this.service
      .getCharacteristic(this.platform.Characteristic.TargetHeaterCoolerState)
      .on(
        CharacteristicEventTypes.SET,
        this.handleTargetHeaterCoolerStateSet.bind(this),
      )

    this.updateCharacteristics()
    const refreshInterval = this.platform.getRefreshIntervalMinutes()
    this.platform.log.info(
      `Starting refresh interval (set to ${refreshInterval} minutes)`,
    )
    setInterval(
      this.updateCharacteristics.bind(this),
      refreshInterval * 60 * 1000,
    )
    this.renewMonitoring()
    setInterval(
      this.renewMonitoring.bind(this),
      60 * 1000, // every 60 seconds
    )
  }

  async updateCharacteristics() {
    if (!this.platform.thinqApi?.getIsLoggedIn()) {
      this.platform.log.debug('Not logged in; skipping updateCharacteristics()')
      return
    }

    try {
      this.platform.log.debug('Getting device status', this.getDeviceId())
      const device = await this.platform.thinqApi.getDevice(this.getDeviceId()!)
      this.platform.log.debug('device response', device)
      this.platform.log.debug(
        'device response.result.snapshot',
        device.result.snapshot,
      )

      for (const characteristic of this.characteristics) {
        try {
          characteristic.handleUpdatedSnapshot(device.result.snapshot)
        } catch (error) {
          this.platform.log.error(
            'Error updating characteristic ' + characteristic.constructor.name,
            error.toString(),
          )
        }
      }

      try {
        this.cachedState.mode = modeFromValue(
          ('' + device.result.snapshot['airState.opMode']) as '0' | '1' | '2',
        )
      } catch (error) {
        this.platform.log.error('Error parsing mode', error.toString())
      }

      this.cachedState.currentTemperature =
        device.result.snapshot['airState.tempState.current']

      // Emit updates to homebridge
      this.updateCharacteristicsFromState()

      this.platform.log.debug('Pushed updates to HomeKit', this.cachedState)
    } catch (error) {
      this.platform.log.error('Error during interval update', error.toString())
    }
  }

  async renewMonitoring() {
    if (!this.platform.thinqApi?.getIsLoggedIn()) {
      this.platform.log.debug('Not logged in; skipping renewMonitoring()')
      return
    }
    this.platform.log.debug('Renewing monitoring', this.getDeviceId())
    try {
      await this.platform.thinqApi.sendAllEventEnable(this.getDeviceId()!)
    } catch (error) {
      this.platform.log.error('Error renewing monitor', error.toString())
    }
  }

  updateCharacteristicsFromState() {
    if (this.cachedState.currentTemperature) {
      this.service.updateCharacteristic(
        this.platform.Characteristic.CurrentTemperature,
        this.cachedState.currentTemperature,
      )
    }
    if (this.cachedState.mode) {
      this.service.updateCharacteristic(
        this.platform.Characteristic.CurrentHeaterCoolerState,
        currentHeaterCoolerStateFromMode(this.cachedState.mode),
      )
      this.service.updateCharacteristic(
        this.platform.Characteristic.TargetHeaterCoolerState,
        targetHeaterCoolerStateFromMode(this.cachedState.mode),
      )
    }
  }

  handleTargetHeaterCoolerStateSet(
    value: CharacteristicValue,
    callback: CharacteristicSetCallback,
  ) {
    this.platform.log.debug('Triggered SET Heater Cooler State:', value)
    if (!this.platform.thinqApi) {
      this.platform.log.error('API not initialized yet')
      return
    }

    let mode: 'cool' | 'heat' | 'fan'
    switch (value) {
      case this.platform.Characteristic.TargetHeaterCoolerState.COOL:
        mode = 'cool'
        break
      case this.platform.Characteristic.TargetHeaterCoolerState.HEAT:
        mode = 'heat'
        break
      case this.platform.Characteristic.TargetHeaterCoolerState.AUTO:
      default:
        mode = 'fan'
    }

    if (mode === this.cachedState.mode) {
      // The air conditioner will make a sound every time this API is called.
      // To avoid unnecessary chimes, we'll optimistically skip sending the API call.
      this.platform.log.debug(
        'Target heater cooler state equals cached state. Skipping.',
        mode,
      )
      callback(null, value)
      return
    }

    this.platform.thinqApi
      .setMode(this.getDeviceId()!, mode)
      .then(() => {
        this.cachedState.mode = mode
        callback(null, value)
      })
      .catch((error) => {
        this.platform.log.error('Failed to set mode', mode, error.toString())
        callback(error)
      })
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  // setOn(value: CharacteristicValue, callback: CharacteristicSetCallback) {
  //   // implement your own code to turn your device on/off
  //   this.exampleStates.On = value as boolean

  //   this.platform.log.debug('Set Characteristic On ->', value)

  //   // you must call the callback function
  //   callback(null)
  // }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possbile. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  // getOn(callback: CharacteristicGetCallback) {
  //   // implement your own code to check if the device is on
  //   const isOn = this.exampleStates.On

  //   this.platform.log.debug('Get Characteristic On ->', isOn)

  //   // you must call the callback function
  //   // the first argument should be null if there were no errors
  //   // the second argument should be the value to return
  //   callback(null, isOn)
  // }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, changing the Brightness
   */
  // setBrightness(
  //   value: CharacteristicValue,
  //   callback: CharacteristicSetCallback,
  // ) {
  //   // implement your own code to set the brightness
  //   this.exampleStates.Brightness = value as number

  //   this.platform.log.debug('Set Characteristic Brightness -> ', value)

  //   // you must call the callback function
  //   callback(null)
  // }
}
