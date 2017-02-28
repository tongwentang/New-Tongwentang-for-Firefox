let categories;
let tableRowItems = {
  urlFilterList:[],
  userPhraseTradList:[],
  userPhraseSimpList:[]
};
let tableRowButtons;
let screenMask;
let urlFilterEditor;
let userPhraseEditor;
let currentPrefs = {};
let l10n = {};
let flagmap = {};

const checkFilterEditorInput = () => {
  console.log('checkFilterEditorInput');
  let checkAny = false;
  let radios = Array.from(document.getElementById('urlFilterAction').querySelectorAll('input[name=urlFilterAction]'));
  for(let radio of radios) {
    if(radio.checked) {
      checkAny = true;
      break;
    }
  }
  if(document.getElementById('newFilterUrl').value !== '' && checkAny) {
    document.getElementById('btnAcceptFilter').disabled = false;
  }
  else {
    document.getElementById('btnAcceptFilter').disabled = true;
  }
}

const checkPhraseEditorInput = () => {
  console.log('checkPhraseEditorInput');
  if(document.getElementById('originPhrase').value !== '' && document.getElementById('newPhrase').value !== '') {
    document.getElementById('btnAcceptPhrase').disabled = false;
  }
  else {
    document.getElementById('btnAcceptPhrase').disabled = true;
  }
}

const hideScreenMask = () => {
  urlFilterEditor.style.display = 'none';
  userPhraseEditor.style.display = 'none';
  screenMask.style.display = 'none';
  document.body.style.height = 'none';
  document.body.style.overflowY = 'scroll';
}

const showUrlFilterEditor = (url, action) => {
  screenMask.style.display = 'block';
  urlFilterEditor.style.display = 'block';
  document.body.style.height = document.documentElement.clientHeight + 'px';
  document.body.style.overflowY = 'hidden';
  document.getElementById('newFilterUrl').value = url;
  let radios = Array.from(document.querySelectorAll('input[name=urlFilterAction]'));
  for(let radio of radios) {
    radio.checked = (parseInt(radio.getAttribute('value')) === action);
  }
  document.getElementById('newFilterUrl').focus();
  checkFilterEditorInput();
}

const showUserPhraseEditor = (key, value, type) => {
  screenMask.style.display = 'block';
  userPhraseEditor.style.display = 'block';
  document.body.style.height = document.documentElement.clientHeight + 'px';
  document.body.style.overflowY = 'hidden';
  document.getElementById('originPhrase').value = key;
  document.getElementById('originPhrase').focus();
  document.getElementById('newPhrase').value = value;
  userPhraseEditor.setAttribute('type', type);
  if(type === 'tard') {
    document.getElementById('originPhraseLabel').textContent = browser.i18n.getMessage('labelSimplified');
    document.getElementById('newPhraseLabel').textContent = browser.i18n.getMessage('labelTraditional');
  }
  else if(type === 'simp'){
    document.getElementById('originPhraseLabel').textContent = browser.i18n.getMessage('labelTraditional');
    document.getElementById('newPhraseLabel').textContent = browser.i18n.getMessage('labelSimplified');
  }
  checkPhraseEditorInput();
}

const clickOnCategory = (event) => {
  for(let category of categories) {
    let id = category.getAttribute('id');
    let panel = document.getElementById('panel-' + id);
    if(category === event.currentTarget) {
      category.setAttribute('selected', true);
      panel.setAttribute('selected', true);
    }
    else {
      category.removeAttribute('selected');
      panel.removeAttribute('selected');
    }
  }
}

const clickOnRowItem = (event) => {
  let target = event.currentTarget.parentNode.getAttribute('id');
  let items = tableRowItems[target];
  for(let tableRowItem of items) {
    if(tableRowItem === event.currentTarget) {
      tableRowItem.setAttribute('selected', true);
    }
    else {
      tableRowItem.removeAttribute('selected');
    }
  }
}

