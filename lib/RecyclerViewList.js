import React, { Component } from 'react';
import ReactNative, { ViewPropTypes, requireNativeComponent, DeviceEventEmitter, StyleSheet, UIManager } from 'react-native';
import PropTypes from 'prop-types';
import DataSource from './DataSource';

class RecyclerViewItem extends Component {
  static propTypes = {
    style: ViewPropTypes.style,
    itemIndex: PropTypes.number,
    shouldUpdate: PropTypes.bool,
    dataSource: PropTypes.object,
    renderItem: PropTypes.func,
    header: PropTypes.any,
    separator: PropTypes.any,
    footer: PropTypes.any
  }

  shouldComponentUpdate(nextProps) {
    if (
      (nextProps.itemIndex !== this.props.itemIndex) ||
      (nextProps.shouldUpdate)
    ) {
      return true;
    }

    return false;
  }

  render() {
    const { style, itemIndex, dataSource, renderItem, header, separator, footer } = this.props;
    const element = renderItem({
      item: dataSource.get(itemIndex),
      index: itemIndex
    });

    return (
      <NativeRecyclerViewItem
        style={style}
        itemIndex={itemIndex}>
        {header}
        {element}
        {separator}
        {footer}
      </NativeRecyclerViewItem>
    );
  }
}
const NativeRecyclerViewItem = requireNativeComponent('RecyclerViewItemView');

class RecyclerView extends React.PureComponent {
  static propTypes = {
    ...ViewPropTypes,
    renderItem: PropTypes.func,
    dataSource: PropTypes.instanceOf(DataSource),
    windowSize: PropTypes.number,
    initialListSize: PropTypes.number,
    initialScrollIndex: PropTypes.number,
    initialScrollOffset: PropTypes.number,
    itemAnimatorEnabled: PropTypes.bool,
    ListHeaderComponent: PropTypes.element,
    ListFooterComponent: PropTypes.element,
    ListEmptyComponent: PropTypes.element,
    ItemSeparatorComponent: PropTypes.element,
    onVisibleItemsChange: PropTypes.func
  }

  static defaultProps = {
    dataSource: new DataSource(),
    initialListSize: 10,
    windowSize: 30,
    itemAnimatorEnabled: true,
  }

  _dataSourceListener = {
    onUnshift: () => {
      this._notifyItemRangeInserted(0, 1);
      this._shouldUpdateAll = true;
    },

    onPush: () => {
      const { dataSource } = this.props;
      this._notifyItemRangeInserted(dataSource.size(), 1);
      this._shouldUpdateAll = true;
    },

    onSplice: (start, deleteCount, ...items) => {
      if (deleteCount > 0) {
        this._notifyItemRangeRemoved(start, deleteCount);
      }
      if (items.length > 0) {
        this._notifyItemRangeInserted(start, items.length);
      }
      this._shouldUpdateAll = true;
    },

    onSet: (index, item) => {
      this._shouldUpdateKeys.push(this.props.dataSource.getKey(item, index));
      this.forceUpdate();
    },

    onSetDirty: () => {
      this._shouldUpdateAll = true;
      this.forceUpdate();
    }
  }

  constructor(props) {
    super(props);

    const {
      dataSource,
      initialListSize,
      initialScrollIndex
    } = this.props;

    dataSource._addListener(this._dataSourceListener);

    var visibleRange = initialScrollIndex >= 0 ?
      [initialScrollIndex, initialScrollIndex + initialListSize]
      : [0, initialListSize];

    this.state = {
      firstVisibleIndex: visibleRange[0],
      lastVisibleIndex: visibleRange[1],
      itemCount: dataSource.size()
    };

    this._shouldUpdateAll = true;
    this._shouldUpdateKeys = [];
  }

  componentWillMount() {
  }

  componentWillUnmount() {
    const { dataSource } = this.props;
    if (dataSource) {
      dataSource._removeListener(this._dataSourceListener);
    }
  }

  componentDidMount() {
    const { initialScrollIndex, initialScrollOffset } = this.props;
    if (initialScrollIndex) {
      this.scrollToIndex({
        animated: false,
        index: initialScrollIndex,
        viewPosition: 0,
        viewOffset: initialScrollOffset
      });
    }

    this._shouldUpdateAll = false;
    this._shouldUpdateKeys = [];
  }

  componentWillReceiveProps(nextProps) {
    const { dataSource } = this.props;
    if (nextProps.dataSource !== dataSource) {
      dataSource._removeListener(this._dataSourceListener);
      nextProps.dataSource._addListener(this._dataSourceListener);
      this._notifyDataSetChanged(nextProps.dataSource.size());
    }
  }

  componentDidUpdate(prevProps, prevState) {
    this._shouldUpdateAll = false;
    this._shouldUpdateKeys = [];
  }

