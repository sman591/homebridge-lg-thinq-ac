import type { Service, PlatformAccessory } from 'homebridge'

import { HomebridgeLgThinqPlatform } from './platform'
import { GetDashboardResponse, GetDeviceResponse } from './thinq/apiTypes'
import AbstractCharacteristic from './characteristic/abstractCharacteristic'
import getCharacteristicsForModel from './getCharacteristicsForModel'
import { TranslationCharacteristics } from './thinq/thinq1translation'

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

  getDevice(): Unpacked<GetDashboardResponse['result']['item']> | undefined {
    return this.accessory.context.device
  }

  getDeviceId() {
    return this.getDevice()?.deviceId
  }

  getThinqPlatformType() {
    return this.getDevice()?.platformType
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
      .setCharacteristic(
        this.platform.Characteristic.SerialNumber,
        this.getDevice()?.platformType || 'Not available',
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
    this.characteristics = getCharacteristicsForModel(
      model,
      this.platform,
      this.service,
      deviceId,
      this.platform.log,
      this.getThinqPlatformType() || 'thinq2',
    )

    // create handlers for required characteristics
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
      const platform = this.getThinqPlatformType()
      let snapshot: GetDeviceResponse['result']['snapshot']
      if (platform === 'thinq2') {
        // Standard ThinQ 2
        const device = await this.platform.thinqApi.getDevice(
          this.getDeviceId()!,
        )
        this.platform.log.debug('device response', device)
        snapshot = device.result.snapshot
      } else if (platform === 'thinq1') {
        // Legacy ThinQ 1 support
        const device = await this.platform.thinqApi.getDeviceV1(
          this.getDeviceId()!,
          '',
        )
        this.platform.log.debug('device response (thinq1)', device)
        // Dynamically translate the ThinQ 1 response to ThinQ 2
        snapshot = {} as GetDeviceResponse['result']['snapshot']
        Object.entries(TranslationCharacteristics).forEach(
          ([thinq2key, thinq1key]) => {
            const typedKey = thinq2key as keyof typeof TranslationCharacteristics
            const value = device[thinq1key]
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (isNaN(value as any)) {
              // Retain value as-is
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              snapshot[typedKey] = value as any
            } else {
              // Convert value to a number
              snapshot[typedKey] = +value
            }
          },
        )
      } else {
        throw new Error('Unsupported platform: ' + platform)
      }

      this.platform.log.debug('device snapshot', snapshot)
      for (const characteristic of this.characteristics) {
        try {
          characteristic.handleUpdatedSnapshot(snapshot)
        } catch (error) {
          this.platform.log.error(
            'Error updating characteristic ' + characteristic.constructor.name,
            error.toString(),
          )
        }
      }

      this.platform.log.debug('Finished pushing updates to HomeKit')
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
}
