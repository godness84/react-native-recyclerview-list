package com.github.godness84.RNRecyclerViewList;

import javax.annotation.Nullable;

import java.util.Map;

import android.graphics.PointF;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.LinearSmoothScroller;
import android.support.v7.widget.RecyclerView;
import android.util.Log;
import android.view.ContextThemeWrapper;
import android.view.View;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.PixelUtil;
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
        ViewGroupManager<RecyclerViewBackedScrollView> {

    public static final String REACT_CLASS = "AndroidRecyclerViewBackedScrollView";
    public static final int COMMAND_NOTIFY_ITEM_RANGE_INSERTED = 1;
    public static final int COMMAND_NOTIFY_ITEM_RANGE_REMOVED = 2;
    public static final int COMMAND_NOTIFY_DATASET_CHANGED = 3;
    public static final int COMMAND_SCROLL_TO_INDEX = 4;
    public static final int COMMAND_NOTIFY_ITEM_MOVED = 5;
    private static final String TAG = "RecyclerViewManager";

    @Override
    public String getName() {
        return REACT_CLASS;
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
    }

    @ReactProp(name = "inverted", defaultBoolean = false)
    public void setInverted(RecyclerViewBackedScrollView parent, boolean inverted) {
        parent.setInverted(inverted);
    }

    @ReactProp(name = "itemAnimatorEnabled", defaultBoolean = true)
    public void setItemAnimatorEnabled(RecyclerViewBackedScrollView parent, boolean enabled) {
        parent.setItemAnimatorEnabled(enabled);
    }

    @Override
    public Map<String, Integer> getCommandsMap() {
        return MapBuilder.of(
            "notifyItemRangeInserted", COMMAND_NOTIFY_ITEM_RANGE_INSERTED,
            "notifyItemRangeRemoved", COMMAND_NOTIFY_ITEM_RANGE_REMOVED,
            "notifyItemMoved", COMMAND_NOTIFY_ITEM_MOVED,
            "notifyDataSetChanged", COMMAND_NOTIFY_DATASET_CHANGED,
            "scrollToIndex", COMMAND_SCROLL_TO_INDEX
        );
    }

    @Override
    public void receiveCommand(
            final RecyclerViewBackedScrollView parent,
            int commandType,
            @Nullable ReadableArray args) {
        Assertions.assertNotNull(parent);
        Assertions.assertNotNull(args);
        switch (commandType) {
            case COMMAND_NOTIFY_ITEM_RANGE_INSERTED: {
                final int position = args.getInt(0);
                final int count = args.getInt(1);
                //Log.d(TAG, String.format("notify item range inserted: position %d, count %d", position, count));

                RecyclerViewBackedScrollView.ReactListAdapter adapter = (RecyclerViewBackedScrollView.ReactListAdapter) parent.getAdapter();
                adapter.setItemCount(adapter.getItemCount() + count);
                adapter.notifyItemRangeInserted(position, count);
                return;
            }

            case COMMAND_NOTIFY_ITEM_RANGE_REMOVED: {
                final int position = args.getInt(0);
                final int count = args.getInt(1);
                //Log.d(TAG, String.format("notify item range removed: position %d, count %d", position, count));

                RecyclerViewBackedScrollView.ReactListAdapter adapter = (RecyclerViewBackedScrollView.ReactListAdapter) parent.getAdapter();
                adapter.setItemCount(adapter.getItemCount() - count);
                adapter.notifyItemRangeRemoved(position, count);
                return;
            }


            case COMMAND_NOTIFY_ITEM_MOVED: {
                final int currentPosition = args.getInt(0);
                final int nextPosition = args.getInt(1);
                RecyclerViewBackedScrollView.ReactListAdapter adapter = (RecyclerViewBackedScrollView.ReactListAdapter) parent.getAdapter();
                adapter.notifyItemMoved(currentPosition, nextPosition);
                return;
            }

            case COMMAND_NOTIFY_DATASET_CHANGED: {
                final int itemCount = args.getInt(0);
                RecyclerViewBackedScrollView.ReactListAdapter adapter = (RecyclerViewBackedScrollView.ReactListAdapter) parent.getAdapter();
                adapter.setItemCount(itemCount);
                parent.getAdapter().notifyDataSetChanged();
                return;
            }

            case COMMAND_SCROLL_TO_INDEX: {
                boolean animated = args.getBoolean(0);
                int index = args.getInt(1);
                RecyclerViewBackedScrollView.ScrollOptions options = new RecyclerViewBackedScrollView.ScrollOptions();
                options.millisecondsPerInch = args.isNull(2) ? null : (float) args.getDouble(2);
                options.viewPosition = args.isNull(3) ? null : (float) args.getDouble(3);
                options.viewOffset = args.isNull(4) ? null : (float) args.getDouble(4);

                if (animated) {
                    parent.smoothScrollToPosition(index, options);
                } else {
                    parent.scrollToPosition(index, options);
                }
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
    public
    @Nullable
    Map getExportedCustomDirectEventTypeConstants() {
        return MapBuilder.builder()
                .put(ScrollEventType.getJSEventName(ScrollEventType.SCROLL), MapBuilder.of("registrationName", "onScroll"))
                .put(ContentSizeChangeEvent.EVENT_NAME, MapBuilder.of("registrationName", "onContentSizeChange"))
                .put(VisibleItemsChangeEvent.EVENT_NAME, MapBuilder.of("registrationName", "onVisibleItemsChange"))
                .build();
    }
}