  render() {
    const {
      dataSource,
      renderItem,
      ListHeaderComponent,
      ListFooterComponent,
      ListEmptyComponent,
      ItemSeparatorComponent,
      ...rest
    } = this.props;

    const itemCount = dataSource.size();
    const end = itemCount-1;
    var stateItemCount = this.state.itemCount;

    var body = [];
    var itemRangeToRender = this._calcItemRangeToRender(this.state.firstVisibleIndex, this.state.lastVisibleIndex);

    if (ListHeaderComponent) {
      var headerElement = React.isValidElement(ListHeaderComponent)
        ? ListHeaderComponent
        : <ListHeaderComponent />;
    }

    if (ListFooterComponent) {
      var footerElement = React.isValidElement(ListFooterComponent)
        ? ListFooterComponent
        : <ListFooterComponent />;
    }

    if (ItemSeparatorComponent) {
      var separatorElement = React.isValidElement(ItemSeparatorComponent)
        ? ItemSeparatorComponent
        : <ItemSeparatorComponent />;
    }

    if (itemCount > 0) {
      for (var i=itemRangeToRender[0]; i<itemRangeToRender[1]; i++) {
        let item = dataSource.get(i);
        let itemKey = dataSource.getKey(item, i);
        let shouldUpdate = this._needsItemUpdate(itemKey);
        body.push(
          <RecyclerViewItem
            key={itemKey}
            style={styles.absolute}
            itemIndex={i}
            shouldUpdate={shouldUpdate}
            dataSource={dataSource}
            renderItem={renderItem}
            header={i == 0 && headerElement}
            separator={i != end && separatorElement}
            footer={i == end && footerElement} />
        );
      }
    } else if (ListEmptyComponent) {
      var emptyElement = React.isValidElement(ListEmptyComponent)
        ? ListEmptyComponent
        : <ListEmptyComponent />;

      body.push(
        <RecyclerViewItem
          style={styles.absolute}
          key="$empty"
          itemIndex={0}
          shouldUpdate={true}
          dataSource={dataSource}
          renderItem={() => emptyElement}
          header={headerElement}
          footer={footerElement} />
      );

      stateItemCount = 1;
    }

    return (
      <NativeRecyclerView
        {...rest}
        itemCount={stateItemCount}
        onVisibleItemsChange={this._handleVisibleItemsChange}>
        {body}
      </NativeRecyclerView>
    );
  }

  scrollToEnd({ animated = true, velocity } = {}) {
    this.scrollToIndex({
      index: this.props.dataSource.size() - 1,
      animated,
      velocity
    });
  }

  scrollToIndex = ({ animated = true, index, velocity, viewPosition, viewOffset }) => {
    index = Math.max(0, Math.min(index, this.props.dataSource.size()-1));

    if (animated) {
      UIManager.dispatchViewManagerCommand(
          ReactNative.findNodeHandle(this),
          UIManager.AndroidRecyclerViewBackedScrollView.Commands.scrollToIndex,
          [animated, index, velocity, viewPosition, viewOffset],
        );
    } else {
      this.setState({
        firstVisibleIndex: index,
        lastVisibleIndex: index + (this.state.lastVisibleIndex - this.state.firstVisibleIndex)
      }, () => {
        UIManager.dispatchViewManagerCommand(
            ReactNative.findNodeHandle(this),
            UIManager.AndroidRecyclerViewBackedScrollView.Commands.scrollToIndex,
            [animated, index, velocity, viewPosition, viewOffset],
          );
      });
    }
  }

  _needsItemUpdate(itemKey) {
    return this._shouldUpdateAll || this._shouldUpdateKeys.includes(itemKey);
  }

  _handleVisibleItemsChange = ({nativeEvent}) => {
    var firstIndex = nativeEvent.firstIndex;
    var lastIndex = nativeEvent.lastIndex;

    this.setState({
      firstVisibleIndex: firstIndex,
      lastVisibleIndex: lastIndex,
    });

    const { onVisibleItemsChange } = this.props;
    if (onVisibleItemsChange) {
      onVisibleItemsChange(nativeEvent);
    }
  }

  _calcItemRangeToRender(firstVisibleIndex, lastVisibleIndex) {
    const { dataSource, windowSize } = this.props;
    var count = dataSource.size();
    var from = Math.min(count, Math.max(0, firstVisibleIndex - windowSize));
    var to = Math.min(count, lastVisibleIndex + windowSize);
    return [from, to];
  }

  _notifyItemRangeInserted(position, count) {
    UIManager.dispatchViewManagerCommand(
        ReactNative.findNodeHandle(this),
        UIManager.AndroidRecyclerViewBackedScrollView.Commands.notifyItemRangeInserted,
        [position, count],
      );

    const { firstVisibleIndex, lastVisibleIndex, itemCount } = this.state;

    if (itemCount == 0) {
      this.setState({
        itemCount: this.props.dataSource.size(),
        firstVisibleIndex: 0,
        lastVisibleIndex: this.props.initialListSize
      });
    } else {
      if (position <= firstVisibleIndex) {
        this.setState({
          firstVisibleIndex: this.state.firstVisibleIndex + count,
          lastVisibleIndex: this.state.lastVisibleIndex + count,
        });
      } else {
        this.forceUpdate();
      }
    }
  }

  _notifyItemRangeRemoved(position, count) {
    UIManager.dispatchViewManagerCommand(
        ReactNative.findNodeHandle(this),
        UIManager.AndroidRecyclerViewBackedScrollView.Commands.notifyItemRangeRemoved,
        [position, count],
      );
    this.forceUpdate();
  }

  _notifyDataSetChanged(itemCount) {
    UIManager.dispatchViewManagerCommand(
        ReactNative.findNodeHandle(this),
        UIManager.AndroidRecyclerViewBackedScrollView.Commands.notifyDataSetChanged,
        [itemCount],
      );
    this.setState({
      itemCount
    });
  }
}

var nativeOnlyProps = {
  nativeOnly: {
    onVisibleItemsChange: true,
    itemCount: true
  }
};

var styles = StyleSheet.create({
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0
  },
});

const NativeRecyclerView = requireNativeComponent('AndroidRecyclerViewBackedScrollView', RecyclerView, nativeOnlyProps);

module.exports = RecyclerView;