const clickOnRowButton = (event) => {
  event.stopPropagation();
  event.preventDefault();
  let button = event.currentTarget;
  if(button.nodeName === 'LI')
    button = button.querySelector('.cellEdit');
  if(button.classList.contains('cellEdit')) {
    let target = button.parentNode.parentNode.getAttribute('id');
    if(target === 'urlFilterList') {
      let index = parseInt(button.parentNode.getAttribute('index'));
      let url = button.parentNode.firstChild.textContent;
      let action = currentPrefs.urlFilterList[index].action;
      showUrlFilterEditor(url, action);
    }
    else {
      let target = button.parentNode.parentNode.getAttribute('id');
      let key = button.previousElementSibling.previousElementSibling.textContent;
      let value = button.previousElementSibling.textContent;
      if(target === 'userPhraseTradList') {
        showUserPhraseEditor(key, value, 'trad');
      }
      else if(target === 'userPhraseSimpList') {
        showUserPhraseEditor(key, value, 'simp');
      }
    }
  }
  else if(button.classList.contains('cellDelete')){
    let target = button.parentNode.parentNode.getAttribute('id');
    if(target === 'urlFilterList') {
      let node = button.parentNode;
      if(node.getAttribute('selected')==='true') {
        let index = parseInt(node.getAttribute('index'));
        node.parentNode.removeChild(node);
        currentPrefs.urlFilterList.splice(index, 1);
        sendVelueChangeMessage('urlFilterList', currentPrefs.urlFilterList);
        //sendVelueChangeMessage(id);
      }
      else {
        clickOnRowItem({currentTarget: node});
      }
    }
    else {
      let target = button.parentNode.parentNode.getAttribute('id');
      let key = button.previousElementSibling.previousElementSibling.previousElementSibling.textContent;
      let node = button.parentNode;
      if(node.getAttribute('selected')==='true') {
        node.parentNode.removeChild(node);
        delete currentPrefs[target][key];
        sendVelueChangeMessage(target, currentPrefs[target]);
      }
      else {
        clickOnRowItem({currentTarget: node});
      }
    }
  }
}

const addRowItemCell = (row, classList, text, onClick) => {
  let div = document.createElement('div');
  for(let c of classList) {
    div.classList.add(c);
  }
  if(text)
    div.appendChild(document.createTextNode(text));
  if(onClick)
    div.addEventListener('click', onClick, true);
  row.appendChild(div);
  return div;
}

const moveUrlFilterPos = (shift) => {
  let selectedIndex = 0;
  let selectedRowItem = null;
  let nNode = null;
  let nIndex = 0;
  for(let tableRowItem of tableRowItems.urlFilterList) {
    if(tableRowItem.getAttribute('selected') === 'true') {
      let index = parseInt(tableRowItem.getAttribute('index'));
      if((shift === -1 && index === 0) || (shift === 1 && index === currentPrefs.urlFilterList.length-1))
        return;
      selectedIndex = index;
      selectedRowItem = tableRowItem;
      let filter = currentPrefs.urlFilterList.splice(index, 1);
      currentPrefs.urlFilterList.splice(index+shift, 0, filter[0]);
      sendVelueChangeMessage('urlFilterList', currentPrefs.urlFilterList);
      break;
    }
  }

  let urlFilterList = document.getElementById('urlFilterList');
  if(shift === 1 && selectedIndex === currentPrefs.urlFilterList.length-2) {
    let lastChild = urlFilterList.querySelector('li:last-of-type');
    urlFilterList.insertBefore(selectedRowItem, lastChild);
    nNode = selectedRowItem.previousElementSibling;
    nIndex = selectedIndex;
  }
  else {
    for(let tableRowItem of tableRowItems.urlFilterList) {
      let index = parseInt(tableRowItem.getAttribute('index'));
      if(shift === -1 && index === selectedIndex-1) {
        urlFilterList.insertBefore(selectedRowItem, tableRowItem);
        nNode = selectedRowItem;
        nIndex = selectedIndex-1;
        break;
      }
      else if(shift === 1 && index === selectedIndex+2) {
        urlFilterList.insertBefore(selectedRowItem, tableRowItem);
        nNode = selectedRowItem.previousElementSibling;
        nIndex = selectedIndex;
        break;
      }
    }
  }

  let item = nNode;
  while(item) {
    if(item.classList.contains('tableFooter'))
      break;
    item.setAttribute('index', nIndex++);
    item = item.nextElementSibling;
  }
}

