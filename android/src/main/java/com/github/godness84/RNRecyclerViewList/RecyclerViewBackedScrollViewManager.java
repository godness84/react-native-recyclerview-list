package com.github.godness84.RNRecyclerViewList;

import javax.annotation.Nullable;

import java.util.Map;

import android.support.v7.widget.LinearLayoutManager;
import android.util.Log;
import android.view.ContextThemeWrapper;
import android.view.View;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.views.scroll.ReactScrollViewCommandHelper;
import com.facebook.react.views.scroll.ScrollEventType;
import com.github.godness84.RNRecyclerViewList.R;

/**
 * View manager for {@link RecyclerViewBackedScrollView}.
 */
public class RecyclerViewBackedScrollViewManager extends
        ViewGroupManager<RecyclerViewBackedScrollView>
        implements ReactScrollViewCommandHelper.ScrollCommandHandler<RecyclerViewBackedScrollView> {

    public static final String REACT_CLASS = "AndroidRecyclerViewBackedScrollView";
    public static final int COMMAND_NOTIFY_ITEM_RANGE_INSERTED = 1;
    private static final String TAG = "RecyclerViewManager";

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    // TODO(8624925): Implement removeClippedSubviews support for native ListView

    @ReactProp(name = "onContentSizeChange")
    public void setOnContentSizeChange(RecyclerViewBackedScrollView view, boolean value) {
        view.setSendContentSizeChangeEvents(value);
    }

    @Override
    protected RecyclerViewBackedScrollView createViewInstance(ThemedReactContext reactContext) {
        return new RecyclerViewBackedScrollView(reactContext);
    }

    @Override
    public void addView(RecyclerViewBackedScrollView parent, View child, int index) {
        Assertions.assertCondition(child instanceof RecyclerViewItemView, "Views attached to RecyclerViewBackedScrollView must be RecyclerViewItemView views.");
        RecyclerViewItemView item = (RecyclerViewItemView) child;
        parent.addViewToAdapter(item, index);
    }

    @Override
    public int getChildCount(RecyclerViewBackedScrollView parent) {
        return parent.getChildCountFromAdapter();
    }

    @Override
    public View getChildAt(RecyclerViewBackedScrollView parent, int index) {
        return parent.getChildAtFromAdapter(index);
    }

    @Override
    public void removeViewAt(RecyclerViewBackedScrollView parent, int index) {
        parent.removeViewFromAdapter(index);
    }

    @ReactProp(name = "itemCount")
    public void setItemCount(RecyclerViewBackedScrollView parent, int itemCount) {
        parent.setItemCount(itemCount);
        parent.getAdapter().notifyDataSetChanged();
        Log.d(TAG, String.format("notified data set changed"));

    }

    @Override
    public Map<String, Integer> getCommandsMap() {
        return MapBuilder.of("notifyItemRangeInserted", COMMAND_NOTIFY_ITEM_RANGE_INSERTED);
    }

    @Override
    public void receiveCommand(
            RecyclerViewBackedScrollView parent,
            int commandType,
            @Nullable ReadableArray args) {
        Assertions.assertNotNull(parent);
        Assertions.assertNotNull(args);
        switch (commandType) {
            case COMMAND_NOTIFY_ITEM_RANGE_INSERTED: {
                final int position = args.getInt(0);
                final int count = args.getInt(1);
                Log.d(TAG, String.format("notify item range inserted: position %d, count %d", position, count));

                RecyclerViewBackedScrollView.ReactListAdapter adapter = (RecyclerViewBackedScrollView.ReactListAdapter) parent.getAdapter();
                adapter.setItemCount(adapter.getItemCount() + count);
                LinearLayoutManager layoutManager = (LinearLayoutManager) parent.getLayoutManager();
                //adapter.notifyItemRangeChanged(0, adapter.getItemCount());
                adapter.notifyItemRangeInserted(position, count);
                return;
            }

            default:
                throw new IllegalArgumentException(String.format(
                        "Unsupported command %d received by %s.",
                        commandType,
                        getClass().getSimpleName()));
        }
    }

    @Override
    public void scrollTo(
            RecyclerViewBackedScrollView scrollView,
            ReactScrollViewCommandHelper.ScrollToCommandData data) {
        scrollView.scrollTo(data.mDestX, data.mDestY, data.mAnimated);
    }

    @Override
    public void scrollToEnd(RecyclerViewBackedScrollView scrollView, ReactScrollViewCommandHelper.ScrollToEndCommandData data) {
        // TODO:
    }

    @Override
    public
    @Nullable
    Map getExportedCustomDirectEventTypeConstants() {
        return MapBuilder.builder()
                .put(ScrollEventType.SCROLL.getJSEventName(), MapBuilder.of("registrationName", "onScroll"))
                .put(ContentSizeChangeEvent.EVENT_NAME, MapBuilder.of("registrationName", "onContentSizeChange"))
                .put(VisibleItemsChangeEvent.EVENT_NAME, MapBuilder.of("registrationName", "onVisibleItemsChange"))
                .build();
    }
}
