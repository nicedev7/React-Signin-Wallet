const ApplicationDIDForMain = "did:elastos:iZvAak2SUHaKwBHmPFsgtVVMGtTpi4r2kY"
// const ApplicationDIDForTest = "did:elastos:ic8pRXyAT3JqEXo4PzHQHv5rsoYyEyDwpB"
export const DidResolverUrl = 'https://api.trinity-tech.io/eid'
// process.env.REACT_APP_ENV === 'production' ? 'mainnet' : 'testnet';

const rpcUrlForMain = "https://api.elastos.io/eth"
const rpcUrlForTest = "https://api-testnet.elastos.io/eth"

export const rpcURL = rpcUrlForMain
export const ApplicationDID = ApplicationDIDForMain

export const trustedProviders = [
    "did:elastos:iqjN3CLRjd7a4jGCZe6B3isXyeLy7KKDuK" // Trinity Tech KYC
]