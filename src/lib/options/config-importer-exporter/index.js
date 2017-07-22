import { setValueToElem, sendValueChangeMessage } from '../options';

function importConfigValidate(config, type) {
  switch (type) {
    case 'all':
      {
        let isInvalid = false;
        const allKeyValuePair = [
          { key: 'autoConvert', type: 'number' },
          { key: 'iconAction', type: 'number' },
          { key: 'inputConvert', type: 'number' },
          { key: 'symConvert', type: 'boolean' },
          { key: 'fontCustomEnabled', type: 'boolean' },
          { key: 'fontCustomTrad', type: 'string' },
          { key: 'fontCustomSimp', type: 'string' },
          { key: 'contextMenuEnabled', type: 'boolean' },
          { key: 'contextMenuInput2Trad', type: 'boolean' },
          { key: 'contextMenuInput2Simp', type: 'boolean' },
          { key: 'contextMenuPage2Trad', type: 'boolean' },
          { key: 'contextMenuPage2Simp', type: 'boolean' },
          { key: 'contextMenuClip2Trad', type: 'boolean' },
          { key: 'contextMenuClip2Simp', type: 'boolean' },
          { key: 'urlFilterEnabled', type: 'boolean' },
          { key: 'urlFilterList', type: 'object' },
          { key: 'userPhraseEnable', type: 'boolean' },
          { key: 'userPhraseTradList', type: 'object' },
          { key: 'userPhraseSimpList', type: 'object' },
          { key: 'version', type: 'number' },
        ];

        allKeyValuePair.forEach((pair) => {
          if (isInvalid) {
            return;
          }
          if (pair.key === 'urlFilterList' && importConfigValidate(config[pair.key], 'url').error) {
            isInvalid = true;
          }
          else if ((pair.key === 'userPhraseTradList' || pair.key === 'userPhraseSimpList') && importConfigValidate(config[pair.key], 'phrase').error) {
            isInvalid = true;
          }
          else if (typeof config[pair.key] !== pair.type) {
            isInvalid = true;
          }
        });

        return isInvalid ? { error: true } : { error: false, config };
      }
    case 'url':
      {
        if (!Array.isArray(config)) {
          return { error: true };
        }

        if (config.length < 1) {
          return { error: false, config };
        }

        let isUrlInvalid = false;
        config.forEach((url) => {
          if (isUrlInvalid) {
            return;
          }
          const urlKeys = Object.keys(url).sort();
          if (urlKeys.length !== 2) {
            isUrlInvalid = true;
            return;
          }
          if (
            (url.action !== 0 && url.action !== 2 && url.action !== 3) ||
            !url.url.match(
              /^(https?\*?:\/\/)?([\d\w\*\.-]+)\.([a-z\.]{2,6})([\/\w\* \.-]*)*\/?$/,
            )
          ) {
            isUrlInvalid = true;
          }
        });
        return isUrlInvalid ? { error: true } : { error: false, config };
      }
    case 'phrase':
      {
        let isPhraseInvalid = false;
        const safeConfig = Object.assign({}, config);
        Object.keys(safeConfig).forEach((key) => {
          if (isPhraseInvalid) {
            return;
          }
          if (typeof safeConfig[key] !== 'string') {
            isPhraseInvalid = true;
          }
        });
        return isPhraseInvalid ? { error: true } : { error: false, safeConfig };
      }
    default:
      return { error: true };
  }
}

function resetListPrefs(name, partialConfig, currentPrefs) {
  // Remove all list from UI
  const list = document.getElementById(name);
  for (let i = list.children.length - 2; i > 0; i--) {
    list.removeChild(list.children[i]);
  }

  // Replace setting
  currentPrefs[name] = partialConfig;

  // Add new list to UI
  setValueToElem(name, currentPrefs[name]);

  // Save to storage
  sendValueChangeMessage(name, currentPrefs[name]);
}

function exportToFile(data, fileName) {
  const blob = new Blob([data], { type: 'text/json;charset=utf-8' });

  browser.downloads.download({
    url: URL.createObjectURL(blob),
    filename: fileName,
    saveAs: true,
  });
}

function importFromFile(callback) {
  const selectFile = document.getElementById('selectFile');
  selectFile.onchange = () => {
    if (selectFile.files && selectFile.files.length) {
      const file = selectFile.files[0];
      const reader = new FileReader();
      reader.onload = function onload(evt) {
        try {
          const data = JSON.parse(evt.target.result);
          callback(data);
        }
        catch (ex) {
          callback();
        }
      };
      reader.readAsText(file);
    }
  };
  selectFile.click();
}

export function exportAllOptions(currentPrefs) {
  exportToFile(JSON.stringify(currentPrefs), 'NewTongWenTang-Options.json');
}

export function exportUrlRule(currentPrefs) {
  exportToFile(JSON.stringify(currentPrefs.urlFilterList), 'NewTongWenTang-UrlRule.json');
}

export function exportS2TTable(currentPrefs) {
  exportToFile(JSON.stringify(currentPrefs.userPhraseTradList), 'NewTongWenTang-S2TTable.json');
}

export function exportT2STable(currentPrefs) {
  exportToFile(JSON.stringify(currentPrefs.userPhraseSimpList), 'NewTongWenTang-T2STable.json');
}

export function importAllOptions(currentPrefs) {
  importFromFile((data) => {
    if (data) {
      const validated = importConfigValidate(data, 'all');

      if (validated.error) {
        console.error('config invalid');
        return;
      }

      Object.keys(validated.config).forEach(key => {
        const elem = document.getElementById(key);
        const elemType = elem.getAttribute('type');
        if (elemType === 'listBox' || elemType === 'listBoxObj') {
          // Remove all list from UI
          for (let i = elem.children.length - 2; i > 0; i--) {
            elem.removeChild(elem.children[i]);
          }
          currentPrefs[key] = validated.config[key];
        }
        setValueToElem(key, validated.config[key]);
        sendValueChangeMessage(key, validated.config[key]);
      });
      currentPrefs = validated.config;
    }
  });
}

export function importUrlRule(currentPrefs) {
  importFromFile((data) => {
    if (data) {
      const validated = importConfigValidate(data, 'url');

      if (validated.error) {
        console.error('url config invalid');
        return;
      }

      resetListPrefs('urlFilterList', validated.config, currentPrefs);
    }
  });
}

export function importS2TTable(currentPrefs) {
  importFromFile((data) => {
    if (data) {
      const validated = importConfigValidate(data, 'phrase');

      if (validated.error) {
        console.error('s2t config invalid');
        return;
      }

      resetListPrefs('userPhraseTradList', validated.config, currentPrefs);
    }
  });
}

export function importT2STable(currentPrefs) {
  importFromFile((data) => {
    if (data) {
      const validated = importConfigValidate(data, 'phrase');

      if (validated.error) {
        console.error('t2s config invalid');
        return;
      }

      resetListPrefs('userPhraseSimpList', validated.config, currentPrefs);
    }
  });
}
