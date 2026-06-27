import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.orunapp.orunapp',
  appName: 'orunapp',
  webDir: 'dist',
  
  plugins: {
    CapacitorUpdater: {
      appId: 'com.orunapp.orunapp',
      version: '0.0.0',
      autoUpdate: 'always',
      autoSplashscreen: true,
      publicKey: '-----BEGIN RSA PUBLIC KEY-----\nMIIBCgKCAQEAyy0Hu8/ySPXHhYrc/rzfC5B0v83zPDnOVSP4HQRPrHdIsiLui8/6\n2PDsC7uXQMZLijJ0fdFXc77E9UlpzlhcsvDf9pJsVsDuFvXR7tA69EOBqmgttCqW\nJoxFgvc8QOnAPn8TZQFMEk7NsGUbH+yOlW6X/kiMajDtes0mjnBfvuzAUIX5tsLX\n6RjzjYN+mINotJpr79lF8Zh4PWiT+w4JXcY65OkyjwNZu/U1NdAKax4W6PNdXHQf\n85Yeoc/jFjZnEp7kmuraKukLDyql54G+EEKPVCARpjGHThWrbNZ7/bTcTRABuKEX\nUC+8w/nK7M8bZ2h3lPY6QVfCWnFn62apSQIDAQAB\n-----END RSA PUBLIC KEY-----\n'
    },
    SplashScreen: {
      launchAutoHide: false
    }
  }
};

export default config;
