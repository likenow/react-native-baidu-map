/**
 * Copyright (c) 2016-present, lovebing.org.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  NativeModules,
  DeviceEventEmitter
} from 'react-native';

import React, {
  Component,
  PropTypes
} from 'react';


const _module = NativeModules.BaiduGeolocationModule;

const _locatingUpdateListener = {
  listener: null,
  handler: null,
  onLocationUpdate: (resp) => {
    this.listener && this.listener(resp);
  },
  setListener: (listener) => {
    this.listener = listener;
  }
}

export default {
  geocode(city, addr) {
    return new Promise((resolve, reject) => {
      try {
        _module.geocode(city, addr);
      }
      catch (e) {
        reject(e);
        return;
      }
      const subscription = DeviceEventEmitter.once('onGetGeoCodeResult', resp => {
        resolve(resp);
        subscription.remove();
      });
    });
  },
  convertGPSCoor(lat, lng) {
    return _module.convertGPSCoor(lat, lng);
  },
  reverseGeoCode(lat, lng) {
    return new Promise((resolve, reject) => {
      try {
        _module.reverseGeoCode(lat, lng);
      }
      catch (e) {
        reject(e);
        return;
      }
      const subscription = DeviceEventEmitter.once('onGetReverseGeoCodeResult', resp => {
        resolve(resp);
        subscription.remove();
      });
    });
  },
  reverseGeoCodeGPS(lat, lng) {
    return new Promise((resolve, reject) => {
      try {
        _module.reverseGeoCodeGPS(lat, lng);
      }
      catch (e) {
        reject(e);
        return;
      }
      const subscription = DeviceEventEmitter.once('onGetReverseGeoCodeResult', resp => {
        resp.latitude = parseFloat(resp.latitude);
        resp.longitude = parseFloat(resp.longitude);
        resolve(resp);
        subscription.remove();
      });
    });
  },
  getCurrentPosition(coorType) {
    if (!coorType) {
      coorType = 'bd09ll';
    } else {
      coorType = coorType.toLowerCase();
    }
    
    return new Promise((resolve, reject) => {
      try {
        _module.getCurrentPosition(coorType);
      }
      catch (e) {
        reject(e);
        return;
      }
      const subscription = DeviceEventEmitter.once('onGetCurrentLocationPosition', resp => {
        if (resp.errcode) {
          reject(resp)
          subscription.remove();
          return;
        }
        if (!resp.address) {
          resp.address = `${resp.province} ${resp.city} ${resp.district} ${resp.streetName}`;
        }
        resolve(resp);
        subscription.remove();
      });
    });
  },
  startLocating(listener, coorType) {
    if (!coorType) {
      coorType = 'bd09ll';
    } else {
      coorType = coorType.toLowerCase();
    }
    _module.startLocating(coorType);
    if (_locatingUpdateListener.handler == null) {
      _locatingUpdateListener.handler = DeviceEventEmitter.addListener('onLocationUpdate', resp => {
        if (!resp.address) {
          resp.address = `${resp.province} ${resp.city} ${resp.district} ${resp.streetName}`;
        }
        _locatingUpdateListener.onLocationUpdate(resp);
      });
    }
    _locatingUpdateListener.setListener(listener);
  },
  stopLocating() {
    _module.stopLocating();
    if (_locatingUpdateListener.handler != null) {
      _locatingUpdateListener.handler.remove();
      _locatingUpdateListener.handler = null;
    }
  }
};
