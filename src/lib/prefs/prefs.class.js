import { defaultPrefs } from '../default/prefs';

export class Prefs {
  constructor({ storageChangedCB }) {
    this._prefs = defaultPrefs;
    this._storageChangedCB = storageChangedCB;
  }

  init() {
    return browser.storage.local.get().then(prefsList => {
      if (Array.isArray(prefsList)) {
        this._prefs = Object.assign({}, this._prefs, prefsList[0]);
      } else {
        this._prefs = Object.assign({}, this._prefs, prefsList);
      }

      browser.storage.onChanged.addListener(this._onStorageChanged.bind(this));
    });
  }

  _onStorageChanged(changes, areaName) {
    if (areaName === 'local') {
      this._prefs = Object.assign({}, this._prefs, changes);
    }
    if (typeof this._storageChangedCB === 'function') {
      this._storageChangedCB();
    }
  }

  get() {
    return this._prefs;
  }
}
