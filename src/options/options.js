import './options.css';
import flagmap from './flagmap';
import prefs from './prefs';

let categories = [];
const tableRowItems = {
  urlFilterList: [],
  userPhraseTradList: [],
  userPhraseSimpList: [],
};
let tableRowButtons = [];
let screenMask;
let urlFilterEditor;
let userPhraseEditor;

function checkFilterEditorInput() {
  // console.log('checkFilterEditorInput');
  let checkAny = false;
  const radios = Array.from(
    document
      .getElementById('urlFilterAction')
      .querySelectorAll('input[name=urlFilterAction]')
  );
  for (const radio of radios) {
    if (radio.checked) {
      checkAny = true;
      break;
    }
  }
  if (document.getElementById('newFilterUrl').value !== '' && checkAny) {
    document.getElementById('btnAcceptFilter').disabled = false;
  } else {
    document.getElementById('btnAcceptFilter').disabled = true;
  }
}

function checkPhraseEditorInput() {
  // console.log('checkPhraseEditorInput');
  if (
    document.getElementById('originPhrase').value !== '' &&
    document.getElementById('newPhrase').value !== ''
  ) {
    document.getElementById('btnAcceptPhrase').disabled = false;
  } else {
    document.getElementById('btnAcceptPhrase').disabled = true;
  }
}

function hideScreenMask() {
  urlFilterEditor.style.display = 'none';
  userPhraseEditor.style.display = 'none';
  screenMask.style.display = 'none';
  document.body.style.height = 'none';
  document.body.style.overflowY = 'scroll';
}

function showUrlFilterEditor(url, action, index) {
  screenMask.style.display = 'block';
  urlFilterEditor.style.display = 'block';
  document.body.style.height = `${document.documentElement.clientHeight}px`;
  document.body.style.overflowY = 'hidden';
  const newFilterUrl = document.getElementById('newFilterUrl');
  newFilterUrl.value = url;
  newFilterUrl.setAttribute('index', index);
  const radios = Array.from(
    document.querySelectorAll('input[name=urlFilterAction]')
  );
  for (const radio of radios) {
    radio.checked = parseInt(radio.getAttribute('value'), 10) === action;
  }
  document.getElementById('newFilterUrl').focus();
  checkFilterEditorInput();
}

function showUserPhraseEditor(key, value, type) {
  screenMask.style.display = 'block';
  userPhraseEditor.style.display = 'block';
  document.body.style.height = `${document.documentElement.clientHeight}px`;
  document.body.style.overflowY = 'hidden';
  document.getElementById('originPhrase').value = key;
  document.getElementById('originPhrase').focus();
  document.getElementById('newPhrase').value = value;
  userPhraseEditor.setAttribute('type', type);
  if (type === 'trad') {
    document.getElementById(
      'originPhraseLabel'
    ).textContent = browser.i18n.getMessage('labelSimplified');
    document.getElementById(
      'newPhraseLabel'
    ).textContent = browser.i18n.getMessage('labelTraditional');
  } else if (type === 'simp') {
    document.getElementById(
      'originPhraseLabel'
    ).textContent = browser.i18n.getMessage('labelTraditional');
    document.getElementById(
      'newPhraseLabel'
    ).textContent = browser.i18n.getMessage('labelSimplified');
  }
  checkPhraseEditorInput();
}

function clickOnCategory(event) {
  for (const category of categories) {
    const id = category.getAttribute('id');
    const panel = document.getElementById(`panel-${id}`);
    if (category === event.currentTarget) {
      category.setAttribute('selected', true);
      panel.setAttribute('selected', true);
    } else {
      category.removeAttribute('selected');
      panel.removeAttribute('selected');
    }
  }
}

function clickOnRowItem(event) {
  const target = event.currentTarget.parentNode.getAttribute('id');
  const items = tableRowItems[target];
  for (const tableRowItem of items) {
    if (tableRowItem === event.currentTarget) {
      tableRowItem.setAttribute('selected', true);
    } else {
      tableRowItem.removeAttribute('selected');
    }
  }
}

