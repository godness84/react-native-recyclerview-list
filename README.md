
# react-native-recyclerview-list

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
import RNRecyclerviewList from 'react-native-recyclerview-list';

// TODO: What to do with the module?
RNRecyclerviewList;
```
  