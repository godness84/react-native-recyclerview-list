package com.github.godness84.RNRecyclerViewList;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import android.content.Context;
import android.content.res.AssetFileDescriptor;
import android.graphics.PointF;
import android.support.annotation.Nullable;
import android.support.v7.widget.DefaultItemAnimator;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.LinearSmoothScroller;
import android.support.v7.widget.RecyclerView;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.ContextThemeWrapper;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;

import com.facebook.common.logging.LoggingDelegate;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.SystemClock;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.NativeGestureUtil;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.facebook.react.views.scroll.ScrollEvent;
import com.facebook.react.views.scroll.ScrollEventType;
import com.github.godness84.RNRecyclerViewList.R;

/**
 * Wraps {@link RecyclerView} providing interface similar to `ScrollView.js` where each children
 * will be rendered as a separate {@link RecyclerView} row.
 * <p>
 * Currently supports only vertically positioned item. Views will not be automatically recycled but
 * they will be detached from native view hierarchy when scrolled offscreen.
 * <p>
 * It works by storing all child views in an array within adapter and binding appropriate views to
 * rows when requested.
 */
@VisibleForTesting
public class RecyclerViewBackedScrollView extends RecyclerView {

    private final static String TAG = "RecyclerViewBackedScrol";

    /**
     * Simple implementation of {@link ViewHolder} as it's an abstract class. The only thing we need
     * to hold in this implementation is the reference to {@link RecyclableWrapperViewGroup} that
     * is already stored by default.
     */
    private static class ConcreteViewHolder extends ViewHolder {
        public ConcreteViewHolder(View itemView) {
            super(itemView);
        }
    }

    /**
     * View that is going to be used as a cell in {@link RecyclerView}. It's going to be reusable and
     * we will remove/attach views for a certain positions based on the {@code mViews} array stored
     * in the adapter class.
     * <p>
     * This method overrides {@link #onMeasure} and delegates measurements to the child view that has
     * been attached to. This is because instances of {@link RecyclableWrapperViewGroup} are created
     * outside of {@link } and their layout is not managed by that manager
     * as opposed to all the other react-native views. Instead we use dimensions of the child view
     * (dimensions has been set in layouting process) so that size of this view match the size of
     * the view it wraps.
     */
    static class RecyclableWrapperViewGroup extends ViewGroup {

        private ReactListAdapter mAdapter;

        public RecyclableWrapperViewGroup(Context context, ReactListAdapter adapter) {
            super(context);
            mAdapter = adapter;
        }

        private OnLayoutChangeListener mChildLayoutChangeListener = new OnLayoutChangeListener() {
            @Override
            public void onLayoutChange(View v, int left, int top, int right, int bottom, int oldLeft, int oldTop, int oldRight, int oldBottom) {
                Assertions.assertCondition(v instanceof RecyclerViewItemView, "Child view must be of type RecyclerViewItemView");
                post(new Runnable() {
                    @Override
                    public void run() {
                        requestLayout();
                        if (getParent() != null) {
                            getParent().requestLayout();
                        }
                    }
                });
            }
        };

        @Override
        protected void onLayout(boolean changed, int l, int t, int r, int b) {
            // This view will only have one child that is managed by the `NativeViewHierarchyManager` and
            // its position and dimensions are set separately. We don't need to handle its layouting here
        }

        @Override
        public void onViewAdded(View child) {
            super.onViewAdded(child);
            child.addOnLayoutChangeListener(mChildLayoutChangeListener);
        }

        @Override
        public void onViewRemoved(View child) {
            super.onViewRemoved(child);
            child.removeOnLayoutChangeListener(mChildLayoutChangeListener);
        }

        @Override
        protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
            if (getChildCount() > 0) {
                // We override measure spec and use dimensions of the children. Children is a view added
                // from the adapter and always have a correct dimensions specified as they are calculated
                // and set with NativeViewHierarchyManager
                View child = getChildAt(0);
                setMeasuredDimension(child.getMeasuredWidth(), child.getMeasuredHeight());
            } else {
                setMeasuredDimension(50, 150);
            }
        }

        public ReactListAdapter getAdapter() {
            return mAdapter;
        }

