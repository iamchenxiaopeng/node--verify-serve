const BLOCK = 8 // 常量

class Authenticator {
    constructor({
        secretKey,
    }) {
        this.secretKey = secretKey
    }

    calcGoogleCode () {
        const secretKeyLength = this.secretKey.length
        const secretKeyPanLength = Math.ceil(secretKeyLength / BLOCK) * 8 - secretKeyLength
        const secretKey = this.secretKey + "=".repeat(secretKeyPanLength)
        /* hmac code */
        const key = base32Decode(secretKey, 'RFC4648')
        const duration_input = parseInt((new Date()).getTime() / 30000)
        const msg = struct.pack('>Q', duration_input)
        const hmac = createHmac('sha1', key)
        hmac.update(msg)
        const googleCode = hmac.digest()
        /* Truncate */
        const o = googleCode[19] & 15
        let _googleCode = `${(struct.unpack(">I", googleCode.subarray(o, o + 4))[0] & 0x7fffffff) % 1000000}`
        if (_googleCode.length === 5) {
            _googleCode = '0' + _googleCode
        }   

        return _googleCode
    }
}