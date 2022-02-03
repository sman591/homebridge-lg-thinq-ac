import type { Service, PlatformAccessory } from 'homebridge'

import { PLATFORM_NAME, PLUGIN_NAME } from './settings'
import { HomebridgeLgThinqPlatform } from './platform'
import { GetDashboardResponse } from './thinq/apiTypes'
import AbstractCharacteristic from './characteristic/abstractCharacteristic'
import getCharacteristicsForModel from './getCharacteristicsForModel'

type Unpacked<T> = T extends (infer U)[] ? U : T

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class LgAirConditionerPlatformAccessory {
  private service: Service
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private characteristics: Array<AbstractCharacteristic<any, any, any>>
  private updateCharacteristicsInterval: NodeJS.Timeout
  private renewMonitoringInterval: NodeJS.Timeout

  unregisterAccessory() {
    clearInterval(this.updateCharacteristicsInterval)
    clearInterval(this.renewMonitoringInterval)
    this.platform.api.unregisterPlatformAccessories(
      PLUGIN_NAME,
      PLATFORM_NAME,
      [this.accessory],
    )
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
    const model = this.getDevice()?.modelName || 'Not available'

    // set accessory information
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(
        this.platform.Characteristic.Manufacturer,
        'LG Electronics',
      )
      .setCharacteristic(this.platform.Characteristic.Model, model)
      .setCharacteristic(
        this.platform.Characteristic.Name,
        this.getDevice()?.alias || 'Not available',
      )

    this.service =
      this.accessory.getService(this.platform.Service.HeaterCooler) ??
      this.accessory.addService(this.platform.Service.HeaterCooler)

    // To avoid "Cannot add a Service with the same UUID another Service without also defining a unique 'subtype' property." error,
    // when creating multiple services of the same type, you need to use the following syntax to specify a name and subtype id:
    // this.accessory.getService('NAME') ?? this.accessory.addService(this.platform.Service.Lightbulb, 'NAME', 'USER_DEFINED_SUBTYPE');

    const deviceId = this.getDeviceId()!
    this.characteristics = getCharacteristicsForModel(
      model,
      this.platform,
      this.service,
      deviceId,
      this.platform.log,
    )

    // create handlers for required characteristics
    this.updateCharacteristics()
    const refreshInterval = this.platform.getRefreshIntervalMinutes()
    this.platform.log.info(
      `Starting refresh interval (set to ${refreshInterval} minutes)`,
    )
    this.updateCharacteristicsInterval = setInterval(
      this.updateCharacteristics.bind(this),
      refreshInterval * 60 * 1000,
    )
    this.renewMonitoring()
    this.renewMonitoringInterval = setInterval(
      this.renewMonitoring.bind(this),
      60 * 1000, // every 60 seconds
    )

    // @ts-expect-error This is a hack
    this.accessory.jsInstance = this
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
      const snapshot = device.result.snapshot
      this.platform.log.debug('device response.result.snapshot', snapshot)

      for (const characteristic of this.characteristics) {
        try {
          characteristic.handleUpdatedSnapshot(snapshot)
        } catch (error) {
          this.platform.log.error(
            'Error updating characteristic ' + characteristic.constructor.name,
            `${error}`,
          )
        }
      }

      this.platform.log.debug('Finished pushing updates to HomeKit')
    } catch (error) {
      this.platform.log.error('Error during interval update', `${error}`)
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
      this.platform.log.error('Error renewing monitor', `${error}`)
    }
  }
}
