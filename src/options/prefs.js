import urlValidator from './url-validator';
import notifier from '../lib/notifier';
import { prefsValidKeys } from '../lib/default/prefs';
import { Prefs } from '../lib/prefs/prefs.class';

class PrefsExtend extends Prefs {
  // type: all, url, phrase
  _validate(pref, type) {
    switch (type) {
      case 'all': {
        let isInvalid = false;

        prefsValidKeys.forEach(pair => {
          if (isInvalid) {
            return;
          }
          if (pair.key === 'urlFilterList' && this._validate(pref[pair.key], 'url').error) {
            isInvalid = true;
          } else if (
            (pair.key === 'userPhraseTradList' || pair.key === 'userPhraseSimpList') &&
            this._validate(pref[pair.key], 'phrase').error
          ) {
            isInvalid = true;
          } else if (typeof pref[pair.key] !== pair.type) {
            isInvalid = true;
          }
        });

        return isInvalid ? { error: true } : { error: false, pref };
      }
      case 'url': {
        if (!Array.isArray(pref)) {
          return { error: true };
        }

        if (pref.length < 1) {
          return { error: false, pref };
        }

        let isUrlInvalid = false;
        pref.forEach(url => {
          if (isUrlInvalid) {
            return;
          }
          const urlKeys = Object.keys(url).sort();
          if (urlKeys.length !== 2) {
            isUrlInvalid = true;
            return;
          }
          if (!/[023]/.test(url.action) || !urlValidator(url.url)) {
            console.log(url);
            isUrlInvalid = true;
          }
        });
        return isUrlInvalid ? { error: true } : { error: false, pref };
      }
      case 'phrase': {
        let isPhraseInvalid = false;
        const safeConfig = Object.assign({}, pref);
        Object.keys(safeConfig).forEach(key => {
          if (isPhraseInvalid) {
            return;
          }
          if (typeof safeConfig[key] !== 'string') {
            isPhraseInvalid = true;
          }
        });
        return isPhraseInvalid ? { error: true } : { error: false, pref: safeConfig };
      }
      default:
        return { error: true };
    }
  }

  _reset(target, newPref) {
    // Remove all list from UI
    const list = document.getElementById(target);
    for (let i = list.children.length - 2; i > 0; i--) {
      list.removeChild(list.children[i]);
    }

    // Replace setting
    this._prefs[target] = newPref;

    // Save to storage
    this.sendValueChangeMessage(target, this._prefs[target]);
  }

  _exportFile(pref, fileName) {
    const blob = new Blob([pref], { type: 'text/json;charset=utf-8' });

    return browser.downloads.download({
      url: URL.createObjectURL(blob),
      filename: fileName,
      saveAs: true,
    });
  }

  _importFile() {
    return new Promise(function(resolve, reject) {
      const selectFile = document.getElementById('selectFile');
      selectFile.onchange = () => {
        if (selectFile.files && selectFile.files.length) {
          const file = selectFile.files[0];
          const reader = new FileReader();
          reader.onload = function onload(evt) {
            try {
              const data = JSON.parse(evt.target.result);
              resolve(data);
            } catch (err) {
              reject(err);
            }
          };
          reader.readAsText(file);
        }
      };
      selectFile.click();
    });
  }

  exportAllOptions() {
    this._exportFile(JSON.stringify(this._prefs), 'NewTongWenTang.prefs.json');
  }

  exportUrlRule() {
    this._exportFile(JSON.stringify(this._prefs.urlFilterList), 'NewTongWenTang.url-rule.json');
  }

  exportS2TTable() {
    this._exportFile(JSON.stringify(this._prefs.userPhraseTradList), 'NewTongWenTang.s2t.json');
  }

  exportT2STable() {
    this._exportFile(JSON.stringify(this._prefs.userPhraseSimpList), 'NewTongWenTang.t2s.json');
  }

  importAllOptions() {
    return this._importFile()
      .then(pref => {
        return this._validate(pref, 'all');
      })
      .then(validated => {
        if (validated.error) {
          notifier.create(browser.i18n.getMessage('dlgImportfail'));
          return Promise.reject('import prefs invalid');
        }

        this._prefs = validated.pref;
        Object.keys(this._prefs).forEach(key => this.sendValueChangeMessage(key, this._prefs[key]));
        return this._prefs;
      });
  }

  importUrlRule() {
    return this._importFile()
      .then(pref => this._validate(pref, 'url'))
      .then(validated => {
        if (validated.error) {
          notifier.create(browser.i18n.getMessage('dlgImportfail'));
          return Promise.reject('import prefs invalid');
        }

        this._reset('urlFilterList', validated.pref);
        return { id: 'urlFilterList', pref: validated.pref };
      });
  }

  importS2TTable() {
    return this._importFile()
      .then(pref => this._validate(pref, 'phrase'))
      .then(validated => {
        if (validated.error) {
          notifier.create(browser.i18n.getMessage('dlgImportfail'));
          return Promise.reject('import prefs invalid');
        }

        this._reset('userPhraseTradList', validated.pref);
        return { id: 'userPhraseTradList', pref: validated.pref };
      });
  }

  importT2STable() {
    return this._importFile()
      .then(pref => this._validate(pref, 'phrase'))
      .then(validated => {
        if (validated.error) {
          notifier.create(browser.i18n.getMessage('dlgImportfail'));
          return Promise.reject('import prefs invalid');
        }

        this._reset('userPhraseSimpList', validated.pref);
        notifier.create(browser.i18n.getMessage('dlgImportSuccess'));
        return { id: 'userPhraseSimpList', pref: validated.pref };
      });
  }

  // save pref to storage
  sendValueChangeMessage(id, value) {
    if (value === undefined) {
      delete this._prefs[id];
      // console.log('sendVelueChangeMessage(0): id = ' + id);
      return Promise.resolve();
    } else {
      // console.log('sendVelueChangeMessage(1): id = ' + id + ', value = ' + JSON.stringify(value));
      return browser.storage.local.set({ [id]: value }).catch(console.error);
    }
  }
}

export default new PrefsExtend({});
