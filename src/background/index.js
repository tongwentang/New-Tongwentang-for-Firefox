import { defaultPrefs } from '../lib/default/prefs';
import { convertMapping } from '../lib/default/convert-mapping';

let supportClipboard = true;
let menuId = null;
let preferences = {};

const doAction = (tab, act, flag) => {
  browser.tabs.detectLanguage(tab.id).then(lang => {
    // console.log('lang = ' + lang);
    lang = typeof lang === 'undefined' ? false : lang.toLocaleLowerCase();
    const request = {
      act,
      flag: 'trad,simp'.includes(flag) ? flag : 'auto',
      lang,
    };
    browser.tabs.sendMessage(tab.id, request, () => {});
  });
};

const getActiveTab = callback => {
  browser.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (typeof tabs !== 'undefined' && tabs.length > 0) {
      callback(tabs[0]);
    } else {
      // console.log(tabs);
    }
  });
};

const getClipData = callback => {
  let textArea = document.getElementById('clipboard');
  const onPaste = event => {
    // console.log(event.target.textContent);
    callback(event.target.textContent);
    event.target.textContent = '';
    event.target.removeEventListener('input', onPaste, false);
  };
  const body = document.querySelector('body');
  if (!textArea) {
    textArea = document.createElement('textarea');
    textArea.setAttribute('id', 'clipboard');
    textArea.setAttribute('type', 'text');
    textArea.setAttribute('value', '');
    textArea.setAttribute('contenteditable', 'true');
    body.appendChild(textArea);
  } else {
    textArea.textContent = '';
  }
  textArea.addEventListener('input', onPaste, false);
  textArea.focus();
  document.execCommand('Paste');
};

const createContextMenu = () => {
  // BUG FIX
  // 如果選項內的右鍵選單只勾選輸入區則 contenxts 陣列只能有 editable （意思是只在輸入的右鍵選單插入同文堂
  if (menuId !== null) {
    return;
  }
  const contexts = [
    'page',
    'selection',
    'link',
    'editable',
    'image',
    'video',
    'audio',
    'frame',
  ];

  // 新同文堂
  menuId = browser.contextMenus.create({
    type: 'normal',
    title: browser.i18n.getMessage('extTitle'),
    contexts,
  });

  if (preferences.contextMenuInput2Trad) {
    // 輸入區 轉繁體
    browser.contextMenus.create({
      parentId: menuId,
      type: 'normal',
      title: browser.i18n.getMessage('contextInput2Trad'),
      contexts: ['editable'],
      onclick: () => {
        getActiveTab(tab => {
          doAction(tab, 'input', 'trad');
        });
      },
    });
  }

  // 輸入區 轉簡體
  if (preferences.contextMenuInput2Simp) {
    browser.contextMenus.create({
      parentId: menuId,
      type: 'normal',
      title: browser.i18n.getMessage('contextInput2Simp'),
      contexts: ['editable'],
      onclick: () => {
        getActiveTab(tab => {
          doAction(tab, 'input', 'simp');
        });
      },
    });
  }

  // 分隔線
  if (
    (preferences.contextMenuInput2Trad || preferences.contextMenuInput2Simp) &&
    (preferences.contextMenuPage2Trad || preferences.contextMenuPage2Simp)
  ) {
    browser.contextMenus.create({
      parentId: menuId,
      type: 'separator',
      contexts: ['editable'],
    });
  }

  // 網頁 轉繁體
  if (preferences.contextMenuPage2Trad) {
    browser.contextMenus.create({
      parentId: menuId,
      type: 'normal',
      title: browser.i18n.getMessage('contextPage2Trad'),
      contexts: ['all'],
      onclick: () => {
        getActiveTab(tab => {
          doAction(tab, 'page', 'trad');
        });
      },
    });
  }

  // 網頁 轉簡體
  if (preferences.contextMenuPage2Simp) {
    browser.contextMenus.create({
      parentId: menuId,
      type: 'normal',
      title: browser.i18n.getMessage('contextPage2Simp'),
      contexts: ['all'],
      onclick: () => {
        getActiveTab(tab => {
          doAction(tab, 'page', 'simp');
        });
      },
    });
  }

  // 分隔線
  if (
    (preferences.contextMenuPage2Trad || preferences.contextMenuPage2Simp) &&
    (preferences.contextMenuClip2Trad || preferences.contextMenuClip2Simp) &&
    supportClipboard
  ) {
    browser.contextMenus.create({
      parentId: menuId,
      type: 'separator',
      contexts: ['all'],
    });
  }

  // 剪貼簿 轉繁體
  if (preferences.contextMenuClip2Trad && supportClipboard) {
    browser.contextMenus.create({
      parentId: menuId,
      type: 'normal',
      title: browser.i18n.getMessage('contextClip2Trad'),
      contexts: ['all'],
      onclick: () => {
        getClipData(text => {
          getActiveTab(tab => {
            browser.tabs.sendMessage(tab.id, {
              act: 'paste',
              text,
              flag: 'traditional',
            });
          });
        });
      },
    });
  }

  // 剪貼簿 轉簡體
  if (preferences.contextMenuClip2Simp && supportClipboard) {
    browser.contextMenus.create({
      parentId: menuId,
      type: 'normal',
      title: browser.i18n.getMessage('contextClip2Simp'),
      contexts: ['all'],
      onclick: () => {
        getClipData(text => {
          getActiveTab(tab => {
            browser.tabs.sendMessage(tab.id, {
              act: 'paste',
              text,
              flag: 'simplified',
            });
          });
        });
      },
    });
  }
};

