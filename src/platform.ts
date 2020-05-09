import { APIEvent } from 'homebridge'
import type {
  API,
  DynamicPlatformPlugin,
  Logger,
  PlatformAccessory,
  PlatformConfig,
} from 'homebridge'

import { PLATFORM_NAME, PLUGIN_NAME } from './settings'
import { ExamplePlatformAccessory } from './platformAccessory'
import { getDashboard } from './thinq/api'

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class ExampleHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service = this.api.hap.Service
  public readonly Characteristic = this.api.hap.Characteristic

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = []

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name)

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on(APIEvent.DID_FINISH_LAUNCHING, () => {
      log.debug('Executed didFinishLaunching callback')
      // run the method to discover / register your devices as accessories
      this.discoverDevices()
    })
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Restoring accessory from cache:', accessory.displayName)

    // create the accessory handler
    // this is imported from `platformAccessory.ts`
    new ExamplePlatformAccessory(this, accessory)

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory)
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  async discoverDevices() {
    // EXAMPLE ONLY
    // A real plugin you would discover accessories from the local network, cloud services
    // or a user-defined array in the platform config.

    const dashboardResponse = await getDashboard()

    const devices = dashboardResponse.result.item.filter(
      (item) =>
        typeof item === 'object' &&
        'deviceType' in item &&
        item.deviceType === 401,
    )

    // loop over the discovered devices and register each one if it has not already been registered
    for (const device of devices) {
      // generate a unique id for the accessory this should be generated from
      // something globally unique, but constant, for example, the device serial
      // number or MAC address
      const uuid = this.api.hap.uuid.generate(device.deviceId)

      // check that the device has not already been registered by checking the
      // cached devices we stored in the `configureAccessory` method above
      if (!this.accessories.find((accessory) => accessory.UUID === uuid)) {
        this.log.info('Registering new accessory:', device.alias)

        // create a new accessory
        const accessory = new this.api.platformAccessory(device.alias, uuid)

        // store a copy of the device object in the `accessory.context`
        // the `context` property can be used to store any data about the accessory you may need
        accessory.context.device = device

        // create the accessory handler
        // this is imported from `platformAccessory.ts`
        new ExamplePlatformAccessory(this, accessory)

        // link the accessory to your platform
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
          accessory,
        ])

        // push into accessory cache
        this.accessories.push(accessory)

        // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
        // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }
  }
}
