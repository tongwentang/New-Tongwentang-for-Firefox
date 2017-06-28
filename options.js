let categories;
let tableRowItems = {
  urlFilterList: [],
  userPhraseTradList: [],
  userPhraseSimpList: []
};
let tableRowButtons;
let screenMask;
let urlFilterEditor;
let userPhraseEditor;
let currentPrefs = {};
let l10n = {};
let flagmap = {};

const checkFilterEditorInput = () => {
  //console.log('checkFilterEditorInput');
  let checkAny = false;
  let radios = Array.from(document.getElementById('urlFilterAction').querySelectorAll('input[name=urlFilterAction]'));
  for (let radio of radios) {
    if (radio.checked) {
      checkAny = true;
      break;
    }
  }
  if (document.getElementById('newFilterUrl').value !== '' && checkAny) {
    document.getElementById('btnAcceptFilter').disabled = false;
  }
  else {
    document.getElementById('btnAcceptFilter').disabled = true;
  }
};

const exportToFile = (data, fileName) => {
  let blob = new Blob([data], { type: "text/json;charset=utf-8" });

  browser.downloads.download({
    url: URL.createObjectURL(blob),
    filename: fileName,
    saveAs: true
  });
};

const importFromFile = (callback) => {
  let selectFile = document.getElementById('selectFile');
  selectFile.onchange = () => {
    if (selectFile.files && selectFile.files.length) {
      let file = selectFile.files[0];
      let reader = new FileReader();
      reader.onload = function (evt) {
        try {
          let data = JSON.parse(evt.target.result);
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
};

const exportAllOptions = () => {
  exportToFile(JSON.stringify(currentPrefs), 'NewTongWenTang-Options.json');
};

const exportUrlRule = () => {
  exportToFile(JSON.stringify(currentPrefs.urlFilterList), 'NewTongWenTang-UrlRule.json');
};

const exportS2TTable = () => {
  exportToFile(JSON.stringify(currentPrefs.userPhraseTradList), 'NewTongWenTang-S2TTable.json');
};

const exportT2STable = () => {
  exportToFile(JSON.stringify(currentPrefs.userPhraseSimpList), 'NewTongWenTang-T2STable.json');
};

const importAllOptions = () => {
  importFromFile(data => {
    if (data) {
      const validated = importConfigValidate(data, 'all');

      if (validated.error) {
        console.error('config invalid');
        return;
      }

      for (let p in validated.config) {
        let elem = document.getElementById(p);
        let elemType = elem.getAttribute('type');
        if (elemType === 'listBox' || elemType === 'listBoxObj') {
          //Remove all list from UI
          for (let i = elem.children.length - 2; i > 0; i--) {
            elem.removeChild(elem.children[i]);
          }
          currentPrefs[p] = validated.config[p];
        }
        setValueToElem(p, validated.config[p]);
        sendVelueChangeMessage(p, validated.config[p]);
      }
      currentPrefs = validated.config;
    }
  });
};

const resetListPrefs = (name, data) => {
  //Remove all list from UI
  let list = document.getElementById(name);
  for (let i = list.children.length - 2; i > 0; i--) {
    list.removeChild(list.children[i]);
  }

  //Replace setting
  currentPrefs[name] = data;

  //Add new list to UI
  setValueToElem(name, currentPrefs[name]);

  //Save to storage
  sendVelueChangeMessage(name, currentPrefs[name]);
};

const importUrlRule = () => {
  importFromFile(data => {
    if (data) {
      const validated = importConfigValidate(data, 'url');

      if (validated.error) {
        console.error('url config invalid');
        return;
      }

      resetListPrefs('urlFilterList', validated.config);
    }
  });
};

const importS2TTable = () => {
  importFromFile(data => {
    if (data) {
      const validated = importConfigValidate(data, 'phrase');

      if (validated.error) {
        console.error('s2t config invalid');
        return;
      }

      resetListPrefs('userPhraseTradList', validated.config);
    }
  });
};

const importT2STable = () => {
  importFromFile(data => {
    if (data) {
      const validated = importConfigValidate(data, 'phrase');

      if (validated.error) {
        console.error('t2s config invalid');
        return;
      }

      resetListPrefs('userPhraseSimpList', validated.config);
    }
  });
};

const importConfigValidate = (config, type) => {
  switch (type) {
    case 'all':
      let isInvalid = false;
      const allConfigKeys = Object.keys(config).sort();
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
        { key: 'version', type: 'number' }
      ];

      allKeyValuePair.forEach((pair, index) => {
        if (isInvalid) {
          return;
        }
        if (pair.key === 'urlFilterList' && importConfigValidate(config[pair.key], 'url').error) {
          isInvalid = true;
          return;
        }
        else if ((pair.key === 'userPhraseTradList' || pair.key === 'userPhraseSimpList') && importConfigValidate(config[pair.key], 'phrase').error) {
          isInvalid = true;
          return;
        }
        else if (typeof config[pair.key] !== pair.type) {
          isInvalid = true;
        }
      });

      return isInvalid ? { error: true } : { error: false, config };
    case 'url':
      if (!Array.isArray(config)) {
        return { error: true };
      }
      if (config.length < 1) {
        return { error: false, config };
      }
      let isUrlInvalid = false;
      config.forEach(url => {
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
            /^(https?:\/\/)?([\d\w\*\.-]+)\.([a-z\.]{2,6})([\/\w\* \.-]*)*\/?$/
          )
        ) {
          isUrlInvalid = true;
          return;
        }
      });
      return isUrlInvalid ? { error: true } : { error: false, config };
    case 'phrase':
      let isPhraseInvalid = false;
      const safeConfig = Object.assign({}, config);
      Object.keys(safeConfig).forEach(key => {
        if (isPhraseInvalid) {
          return;
        }
        if (typeof safeConfig[key] !== 'string') {
          isPhraseInvalid = true;
        }
      });
      return isPhraseInvalid ? { error: true } : { error: false, safeConfig };
    default:
      return { error: true };
  }
};

const checkPhraseEditorInput = () => {
  //console.log('checkPhraseEditorInput');
  if (document.getElementById('originPhrase').value !== '' && document.getElementById('newPhrase').value !== '') {
    document.getElementById('btnAcceptPhrase').disabled = false;
  }
  else {
    document.getElementById('btnAcceptPhrase').disabled = true;
  }
};

const hideScreenMask = () => {
  urlFilterEditor.style.display = 'none';
  userPhraseEditor.style.display = 'none';
  screenMask.style.display = 'none';
  document.body.style.height = 'none';
  document.body.style.overflowY = 'scroll';
};

const showUrlFilterEditor = (url, action, index) => {
  screenMask.style.display = 'block';
  urlFilterEditor.style.display = 'block';
  document.body.style.height = document.documentElement.clientHeight + 'px';
  document.body.style.overflowY = 'hidden';
  let newFilterUrl = document.getElementById('newFilterUrl');
  newFilterUrl.value = url;
  newFilterUrl.setAttribute('index', index);
  let radios = Array.from(document.querySelectorAll('input[name=urlFilterAction]'));
  for (let radio of radios) {
    radio.checked = (parseInt(radio.getAttribute('value')) === action);
  }
  document.getElementById('newFilterUrl').focus();
  checkFilterEditorInput();
};

const showUserPhraseEditor = (key, value, type) => {
  screenMask.style.display = 'block';
  userPhraseEditor.style.display = 'block';
  document.body.style.height = document.documentElement.clientHeight + 'px';
  document.body.style.overflowY = 'hidden';
  document.getElementById('originPhrase').value = key;
  document.getElementById('originPhrase').focus();
  document.getElementById('newPhrase').value = value;
  userPhraseEditor.setAttribute('type', type);
  if (type === 'trad') {
    document.getElementById('originPhraseLabel').textContent = browser.i18n.getMessage('labelSimplified');
    document.getElementById('newPhraseLabel').textContent = browser.i18n.getMessage('labelTraditional');
  }
  else if (type === 'simp') {
    document.getElementById('originPhraseLabel').textContent = browser.i18n.getMessage('labelTraditional');
    document.getElementById('newPhraseLabel').textContent = browser.i18n.getMessage('labelSimplified');
  }
  checkPhraseEditorInput();
};

const clickOnCategory = (event) => {
  for (let category of categories) {
    let id = category.getAttribute('id');
    let panel = document.getElementById('panel-' + id);
    if (category === event.currentTarget) {
      category.setAttribute('selected', true);
      panel.setAttribute('selected', true);
    }
    else {
      category.removeAttribute('selected');
      panel.removeAttribute('selected');
    }
  }
};

const clickOnRowItem = (event) => {
  let target = event.currentTarget.parentNode.getAttribute('id');
  let items = tableRowItems[target];
  for (let tableRowItem of items) {
    if (tableRowItem === event.currentTarget) {
      tableRowItem.setAttribute('selected', true);
    }
    else {
      tableRowItem.removeAttribute('selected');
    }
  }
};

const clickOnRowButton = (event) => {
  event.stopPropagation();
  event.preventDefault();
  let button = event.currentTarget;
  if (button.nodeName === 'LI')
    button = button.querySelector('.cellEdit');
  if (button.classList.contains('cellEdit')) {
    let target = button.parentNode.parentNode.getAttribute('id');
    if (target === 'urlFilterList') {
      let index = parseInt(button.parentNode.getAttribute('index'));
      let url = button.parentNode.firstChild.textContent;
      let action = currentPrefs.urlFilterList[index].action;
      showUrlFilterEditor(url, action, index);
    }
    else {
      let target = button.parentNode.parentNode.getAttribute('id');
      let key = button.previousElementSibling.previousElementSibling.textContent;
      let value = button.previousElementSibling.textContent;
      document.getElementById('originPhrase-old').value = key;
      if (target === 'userPhraseTradList') {
        showUserPhraseEditor(key, value, 'trad');
      }
      else if (target === 'userPhraseSimpList') {
        showUserPhraseEditor(key, value, 'simp');
      }
    }
  }
  else if (button.classList.contains('cellDelete')) {
    let target = button.parentNode.parentNode.getAttribute('id');
    if (target === 'urlFilterList') {
      let urlFilterList = document.getElementById('urlFilterList');
      let node = button.parentNode;
      if (node.getAttribute('selected') === 'true') {
        let index = parseInt(node.getAttribute('index'));
        node.parentNode.removeChild(node);
        for (let i = index + 1; i < urlFilterList.children.length - 1; ++i) {
          urlFilterList.children[i].setAttribute('index', i - 1);
        }
        currentPrefs.urlFilterList.splice(index, 1);
        sendVelueChangeMessage('urlFilterList', currentPrefs.urlFilterList);
        //sendVelueChangeMessage(id);
      }
      else {
        clickOnRowItem({ currentTarget: node });
      }
    }
    else {
      let target = button.parentNode.parentNode.getAttribute('id');
      let key = button.previousElementSibling.previousElementSibling.previousElementSibling.textContent;
      let node = button.parentNode;
      if (node.getAttribute('selected') === 'true') {
        node.parentNode.removeChild(node);
        delete currentPrefs[target][key];
        sendVelueChangeMessage(target, currentPrefs[target]);
      }
      else {
        clickOnRowItem({ currentTarget: node });
      }
    }
  }
};

const addRowItemCell = (row, classList, text, onClick) => {
  let div = document.createElement('div');
  for (let c of classList) {
    div.classList.add(c);
  }
  if (text)
    div.appendChild(document.createTextNode(text));
  if (onClick)
    div.addEventListener('click', onClick, true);
  row.appendChild(div);
  return div;
};

const moveUrlFilterPos = (shift) => {
  let selectedIndex = 0;
  let selectedRowItem = null;
  let nNode = null;
  let nIndex = 0;
  for (let tableRowItem of tableRowItems.urlFilterList) {
    if (tableRowItem.getAttribute('selected') === 'true') {
      let index = parseInt(tableRowItem.getAttribute('index'));
      if ((shift === -1 && index === 0) || (shift === 1 && index === currentPrefs.urlFilterList.length - 1))
        return;
      selectedIndex = index;
      selectedRowItem = tableRowItem;
      let filter = currentPrefs.urlFilterList.splice(index, 1);
      currentPrefs.urlFilterList.splice(index + shift, 0, filter[0]);
      sendVelueChangeMessage('urlFilterList', currentPrefs.urlFilterList);
      break;
    }
  }

  let urlFilterList = document.getElementById('urlFilterList');
  if (shift === 1 && selectedIndex === currentPrefs.urlFilterList.length - 2) {
    let lastChild = urlFilterList.querySelector('li:last-of-type');
    urlFilterList.insertBefore(selectedRowItem, lastChild);
    nNode = selectedRowItem.previousElementSibling;
    nIndex = selectedIndex;
  }
  else {
    for (let tableRowItem of tableRowItems.urlFilterList) {
      let index = parseInt(tableRowItem.getAttribute('index'));
      if (shift === -1 && index === selectedIndex - 1) {
        urlFilterList.insertBefore(selectedRowItem, tableRowItem);
        nNode = selectedRowItem;
        nIndex = selectedIndex - 1;
        break;
      }
      else if (shift === 1 && index === selectedIndex + 2) {
        urlFilterList.insertBefore(selectedRowItem, tableRowItem);
        nNode = selectedRowItem.previousElementSibling;
        nIndex = selectedIndex;
        break;
      }
    }
  }

  let item = nNode;
  while (item) {
    if (item.classList.contains('tableFooter'))
      break;
    item.setAttribute('index', nIndex++);
    item = item.nextElementSibling;
  }
};

const modefyUrlFilter = (url, action, index) => {
  let urlFilterList = document.getElementById('urlFilterList');
  let row = urlFilterList.children[index + 1];
  row.children[0].textContent = url;
  row.children[1].textContent = flagmap[action];
  currentPrefs.urlFilterList[index].url = url;
  currentPrefs.urlFilterList[index].action = action;
};

const addUrlFilter = (url, action, index) => {
  let urlFilterList = document.getElementById('urlFilterList');
  let li = document.createElement('li');
  if (index === undefined)
    index = currentPrefs.urlFilterList.length;
  li.setAttribute('index', index);
  li.classList.add('tableRow');
  addRowItemCell(li, ['cellUrl'], url);
  addRowItemCell(li, ['cellAction'], flagmap[action]);
  let edit = addRowItemCell(li, ['cellEdit', 'cellButton'], null, clickOnRowButton);
  edit.setAttribute('custom', true);
  addRowItemCell(li, ['cellDelete', 'cellButton'], null, clickOnRowButton);
  li.addEventListener('click', clickOnRowItem, false);
  li.addEventListener('dblclick', clickOnRowButton, false);
  let lastChild = urlFilterList.querySelector('li:last-of-type');
  urlFilterList.insertBefore(li, lastChild);
  tableRowItems.urlFilterList.push(li);
};

const modifyUserPhrase = (oldkey, key, value, type) => {
  let list = type === 'trad' ? document.getElementById('userPhraseTradList') : document.getElementById('userPhraseSimpList');
  for (let i = list.children.length - 2; i > 0; i--) {
    let row = list.children[i];
    if (row.children[0].textContent === oldkey) {
      row.children[0].textContent = key;
      row.children[1].textContent = value;
      break;
    }
  }
};

const addUserPhrase = (key, value, type) => {
  let list = type === 'trad' ? document.getElementById('userPhraseTradList') : document.getElementById('userPhraseSimpList');
  let li = document.createElement('li');
  li.classList.add('tableRow');
  addRowItemCell(li, ['cellConvert'], key);
  addRowItemCell(li, ['cellConvert'], value);
  let edit = addRowItemCell(li, ['cellEdit', 'cellButton'], null, clickOnRowButton);
  edit.setAttribute('custom', true);
  addRowItemCell(li, ['cellDelete', 'cellButton'], null, clickOnRowButton);
  li.addEventListener('click', clickOnRowItem, false);
  li.addEventListener('dblclick', clickOnRowButton, false);
  let lastChild = list.querySelector('li:last-of-type');
  list.insertBefore(li, lastChild);
  if (type === 'trad')
    tableRowItems.userPhraseTradList.push(li);
  else
    tableRowItems.userPhraseSimpList.push(li);
};

const startup = () => {
  categories = Array.from(document.querySelectorAll('.categories .categoryItem'));
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

  screenMask.addEventListener('click', event => {
    hideScreenMask();
  }, false);

  Array.from(document.querySelectorAll('.btnCancel')).forEach(btn => {
    btn.addEventListener('click', event => {
      hideScreenMask();
    }, false);
  });

  Array.from(document.querySelectorAll('.btnAccept')).forEach(btn => {
    btn.addEventListener('click', event => {
      let dlgName = event.target.getAttribute('dlgName');
      if (dlgName === 'urlFilterEditor') {
        let newFilterUrl = document.getElementById('newFilterUrl');
        let index = parseInt(newFilterUrl.getAttribute('index'));
        let url = newFilterUrl.value;
        let radios = Array.from(document.querySelectorAll('input[name=urlFilterAction]'));
        let action;
        for (let radio of radios) {
          if (radio.checked) {
            action = parseInt(radio.getAttribute('value'));
            break;
          }
        }
        if (index === -1) {
          addUrlFilter(url, action);
          currentPrefs.urlFilterList.push({ url: url, action: action });
        }
        else {
          modefyUrlFilter(url, action, index);
        }
        sendVelueChangeMessage('urlFilterList', currentPrefs.urlFilterList);
        hideScreenMask();
      }
      else if (dlgName === 'userPhraseEditor') {
        let oldkey = document.getElementById('originPhrase-old').value;
        let key = document.getElementById('originPhrase').value;
        let value = document.getElementById('newPhrase').value;
        let type = userPhraseEditor.getAttribute('type');
        if (oldkey) {
          modifyUserPhrase(oldkey, key, value, type);
        }
        else {
          addUserPhrase(key, value, type);
        }
        if (type === 'trad') {
          if (oldkey)
            delete currentPrefs.userPhraseTradList[oldkey];
          currentPrefs.userPhraseTradList[key] = value;
          sendVelueChangeMessage('userPhraseTradList', currentPrefs.userPhraseTradList);
        }
        else if (type === 'simp') {
          if (oldkey)
            delete currentPrefs.userPhraseSimpList[oldkey];
          currentPrefs.userPhraseSimpList[key] = value;
          sendVelueChangeMessage('userPhraseSimpList', currentPrefs.userPhraseSimpList);
        }
        hideScreenMask();
      }
    }, false);
  });

  document.getElementById('btnAddUserPhraseTrad').addEventListener('click', event => {
    document.getElementById('originPhrase-old').value = '';
    showUserPhraseEditor('', '', 'trad');
  }, false);
  document.getElementById('btnAddUserPhraseSimp').addEventListener('click', event => {
    document.getElementById('originPhrase-old').value = '';
    showUserPhraseEditor('', '', 'simp');
  }, false);
  document.getElementById('btnAddUrlFilter').addEventListener('click', event => {
    showUrlFilterEditor('', -1, -1);
  }, false);
  document.getElementById('btnMoveUp').addEventListener('click', event => {
    moveUrlFilterPos(-1);
  }, false);
  document.getElementById('btnMoveDown').addEventListener('click', event => {
    moveUrlFilterPos(+1);
  }, false);

  document.getElementById('newFilterUrl').addEventListener('input', event => {
    checkFilterEditorInput();
  }, false);
  let radios2 = Array.from(document.getElementById('urlFilterAction').querySelectorAll('input[name=urlFilterAction]'));
  for (let radio of radios2) {
    radio.addEventListener('input', event => {
      checkFilterEditorInput();
    });
  }

  document.getElementById('originPhrase').addEventListener('input', event => {
    checkPhraseEditorInput();
  }, false);
  document.getElementById('newPhrase').addEventListener('input', event => {
    checkPhraseEditorInput();
  }, false);

  document.getElementById('btnExportAllOptions').addEventListener('click', event => {
    exportAllOptions();
  }, false);
  document.getElementById('btnExportUrlRule').addEventListener('click', event => {
    exportUrlRule();
  }, false);
  document.getElementById('btnExportS2TTable').addEventListener('click', event => {
    exportS2TTable();
  }, false);
  document.getElementById('btnExportT2STable').addEventListener('click', event => {
    exportT2STable();
  }, false);

  document.getElementById('btnImportAllOptions').addEventListener('click', event => {
    importAllOptions();
  }, false);
  document.getElementById('btnImportUrlRule').addEventListener('click', event => {
    importUrlRule();
  }, false);
  document.getElementById('btnImportS2TTable').addEventListener('click', event => {
    importS2TTable();
  }, false);
  document.getElementById('btnImportT2STable').addEventListener('click', event => {
    importT2STable();
  }, false);

};

const setValueToElem = (id, value) => {
  let elem = document.getElementById(id);
  if (elem) {
    let elemType = elem.getAttribute('type');
    if (elemType === 'radioGroup') {
      let radios = Array.from(elem.querySelectorAll('input[name=' + id + ']'));
      for (let radio of radios) {
        if (parseInt(radio.getAttribute('value')) === value) {
          radio.checked = true;
          break;
        }
      }
    }
    else if (elemType === 'checkbox') {
      elem.checked = value;
    }
    else if (elemType === 'color' || elemType === 'number' || elemType === 'text') {
      elem.value = value;
    }
    else if (elemType === 'listBox') {
      for (let i = 0; i < value.length; ++i) {
        addUrlFilter(value[i].url, value[i].action, i);
      }
    }
    else if (elemType === 'listBoxObj') {
      for (let key in value) {
        addUserPhrase(key, value[key], id === 'userPhraseTradList' ? 'trad' : 'simp');
      }
    }
  }
};

const getValueFromElem = (id) => { };

const sendVelueChangeMessage = (id, value) => {
  if (value === undefined) {
    delete currentPrefs[id];
    //console.log('sendVelueChangeMessage(0): id = ' + id);
  }
  else if (typeof value === 'object') {
    //console.log('sendVelueChangeMessage(1): id = ' + id + ', value = ' + JSON.stringify(value));
    let update = {};
    update[id] = value;
    browser.storage.local.set(update).then(null, err => { });
  }
  else {
    if (currentPrefs[id] !== value) {
      currentPrefs[id] = value;
      //console.log('sendVelueChangeMessage(2): id = ' + id + ', value = ' + value + ', type = ' + typeof(value));
      let update = {};
      update[id] = value;
      browser.storage.local.set(update).then(null, err => { });
    }
  }
};

const handleVelueChange = (id) => {
  let elem = document.getElementById(id);
  if (elem) {
    let elemType = elem.getAttribute('type');
    if (elemType === 'radioGroup') {
      let radios = Array.from(elem.querySelectorAll('input[name=' + id + ']'));
      for (let radio of radios) {
        radio.addEventListener('input', event => { if (radio.checked) sendVelueChangeMessage(id, parseInt(radio.getAttribute("value"))); });
      }
    }
    else if (elemType === 'checkbox') {
      elem.addEventListener('input', event => { sendVelueChangeMessage(id, elem.checked); });
    }
    else if (elemType === 'color') {
      elem.addEventListener('input', event => { sendVelueChangeMessage(id, elem.value); });
    }
    else if (elemType === 'number') {
      elem.addEventListener('input', event => { sendVelueChangeMessage(id, parseInt(elem.value)); });
    }
    else if (elemType === 'text') {
      elem.addEventListener('input', event => { sendVelueChangeMessage(id, elem.value); });
    }
  }
};

const init = preferences => {
  flagmap = [
    browser.i18n.getMessage('labelNoTranslate'),
    '',
    browser.i18n.getMessage('labelToTraditional'),
    browser.i18n.getMessage('labelToSimplified')
  ];

  //console.log(JSON.stringify(preferences,null,4));
  currentPrefs = preferences;
  for (let p in preferences) {
    setValueToElem(p, preferences[p]);
    handleVelueChange(p);
  }
  document.title = browser.i18n.getMessage('optionTitle');
  let l10nTags = Array.from(document.querySelectorAll('[data-l10n-id]'));
  l10nTags.forEach(tag => {
    tag.textContent = browser.i18n.getMessage(tag.getAttribute('data-l10n-id'));
  });
};

window.addEventListener('load', event => {
  browser.runtime.getBrowserInfo().then(info => {
    if (info.name === 'Firefox' && parseInt(info.version) < 54) {
      document.getElementById('contextMenuClipboardT').style.display = 'none';
      document.getElementById('contextMenuClipboardS').style.display = 'none';
    }
    browser.storage.local.get().then(results => {
      if ((typeof results.length === 'number') && (results.length > 0)) {
        results = results[0];
      }
      if (results.version) {
        init(results);
        startup();
      }
    });
  });
}, true);

window.addEventListener('contextmenu', event => {
  event.stopPropagation();
  event.preventDefault();
}, true);

window.addEventListener('keydown', event => {
  if (event.keyCode === 27) {
    hideScreenMask();
  }
}, true);
