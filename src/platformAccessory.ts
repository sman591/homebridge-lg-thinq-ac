import type { Service, PlatformAccessory } from 'homebridge'
import type {
  GetDeviceResponse,
  GetDashboardResponse,
  GetModelInfoResponse,
} from './thinq/apiTypes'

import { HomebridgeLgThinqPlatform } from './platform'
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
  public lockTemperature = false

  getDevice(): Unpacked<GetDashboardResponse['result']['item']> {
    return this.accessory.context.device
  }

  getDeviceId() {
    return this.getDevice()?.deviceId
  }

  getModelInfo(): GetModelInfoResponse {
    return this.accessory.context.modelInfo
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
        'Not available',
      )

    this.service =
      this.accessory.getService(this.platform.Service.HeaterCooler) ??
      this.accessory.addService(this.platform.Service.HeaterCooler)

    // To avoid "Cannot add a Service with the same UUID another Service without also defining a unique 'subtype' property." error,
    // when creating multiple services of the same type, you need to use the following syntax to specify a name and subtype id:
    // this.accessory.getService('NAME') ?? this.accessory.addService(this.platform.Service.Lightbulb, 'NAME', 'USER_DEFINED_SUBTYPE');
    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb
    this.characteristics = getCharacteristicsForModel(
      this.platform,
      this.service,
      this,
      this.platform.log,
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

  async updateCharacteristics(
    fromCache = false,
    skipUUID: string | null = null,
  ) {
    if (!fromCache && !this.platform.thinqApi?.getIsLoggedIn()) {
      this.platform.log.debug('Not logged in; skipping updateCharacteristics()')
      return
    }

    try {
      let device = this.getDevice().snapshot
      if (!fromCache && this.platform.thinqApi) {
        device = (
          await this.platform.thinqApi.getDevice(this.getDeviceId()!)
        ).result.snapshot
      }

      for (const characteristic of this.characteristics) {
        if (skipUUID !== null && characteristic.getUUID() === skipUUID) {
          continue
        }

        try {
          characteristic.handleUpdatedSnapshot(
            <Unpacked<GetDeviceResponse['result']['snapshot']>>device,
          )
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
