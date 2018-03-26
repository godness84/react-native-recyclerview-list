/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  Image,
  Button,
  TouchableNativeFeedback,
  ToastAndroid
} from 'react-native';

import RecyclerViewList from 'react-native-recyclerview-list';
import DataSource from 'react-native-recyclerview-list/lib/DataSource';

var _gCounter = 1;
function newItem() {
  return {
    id: _gCounter++,
    counter: 0
  };
}

export default class example extends Component {
  constructor(props) {
    super(props);
    var data = Array(10).fill().map((e,i) => newItem());

    this.state = {
      dataSource: new DataSource(data, (item, index) => item.id)
    };
  }

  render() {
    const { dataSource } = this.state;

    return (
      <View style={styles.container}>
        { this.renderTopControlPanel() }
        <RecyclerViewList
          ref={(component) => this._recycler = component}
          style={{ flex: 1 }}
          dataSource={dataSource}
          renderItem={this.renderItem}
          windowSize={20}
          initialScrollIndex={0}
          ListHeaderComponent={(
            <View style={{ paddingTop: 15, backgroundColor: '#eee' }} />
          )}
          ListFooterComponent={(
            <View style={{ paddingTop: 15, backgroundColor: '#eee'}} />
          )}
          ListEmptyComponent={(
            <View style={{ borderColor: '#e7e7e7', borderWidth: 1, margin: 10, padding: 20, }}>
              <Text style={{ fontSize: 15 }}>No results.</Text>
            </View>
          )}
          ItemSeparatorComponent={(
            <View style={{ borderBottomWidth: 1, borderColor: '#e7e7e7', marginHorizontal: 5, marginVertical: 10 }} />
          )} />
        { this.renderBottomControlPanel() }
      </View>
    );
  }

  renderItem = ({item, index}) => {
    return (
      <Item
        item={item}
        index={index}
        onRemove={() => this.remove(index)}
        onAddAbove={() => this.addAbove(index)}
        onAddBelow={() => this.addBelow(index)}
        onIncrementCounter={() => this.incrementCounter(index)} />
    );
  }

  renderTopControlPanel() {
    return (
      <View style={{ flexDirection: 'row', padding: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e7e7e7' }}>
        <Button
          title={"\u002B40 \u25B2"}
          onPress={() => this.addToTop(40)} />
        <View style={{ width: 5 }} />
        <Button
          title={"\u002B40 \u25BC"}
          onPress={() => this.addToBottom(40)} />
        <View style={{ width: 15 }} />
        <Text>Scroll:</Text>
        <View style={{ width: 5 }} />
        <Button
          title={"\u25B2"}
          onPress={() => this._recycler && this._recycler.scrollToIndex({index: 0, animated: true})} />
        <View style={{ width: 5 }} />
        <Button
          title={"\u25BC"}
          onPress={() => this._recycler && this._recycler.scrollToEnd()} />
        <View style={{ width: 5 }} />
        <Button
          title={"rand"}
          onPress={() => {
            var index = Math.floor((Math.random() * this.state.dataSource.size()));
            var item = this.state.dataSource.get(index);
            this._recycler && this._recycler.scrollToIndex({ index, animated: false });
            ToastAndroid.show('Scrolled to item: ' + item.id, ToastAndroid.SHORT);
          }} />
      </View>
    );
  }

  renderBottomControlPanel() {
    return (
      <View style={{ flexDirection: 'row', padding: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e7e7e7' }}>
        <Button
          title={"Reset"}
          onPress={() => this.reset()} />
      </View>
    );
  }

  reset() {
    //_gCounter = 1;
    var data = Array(10).fill().map((e,i) => newItem());
    this.setState({
      dataSource: new DataSource(data, (item, index) => item.id)
    });
  }

  remove(index) {
    this.state.dataSource.splice(index, 1);
  }

  addAbove(index) {
    this.state.dataSource.splice(index, 0, newItem());
  }

  addBelow(index) {
    const { dataSource } = this.state;
    if (index == dataSource.size() - 1 && this._recycler) {
      this._recycler.scrollToIndex({
        animated: true,
        index: dataSource.size(),
        velocity: 120
      });
    }

    this.state.dataSource.splice(index+1, 0, newItem());
  }

  incrementCounter(index) {
    var item = this.state.dataSource.get(index);
    item.counter++;
    this.state.dataSource.set(index, item);
  }

  addToTop(size) {
    var currCount = this.state.dataSource.size();
    var newItems = Array(size).fill().map((e,i)=>newItem());
    this.state.dataSource.splice(0, 0, ...newItems);
  }

  addToBottom(size) {
    var currCount = this.state.dataSource.size();
    var newItems = Array(size).fill().map((e,i)=>newItem());
    this.state.dataSource.splice(currCount, 0, ...newItems);
  }
}

class Item extends Component {
  render() {
    const { item, index, onRemove, onAddAbove, onAddBelow, onIncrementCounter } = this.props;
    const { id, counter } = item;
    const imageSize = 70 + id % 70;

    return (
      <TouchableNativeFeedback
        onPress={onIncrementCounter}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 5 }}>
          <Image
            source={{ uri: 'http://loremflickr.com/320/240?t=' + (id % 9) }}
            style={{
              width: imageSize,
              height: imageSize,
              marginRight: 10
            }} />
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 16,
              color: 'black'
            }}>Item #{id}</Text>
            <Text style={{
              fontSize: 13,
              color: '#888'
            }}>Touch to count { counter ?
              <Text style={{ fontWeight: 'bold', color: 'black' }}>{counter}</Text>
              : null }</Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <Button
              title={"\u002B\u25B2"}
              onPress={onAddAbove} />
            <View style={{ width: 5 }} />
            <Button
              title={"\u002B\u25BC"}
              onPress={onAddBelow} />
            <View style={{ width: 5 }} />
            <Button
              color="red"
              title={" X "}
              onPress={onRemove} />
          </View>
        </View>
      </TouchableNativeFeedback>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
});

AppRegistry.registerComponent('example', () => example);
