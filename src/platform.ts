import { readFileSync, writeFileSync } from 'fs'
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
import ThinqApi from './thinq/api'
import ThinqAuth, { ThinqAuthConfig } from './thinq/auth'
import { ThinqConfig, PartialThinqConfig } from './thinq/thinqConfig'

const AUTH_REFRESH_INTERVAL = 10 * 60 * 1000 // 10 minutes

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

  public thinqAuth: ThinqAuth | undefined
  public thinqApi: ThinqApi | undefined

  private didFinishLaunching: Promise<void>
  private finishedLaunching: Function | undefined

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.didFinishLaunching = new Promise(
      (resolve) => (this.finishedLaunching = resolve),
    )
    this.log.debug('Finished initializing platform:', this.config.name)

    this.initialize()

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on(APIEvent.DID_FINISH_LAUNCHING, () => {
      this.log.debug('Executed didFinishLaunching callback')
      if (this.finishedLaunching) {
        this.finishedLaunching()
      }
    })
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.debug('Restoring accessory from cache:', accessory.displayName)

    // create the accessory handler
    // this is imported from `platformAccessory.ts`
    new ExamplePlatformAccessory(this, accessory)

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory)
  }

  async initialize() {
    try {
      const thinqConfig = await this.initializeThinqConfig()
      this.thinqAuth = ThinqAuth.fromConfig(
        this.log,
        thinqConfig,
        this.config as ThinqAuthConfig,
      )
      this.thinqApi = new ThinqApi(thinqConfig, this.thinqAuth)
      await this.inititializeAuth()
      this.startRefreshTokenInterval()
      this.discoverDevicesWhenReady()
    } catch (error) {
      this.log.error(error)
    }
  }

  async initializeThinqConfig() {
    const partialThinqConfig: PartialThinqConfig = {
      countryCode: this.config.country_code,
      languageCode: this.config.language_code,
    }
    const gatewayUri = await ThinqApi.getGatewayUri(partialThinqConfig)
    const thinqConfig: ThinqConfig = {
      apiBaseUri: gatewayUri.result.thinq2Uri,
      accessTokenUri: `https://${partialThinqConfig.countryCode.toLowerCase()}.lgeapi.com/oauth/1.0/oauth2/token`,
      redirectUri: `${gatewayUri.result.empUri}/login/iabClose`,
      authorizationUri: `${gatewayUri.result.empSpxUri}/login/signIn`,
      countryCode: partialThinqConfig.countryCode,
      languageCode: partialThinqConfig.languageCode,
    }
    return thinqConfig
  }

  async inititializeAuth() {
    this.updateAndReplaceConfig()
    const redirectedUrl = this.config.auth_redirected_url as unknown
    if (this.thinqAuth?.getIsLoggedIn()) {
      this.log.info('Already logged into ThinQ')
      await this.refreshAuth()
    } else if (typeof redirectedUrl === 'string' && redirectedUrl !== '') {
      this.log.info('Initiating auth with provided redirect URL')
      try {
        await this.thinqAuth!.processLoginResult(redirectedUrl)
        this.updateAndReplaceConfig()
      } catch (error) {
        this.log.error('Error setting refresh token', error)
        throw error
      }
    } else {
      this.log.debug(
        'Redirected URL not stored in config and no existing auth state. Skipping initializeAuth().',
      )
      throw new Error('Auth not ready yet, please log in.')
    }
  }

  private startRefreshTokenInterval() {
    setInterval(() => this.refreshAuth(), AUTH_REFRESH_INTERVAL)
  }

  private async refreshAuth() {
    this.log.debug('refreshAuth()')
    try {
      await this.thinqAuth!.initiateRefreshToken()
      this.updateAndReplaceConfig()
    } catch (error) {
      this.log.error(
        'Failed to refresh token during interval',
        error.toString(),
      )
    }
  }

  private async discoverDevicesWhenReady() {
    await this.didFinishLaunching
    // run the method to discover / register your devices as accessories
    try {
      await this.discoverDevices()
    } catch (error) {
      this.log.error('Error discovering devices', error.toString())
    }
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  async discoverDevices() {
    if (!this.thinqAuth?.getIsLoggedIn()) {
      this.log.info('Not logged in; skipping discoverDevices()')
      return
    }

    const dashboardResponse = await this.thinqApi!.getDashboard()

    this.log.debug('dashboardResponse', dashboardResponse)

    this.log.info(
      `Discover found ${dashboardResponse.result.item.length} total devices`,
    )

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

      const matchingAccessories = this.accessories.filter(
        (accessory) => accessory.UUID === uuid,
      )

      if (matchingAccessories.length > 0) {
        this.log.info('Existing accessory:', device.alias)
        // check that the device has not already been registered by checking the
        // cached devices we stored in the `configureAccessory` method above
        for (const accessory of matchingAccessories) {
          accessory.context.device = device
        }
      } else {
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

  refreshIntervalMinutes() {
    const fallbackDefault = 1
    try {
      const parsedValue = parseFloat(this.config.refresh_interval)
      if (parsedValue > 0.1 && parsedValue < 100000) {
        return parsedValue
      }
    } catch (error) {
      this.log.error('Failed to parse refresh_interval from config', error)
    }
    return fallbackDefault
  }

  updateAndReplaceConfig() {
    const configPath = this.api.user.configPath()
    const configString = readFileSync(configPath).toString()
    try {
      const config = JSON.parse(configString)
      this.log.debug(config)
      const platforms = config.platforms.filter(
        (platform: Record<string, string>) =>
          platform.platform === 'LgThinqAirConditioner',
      )
      const serializedAuth = this.thinqAuth!.serializeToConfig()
      for (const platform of platforms) {
        Object.assign(platform, serializedAuth)
      }
      writeFileSync(configPath, JSON.stringify(config))
    } catch (error) {
      this.log.error('Failed to store updated config', error)
    }
  }
}
