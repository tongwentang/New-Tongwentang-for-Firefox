import { defaultPS2TTable } from './tongwen_table_ps2t';
import { defaultPT2STable } from './tongwen_table_pt2s';
import { defaultS2TTable } from './tongwen_table_s2t';
import { defaultT2STable } from './tongwen_table_t2s';
import { symbolS2T } from './tongwen_table_ss2t';
import { symbolT2S } from './tongwen_table_st2s';

export const TongWen = (function() {
  const version = '0.4'; // 版本

  const flagSimp = 'simplified'; // 簡體
  const flagTrad = 'traditional'; // 繁體

  const zhEncodesSimp = [
    'gb2312',
    'gbk',
    'x-gbk',
    'gb18030',
    'hz-gb-2312',
    'iso-2022-cn',
    'utf-7',
    'utf-8',
    'utf-16le',
    'x-user-defined',
  ];
  const zhEncodesTrad = ['big5', 'big5-hkscs', 'x-euc-tw'];

  const zhLangSimp = ['zh-cn', 'zh'];
  const zhLangTrad = ['zh-tw', 'zh-hk', 'zh-hant-tw', 'zh-hant-hk'];

  let enableFontset = false;
  let fontTrad = 'PMingLiU,MingLiU,新細明體,細明體';
  let fontSimp = 'MS Song,宋体,SimSun';

  const t2s = {}; // 繁轉簡 對照表
  const s2t = {}; // 簡轉繁 對照表

  let maxSTLen = 1; // 簡轉繁 最長的詞句
  let maxTSLen = 1; // 繁轉簡 最長的詞句

  let curZhFlag = ''; // 目前網頁編碼
  const styleIdx = 0; // 樣式索引
  // const debug = false;

  // =============================================================================
  function enableCustomFontset(bol) {
    enableFontset = bol;
  }

  function setTradFontset(val) {
    fontTrad = val;
  }

  function setSimpFontset(val) {
    fontSimp = val;
  }

  function setFont(zhflag) {
    let css;
    if (zhflag === flagTrad) {
      css = ` font-family: ${fontTrad};`;
    } else if (zhflag === flagSimp) {
      css = ` font-family: ${fontSimp};`;
    }

    const sty = document.styleSheets[styleIdx];
    if (sty.insertRule && typeof sty.addRule === 'undefined') {
      sty.addRule = function(rule, newCss, idx) {
        if (typeof idx === 'undefined') {
          this.insertRule(`${rule} { ${newCss} }`, this.cssRules.length);
        } else {
          this.insertRule(`${rule} {${newCss}}`, idx);
        }
      };
    }
    sty.addRule('*', css);
  }

  // =============================================================================

  // 新增 簡轉繁 對照表
  function addS2TTable(table) {
    Object.keys(table).forEach(key => {
      maxSTLen = Math.max(maxSTLen, table[key].length);
      s2t[key] = table[key];
    });
  }

  // 新增 繁轉簡 對照表
  function addT2STable(table) {
    Object.keys(table).forEach(key => {
      maxTSLen = Math.max(maxTSLen, table[key].length);
      t2s[key] = table[key];
    });
  }

  function getZhFlag(doc) {
    let zhflag = '';
    let lang;
    let charset;

    if (doc && doc.documentElement) {
      lang = doc.documentElement.getAttribute('lang');
      if (lang === null) {
        charset = document.characterSet.toLowerCase();
        if (zhEncodesTrad.indexOf(charset) >= 0) {
          zhflag = flagTrad;
        } else if (zhEncodesSimp.indexOf(charset) >= 0) {
          zhflag = flagSimp;
        }
      } else {
        lang = lang.toLowerCase();
        if (zhLangTrad.indexOf(lang) >= 0) {
          zhflag = flagTrad;
        } else if (zhLangSimp.indexOf(lang) >= 0) {
          zhflag = flagSimp;
        }
      }
    }
    return zhflag;
  }

  // 單字轉換
  function convertCharacter(str, zhflag) {
    let zmap;
    if (zhflag === flagSimp) {
      // 繁轉簡
      zmap = t2s;
    } else {
      // 簡轉繁
      zmap = s2t;
    }
    str = str.split('');
    for (let i = 0, c = str.length; i < c; i += 1) {
      str[i] = zmap[str[i]] || str[i];
    }
    return str.join('');
  }

  // 繁簡轉換
  function convert(str, zhflag) {
    // let d = false;
    // if(str==='您刚升级到 Firefox Nightly 54！') {
    //   d = true;
    //   console.log(str);
    // }
    let leng = 4;
    let zmap = null;
    let i;
    let j;
    let c;
    let txt;
    let s;
    let bol;

    if (zhflag === flagSimp) {
      // 繁轉簡
      zmap = t2s;
      leng = Math.min(maxTSLen, str.length);
    } else {
      // 簡轉繁
      zmap = s2t;
      leng = Math.min(maxSTLen, str.length);
    }

    // 單字轉換
    str = convertCharacter(str, zhflag);

    // 詞彙轉換
    txt = '';
    s = '';
    bol = true;
    for (i = 0, c = str.length; i < c; ) {
      bol = true;
      for (j = leng; j > 1; j -= 1) {
        s = str.substr(i, j);
        // if(d)
        //   console.log(s);

        if (s in zmap) {
          txt += zmap[s];
          i += j;
          bol = false;
          break;
        }
      }

      if (bol) {
        txt += str.substr(i, 1);
        i += 1;
      }
    }
    if (txt !== '') {
      str = txt;
    }
    return str;
  }

  function parseTree(doc, zhflag) {
    const treeWalker = doc.createTreeWalker(doc.body, 1 | 4, null, false);

    (function walker() {
      let node = null;
      let attr = null;
      let cnt = 0;

      while (treeWalker.nextNode()) {
        node = treeWalker.currentNode;

        // Node Types http://www.w3schools.com/dom/dom_nodetype.asp
        switch (node.nodeType) {
          case 1: // ELEMENT_NODE
            // opera.postError(node.nodeName + ': ' + node.innerHTML);
            switch (node.nodeName.toLowerCase()) {
              case 'frame':
              case 'iframe':
                // if (typeof node.contentDocument != 'undefined') {
                // transPage(node.contentDocument, zhflag);
                // frame.push(node.contentDocument);
                // } else if ((typeof node.contentWindow != 'undefined') && (typeof node.contentWindow.document != 'undefined')) {
                // transPage(node.contentWindow.document, zhflag);
                // frame.push(node.contentWindow.document);
                // }
                // transPage(node.contentDocument || node.contentWindow.document, zhflag);
                // frame.push(node.contentDocument || node.contentWindow.document);
                break;
              case 'embed':
              case 'object':
              case 'script':
              case 'noscript':
              case 'style':
              case 'title':
              case 'br':
              case 'hr':
              case 'link':
              case 'meta':
                break;
              case 'img':
                attr = node.getAttribute('title');
                if (attr !== null) {
                  node.setAttribute('title', convert(attr, zhflag));
                }
                attr = node.getAttribute('alt');
                if (attr !== null) {
                  node.setAttribute('alt', convert(attr, zhflag));
                }
                break;
              case 'input':
                if (
                  'text,hidden'.indexOf(node.type.toLowerCase()) < 0 &&
                  node.value.length > 0
                ) {
                  node.value = convert(node.value, zhflag);
                }
                break;
              case 'textarea':
                if (node.hasChildNodes()) {
                  treeWalker.nextNode();
                }
                break;
              case 'option':
                if (node.text.length > 0) {
                  node.text = convert(node.text, zhflag);
                }
                break;
              default:
                attr = node.getAttribute('title');
                if (attr !== null) {
                  node.setAttribute('title', convert(attr, zhflag));
                }
                break;
            }
            break;
          case 3: // TEXT_NODE
            if (node.nodeValue.length > 0) {
              // opera.postError(node.nodeValue);
              node.nodeValue = convert(node.nodeValue, zhflag);
            }
            break;
          default:
            break;
        }

        if (cnt > 70) {
          break;
        }
        cnt += 1;
      }

      setTimeout(() => {
        walker();
      }, 1);
    })();
  }

  function transPage(doc, zhflag) {
    curZhFlag = zhflag;
    try {
      doc.title = convert(doc.title, zhflag);
      parseTree(doc, zhflag);
      if (enableFontset) {
        setFont(zhflag);
      }
    } catch (ex) {
      console.error(ex);
    }
  }

  function trans2Trad(doc) {
    transPage(doc || document, flagTrad);
  }

  function trans2Simp(doc) {
    transPage(doc || document, flagSimp);
  }

  function transAuto(doc) {
    const curDoc = doc || document;

    if (curZhFlag === '') {
      curZhFlag = getZhFlag(curDoc);
      if (curZhFlag === '') {
        return;
      }
    }
    const zhflag = curZhFlag === flagTrad ? flagSimp : flagTrad;
    transPage(curDoc, zhflag);
  }

  // =============================================================================
  // for Chrome, Safari, Opera extensions
  function loadSettingData(preferences) {
    // 載入預設的轉換表
    addS2TTable(defaultS2TTable);
    addT2STable(defaultT2STable);
    addS2TTable(defaultPS2TTable);
    addT2STable(defaultPT2STable);

    // 載入標點符號轉換表
    if (preferences.symConvert) {
      addT2STable(symbolT2S);
      addS2TTable(symbolS2T);
    }
    // 載入使用者定義的詞彙表
    if (preferences.userPhraseEnable) {
      // addT2STable(preferences.userPhraseSimpList);
      // addS2TTable(preferences.userPhraseTradList);
      const newPT2S = {};
      Object.keys(preferences.userPhraseSimpList).forEach(key => {
        const nk = convertCharacter(key, flagSimp);
        newPT2S[nk] = preferences.userPhraseSimpList[key];
      });
      addT2STable(newPT2S);

      const newPS2T = {};
      Object.keys(preferences.userPhraseTradList).forEach(key => {
        const nk = convertCharacter(key, flagTrad);
        newPS2T[nk] = preferences.userPhraseTradList[key];
      });
      addS2TTable(newPS2T);
    }
    // 強制字型設定
    if (preferences.fontCustomEnabled) {
      setTradFontset(preferences.fontCustomTrad);
      setSimpFontset(preferences.fontCustomSimp);
      enableCustomFontset(true);
    } else {
      enableCustomFontset(false);
    }
  }

  function extensionAction() {}
  // =============================================================================

  return {
    version,
    addS2TTable,
    addT2STable,
    convert,
    transPage,
    trans2Trad,
    trans2Simp,
    transAuto,
    enableCustomFontset,
    setTradFontset,
    setSimpFontset,
    loadSettingData,
    extensionAction,
  };
})();
