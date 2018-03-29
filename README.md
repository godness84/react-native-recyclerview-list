
# react-native-recyclerview-list

A RecyclerView implementation for ReactNative, that overcomes some limitations of `FlatList`, `VirtualizedList` and `ListView`.

## Supported React Native Versions
| Component Version     | RN Versions    |
|-----------------------|---------------|
| **0.1.x**          | **0.45, 0.46**   |
| **0.2.0 - 0.2.2**  | **0.47, 0.48**   |
| **0.2.3**          | **>= 0.49**   |

## Features

- **Supports native animation during adding or removal of items** (as the classic RecyclerView does)
- **Add items at the top with no scrolling issue**: it means that you can easily implement an infinite scroll in both directions
- **Scroll to whatever index you want**: even if you don't know the exact dimensions of your rendered items, you can scroll to any index without any scrolling issue
- **Control the scrolling velocity**: the `velocity` param in the `scrollToIndex` method is exactly for this
- **Initial scroll index**: specify the scroll position at startup, and there will be no flicker
- **Low memory usage**: it renders just the visible items plus some extra items around

## Caveats

- It's just for Android.
- Just vertical linear layout. No fancy layouts as grid.

## Getting started

`$ npm install react-native-recyclerview-list --save`

### Mostly automatic installation

`$ react-native link react-native-recyclerview-list`

### Manual installation


#### Android

1. Open up `android/app/src/main/java/[...]/MainActivity.java`
  - Add `import com.github.godness84.RNRecyclerViewList.RNRecyclerviewListPackage;` to the imports at the top of the file
  - Add `new RNRecyclerviewListPackage()` to the list returned by the `getPackages()` method
2. Append the following lines to `android/settings.gradle`:
  	```
  	include ':react-native-recyclerview-list'
  	project(':react-native-recyclerview-list').projectDir = new File(rootProject.projectDir, 	'../node_modules/react-native-recyclerview-list/android')
  	```
3. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
  	```
      compile project(':react-native-recyclerview-list')
  	```


## Usage
```javascript
import RecyclerviewList, { DataSource } from 'react-native-recyclerview-list';

// Take an array as data
var rawdata = [
  { id: 1, text: 'Item #1' },
  { id: 2, text: 'Item #2' },
  { id: 3, text: 'Item #3' },
  { id: 4, text: 'Item #4' },
  { id: 5, text: 'Item #5' }
];

// Wrap your data in a DataSource.
// The second argument is the 'keyExtractor' function that returns the unique key of the item.
var dataSource = new DataSource(rawdata, (item, index) => item.id);

...

// Render the list
render() {
  return (
    <RecyclerviewList
      style={{ flex: 1 }}
      dataSource={dataSource}
      renderItem={({item, index}) => (
        <Text>{item.text} - {index}</Text>
      )} />
  );
}
```

# Props

Prop name             | Description   | Type      | Default value
----------------------|---------------|-----------|--------------
`style`               | Style for the list | object | {}
`dataSource`          | The datasource that contains the data to render | DataSource | none
`windowSize`          | Number of items to render at the top (and bottom) of the visible items | int | 30
`initialListSize`     | Number of items to render at startup. | int | 10
`initialScrollIndex`  | Index of the item to scroll at startup | int | none
`initialScrollOffset` | Offset of the scroll position at startup | int | none
`itemAnimatorEnabled` | Whether animates items when they are added or removed | boolean | true
`ListHeaderComponent` | Component to render as header | component | none
`ListFooterComponent` | Component to render as footer | component | none
`ListEmptyComponent`  | Component to render in case of no items | component | none
`ItemSeparatorComponent`  | Component to render as item separator | component | none
`onVisibleItemsChange`    | Called when the first and last index of the visible items change | function | none
`onScroll`                | Called when the list is scrolling | function | none
`onScrollBeginDrag`       | Called when the user starts scrolling | function | none
`onScrollEndDrag`         | Called when the user stops dragging | function | none

# Methods

Method name           | Params                          | Description
----------------------|---------------------------------|------------
`scrollToIndex`       | `{ index, animated, velocity, viewPosition, viewOffset }` | Scroll the list to the `index`ed item such that it is positioned in the viewable area such that `viewPosition` 0 places it at the top, 1 at the bottom, and 0.5 centered in the middle. `viewOffset` is a fixed number of pixels to offset the final target position.  It can be `animated`. `velocity` is the amount of milliseconds per inch.
`scrollToEnd`         | `{ animated, velocity }` | Scroll to the end of the list. It can be `animated`. `velocity` is the amount of milliseconds per inch.

# DataSource

It wraps your array, giving you some useful methods to update the data.

## Methods

Method name           | Params                          | Description
----------------------|---------------------------------|------------
`push`                | item                            | Add an item to the end of the array
`unshift`             | item                            | Add an item to the beginning of the array
`splice`              | index, deleteCount, ...items    | Equals to `Array.prototype.splice`
`set`                 | index, item                     | Set the item at the specified index
`get`                 | index                           | Returns the item at the specified index
`size`                |                                 | Returns the length of the array
`setDirty`			  | 								| Forces the RecyclerViewList to render again the visible items

# How to contribute to this library

## Directory structure

```
.
├── example
│   ├── __tests__
│   ├── android
│   ├── ios
│   ├── app.json
│   ├── index.android.js
│   ├── index.ios.js
│   └── package.json
├── android
│   └── src
│      └── main
│          └── java
│              └── com
│                  └── github
│                      └── godness84
│                          └── RNRecyclerViewList
│                              ├── ContentSizeChangeEvent.java
│                              ├── NotAnimatedItemAnimator.java
│                              ├── RNRecyclerviewListModule.java
│                              ├── RNRecyclerviewListPackage.java
│                              ├── RecyclerViewBackedScrollView.java
│                              ├── RecyclerViewBackedScrollViewManager.java
│                              ├── RecyclerViewItemView.java
│                              ├── RecyclerViewItemViewManager.java
│                              └── VisibleItemsChangeEvent.java
├── src
│   ├── DataSource.js
│   └── RecyclerViewList.js
├── index.js
├── package.json
├── LICENSE.md
└── README.md
```

If you have to change Android native code, you must have a look at the code in `library/android/src/main/java/com/github/godness84/RNRecyclerViewList`. Depending of your changes you might have to change the Javascript interface as well in `library/src/`.

## Run the example app

Make sure to have an emulator running or an Android device connected, and then:

```
$ cd example/
$ react-native run-android
```

This will build the Android library (via `gradle`) and example app, then launch the main example activity on your connected device and run the Metro bundler at the same time.