function clickOnRowButton(event) {
  event.stopPropagation();
  event.preventDefault();
  let button = event.currentTarget;
  if (button.nodeName === 'LI') {
    button = button.querySelector('.cellEdit');
  }
  if (button.classList.contains('cellEdit')) {
    let target = button.parentNode.parentNode.getAttribute('id');
    if (target === 'urlFilterList') {
      const index = parseInt(button.parentNode.getAttribute('index'), 10);
      const url = button.parentNode.firstChild.textContent;
      const action = prefs.get().urlFilterList[index].action;
      showUrlFilterEditor(url, action, index);
    } else {
      target = button.parentNode.parentNode.getAttribute('id');
      const key =
        button.previousElementSibling.previousElementSibling.textContent;
      const value = button.previousElementSibling.textContent;
      document.getElementById('originPhrase-old').value = key;
      if (target === 'userPhraseTradList') {
        showUserPhraseEditor(key, value, 'trad');
      } else if (target === 'userPhraseSimpList') {
        showUserPhraseEditor(key, value, 'simp');
      }
    }
  } else if (button.classList.contains('cellDelete')) {
    let target = button.parentNode.parentNode.getAttribute('id');
    if (target === 'urlFilterList') {
      const urlFilterList = document.getElementById('urlFilterList');
      const node = button.parentNode;
      if (node.getAttribute('selected') === 'true') {
        const index = parseInt(node.getAttribute('index'), 10);
        node.parentNode.removeChild(node);
        for (let i = index + 1; i < urlFilterList.children.length - 1; ++i) {
          urlFilterList.children[i].setAttribute('index', i - 1);
        }
        prefs.get().urlFilterList.splice(index, 1);
        prefs.sendValueChangeMessage(
          'urlFilterList',
          prefs.get().urlFilterList
        );
        // sendVelueChangeMessage(id);
      } else {
        clickOnRowItem({ currentTarget: node });
      }
    } else {
      target = button.parentNode.parentNode.getAttribute('id');
      const key =
        button.previousElementSibling.previousElementSibling
          .previousElementSibling.textContent;
      const node = button.parentNode;
      if (node.getAttribute('selected') === 'true') {
        node.parentNode.removeChild(node);
        delete prefs.get()[target][key];
        prefs.sendValueChangeMessage(target, prefs.get()[target]);
      } else {
        clickOnRowItem({ currentTarget: node });
      }
    }
  }
}

function addRowItemCell(row, classList, text, onClick) {
  const div = document.createElement('div');
  for (const c of classList) {
    div.classList.add(c);
  }
  if (text) {
    div.appendChild(document.createTextNode(text));
  }
  if (onClick) {
    div.addEventListener('click', onClick, true);
  }
  row.appendChild(div);
  return div;
}

function moveUrlFilterPos(shift) {
  let selectedIndex = 0;
  let selectedRowItem = null;
  let nNode = null;
  let nIndex = 0;
  for (const tableRowItem of tableRowItems.urlFilterList) {
    if (tableRowItem.getAttribute('selected') === 'true') {
      const index = parseInt(tableRowItem.getAttribute('index'), 10);
      if (
        (shift === -1 && index === 0) ||
        (shift === 1 && index === prefs.get().urlFilterList.length - 1)
      ) {
        return;
      }
      selectedIndex = index;
      selectedRowItem = tableRowItem;
      const filter = prefs.get().urlFilterList.splice(index, 1);
      prefs.get().urlFilterList.splice(index + shift, 0, filter[0]);
      prefs.sendValueChangeMessage('urlFilterList', prefs.get().urlFilterList);
      break;
    }
  }

  const urlFilterList = document.getElementById('urlFilterList');
  if (shift === 1 && selectedIndex === prefs.get().urlFilterList.length - 2) {
    const lastChild = urlFilterList.querySelector('li:last-of-type');
    urlFilterList.insertBefore(selectedRowItem, lastChild);
    nNode = selectedRowItem.previousElementSibling;
    nIndex = selectedIndex;
  } else {
    for (const tableRowItem of tableRowItems.urlFilterList) {
      const index = parseInt(tableRowItem.getAttribute('index'), 10);
      if (shift === -1 && index === selectedIndex - 1) {
        urlFilterList.insertBefore(selectedRowItem, tableRowItem);
        nNode = selectedRowItem;
        nIndex = selectedIndex - 1;
        break;
      } else if (shift === 1 && index === selectedIndex + 2) {
        urlFilterList.insertBefore(selectedRowItem, tableRowItem);
        nNode = selectedRowItem.previousElementSibling;
        nIndex = selectedIndex;
        break;
      }
    }
  }

  let item = nNode;
  while (item) {
    if (item.classList.contains('tableFooter')) {
      break;
    }
    item.setAttribute('index', nIndex++);
    item = item.nextElementSibling;
  }
}

