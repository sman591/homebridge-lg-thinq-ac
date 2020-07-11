import type { Logger, Service } from 'homebridge'

import type { HomebridgeLgThinqPlatform } from './platform'

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Array<AbstractCharacteristic<any, any, any>> {
  switch (model) {
    case 'RAC_056905_WW':
      return [
        new ActiveCharacteristic(platform, service, deviceId),
        new SwingModeCharacteristic(platform, service, deviceId),
        new RotationSpeedCharacteristic(platform, service, deviceId, 4),
        new CoolingThresholdTemperatureCharacteristic(
          platform,
          service,
          deviceId,
        ),
        new HeatingThresholdTemperatureCharacteristic(
          platform,
          service,
          deviceId,
        ),
        new TargetHeaterCoolerStateCharacteristic(
          platform,
          service,
          deviceId,
          true,
        ),
        new CurrentTemperatureCharacteristic(platform, service, deviceId),
      ]
    // LW8017ERSM
    case 'WIN_056905_WW':
      return [
        new ActiveCharacteristic(platform, service, deviceId),
        new RotationSpeedCharacteristic(platform, service, deviceId),
        new CoolingThresholdTemperatureCharacteristic(
          platform,
          service,
          deviceId,
        ),
        new HeatingThresholdTemperatureCharacteristic(
          platform,
          service,
          deviceId,
        ),
        new TargetHeaterCoolerStateCharacteristic(platform, service, deviceId),
        new CurrentTemperatureCharacteristic(platform, service, deviceId),
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
        new ActiveCharacteristic(platform, service, deviceId),
        new SwingModeCharacteristic(platform, service, deviceId),
        new RotationSpeedCharacteristic(platform, service, deviceId),
        new CoolingThresholdTemperatureCharacteristic(
          platform,
          service,
          deviceId,
        ),
        new HeatingThresholdTemperatureCharacteristic(
          platform,
          service,
          deviceId,
        ),
        new TargetHeaterCoolerStateCharacteristic(platform, service, deviceId),
        new CurrentTemperatureCharacteristic(platform, service, deviceId),
      ]
  }
}
