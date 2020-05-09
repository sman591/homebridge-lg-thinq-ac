import { CharacteristicEventTypes } from 'homebridge'
import type {
  Service,
  PlatformAccessory,
  CharacteristicValue,
  CharacteristicSetCallback,
  CharacteristicGetCallback,
} from 'homebridge'

import { ExampleHomebridgePlatform } from './platform'
import { setPower, getDevice } from './thinq/api'
import { powerStateFromValue, modeFromValue } from './thinq/convert'

type cachedStateConfig = {
  deviceId: string
  power: 'on' | 'off' | null
  currentTemperature: number | null
  targetTemperature: number | null
  mode: 'cool' | 'dry' | 'fan' | null
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
    deviceId: '',
    power: null,
    currentTemperature: null,
    targetTemperature: null,
    mode: null,
  }

  constructor(
    private readonly platform: ExampleHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    // set accessory information
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(
        this.platform.Characteristic.Manufacturer,
        'Default-Manufacturer',
      )
      .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model')
      .setCharacteristic(
        this.platform.Characteristic.SerialNumber,
        'Default-Serial',
      )

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.service =
      this.accessory.getService(this.platform.Service.HeaterCooler) ??
      this.accessory.addService(this.platform.Service.HeaterCooler)

    // To avoid "Cannot add a Service with the same UUID another Service without also defining a unique 'subtype' property." error,
    // when creating multiple services of the same type, you need to use the following syntax to specify a name and subtype id:
    // this.accessory.getService('NAME') ?? this.accessory.addService(this.platform.Service.Lightbulb, 'NAME', 'USER_DEFINED_SUBTYPE');

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(
      this.platform.Characteristic.Name,
      accessory.context.device.exampleDisplayName,
    )

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // create handlers for required characteristics
    this.service
      .getCharacteristic(this.platform.Characteristic.Active)
      .on(CharacteristicEventTypes.GET, this.handleActiveGet.bind(this))
      .on(CharacteristicEventTypes.SET, this.handleActiveSet.bind(this))

    // this.service
    //   .getCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState)
    //   .on(
    //     CharacteristicEventTypes.GET,
    //     this.handleCurrentHeaterCoolerStateGet.bind(this),
    //   )

    // this.service
    //   .getCharacteristic(this.platform.Characteristic.TargetHeaterCoolerState)
    //   .on(
    //     CharacteristicEventTypes.GET,
    //     this.handleTargetHeaterCoolerStateGet.bind(this),
    //   )
    //   .on(
    //     CharacteristicEventTypes.SET,
    //     this.handleTargetHeaterCoolerStateSet.bind(this),
    //   )

    // this.service
    //   .getCharacteristic(this.platform.Characteristic.CurrentTemperature)
    //   .on(
    //     CharacteristicEventTypes.GET,
    //     this.handleCurrentTemperatureGet.bind(this),
    //   )

    // EXAMPLE ONLY
    // Example showing how to update the state of a Characteristic asynchronously instead
    // of using the `on('get')` handlers.
    //
    // Here we change update the brightness to a random value every 5 seconds using
    // the `updateCharacteristic` method.
    this.updateCharacteristics()
    setInterval(
      this.updateCharacteristics.bind(this),
      this.platform.refreshIntervalMinutes(),
    )
  }

  async updateCharacteristics() {
    try {
      const device = await getDevice(this.cachedState.deviceId)

      this.cachedState.power = powerStateFromValue(
        ('' + device.result.snapshot['airState.operation']) as '1' | '0',
      )
      this.cachedState.currentTemperature =
        device.result.snapshot['airState.tempState.current']
      this.cachedState.targetTemperature =
        device.result.snapshot['airState.tempState.target']
      this.cachedState.mode = modeFromValue(
        ('' + device.result.snapshot['airState.opMode']) as '0' | '1' | '2',
      )

      this.service.updateCharacteristic(
        this.platform.Characteristic.Active,
        this.cachedState.power === 'on' ? 1 : 0,
      )
      this.service.updateCharacteristic(
        this.platform.Characteristic.CurrentTemperature,
        this.cachedState.currentTemperature,
      )
      this.service.updateCharacteristic(
        this.platform.Characteristic.CoolingThresholdTemperature,
        this.cachedState.targetTemperature,
      )

      this.platform.log.debug('Pushed updates to HomeKit', this.cachedState)
    } catch (error) {
      this.platform.log.error('Error during interval update', error)
    }
  }

  handleActiveGet(callback: CharacteristicGetCallback) {
    this.platform.log.debug('Triggered GET Active')

    // set this to a valid value for Active
    const currentValue = this.cachedState.power === 'on' ? 1 : 0

    callback(null, currentValue)
  }

  handleActiveSet(
    value: CharacteristicValue,
    callback: CharacteristicSetCallback,
  ) {
    this.platform.log.debug('Triggered SET Active:', value)

    const powerState = value === 1 ? 'on' : 'off'

    if (powerState === this.cachedState.power) {
      // The air conditioner will make a sound every time this API is called.
      // To avoid unnecessary chimes, we'll optimistically skip sending the API call.
      this.platform.log.debug(
        'Power state equals cached state. Skipping.',
        powerState,
      )
      callback(null)
      return
    }

    setPower(this.cachedState.deviceId, powerState)
      .then(() => {
        this.cachedState.power = powerState
        callback(null)
      })
      .catch((error) => callback(error))
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
