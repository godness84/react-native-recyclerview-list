package com.github.godness84.RNRecyclerViewList;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

public class VisibleItemsChangeEvent extends Event<VisibleItemsChangeEvent> {

    public static final String EVENT_NAME = "visibleItemsChange";

    private final int mFirstIndex;
    private final int mLastIndex;

    public VisibleItemsChangeEvent(int viewTag, long timestampMs, int firstIndex, int lastIndex) {
        super(viewTag);
        mFirstIndex = firstIndex;
        mLastIndex = lastIndex;
    }

    @Override
    public String getEventName() {
        return EVENT_NAME;
    }

    @Override
    public void dispatch(RCTEventEmitter rctEventEmitter) {
        WritableMap data = Arguments.createMap();
        data.putInt("firstIndex", mFirstIndex);
        data.putInt("lastIndex", mLastIndex);
        rctEventEmitter.receiveEvent(getViewTag(), EVENT_NAME, data);
    }
}
