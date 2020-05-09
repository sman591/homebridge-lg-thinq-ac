import { createHmac } from 'crypto'

export function generateTimestamp() {
  const date = new Date()
  const timestamp = date.toUTCString()
  return timestamp.replace('GMT', '+0000')
}

function generateOAuth2Signature(message: string, secretKey: string) {
  return createHmac('sha1', secretKey)
    .update(message)
    .digest()
    .toString('base64')
}

export function generateTokenSignatureTimestamp(
  requestUrl: string,
  timestamp: string,
  secretKey: string,
) {
  const message = `${requestUrl}\n${timestamp}`
  const signature = generateOAuth2Signature(message, secretKey)
  return signature
}