function modifyUrlFilter(url, action, index) {
  const urlFilterList = document.getElementById('urlFilterList');
  const row = urlFilterList.children[index + 1];
  row.children[0].textContent = url;
  row.children[1].textContent = flagmap.get(action);
  prefs.get().urlFilterList[index].url = url;
  prefs.get().urlFilterList[index].action = action;
}

function addUrlFilter(url, action, index) {
  const urlFilterList = document.getElementById('urlFilterList');
  const li = document.createElement('li');
  if (index === undefined) {
    index = prefs.get().urlFilterList.length;
  }
  li.setAttribute('index', index);
  li.classList.add('tableRow');
  addRowItemCell(li, ['cellUrl'], url);
  addRowItemCell(li, ['cellAction'], flagmap.get(action));
  const edit = addRowItemCell(
    li,
    ['cellEdit', 'cellButton'],
    null,
    clickOnRowButton
  );
  edit.setAttribute('custom', true);
  addRowItemCell(li, ['cellDelete', 'cellButton'], null, clickOnRowButton);
  li.addEventListener('click', clickOnRowItem, false);
  li.addEventListener('dblclick', clickOnRowButton, false);
  const lastChild = urlFilterList.querySelector('li:last-of-type');
  urlFilterList.insertBefore(li, lastChild);
  tableRowItems.urlFilterList.push(li);
}

function modifyUserPhrase(oldkey, key, value, type) {
  const list =
    type === 'trad'
      ? document.getElementById('userPhraseTradList')
      : document.getElementById('userPhraseSimpList');
  for (let i = list.children.length - 2; i > 0; i--) {
    const row = list.children[i];
    if (row.children[0].textContent === oldkey) {
      row.children[0].textContent = key;
      row.children[1].textContent = value;
      break;
    }
  }
}

function addUserPhrase(key, value, type) {
  const list =
    type === 'trad'
      ? document.getElementById('userPhraseTradList')
      : document.getElementById('userPhraseSimpList');
  const li = document.createElement('li');
  li.classList.add('tableRow');
  addRowItemCell(li, ['cellConvert'], key);
  addRowItemCell(li, ['cellConvert'], value);
  const edit = addRowItemCell(
    li,
    ['cellEdit', 'cellButton'],
    null,
    clickOnRowButton
  );
  edit.setAttribute('custom', true);
  addRowItemCell(li, ['cellDelete', 'cellButton'], null, clickOnRowButton);
  li.addEventListener('click', clickOnRowItem, false);
  li.addEventListener('dblclick', clickOnRowButton, false);
  const lastChild = list.querySelector('li:last-of-type');
  list.insertBefore(li, lastChild);
  if (type === 'trad') {
    tableRowItems.userPhraseTradList.push(li);
  } else {
    tableRowItems.userPhraseSimpList.push(li);
  }
}

