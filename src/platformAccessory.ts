import { CharacteristicEventTypes } from 'homebridge'
import type {
  Service,
  PlatformAccessory,
  CharacteristicValue,
  CharacteristicSetCallback,
} from 'homebridge'
import debounce from 'lodash.debounce'

import { HomebridgeLgThinqPlatform } from './platform'
import {
  powerStateFromValue,
  modeFromValue,
  activeFromPowerState,
  currentHeaterCoolerStateFromMode,
  targetHeaterCoolerStateFromMode,
  rotationSpeedFromFan,
  fanFromValue,
} from './thinq/convert'
import { GetDashboardResponse } from './thinq/apiTypes'

type Unpacked<T> = T extends (infer U)[] ? U : T

type cachedStateConfig = {
  power: 'on' | 'off' | null
  currentTemperature: number | null
  targetTemperatureCool: number | null
  targetTemperatureHeat: number | null
  mode: 'cool' | 'heat' | 'fan' | null
  fan: 'low' | 'medium' | 'high' | null
}

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class ExamplePlatformAccessory {
  private service: Service

  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */
  private cachedState: cachedStateConfig = {
    power: null,
    currentTemperature: null,
    targetTemperatureCool: null,
    targetTemperatureHeat: null,
    mode: null,
    fan: null,
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

    // create handlers for required characteristics
    this.service
      .getCharacteristic(this.platform.Characteristic.Active)
      .on(CharacteristicEventTypes.SET, this.handleActiveSet.bind(this))

    this.service
      .getCharacteristic(this.platform.Characteristic.TargetHeaterCoolerState)
      .on(
        CharacteristicEventTypes.SET,
        this.handleTargetHeaterCoolerStateSet.bind(this),
      )

    this.service
      .getCharacteristic(
        this.platform.Characteristic.CoolingThresholdTemperature,
      )
      .on(
        CharacteristicEventTypes.SET,
        debounce(this.handleTargetCoolingThresholdTemperature.bind(this), 1000),
      )

    this.service
      .getCharacteristic(
        this.platform.Characteristic.HeatingThresholdTemperature,
      )
      .on(
        CharacteristicEventTypes.SET,
        debounce(this.handleTargetHeatingThresholdTemperature.bind(this), 1000),
      )

    this.service
      .getCharacteristic(this.platform.Characteristic.RotationSpeed)
      .on(
        CharacteristicEventTypes.SET,
        debounce(this.handleRotationSpeedSet.bind(this), 1000),
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

      try {
        this.cachedState.power = powerStateFromValue(
          ('' + device.result.snapshot['airState.operation']) as '1' | '0',
        )
      } catch (error) {
        this.platform.log.error('Error parsing power state', error.toString())
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

      const targetTemperatureUnknown =
        device.result.snapshot['airState.tempState.target']
      switch (this.cachedState.mode) {
        case 'fan':
          this.platform.log.debug(
            'Mode is "fan", ignoring target temperature value.',
          )
          break
        case 'heat':
          this.cachedState.targetTemperatureHeat = targetTemperatureUnknown
          break
        case 'cool':
          this.cachedState.targetTemperatureCool = targetTemperatureUnknown
          break
        default:
          this.platform.log.error(
            'Mode is unknown. Assuming target temperature is for "cool" mode.',
          )
          this.cachedState.targetTemperatureCool = targetTemperatureUnknown
      }

      try {
        this.cachedState.fan = fanFromValue(
          // eslint-disable-next-line prettier/prettier
          ('' + device.result.snapshot['airState.windStrength']) as '2' | '4' | '6',
        )
      } catch (error) {
        this.platform.log.error('Error parsing fan speed', error.toString())
      }

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
    if (this.cachedState.power) {
      this.service.updateCharacteristic(
        this.platform.Characteristic.Active,
        activeFromPowerState(this.cachedState.power),
      )
    }
    if (this.cachedState.currentTemperature) {
      this.service.updateCharacteristic(
        this.platform.Characteristic.CurrentTemperature,
        this.cachedState.currentTemperature,
      )
    }
    if (this.cachedState.targetTemperatureCool) {
      this.service.updateCharacteristic(
        this.platform.Characteristic.CoolingThresholdTemperature,
        this.cachedState.targetTemperatureCool,
      )
    }
    if (this.cachedState.targetTemperatureHeat) {
      this.service.updateCharacteristic(
        this.platform.Characteristic.HeatingThresholdTemperature,
        this.cachedState.targetTemperatureHeat,
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
    if (this.cachedState.fan) {
      this.service.updateCharacteristic(
        this.platform.Characteristic.RotationSpeed,
        rotationSpeedFromFan(this.cachedState.fan),
      )
    }
  }

  handleActiveSet(
    value: CharacteristicValue,
    callback: CharacteristicSetCallback,
  ) {
    this.platform.log.debug('Triggered SET Active:', value)
    if (!this.platform.thinqApi) {
      this.platform.log.error('API not initialized yet')
      return
    }

    const powerState = Number(value) === 1 ? 'on' : 'off'

    if (powerState === this.cachedState.power) {
      // The air conditioner will make a sound every time this API is called.
      // To avoid unnecessary chimes, we'll optimistically skip sending the API call.
      this.platform.log.debug(
        'Power state equals cached state. Skipping.',
        powerState,
      )
      callback(null, value)
      return
    }

    this.platform.thinqApi
      .setPower(this.getDeviceId()!, powerState)
      .then(() => {
        this.cachedState.power = powerState
        callback(null, value)
      })
      .catch((error) => {
        this.platform.log.error(
          'Failed to set power state',
          powerState,
          error.toString(),
        )
        callback(error)
      })
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

  handleTargetCoolingThresholdTemperature(
    value: CharacteristicValue,
    callback: CharacteristicSetCallback,
  ) {
    this.platform.log.debug(
      'Triggered SET Cooling Threshold Temperature:',
      value,
    )
    if (!this.platform.thinqApi) {
      this.platform.log.error('API not initialized yet')
      return
    }

    let targetTemperature: number
    try {
      targetTemperature = Number(value)
    } catch (error) {
      this.platform.log.error(
        'Could not parse cool temperature value',
        value,
        error.toString(),
      )
      callback(error)
      return
    }

    if (
      Math.abs(
        targetTemperature - Number(this.cachedState.targetTemperatureCool),
      ) < 0.4
    ) {
      // The air conditioner will make a sound every time this API is called.
      // To avoid unnecessary chimes, we'll optimistically skip sending the API call.
      this.platform.log.debug(
        'Target cool termperature equals cached state. Skipping.',
        targetTemperature,
      )
      callback(null, value)
      return
    }

    this.platform.thinqApi
      .setTemperature(this.getDeviceId()!, targetTemperature)
      .then(() => {
        this.cachedState.targetTemperatureCool = targetTemperature
        callback(null, value)
      })
      .catch((error) => {
        this.platform.log.error(
          'Failed to set target cool temperature',
          targetTemperature,
          error,
        )
        callback(error)
      })
  }

  handleTargetHeatingThresholdTemperature(
    value: CharacteristicValue,
    callback: CharacteristicSetCallback,
  ) {
    this.platform.log.debug(
      'Triggered SET Heating Threshold Temperature:',
      value,
    )
    if (!this.platform.thinqApi) {
      this.platform.log.error('API not initialized yet')
      return
    }

    let targetTemperature: number
    try {
      targetTemperature = Number(value)
    } catch (error) {
      this.platform.log.error(
        'Could not parse heat temperature value',
        value,
        error.toString(),
      )
      callback(error)
      return
    }

    if (
      Math.abs(
        targetTemperature - Number(this.cachedState.targetTemperatureHeat),
      ) < 0.4
    ) {
      // The air conditioner will make a sound every time this API is called.
      // To avoid unnecessary chimes, we'll optimistically skip sending the API call.
      this.platform.log.debug(
        'Target heat termperature equals cached state. Skipping.',
        targetTemperature,
      )
      callback(null, value)
      return
    }

    this.platform.thinqApi
      .setTemperature(this.getDeviceId()!, targetTemperature)
      .then(() => {
        this.cachedState.targetTemperatureHeat = targetTemperature
        callback(null, value)
      })
      .catch((error) => {
        this.platform.log.error(
          'Failed to set target heat temperature',
          targetTemperature,
          error,
        )
        callback(error)
      })
  }

  handleRotationSpeedSet(
    value: CharacteristicValue,
    callback: CharacteristicSetCallback,
  ) {
    this.platform.log.debug('Triggered SET Rotation Speed:', value)
    if (!this.platform.thinqApi) {
      this.platform.log.error('API not initialized yet')
      return
    }

    const numberValue = Number(value)

    let fan: 'low' | 'medium' | 'high'
    if (numberValue > 75) {
      fan = 'high'
    } else if (numberValue > 40) {
      fan = 'medium'
    } else {
      fan = 'low'
    }

    if (fan === this.cachedState.fan) {
      // The air conditioner will make a sound every time this API is called.
      // To avoid unnecessary chimes, we'll optimistically skip sending the API call.
      this.platform.log.debug('Fan state equals cached state. Skipping.', fan)
      callback(null, value)
      return
    }

    this.platform.thinqApi
      .setFan(this.getDeviceId()!, fan)
      .then(() => {
        this.cachedState.fan = fan
        callback(null, value)
      })
      .catch((error) => {
        this.platform.log.error('Failed to set fan', fan, error.toString())
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
