import React, { Component, PropTypes } from 'react';
import ReactNative, { View, requireNativeComponent, DeviceEventEmitter, StyleSheet, UIManager } from 'react-native';

class RecyclerViewItem extends Component {
  render() {
    const {children, ...props} = this.props;
    return <NativeRecyclerViewItem {...props}>{children}</NativeRecyclerViewItem>;
  }
}
const NativeRecyclerViewItem = requireNativeComponent('RecyclerViewItemView', RecyclerViewItem);

class RecyclerView extends Component {
  static propTypes = {
    renderItem: React.PropTypes.function,
    /**
     * The default accessor functions assume this is an Array<{key: string}> but you can override
     * getItem, getItemCount, and keyExtractor to handle any type of index-based data.
     */
    data: React.PropTypes.array,
    /**
     * A generic accessor for extracting an item from any sort of data blob.
     */
    getItem: React.PropTypes.function,
    /**
     * Determines how many items are in the data blob.
     */
    getItemCount: React.PropTypes.function,

    initialListSize: React.PropTypes.number,
    pageSize: React.PropTypes.number
  }

  static defaultProps = {
    getItem: (data, index) => data[index],
    getItemCount: (data) => data.length,
    initialListSize: 10,
    pageSize: 30
  }

  constructor(props) {
    super(props);
    this.state = {
      firstVisibleIndex: 0,
      lastVisibleIndex: this.props.initialListSize,
      fakeCount: this.props.data.length
    };
  }

  componentWillMount() {
  }

  componentWillUnmount() {
  }

  componentWillReceiveProps(nextProps) {
    console.log('receiving nextProps', nextProps.data === this.props.data);
  }

  render() {
    const { data, getItem, getItemCount, renderItem, ...rest} = this.props;

    var itemCount = getItemCount(data);
    var body = [];
    var itemRangeToRender = this._calcItemRangeToRender(this.state.firstVisibleIndex, this.state.lastVisibleIndex);

    for (var i=itemRangeToRender[0], k=0; i<itemRangeToRender[1]; i++, k++) {
      body.push(
        <RecyclerViewItem key={i} itemIndex={i} style={styles.absolute}>
          {renderItem({item: data[i], index: i})}
        </RecyclerViewItem>
      );
    }

    return (
      <NativeRecyclerView {...rest} itemCount={this.state.fakeCount} onVisibleItemsChange={this.handleVisibleItemsChange}>
        {body}
      </NativeRecyclerView>
    );
  }

  handleVisibleItemsChange = ({nativeEvent}) => {
    console.log(nativeEvent);
    var firstIndex = nativeEvent.firstIndex;
    var lastIndex = nativeEvent.lastIndex;

    this.setState({
      firstVisibleIndex: firstIndex,
      lastVisibleIndex: lastIndex,
    });
  }

  _calcItemRangeToRender(firstVisibleIndex, lastVisibleIndex) {
    var count = this.props.getItemCount(this.props.data);
    var from = Math.min(count, Math.max(0, firstVisibleIndex - 15));
    var to = Math.min(count, lastVisibleIndex + 15);
    return [from, to];
  }

  _notifyItemRangeInserted(position, count) {
    UIManager.dispatchViewManagerCommand(
        ReactNative.findNodeHandle(this),
        UIManager.AndroidRecyclerViewBackedScrollView.Commands.notifyItemRangeInserted,
        [position, count],
      );
    this.setState({
      firstVisibleIndex: this.state.firstVisibleIndex + count,
      lastVisibleIndex: this.state.lastVisibleIndex + count,
    }, () => {
    });
  }
}

var nativeOnlyProps = {
  nativeOnly: {
    onVisibleItemsChange: true,
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
