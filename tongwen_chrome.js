chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        var isInput, val, tag, attr, zhflag, elem, lang;

        lang = document.documentElement.getAttribute('lang');
        if ((lang === null) && (request.lang !== false)) {
            document.documentElement.setAttribute('lang', request.lang);
        }

        elem = document.activeElement;
        tag = (typeof elem.tagName === 'undefined') ? '' : elem.tagName.toLowerCase();
        val = (typeof elem.type === 'undefined') ? '' : elem.type.toLowerCase();
        isInput = ((['textarea', 'input'].indexOf(tag) >= 0) && (['textarea', 'text'].indexOf(val) >= 0));

        if (isInput && ((request.act === 'input') || (request.tongwen.inputConvert !== 'none'))) {
            // 輸入區文字轉換
            zhflag = request.flag;
            val = document.activeElement.value;
            if (zhflag === 'auto') {
                attr = document.activeElement.getAttribute('zhtongwen');
                if (attr === null) {
                    zhflag = 'traditional';
                } else {
                    zhflag = (attr === 'traditional') ? 'simplified' : 'traditional';
                }
                document.activeElement.setAttribute('zhtongwen', zhflag);
                document.activeElement.value = TongWen.convert(val, zhflag);
            } else if (zhflag === 'trad') {
                document.activeElement.value = TongWen.convert(val, 'traditional');
            } else if (zhflag === 'simp') {
                document.activeElement.value = TongWen.convert(val, 'simplified');
            }
        } else {
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
    }
);

// window loaded
chrome.runtime.sendMessage(
    '',
    {
        'baseURI': document.baseURI,
        'docURL' : document.URL
    },
    function (response) {
        TongWen.loadSettingData(response[0]);
        if (response[1] === 'trad') {
            TongWen.trans2Trad(document);
        } else if (response[1] === 'simp') {
            TongWen.trans2Simp(document);
        }
    }
);