const addUrlFilter = (url, action, index) => {
  let urlFilterList = document.getElementById('urlFilterList');
  let li = document.createElement('li');
  if(index === undefined)
    index = currentPrefs.urlFilterList.length;
  li.setAttribute('index', index);
  li.classList.add('tableRow');
  addRowItemCell(li, ['cellUrl'], url);
  addRowItemCell(li, ['cellAction'], flagmap[action]);
  let edit = addRowItemCell(li, ['cellEdit','cellButton'], null, clickOnRowButton);
  edit.setAttribute('custom', true);
  addRowItemCell(li, ['cellDelete','cellButton'], null, clickOnRowButton);
  li.addEventListener('click', clickOnRowItem, false);
  li.addEventListener('dblclick', clickOnRowButton, false);
  let lastChild = urlFilterList.querySelector('li:last-of-type');
  urlFilterList.insertBefore(li, lastChild);
  tableRowItems.urlFilterList.push(li);
}

const addUserPhrase = (key, value, type) => {
  let list = type === 'tard' ? document.getElementById('userPhraseTradList') : document.getElementById('userPhraseSimpList');
  let li = document.createElement('li');
  li.classList.add('tableRow');
  addRowItemCell(li, ['cellConvert'], key);
  addRowItemCell(li, ['cellConvert'], value);
  let edit = addRowItemCell(li, ['cellEdit','cellButton'], null, clickOnRowButton);
  edit.setAttribute('custom', true);
  addRowItemCell(li, ['cellDelete','cellButton'], null, clickOnRowButton);
  li.addEventListener('click', clickOnRowItem, false);
  li.addEventListener('dblclick', clickOnRowButton, false);
  let lastChild = list.querySelector('li:last-of-type');
  list.insertBefore(li, lastChild);
  if(type === 'tard')
    tableRowItems.userPhraseTradList.push(li);
  else
    tableRowItems.userPhraseSimpList.push(li);
}

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
      if(dlgName === 'urlFilterEditor') {
        let url = document.getElementById('newFilterUrl').value;
        let radios = Array.from(document.querySelectorAll('input[name=urlFilterAction]'));
        let action;
        for(let radio of radios) {
          if(radio.checked) {
            action = parseInt(radio.getAttribute('value'));
            break;
          }
        }

        addUrlFilter(url, action);
        currentPrefs.urlFilterList.push({url: url, action: action});
        sendVelueChangeMessage('urlFilterList', currentPrefs.urlFilterList);
        hideScreenMask();
      }
      else if(dlgName === 'userPhraseEditor'){
        let key = document.getElementById('originPhrase').value;
        let value = document.getElementById('newPhrase').value;
        let type = userPhraseEditor.getAttribute('type');
        addUserPhrase(key, value, type);
        if(type === 'tard') {
          currentPrefs.userPhraseTradList[key] = value;
          sendVelueChangeMessage('userPhraseTradList', currentPrefs.userPhraseTradList);
        }
        else if(type === 'simp'){
          currentPrefs.userPhraseSimpList[key] = value;
          sendVelueChangeMessage('userPhraseSimpList', currentPrefs.userPhraseSimpList);
        }
        hideScreenMask();
      }
    }, false);
  });

  document.getElementById('btnAddUserPhraseTrad').addEventListener('click', event => {
    showUserPhraseEditor('', '', 'tard');
  }, false);
  document.getElementById('btnAddUserPhraseSimp').addEventListener('click', event => {
    showUserPhraseEditor('', '', 'simp');
  }, false);
  document.getElementById('btnAddUrlFilter').addEventListener('click', event => {
    showUrlFilterEditor('', -1);
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
  for(let radio of radios2) {
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
}

const setValueToElem = (id, value) => {
  let elem = document.getElementById(id);
  if(elem) {
    let elemType = elem.getAttribute('type');
    if(elemType === 'radioGroup') {
      let radios = Array.from(elem.querySelectorAll('input[name='+id+']'));
      for(let radio of radios) {
        if(parseInt(radio.getAttribute('value')) === value) {
          radio.checked = true;
          break;
        }
      }
    }
    else if(elemType === 'checkbox') {
      elem.checked = value;
    }
    else if(elemType === 'color' || elemType === 'number' || elemType === 'text') {
      elem.value = value;
    }
    else if(elemType === 'listBox') {
      for(let i = 0; i < value.length; ++i) {
        addUrlFilter(value[i].url, value[i].action, i);
      }
    }
    else if(elemType === 'listBoxObj') {
      for(let key in value) {
        addUserPhrase(key, value[key], id === 'userPhraseTradList' ? 'tard' : 'simp');
      }
    }
  }
}

const getValueFromElem = (id) => {

}

const sendVelueChangeMessage = (id, value) => {
  if(value === undefined) {
    delete currentPrefs[id];
    //console.log('sendVelueChangeMessage(0): id = ' + id);
  }
  else if(typeof value === 'object') {
    //console.log('sendVelueChangeMessage(1): id = ' + id + ', value = ' + JSON.stringify(value));
    let update = {};
    update[id] = value;
    browser.storage.local.set(update).then(null, err => {});
  }
  else {
    if(currentPrefs[id] !== value) {
      currentPrefs[id] = value;
      //console.log('sendVelueChangeMessage(2): id = ' + id + ', value = ' + value + ', type = ' + typeof(value));
      let update = {};
      update[id] = value;
      browser.storage.local.set(update).then(null, err => {});
    }
  }
}

const handleVelueChange = (id, value) => {
  let elem = document.getElementById(id);
  let newValue;
  if(elem) {
    let elemType = elem.getAttribute('type');
    if(elemType === 'radioGroup') {
      let radios = Array.from(elem.querySelectorAll('input[name='+id+']'));
      for(let radio of radios) {
        radio.addEventListener('input', event => {if(radio.checked)sendVelueChangeMessage(id, parseInt(radio.getAttribute("value")));});
      }
    }
    else if(elemType === 'checkbox') {
      elem.addEventListener('input', event => {sendVelueChangeMessage(id, elem.checked);});
    }
    else if(elemType === 'color') {
      elem.addEventListener('input', event => {sendVelueChangeMessage(id, elem.value);});
    }
    else if(elemType === 'number') {
      elem.addEventListener('input', event => {sendVelueChangeMessage(id, parseInt(elem.value));});
    }
  }
}

const init = preferences => {
  flagmap = [
    browser.i18n.getMessage('labelNoTranslate'),
    '',
    browser.i18n.getMessage('labelToTraditional'),
    browser.i18n.getMessage('labelToSimplified')
  ];

  //console.log(JSON.stringify(preferences,null,4));
  currentPrefs = preferences;
  for(let p in preferences) {
    setValueToElem(p, preferences[p]);
    handleVelueChange(p, preferences[p]);
  }
  document.title = browser.i18n.getMessage('optionTitle');
  let l10nTags = categories = Array.from(document.querySelectorAll('[data-l10n-id]'));
  l10nTags.forEach(tag => {
    tag.textContent = browser.i18n.getMessage(tag.getAttribute('data-l10n-id'));
  });
}

window.addEventListener('load', event => {
  browser.runtime.getBrowserInfo().then( info => {
    if(info.name === 'Firefox' && parseInt(info.version) < 54) {
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
  if(event.keyCode === 27) {
    hideScreenMask();
  }
}, true);
