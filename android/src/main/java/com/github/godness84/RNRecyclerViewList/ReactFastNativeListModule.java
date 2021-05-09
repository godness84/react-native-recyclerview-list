
package com.github.godness84.RNRecyclerViewList;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;

public class ReactFastNativeListModule extends ReactContextBaseJavaModule {
  public ReactFastNativeListModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "ReactFastNativeList";
  }
}