export type GenericResponse = {
  resultCode: string
  result: unknown
}

export type GetDeviceResponse = {
  resultCode: string
  result: {
    appType: string
    modelCountryCode: string
    countryCode: string
    modelName: string
    deviceType: number
    deviceCode: string
    alias: string
    deviceId: string
    fwVer: string
    imageFileName: string
    ssid: string
    softapId: string
    softapPass: string
    macAddress: string
    networkType: string
    timezoneCode: string
    timezoneCodeAlias: string
    utcOffset: number
    utcOffsetDisplay: string
    dstOffset: number
    dstOffsetDisplay: string
    curOffset: number
    curOffsetDisplay: string
    sdsGuide: string
    newRegYn: string
    remoteControlType: string
    userNo: string
    tftYn: string
    deviceState: string
    snapshot: {
      'airState.windStrength': number
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      static: [Record<string, any>]
      'airState.tempState.current': number
      'airState.reservation.sleepTime': number
      'airState.filterMngStates.maxTime': number
      'airState.reservation.targetTimeToStart': number
      'airState.operation': number
      'airState.opMode': number
      'airState.quality.sensorMon': number
      'airState.filterMngStates.useTime': number
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      meta: [Record<string, any>]
      'airState.energy.accumulatedTime': number
      online: true
      timestamp: number
      'airState.energy.accumulated': number
      'airState.reservation.targetTimeToStop': number
      'airState.tempState.target': number
      'airState.diagCode': number
      'airState.wDir.vStep': number
      'airState.energy.onCurrent': number
    }
    online: true
    platformType: string
    area: number
    regDt: number
    blackboxYn: string
    modelProtocol: string
    receipeVersion: number
    activeSaving: string
    smartCareV2: string
    order: number
    drServiceYn: string
    regDtUtc: string
    groupableYn: string
    controllableYn: string
    combinedProductYn: string
    masterYn: string
    tclcount: number
  }
}

export type GetDashboardResponse = {
  resultCode: '0000'
  result: {
    langPackCommonVer: string
    langPackCommonUri: string
    item: Array<{
      appType: string
      modelCountryCode: string
      countryCode: string
      modelName: string
      deviceType: number
      deviceCode: string
      alias: string
      deviceId: string
      fwVer: string
      imageFileName: string
      imageUrl: string
      smallImageUrl: string
      ssid: string
      softapId: string
      softapPass: string
      macAddress: string
      networkType: string
      timezoneCode: string
      timezoneCodeAlias: string
      utcOffset: number
      utcOffsetDisplay: string
      dstOffset: number
      dstOffsetDisplay: string
      curOffset: number
      curOffsetDisplay: string
      sdsGuide: string
      newRegYn: string
      remoteControlType: string
      userNo: string
      tftYn: string
      modelJsonVer: number
      modelJsonUri: string
      appModuleVer: number
      appModuleUri: string
      appRestartYn: string
      appModuleSize: number
      langPackProductTypeVer: number
      langPackProductTypeUri: string
      deviceState: string
      snapshot:
        | GetDeviceResponse['result']['snapshot']
        | Record<string, unknown> // could be a different product
      online: true
      platformType: string
      area: number
      regDt: number
      blackboxYn: string
      modelProtocol: string
      order: number
      drServiceYn: string
      fwInfoList: Array<{
        order: number
        checksum: string
        partNumber: string
      }>
      modemInfo: {
        modemType: string
        modelName: string
        appVersion: string
      }
      guideTypeYn: string
      guideType: string
      regDtUtc: string
      groupableYn: string
      controllableYn: string
      combinedProductYn: string
      masterYn: string
      tclcount: number
    }>
    group: []
  }
}

export type GetGatewayUriResponse = {
  resultCode: string
  result: {
    countryCode: string
    languageCode: string
    thinq1Uri: string
    thinq2Uri: string
    empUri: string
    empSpxUri: string
    rtiUri: string
    mediaUri: string
    appLatestVer: string
    appUpdateYn: string
    appLink: string
    nestSupportAppVer: string
    uuidLoginYn: string
    lineLoginYn: string
    lineChannelId: string
    cicTel: string
    cicUri: string
    isSupportVideoYn: string
    countryLangDescription: string
    googleAssistantUri: string
    smartWorldUri: string
    racUri: string
    cssUri: string
    cssWebUri: string
    iotssUri: string
    amazonDrsYn: string
    features: {
      amazonDrs: string
      pccPushProd: string
      disableWeatherCard: string
      thinqCss: string
      cicSupport: string
      pccPush: string
      qrRegisterYn: string
      pccWarrantyProd: string
      pccWarranty: string
    }
    serviceCards: Array<Record<string, unknown>>
  }
}

export type ApiHeaders = {
  'X-Thinq-App-Ver': string
  'X-Thinq-App-Type': string
  'X-Language-Code': string
  'X-Client-Id': string
  'X-Thinq-App-Level': string
  'X-Service-Code': string
  'Accept-Language': string
  'X-Message-Id': string
  Accept: string
  'Content-Type': string
  'X-Api-Key': string
  'X-Thinq-App-Os': string
  'X-Country-Code': string
  'X-Service-Phase': string
  'Accept-Encoding': string

  'X-User-No'?: string
  'X-Emp-Token'?: string
}
