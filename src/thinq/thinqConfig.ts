export type ThinqConfig = {
  /** @example "https://aic-service.lgthinq.com:46030/v1" */
  readonly apiBaseUri: string

  /** @example "https://us.lgeapi.com/oauth/1.0/oauth2/token" */
  readonly accessTokenUri: string

  /** @example "https://kr.m.lgaccount.com/login/iabClose" */
  readonly redirectUri: string

  /** @example "https://us.m.lgaccount.com/spx/login/signIn" */
  readonly authorizationUri: string

  /** @example "US" */
  readonly countryCode: string

  /** @example "en-US" */
  readonly languageCode: string

  /** @example "false" */
  readonly useEcoMode: boolean
}

export type PartialThinqConfig = Pick<
  ThinqConfig,
  'countryCode' | 'languageCode' | 'useEcoMode'
>
