
package com.github.godness84.RNRecyclerViewList;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;

public class RNRecyclerviewListModule extends ReactContextBaseJavaModule {

  private final ReactApplicationContext reactContext;

  public RNRecyclerviewListModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    return "RNRecyclerviewList";
  }
}