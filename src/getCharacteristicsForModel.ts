import type { Logger, Service } from 'homebridge'
import type { HomebridgeLgThinqPlatform } from './platform'
import type { LgAirConditionerPlatformAccessory } from './platformAccessory'

import ActiveCharacteristic from './characteristic/activeCharacteristic'
import AbstractCharacteristic from './characteristic/abstractCharacteristic'
import SwingModeCharacteristic from './characteristic/swingModeCharacteristic'
import RotationSpeedCharacteristic from './characteristic/rotationSpeedCharacteristic'
import CoolingThresholdTemperatureCharacteristic from './characteristic/coolingThresholdTemperatureCharacteristic'
import HeatingThresholdTemperatureCharacteristic from './characteristic/heatingThresholdTemperatureCharacteristic'
import TargetHeaterCoolerStateCharacteristic from './characteristic/targetHeaterCoolerStateCharacteristic'
import CurrentTemperatureCharacteristic from './characteristic/currentTemperatureCharacteristic'
import FilterChangeCharacteristic from './characteristic/filterChangeCharacteristic'

export default function getCharacteristicsForModel(
  platform: HomebridgeLgThinqPlatform,
  service: Service,
  device: LgAirConditionerPlatformAccessory,
  log: Logger,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Array<AbstractCharacteristic<any, any, any>> {
  const model = device.getDevice()!.modelName

  switch (model) {
    case 'RAC_056905_WW':
      return [
        new ActiveCharacteristic(platform, service, device),
        new SwingModeCharacteristic(platform, service, device),
        new RotationSpeedCharacteristic(platform, service, device),
        new FilterChangeCharacteristic(platform, service, device),
        new CurrentTemperatureCharacteristic(platform, service, device),
        new CoolingThresholdTemperatureCharacteristic(
          platform,
          service,
          device,
        ),
        new HeatingThresholdTemperatureCharacteristic(
          platform,
          service,
          device,
        ),
        new TargetHeaterCoolerStateCharacteristic(
          platform,
          service,
          device,
          true,
        ),
      ]

    // LW8017ERSM -- 3 fan modes
    // LW1517IVSM -- 4 fan modes
    case 'WIN_056905_WW':
      return [
        new ActiveCharacteristic(platform, service, device),
        new RotationSpeedCharacteristic(platform, service, device),
        new FilterChangeCharacteristic(platform, service, device),
        new CurrentTemperatureCharacteristic(platform, service, device),
        new CoolingThresholdTemperatureCharacteristic(
          platform,
          service,
          device,
        ),
        new HeatingThresholdTemperatureCharacteristic(
          platform,
          service,
          device,
        ),
        new TargetHeaterCoolerStateCharacteristic(
          platform,
          service,
          device,
          false,
          platform.config.use_eco_mode,
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
        new ActiveCharacteristic(platform, service, device),
        new RotationSpeedCharacteristic(platform, service, device),
        new FilterChangeCharacteristic(platform, service, device),
        new CurrentTemperatureCharacteristic(platform, service, device),
        new CoolingThresholdTemperatureCharacteristic(
          platform,
          service,
          device,
        ),
        new HeatingThresholdTemperatureCharacteristic(
          platform,
          service,
          device,
        ),
        new TargetHeaterCoolerStateCharacteristic(
          platform,
          service,
          device,
          false,
          false, // no eco mode
        ),
        new SwingModeCharacteristic(platform, service, device),
      ]
  }
}
