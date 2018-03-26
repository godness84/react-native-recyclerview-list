export default class DataSource {
  constructor(data, keyExtractor) {
    this._data = data || [];
    this._keyExtractor = keyExtractor;
    this._listeners = [];

    if (!keyExtractor) {
      console.warn(
        'RecyclerViewList/DataSource: missing keyExtractor, it\'s strongly recommended to specify a keyExtractor function ' +
        'in order to use all the features correctly.'
      );

      this._keyExtractor = (item, index) => {
        return JSON.stringify(item) + '_' + index;
      }
    }
  }

  push(item) {
    this._data.push(item);
    this._listeners.forEach((listener) => {
      listener && listener.onPush && listener.onPush(item);
    });
  }

  unshift(item) {
    this._data.unshift(item);
    this._listeners.forEach((listener) => {
      listener && listener.onUnshift && listener.onUnshift(item);
    });
  }

  splice(start, deleteCount, ...items) {
    this._data.splice(start, deleteCount, ...items);
    this._listeners.forEach((listener) => {
      listener && listener.onSplice && listener.onSplice(start, deleteCount, ...items);
    });
  }

  size() {
    return this._data.length;
  }

  moveUp(index) {
    if (index <= 0) {
      return;
    }
    const item = this._data[index];
    this._data[index] = this._data[index - 1];
    this._data[index - 1] = item;
    this._listeners.forEach((listener) => {
      listener && listener.onMoveUp && listener.onMoveUp(index);
    });
  }

  moveDown(index) {
    if (index >= this._data.length - 1) {
      return;
    }
    const item = this._data[index];
    this._data[index] = this._data[index + 1];
    this._data[index + 1] = item;
    this._listeners.forEach((listener) => {
      listener && listener.onMoveDown && listener.onMoveDown(index);
    });
  }

  set(index, item) {
    this._data[index] = item;
    this._listeners.forEach((listener) => {
      listener && listener.onSplice && listener.onSet(index, item);
    });
  }

  setDirty() {
    this._listeners.forEach((listener) => {
      listener && listener.onSetDirty && listener.onSetDirty();
    });
  }

  get(index) {
    return this._data[index];
  }

  getKey(item, index) {
    return this._keyExtractor(item, index);
  }

  _addListener(listener) {
    this._listeners.push(listener);
  }

  _removeListener(listener) {
    var index = this._listeners.indexOf(listener);
    if (index > -1) {
      this._listeners.splice(index, 1);
    }
  }
}
