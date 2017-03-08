// window loaded
let preferences;
let convertMapping = ['none','auto','trad','simp'];

const urlFilterAction = uri => {
  for (let filter of preferences.urlFilterList) {
    if (filter.url.includes('*')) {
      // var url = filter.url.replace(/(\W+)/ig, '\\$1').replace('*.', '*\\.').replace(/\*/ig, '\\w*'); // 較為嚴謹
      let url = filter.url.replace(/(\W)/ig, '\\$1').replace(/\\\*/ig, '*').replace(/\*/ig, '.*'); // 寬鬆比對
      let re = new RegExp('^' + url + '$', 'ig');
      if (uri.match(re) !== null) {
        return convertMapping[filter.action];
      }
    }
    else if (uri === filter.url) {
      return convertMapping[filter.action];
    }
  }
  return '';
};

const docLoadedInit = uri => {
  let zhflag = '';

  if (preferences.urlFilterEnabled) {
    zhflag = urlFilterAction(uri);
  }
  if (zhflag === '') {
    zhflag = convertMapping[preferences.autoConvert];
  }
  return zhflag;
};

browser.storage.local.get().then(results => {
  if ((typeof results.length === 'number') && (results.length > 0)) {
    results = results[0];
  }
  if (results.version) {
    preferences = results;
    //console.log(JSON.stringify(preferences, null, 4));
    let zhflag = docLoadedInit(document.URL);
    //console.log('zhflag = ' + zhflag );
    TongWen.loadSettingData(preferences);
    if (zhflag === 'trad') {
      TongWen.trans2Trad(document);
    }
    else if (zhflag === 'simp') {
      TongWen.trans2Simp(document);
    }
  }
});

const messageHandler = (request, sender, sendResponse) => {
  //console.log(JSON.stringify(request, null , 4));
  var isInput, val, tag, attr, zhflag, elem, lang;
  if (request.act === 'paste') {
    let val = TongWen.convert(request.text, request.flag);
    let textArea = document.createElement('textarea');
    textArea.value = val;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    sendResponse({text: val});
    return;
  }

  lang = document.documentElement.getAttribute('lang');
  if ((lang === null) && (request.lang !== false)) {
    document.documentElement.setAttribute('lang', request.lang);
  }

  elem = document.activeElement;
  tag = (typeof elem.tagName === 'undefined') ? '' : elem.tagName.toLowerCase();
  val = (typeof elem.type === 'undefined') ? '' : elem.type.toLowerCase();
  isInput = ((['textarea', 'input'].indexOf(tag) >= 0) && (['textarea', 'text'].indexOf(val) >= 0));

  if (isInput && ((request.act === 'input') || (preferences.inputConvert !== 'none'))) {
    // 輸入區文字轉換
    zhflag = request.flag;
    val = document.activeElement.value;
    if (zhflag === 'auto') {
      attr = document.activeElement.getAttribute('zhtongwen');
      if (attr === null) {
        zhflag = 'traditional';
      }
      else {
        zhflag = (attr === 'traditional') ? 'simplified' : 'traditional';
      }
      document.activeElement.setAttribute('zhtongwen', zhflag);
      document.activeElement.value = TongWen.convert(val, zhflag);
    }
    else if (zhflag === 'trad') {
      document.activeElement.value = TongWen.convert(val, 'traditional');
    }
    else if (zhflag === 'simp') {
      document.activeElement.value = TongWen.convert(val, 'simplified');
    }
  }
  else {
    // 網頁轉換
    switch (request.flag) {
      case 'auto':
        TongWen.transAuto(document);
        break;
      case 'trad':
        TongWen.trans2Trad(document);
        break;
      case 'simp':
        TongWen.trans2Simp(document);
        break;
    }
  }
};

browser.runtime.onMessage.addListener(messageHandler);