const resetContextMenu = () => {
  let createNew = false;
  if (
    preferences.contextMenuEnabled &&
    (preferences.contextMenuInput2Trad ||
      preferences.contextMenuInput2Simp ||
      preferences.contextMenuPage2Trad ||
      preferences.contextMenuPage2Simp ||
      ((preferences.contextMenuClip2Trad || preferences.contextMenuClip2Simp) &&
        supportClipboard))
  ) {
    createNew = true;
  }
  if (menuId !== null) {
    browser.contextMenus.removeAll(() => {
      menuId = null;
      if (createNew) {
        createContextMenu();
      }
    });
  } else {
    if (createNew) {
      createContextMenu();
    }
  }
};

const setActionButtonText = () => {
  switch (convertMapping[preferences.iconAction]) {
    case 'trad':
      browser.browserAction.setBadgeText({ text: 'T' });
      break;
    case 'simp':
      browser.browserAction.setBadgeText({ text: 'S' });
      break;
    default:
      browser.browserAction.setBadgeText({ text: 'A' });
  }
  browser.browserAction.setBadgeBackgroundColor({ color: '#C0C0C0' });
};

const storageChangeHandler = (changes, area) => {
  if (area === 'local') {
    const changedItems = Object.keys(changes);
    for (const item of changedItems) {
      preferences[item] = changes[item].newValue;
      switch (item) {
        case 'contextMenuEnabled':
        case 'contextMenuInput2Trad':
        case 'contextMenuInput2Simp':
        case 'contextMenuPage2Trad':
        case 'contextMenuPage2Simp':
        case 'contextMenuClip2Trad':
        case 'contextMenuClip2Simp':
          resetContextMenu();
          break;
        case 'iconAction':
          setActionButtonText();
          break;
        default:
          break;
      }
    }
  }
};

const loadPreference = () => {
  browser.runtime.getBrowserInfo().then(info => {
    // Firefox issue: https://bugzilla.mozilla.org/show_bug.cgi?id=1197451#c37
    //                https://bugzilla.mozilla.org/show_bug.cgi?id=1312260
    // Fix on Firefox 54.0a
    if (info.name === 'Firefox' && parseInt(info.version) < 54) {
      supportClipboard = false;
    }
    browser.storage.local.get().then(results => {
      if (typeof results.length === 'number' && results.length > 0) {
        results = results[0];
      }
      if (!results.version) {
        preferences = defaultPrefs;
        browser.storage.local.set(defaultPrefs).then(
          () => {
            browser.storage.onChanged.addListener(storageChangeHandler);
          },
          () => {}
        );
      } else {
        preferences = results;
        browser.storage.onChanged.addListener(storageChangeHandler);
      }
      resetContextMenu();
      setActionButtonText();
    });
  });
};

window.addEventListener('DOMContentLoaded', () => {
  loadPreference();
});

browser.browserAction.onClicked.addListener(tab => {
  doAction(tab, 'icon', convertMapping[preferences.iconAction]);
});

browser.commands.onCommand.addListener(command => {
  if (command === 'page-trad') {
    getActiveTab(tab => {
      doAction(tab, 'page', 'trad');
    });
  } else if (command === 'page-simp') {
    getActiveTab(tab => {
      doAction(tab, 'page', 'simp');
    });
  } else if (command === 'clip-trad' && supportClipboard) {
    getClipData(text => {
      getActiveTab(tab => {
        browser.tabs.sendMessage(tab.id, {
          act: 'paste',
          text,
          flag: 'traditional',
        });
      });
    });
  } else if (command === 'clip-simp' && supportClipboard) {
    getClipData(text => {
      getActiveTab(tab => {
        browser.tabs.sendMessage(tab.id, {
          act: 'paste',
          text,
          flag: 'simplified',
        });
      });
    });
  }
});

browser.pageAction.onClicked.addListener(tab => {
  doAction(tab, 'page', 'auto');
});

function handleMessage(request, sender) {
  if (request.loaded) {
    browser.pageAction.show(sender.tab.id);
  }
}

browser.runtime.onMessage.addListener(handleMessage);