        @Override
        public boolean onTouchEvent(MotionEvent event) {
            // Similarly to ReactViewGroup, we return true.
            // In this case it is necessary in order to force the RecyclerView to intercept the touch events,
            // in this way we can exactly know when the drag starts because "onInterceptTouchEvent"
            // of the RecyclerView will return true.
            return true;
        }
    }

    /*package*/ static class ReactListAdapter extends Adapter<ConcreteViewHolder> {

        private final List<RecyclerViewItemView> mViews = new ArrayList<>();
        private final RecyclerViewBackedScrollView mScrollView;
        private int mItemCount = 0;

        // The following `OnLayoutChangeListsner` is attached to the views stored in the adapter
        // `mViews` array. It's used to get layout information passed to that view from css-layout
        // and to update its layout to be enclosed in the wrapper view group.
        private final OnLayoutChangeListener
                mChildLayoutChangeListener = new OnLayoutChangeListener() {

            @Override
            public void onLayoutChange(
                    View v,
                    int left,
                    int top,
                    int right,
                    int bottom,
                    int oldLeft,
                    int oldTop,
                    int oldRight,
                    int oldBottom) {
                // We need to get layout information from css-layout to set the size of the rows correctly.

                int oldHeight = (oldBottom - oldTop);
                int newHeight = (bottom - top);

                if (oldHeight != newHeight) {
                    // Since "wrapper" view position +dimensions are not managed by NativeViewHierarchyManager
                    // we need to ensure that the wrapper view is properly layed out as it dimension should
                    // be updated if the wrapped view dimensions are changed.
                    // To achieve that we call `forceLayout()` on the view modified and on `RecyclerView`
                    // instance (which is accessible with `v.getParent().getParent()` if the view is
                    // attached). We rely on NativeViewHierarchyManager to call `layout` on `RecyclerView`
                    // then, which will happen once all the children of `RecyclerView` have their layout
                    // updated. This will trigger `layout` call on attached wrapper nodes and will let us
                    // update dimensions of them through overridden onMeasure method.
                    // We don't care about calling this is the view is not currently attached as it would be
                    // laid out once added to the recycler.
                    if (v.getParent() != null
                            && v.getParent().getParent() != null) {
                        View wrapper = (View) v.getParent(); // native view that wraps view added to adapter
                        wrapper.forceLayout();
                        // wrapper.getParent() points to the recycler if the view is currently attached (it
                        // could be in "scrape" state when it is attached to recyclable wrapper but not to
                        // the recycler)
                        ((View) wrapper.getParent()).forceLayout();
                    }
                }
            }
        };

        public ReactListAdapter(RecyclerViewBackedScrollView scrollView) {
            mScrollView = scrollView;
            //setHasStableIds(true);
        }

        public void addView(RecyclerViewItemView child, int index) {
            mViews.add(index, child);

            child.addOnLayoutChangeListener(mChildLayoutChangeListener);

            final int itemIndex = child.getItemIndex();

            notifyItemChanged(itemIndex);
        }

        public void removeViewAt(int index) {
            RecyclerViewItemView child = mViews.get(index);
            if (child != null) {
                mViews.remove(index);

                child.removeOnLayoutChangeListener(mChildLayoutChangeListener);
            }
        }

        public int getViewCount() {
            return mViews.size();
        }

        @Override
        public ConcreteViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
            return new ConcreteViewHolder(new RecyclableWrapperViewGroup(parent.getContext(), this));
        }

        @Override
        public void onBindViewHolder(ConcreteViewHolder holder, int position) {
            RecyclableWrapperViewGroup vg = (RecyclableWrapperViewGroup) holder.itemView;
            View row = getViewByItemIndex(position);
            if (row != null && row.getParent() != vg) {
                if (row.getParent() != null) {
                    ((ViewGroup) row.getParent()).removeView(row);
                }
                vg.addView(row, 0);
            }
        }

        @Override
        public void onViewRecycled(ConcreteViewHolder holder) {
            super.onViewRecycled(holder);
            ((RecyclableWrapperViewGroup) holder.itemView).removeAllViews();
        }

        @Override
        public int getItemCount() {
            return mItemCount;
        }

        public void setItemCount(int itemCount) {
            this.mItemCount = itemCount;
        }

        public View getView(int index) {
            return mViews.get(index);
        }

        public RecyclerViewItemView getViewByItemIndex(int position) {
            for (int i = 0; i < mViews.size(); i++) {
                if (mViews.get(i).getItemIndex() == position) {
                    return mViews.get(i);
                }
            }

            return null;
        }
    }

    private boolean mDragging;
    private int mFirstVisibleIndex, mLastVisibleIndex;

    @Override
    protected void onScrollChanged(int l, int t, int oldl, int oldt) {
        super.onScrollChanged(l, t, oldl, oldt);

        getReactContext().getNativeModule(UIManagerModule.class).getEventDispatcher()
                .dispatchEvent(ScrollEvent.obtain(
                        getId(),
                        ScrollEventType.SCROLL,
                        0, /* offsetX = 0, horizontal scrolling only */
                        computeVerticalScrollOffset(),
                        getWidth(),
                        computeVerticalScrollRange(),
                        getWidth(),
                        getHeight()));

        final int firstIndex = ((LinearLayoutManager) getLayoutManager()).findFirstVisibleItemPosition();
        final int lastIndex = ((LinearLayoutManager) getLayoutManager()).findLastVisibleItemPosition();

        if (firstIndex != mFirstVisibleIndex || lastIndex != mLastVisibleIndex) {
            getReactContext().getNativeModule(UIManagerModule.class).getEventDispatcher()
                    .dispatchEvent(new VisibleItemsChangeEvent(
                            getId(),
                            SystemClock.nanoTime(),
                            firstIndex,
                            lastIndex));

            mFirstVisibleIndex = firstIndex;
            mLastVisibleIndex = lastIndex;
        }
    }

    private ReactContext getReactContext() {
        return (ReactContext) ((ContextThemeWrapper) getContext()).getBaseContext();
    }

    public RecyclerViewBackedScrollView(Context context) {
        super(new ContextThemeWrapper(context, R.style.ScrollbarRecyclerView));
        setHasFixedSize(true);
        ((DefaultItemAnimator) getItemAnimator()).setSupportsChangeAnimations(false);
        setLayoutManager(new LinearLayoutManager(context));
        setAdapter(new ReactListAdapter(this));
    }

    /*package*/ void addViewToAdapter(RecyclerViewItemView child, int index) {
        ((ReactListAdapter) getAdapter()).addView(child, index);
    }

    /*package*/ void removeViewFromAdapter(int index) {
        ((ReactListAdapter) getAdapter()).removeViewAt(index);
    }

    /*package*/ View getChildAtFromAdapter(int index) {
        return ((ReactListAdapter) getAdapter()).getView(index);
    }

    /*package*/ int getChildCountFromAdapter() {
        return ((ReactListAdapter) getAdapter()).getViewCount();
    }

    /*package*/ void setItemCount(int itemCount) {
        ((ReactListAdapter) getAdapter()).setItemCount(itemCount);
    }

    /*package*/ int getItemCount() {
        return getAdapter().getItemCount();
    }

    @Override
    public boolean onInterceptTouchEvent(MotionEvent ev) {
        if (super.onInterceptTouchEvent(ev)) {
            NativeGestureUtil.notifyNativeGestureStarted(this, ev);
            mDragging = true;
            getReactContext().getNativeModule(UIManagerModule.class).getEventDispatcher()
                    .dispatchEvent(ScrollEvent.obtain(
                            getId(),
                            ScrollEventType.BEGIN_DRAG,
                            0, /* offsetX = 0, horizontal scrolling only */
                            computeVerticalScrollOffset(),
                            getWidth(),
                            computeVerticalScrollRange(),
                            getWidth(),
                            getHeight()));
            return true;
        }

        return false;
    }

    @Override
    public boolean onTouchEvent(MotionEvent ev) {
        int action = ev.getAction() & MotionEvent.ACTION_MASK;
        if (action == MotionEvent.ACTION_UP && mDragging) {
            mDragging = false;
            getReactContext().getNativeModule(UIManagerModule.class).getEventDispatcher()
                    .dispatchEvent(ScrollEvent.obtain(
                            getId(),
                            ScrollEventType.END_DRAG,
                            0, /* offsetX = 0, horizontal scrolling only */
                            computeVerticalScrollOffset(),
                            getWidth(),
                            computeVerticalScrollRange(),
                            getWidth(),
                            getHeight()));
        }
        return super.onTouchEvent(ev);
    }

    private boolean mRequestedLayout = false;

    @Override
    public void requestLayout() {
        super.requestLayout();

        if (!mRequestedLayout) {
            mRequestedLayout = true;
            this.post(new Runnable() {
                @Override
                public void run() {
                    mRequestedLayout = false;
                    layout(getLeft(), getTop(), getRight(), getBottom());
                    onLayout(false, getLeft(), getTop(), getRight(), getBottom());
                }
            });
        }
    }

    @Override
    public void smoothScrollToPosition(int position) {
        this.smoothScrollToPositionWithVelocity(position, 0);
    }

    public void smoothScrollToPositionWithVelocity(int position, final float millisecondsPerInch) {
        final RecyclerView.SmoothScroller smoothScroller = new LinearSmoothScroller(this.getContext()) {
            @Override
            protected int getVerticalSnapPreference() {
                return LinearSmoothScroller.SNAP_TO_START;
            }

            @Override
            public PointF computeScrollVectorForPosition(int targetPosition) {
                return ((LinearLayoutManager) this.getLayoutManager()).computeScrollVectorForPosition(targetPosition);
            }

            @Override
            protected float calculateSpeedPerPixel(DisplayMetrics displayMetrics) {
                if (millisecondsPerInch > 0) {
                    return millisecondsPerInch / displayMetrics.densityDpi;
                } else {
                    return super.calculateSpeedPerPixel(displayMetrics);
                }
            }
        };

        smoothScroller.setTargetPosition(position);
        this.getLayoutManager().startSmoothScroll(smoothScroller);
    }
}
