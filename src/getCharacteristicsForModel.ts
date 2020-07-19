import type { Logger, Service } from 'homebridge'

import type { HomebridgeLgThinqPlatform } from './platform'
import type { ThinqPlatformType } from './thinq/apiTypes'

import ActiveCharacteristic from './characteristic/activeCharacteristic'
import AbstractCharacteristic from './characteristic/abstractCharacteristic'
import SwingModeCharacteristic from './characteristic/swingModeCharacteristic'
import RotationSpeedCharacteristic from './characteristic/rotationSpeedCharacteristic'
import CoolingThresholdTemperatureCharacteristic from './characteristic/coolingThresholdTemperatureCharacteristic'
import HeatingThresholdTemperatureCharacteristic from './characteristic/heatingThresholdTemperatureCharacteristic'
import TargetHeaterCoolerStateCharacteristic from './characteristic/targetHeaterCoolerStateCharacteristic'
import CurrentTemperatureCharacteristic from './characteristic/currentTemperatureCharacteristic'

export default function getCharacteristicsForModel(
  model: string,
  platform: HomebridgeLgThinqPlatform,
  service: Service,
  deviceId: string,
  log: Logger,
  thinqPlatform: ThinqPlatformType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Array<AbstractCharacteristic<any, any, any>> {
  switch (model) {
    case 'RAC_056905_WW':
    case 'CVT_493401_WW':
      return [
        new ActiveCharacteristic(platform, service, deviceId, thinqPlatform),
        // TODO: These units (or at least RAC_056905_WW does) support variable-position, not just "all or nothing"
        new SwingModeCharacteristic(platform, service, deviceId, thinqPlatform),
        new RotationSpeedCharacteristic(
          platform,
          service,
          deviceId,
          thinqPlatform,
          4,
        ),
        new CoolingThresholdTemperatureCharacteristic(
          platform,
          service,
          deviceId,
          thinqPlatform,
        ),
        new HeatingThresholdTemperatureCharacteristic(
          platform,
          service,
          deviceId,
          thinqPlatform,
        ),
        new TargetHeaterCoolerStateCharacteristic(
          platform,
          service,
          deviceId,
          thinqPlatform,
          true,
        ),
        new CurrentTemperatureCharacteristic(
          platform,
          service,
          deviceId,
          thinqPlatform,
        ),
      ]
    // LW8017ERSM -- 3 fan modes
    // LW1517IVSM -- 4 fan modes
    case 'WIN_056905_WW':
      return [
        new ActiveCharacteristic(platform, service, deviceId, thinqPlatform),
        new RotationSpeedCharacteristic(
          platform,
          service,
          deviceId,
          thinqPlatform,
        ),
        new CoolingThresholdTemperatureCharacteristic(
          platform,
          service,
          deviceId,
          thinqPlatform,
        ),
        new HeatingThresholdTemperatureCharacteristic(
          platform,
          service,
          deviceId,
          thinqPlatform,
        ),
        new TargetHeaterCoolerStateCharacteristic(
          platform,
          service,
          deviceId,
          thinqPlatform,
        ),
        new CurrentTemperatureCharacteristic(
          platform,
          service,
          deviceId,
          thinqPlatform,
        ),
      ]
    // LP1419IVSM
    case 'POT_056905_WW':
    default:
      if (model !== 'POT_056905_WW') {
        log.error(
          `Unsupported model: ${model}. Please open a GitHub issue at https://github.com/sman591/homebridge-lg-thinq-ac/issues to ` +
            'request support for your model. Falling back to default "POT_056905_WW" model instead.',
        )
      }
      return [
        new ActiveCharacteristic(platform, service, deviceId, thinqPlatform),
        new SwingModeCharacteristic(platform, service, deviceId, thinqPlatform),
        new RotationSpeedCharacteristic(
          platform,
          service,
          deviceId,
          thinqPlatform,
        ),
        new CoolingThresholdTemperatureCharacteristic(
          platform,
          service,
          deviceId,
          thinqPlatform,
        ),
        new HeatingThresholdTemperatureCharacteristic(
          platform,
          service,
          deviceId,
          thinqPlatform,
        ),
        new TargetHeaterCoolerStateCharacteristic(
          platform,
          service,
          deviceId,
          thinqPlatform,
        ),
        new CurrentTemperatureCharacteristic(
          platform,
          service,
          deviceId,
          thinqPlatform,
        ),
      ]
  }
}
