// 過濾網址轉換目標的文字（不轉換、繁體、簡體）
class FlagMap {
  constructor() {
    this._flagmap = [];
    this._flagmap.push(browser.i18n.getMessage('labelNoTranslate'));
    this._flagmap.push('');
    this._flagmap.push(browser.i18n.getMessage('labelToTraditional'));
    this._flagmap.push(browser.i18n.getMessage('labelToSimplified'));
  }

  get(id) {
    return this._flagmap[id];
  }
}

export default new FlagMap();