function uiEventBinding() {
  categories = Array.from(
    document.querySelectorAll('.categories .categoryItem')
  );
  categories.forEach(category => {
    category.addEventListener('click', clickOnCategory, true);
  });

  tableRowButtons = Array.from(document.querySelectorAll('.cellButton'));
  tableRowButtons.forEach(tableRowButton => {
    tableRowButton.addEventListener('click', clickOnRowButton, true);
  });
  screenMask = document.getElementById('screenMask');
  urlFilterEditor = document.getElementById('urlFilterEditor');
  userPhraseEditor = document.getElementById('userPhraseEditor');

  screenMask.addEventListener(
    'click',
    () => {
      hideScreenMask();
    },
    false
  );

  Array.from(document.querySelectorAll('.btnCancel')).forEach(btn => {
    btn.addEventListener(
      'click',
      () => {
        hideScreenMask();
      },
      false
    );
  });

  Array.from(document.querySelectorAll('.btnAccept')).forEach(btn => {
    btn.addEventListener(
      'click',
      event => {
        const dlgName = event.target.getAttribute('dlgName');
        if (dlgName === 'urlFilterEditor') {
          const newFilterUrl = document.getElementById('newFilterUrl');
          const index = parseInt(newFilterUrl.getAttribute('index'));
          const url = newFilterUrl.value;
          const radios = Array.from(
            document.querySelectorAll('input[name=urlFilterAction]')
          );
          let action;
          for (const radio of radios) {
            if (radio.checked) {
              action = parseInt(radio.getAttribute('value'));
              break;
            }
          }
          if (index === -1) {
            addUrlFilter(url, action);
            prefs.get().urlFilterList.push({ url, action });
          } else {
            modifyUrlFilter(url, action, index);
          }
          prefs.sendValueChangeMessage(
            'urlFilterList',
            prefs.get().urlFilterList
          );
          hideScreenMask();
        } else if (dlgName === 'userPhraseEditor') {
          const oldkey = document.getElementById('originPhrase-old').value;
          const key = document.getElementById('originPhrase').value;
          const value = document.getElementById('newPhrase').value;
          const type = userPhraseEditor.getAttribute('type');
          if (oldkey) {
            modifyUserPhrase(oldkey, key, value, type);
          } else {
            addUserPhrase(key, value, type);
          }
          if (type === 'trad') {
            if (oldkey) {
              delete prefs.get().userPhraseTradList[oldkey];
            }
            prefs.get().userPhraseTradList[key] = value;
            prefs.sendValueChangeMessage(
              'userPhraseTradList',
              prefs.get().userPhraseTradList
            );
          } else if (type === 'simp') {
            if (oldkey) {
              delete prefs.get().userPhraseSimpList[oldkey];
            }
            prefs.get().userPhraseSimpList[key] = value;
            prefs.sendValueChangeMessage(
              'userPhraseSimpList',
              prefs.get().userPhraseSimpList
            );
          }
          hideScreenMask();
        }
      },
      false
    );
  });

  document.getElementById('btnAddUserPhraseTrad').addEventListener(
    'click',
    () => {
      document.getElementById('originPhrase-old').value = '';
      showUserPhraseEditor('', '', 'trad');
    },
    false
  );
  document.getElementById('btnAddUserPhraseSimp').addEventListener(
    'click',
    () => {
      document.getElementById('originPhrase-old').value = '';
      showUserPhraseEditor('', '', 'simp');
    },
    false
  );
  document.getElementById('btnAddUrlFilter').addEventListener(
    'click',
    () => {
      showUrlFilterEditor('', -1, -1);
    },
    false
  );
  document.getElementById('btnMoveUp').addEventListener(
    'click',
    () => {
      moveUrlFilterPos(-1);
    },
    false
  );
  document.getElementById('btnMoveDown').addEventListener(
    'click',
    () => {
      moveUrlFilterPos(+1);
    },
    false
  );

  document.getElementById('newFilterUrl').addEventListener(
    'input',
    () => {
      checkFilterEditorInput();
    },
    false
  );
  const radios2 = Array.from(
    document
      .getElementById('urlFilterAction')
      .querySelectorAll('input[name=urlFilterAction]')
  );
  for (const radio of radios2) {
    radio.addEventListener('input', () => {
      checkFilterEditorInput();
    });
  }

  document.getElementById('originPhrase').addEventListener(
    'input',
    () => {
      checkPhraseEditorInput();
    },
    false
  );
  document.getElementById('newPhrase').addEventListener(
    'input',
    () => {
      checkPhraseEditorInput();
    },
    false
  );

  document.getElementById('btnExportAllOptions').addEventListener(
    'click',
    () => {
      prefs.exportAllOptions();
    },
    false
  );
  document.getElementById('btnExportUrlRule').addEventListener(
    'click',
    () => {
      prefs.exportUrlRule();
    },
    false
  );
  document.getElementById('btnExportS2TTable').addEventListener(
    'click',
    () => {
      prefs.exportS2TTable();
    },
    false
  );
  document.getElementById('btnExportT2STable').addEventListener(
    'click',
    () => {
      prefs.exportT2STable();
    },
    false
  );

  document.getElementById('btnImportAllOptions').addEventListener(
    'click',
    () => {
      prefs.importAllOptions().then(newPrefs => {
        Object.keys(newPrefs).forEach(key => {
          const elem = document.getElementById(key);
          const elemType = elem.getAttribute('type');
          if (elemType === 'listBox' || elemType === 'listBoxObj') {
            // Remove all list from UI
            for (let i = elem.children.length - 2; i > 0; i--) {
              elem.removeChild(elem.children[i]);
            }
          }
          setValueToElem(key, newPrefs[key]);
        });
        alert(browser.i18n.getMessage('dlgImportSuccess'));
      });
    },
    false
  );
  document.getElementById('btnImportUrlRule').addEventListener(
    'click',
    () => {
      prefs
        .importUrlRule()
        .then(({ id, pref }) => setValueToElem(id, pref))
        .then(() => alert(browser.i18n.getMessage('dlgImportSuccess')));
    },
    false
  );
  document.getElementById('btnImportS2TTable').addEventListener(
    'click',
    () => {
      prefs
        .importS2TTable()
        .then(({ id, pref }) => setValueToElem(id, pref))
        .then(() => alert(browser.i18n.getMessage('dlgImportSuccess')));
    },
    false
  );
  document.getElementById('btnImportT2STable').addEventListener(
    'click',
    () => {
      prefs
        .importT2STable()
        .then(({ id, pref }) => setValueToElem(id, pref))
        .then(() => alert(browser.i18n.getMessage('dlgImportSuccess')));
    },
    false
  );
}

