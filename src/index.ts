import type { API } from 'homebridge'

import { PLATFORM_NAME } from './settings'
import { HomebridgeLgThinqPlatform } from './platform'

/**
 * This method registers the platform with Homebridge
 */
export = (api: API) => {
  api.registerPlatform(PLATFORM_NAME, HomebridgeLgThinqPlatform)
}
