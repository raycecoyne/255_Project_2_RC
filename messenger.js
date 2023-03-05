'use strict'

/** ******* Imports ********/

const {
  /* The following functions are all of the cryptographic
  primatives that you should need for this assignment.
  See lib.js for details on usage. */
  byteArrayToString,
  genRandomSalt,
  generateEG, // async
  computeDH, // async
  verifyWithECDSA, // async
  HMACtoAESKey, // async
  HMACtoHMACKey, // async
  HKDF, // async
  encryptWithGCM, // async
  decryptWithGCM,
  cryptoKeyToJSON, // async
  govEncryptionDataStr
} = require('./lib')

/** ******* Implementation ********/

class MessengerClient {
  constructor (certAuthorityPublicKey, govPublicKey) {
    // the certificate authority DSA public key is used to
    // verify the authenticity and integrity of certificates
    // of other users (see handout and receiveCertificate)

    // you can store data as needed in these objects.
    // Feel free to modify their structure as you see fit.
    this.caPublicKey = certAuthorityPublicKey
    this.govPublicKey = govPublicKey
    this.conns = {} // data for each active connection
    this.certs = {} // certificates of other users
    this.EGKeyPair = {} // keypair from generateCertificate

  }

  /**
   * Generate a certificate to be stored with the certificate authority.
   * The certificate must contain the field "username".
   *
   * Arguments:
   *   username: string
   *
   * Return Type: certificate object/dictionary
   */
  async generateCertificate (username) {
    //throw ('not implemented!')
    this.EGKeyPair = await generateEG()

    const certificate = {
      username: username,
      pub: this.EGKeyPair.pub
    }

    return certificate
  }

  /**
 * Receive and store another user's certificate.
 *
 * Arguments:
 *   certificate: certificate object/dictionary
 *   signature: string
 *
 * Return Type: void
 */
  async receiveCertificate (certificate, signature) {
  // The signature will be on the output of stringifying the certificate
  // rather than on the certificate directly.
    //throw ('not implemented!')
  
    const certString = JSON.stringify(certificate)
    const verification = await verifyWithECDSA(this.caPublicKey, certString, signature)

    if (verification) {
      this.certs[certificate.username] = certificate.pub
      //this.conns[certificate.username] = {sendChain:{}, receiveChain:{}}
    }
    else{
      throw('Invalid certificate')
    }
  }

  /**
 * Generate the message to be sent to another user.
 *
 * Arguments:
 *   name: string
 *   plaintext: string
 *
 * Return Type: Tuple of [dictionary, string]
 */
  async sendMessage (name, plaintext) {
    //throw ('not implemented!')
    //Generate unique message key
    const SharedSecretDH = await computeDH(this.EGKeyPair.sec,this.certs[name])
    const derivedKey = await HMACtoAESKey(SharedSecretDH,"AESKeyGen")
    const salt = await genRandomSalt()
    const ciphertext = await encryptWithGCM(derivedKey,plaintext,salt)
    const header = {salt: salt}
    return [header, ciphertext]
  }

  /**
 * Decrypt a message received from another user.
 *
 * Arguments:
 *   name: string
 *   [header, ciphertext]: Tuple of [dictionary, string]
 *
 * Return Type: string
 */
  async receiveMessage (name, [header, ciphertext]) {
    //throw ('not implemented!')
    const SharedSecretDH = await computeDH(this.EGKeyPair.sec,this.certs[name])
    const derivedKey = await HMACtoAESKey(SharedSecretDH,"AESKeyGen")
    const plaintext = await decryptWithGCM(derivedKey,ciphertext,header.salt)
    console.log()
    
    return byteArrayToString(plaintext)
  }

};

module.exports = {
  MessengerClient
}