function setValueToElem(id, value) {
  const elem = document.getElementById(id);
  if (elem) {
    const elemType = elem.getAttribute('type');
    if (elemType === 'radioGroup') {
      const radios = Array.from(elem.querySelectorAll(`input[name=${id}]`));
      for (const radio of radios) {
        if (parseInt(radio.getAttribute('value')) === value) {
          radio.checked = true;
          break;
        }
      }
    } else if (elemType === 'checkbox') {
      elem.checked = value;
    } else if (
      elemType === 'color' ||
      elemType === 'number' ||
      elemType === 'text'
    ) {
      elem.value = value;
    } else if (elemType === 'listBox') {
      for (let i = 0; i < value.length; ++i) {
        addUrlFilter(value[i].url, value[i].action, i);
      }
    } else if (elemType === 'listBoxObj') {
      Object.keys(value).forEach(key => {
        addUserPhrase(
          key,
          value[key],
          id === 'userPhraseTradList' ? 'trad' : 'simp'
        );
      });
    }
  }
}

function handleValueChange(id) {
  const elem = document.getElementById(id);
  if (elem) {
    const elemType = elem.getAttribute('type');
    if (elemType === 'radioGroup') {
      const radios = Array.from(elem.querySelectorAll(`input[name=${id}]`));
      for (const radio of radios) {
        radio.addEventListener('input', () => {
          if (radio.checked)
            prefs.sendValueChangeMessage(
              id,
              parseInt(radio.getAttribute('value'))
            );
        });
      }
    } else if (elemType === 'checkbox') {
      elem.addEventListener('input', () => {
        prefs.sendValueChangeMessage(id, elem.checked);
      });
    } else if (elemType === 'color') {
      elem.addEventListener('input', () => {
        prefs.sendValueChangeMessage(id, elem.value);
      });
    } else if (elemType === 'number') {
      elem.addEventListener('input', () => {
        prefs.sendValueChangeMessage(id, parseInt(elem.value));
      });
    } else if (elemType === 'text') {
      elem.addEventListener('input', () => {
        prefs.sendValueChangeMessage(id, elem.value);
      });
    }
  }
}

// function getValueFromElem(id) {};

function init() {
  Object.keys(prefs.get()).forEach(key => {
    setValueToElem(key, prefs.get()[key]);
    handleValueChange(key);
  });
  document.title = browser.i18n.getMessage('optionTitle');
  const l10nTags = Array.from(document.querySelectorAll('[data-l10n-id]'));
  l10nTags.forEach(tag => {
    tag.textContent = browser.i18n.getMessage(tag.getAttribute('data-l10n-id'));
  });
}

window.addEventListener(
  'load',
  () => {
    browser.runtime.getBrowserInfo().then(info => {
      if (info.name === 'Firefox' && parseInt(info.version) < 54) {
        document.getElementById('contextMenuClipboardT').style.display = 'none';
        document.getElementById('contextMenuClipboardS').style.display = 'none';
      }

      prefs
        .init()
        .then(() => {
          init();
          uiEventBinding();
        })
        .catch(() => {
          throw new Error('prefs.init(): get prefs from storage failed');
        });
    });
  },
  true
);

window.addEventListener(
  'contextmenu',
  event => {
    event.stopPropagation();
    event.preventDefault();
  },
  true
);

window.addEventListener(
  'keydown',
  event => {
    if (event.keyCode === 27) {
      hideScreenMask();
    }
  },
  true
);
