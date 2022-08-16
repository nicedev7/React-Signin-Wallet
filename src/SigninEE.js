
import React from 'react'
import { isUndefined } from 'lodash';
import { DID } from '@elastosfoundation/elastos-connectivity-sdk-js';
import { VerifiablePresentation, DefaultDIDAdapter, DIDBackend } from '@elastosfoundation/did-js-sdk';
import jwt from 'jsonwebtoken';
import { useWeb3React } from '@web3-react/core';

import { essentialsConnector, initConnectivitySDK, isUsingEssentialsConnector } from './connect/EssentialConnectivity';
import { injected } from './connect/connectors';
import { DidResolverUrl } from './config';

const isInAppBrowser = () => window['elastos'] !== undefined && window['elastos'].name === 'essentialsiab';

function SigninEE() {
  const context = useWeb3React();
  const { activate } = context;
  const [activatingConnector, setActivatingConnector] = React.useState(null);
  const [walletAddress, setWalletAddress] = React.useState(null);
  let sessionLinkFlag = sessionStorage.getItem('SDK_LINK');

  const initializeWalletConnection = React.useCallback(async () => {
    if (sessionLinkFlag && !activatingConnector) {
      if (sessionLinkFlag === '1') {
        setWalletAddress(
          isInAppBrowser()
            ? await window['elastos'].getWeb3Provider().address
            : essentialsConnector.getWalletConnectProvider().wc.accounts[0]
        );
        setActivatingConnector(essentialsConnector);
      }
      else if (sessionLinkFlag === '2') {
        setActivatingConnector(injected);
        await activate(injected);
        setWalletAddress(await injected.getAccount());
      }
    }
  }, [sessionLinkFlag, activatingConnector]);

  React.useEffect(()=>{
    initializeWalletConnection()
  }, [])

  const handleSigninEE = async (e) => {
    if (isUsingEssentialsConnector() && essentialsConnector.hasWalletConnectSession()) {
      await signOutWithEssentials();
    } else if (essentialsConnector.hasWalletConnectSession()) {
      await essentialsConnector.disconnectWalletConnect();
    }
    await signInWithEssentials();
  }

  const handleSigninMM = async () => {
    let currentConnector = injected;
    await activate(currentConnector);
    const retAddress = await currentConnector.getAccount();
    if(!isUndefined(retAddress)) {
      console.log('loged in');
      if (currentConnector === injected) {
        sessionStorage.setItem('SDK_LINK', '2');
      }
      setActivatingConnector(currentConnector);
      setWalletAddress(await currentConnector.getAccount());
    }
  };

  const signInWithEssentials = async () => {
    initConnectivitySDK();
    const didAccess = new DID.DIDAccess();
    // let presentation;
    try {
      const presentation = await didAccess.requestCredentials({
        claims: [DID.simpleIdClaim('Your avatar', 'avatar', false), DID.simpleIdClaim('Your name', 'name', false), DID.simpleIdClaim('Your description', 'description', false)]
      });
      if (presentation) {
        const did = presentation.getHolder().getMethodSpecificId() || '';

        DIDBackend.initialize(new DefaultDIDAdapter(DidResolverUrl));
        // verify
        const vp = VerifiablePresentation.parse(JSON.stringify(presentation.toJSON()));
        
        const sDid = vp.getHolder().toString();
        if (!sDid) {
          console.log('Unable to extract owner DID from the presentation');
          return;
        }
        // Optional name
        const nameCredential = vp.getCredential(`name`);
        const name = nameCredential ? nameCredential.getSubject().getProperty('name') : '';
        // Optional bio
        const bioCredential = vp.getCredential(`description`);
        const bio = bioCredential ? bioCredential.getSubject().getProperty('description') : '';

        const user = {
          sDid,
          type: 'user',
          bio,
          name,
          // email,
          canManageAdmins: false
        };
        // succeed
        const token = jwt.sign(user, 'pasar', { expiresIn: 60 * 60 * 24 * 7 });
        // sessionStorage.setItem('PASAR_TOKEN', token);
        sessionStorage.setItem('SDK_DID', did);
        sessionStorage.setItem('SDK_LINK', '1');

        let essentialAddress = essentialsConnector.getWalletConnectProvider().wc.accounts[0]
        if (isInAppBrowser())
          essentialAddress = await window['elastos'].getWeb3Provider().address
        setWalletAddress(essentialAddress);
        setActivatingConnector(essentialsConnector);
      }
    } catch (e) {
      try {
        await essentialsConnector.getWalletConnectProvider().disconnect();
      } catch (e) {
        console.log('Error while trying to disconnect wallet connect session', e);
      }
    }
  };

  const signOutWithEssentials = async () => {
    sessionStorage.removeItem('SDK_LINK');
    sessionStorage.removeItem('SDK_DID');
    try {
      setActivatingConnector(null);
      setWalletAddress(null);
      if (isUsingEssentialsConnector() && essentialsConnector.hasWalletConnectSession())
        await essentialsConnector.disconnectWalletConnect();
      if (isInAppBrowser() && (await window['elastos'].getWeb3Provider().isConnected()))
        await window['elastos'].getWeb3Provider().disconnect();
    } catch (error) {
      console.log('Error while disconnecting the wallet', error);
    }
  };

  const handleSignout = async () => {
    if (sessionStorage.getItem('SDK_LINK') === '1') {
        await signOutWithEssentials()
    }
    else {
        await activate(null);
        setActivatingConnector(null);
        setWalletAddress(null);
        sessionStorage.removeItem('SDK_LINK');
        sessionStorage.removeItem('SDK_DID');
    }
  }

  return (
    !walletAddress?
    <div>
        <button onClick={handleSigninEE}>Sign in with EE</button>
        <button onClick={handleSigninMM}>Sign in with MM</button>
    </div>:

    <div>
        <h5>{walletAddress}</h5>
        <button onClick={handleSignout}>Sign out</button>
    </div>
  );
}

export default SigninEE;
