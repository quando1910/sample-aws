import * as crypto from 'crypto'

export function generateSha256(src: string) {
  const sha256 = crypto.createHash('sha256')
  sha256.update(src)
  return sha256.digest('hex')
}


export function sleep(msec: number) {
  new Promise(resolve => setTimeout(resolve, msec))
}
