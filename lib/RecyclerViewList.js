import React, { Component, PropTypes } from 'react';
import ReactNative, { View, requireNativeComponent, DeviceEventEmitter, StyleSheet, UIManager } from 'react-native';
import DataSource from './DataSource';

class RecyclerViewItem extends Component {
  static propTypes = {
    sss: PropTypes.string
  }

  render() {
    const {children, ...props} = this.props;
    return <NativeRecyclerViewItem {...props}>{children}</NativeRecyclerViewItem>;
  }
}
const NativeRecyclerViewItem = requireNativeComponent('RecyclerViewItemView');

class RecyclerView extends React.PureComponent {
  static propTypes = {
    ...View.propTypes,
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
    },

    onPush: () => {
      const { dataSource } = this.props;
      this._notifyItemRangeInserted(dataSource.size(), 1);
    },

    onSplice: (start, deleteCount, ...items) => {
      if (deleteCount > 0) {
        this._notifyItemRangeRemoved(start, deleteCount);
      }
      if (items.length > 0) {
        this._notifyItemRangeInserted(start, items.length);
      }
    },

    onSet: () => {
      this.forceUpdate();
    },

    onSetDirty: () => {
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
  }

  componentWillReceiveProps(nextProps) {
    const { dataSource } = this.props;
    if (nextProps.dataSource !== dataSource) {
      dataSource._removeListener(this._dataSourceListener);
      nextProps.dataSource._addListener(this._dataSourceListener);
      this._notifyDataSetChanged(nextProps.dataSource.size());
    }
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
        body.push(
          <RecyclerViewItem
            style={styles.absolute}
            key={dataSource.getKey(item, i)}
            itemIndex={i}>
            {i == 0 && headerElement}
            {renderItem({item: item, index: i})}
            {i != end && separatorElement}
            {i == end && footerElement}
          </RecyclerViewItem>
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
          itemIndex={0}>
          {headerElement}
          {emptyElement}
          {footerElement}
        </RecyclerViewItem>
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

    UIManager.dispatchViewManagerCommand(
        ReactNative.findNodeHandle(this),
        UIManager.AndroidRecyclerViewBackedScrollView.Commands.scrollToIndex,
        [animated, index, velocity, viewPosition, viewOffset],
      );
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
