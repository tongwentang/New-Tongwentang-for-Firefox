class Notifier {
  constructor() {}

  create(message, timeout = 5000, id = new Date().valueOf().toString()) {
    if (!message) {
      return;
    }

    browser.notifications.create(id, {
      type: 'basic',
      title: browser.i18n.getMessage('notifDefaultTitle'),
      message,
    });

    setTimeout(
      id => {
        this.clean(id);
      },
      timeout,
      id
    );
  }

  clean(id) {
    browser.notifications.clear(id);
  }
}

export default new Notifier();
