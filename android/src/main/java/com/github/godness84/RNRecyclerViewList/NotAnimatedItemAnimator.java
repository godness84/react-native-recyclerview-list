package com.github.godness84.RNRecyclerViewList;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.recyclerview.widget.RecyclerView;

/**
 * Implementation of {@link RecyclerView.ItemAnimator} that disables all default animations.
 */
class NotAnimatedItemAnimator extends RecyclerView.ItemAnimator {
    @Override
    public boolean animateDisappearance(
        @NonNull RecyclerView.ViewHolder viewHolder,
        @NonNull ItemHolderInfo preLayoutInfo,
        @Nullable ItemHolderInfo postLayoutInfo
    ) {
      dispatchAnimationStarted(viewHolder);
      dispatchAnimationFinished(viewHolder);

      return true;
    }

    @Override
    public boolean animateAppearance(
        @NonNull RecyclerView.ViewHolder viewHolder,
        @Nullable ItemHolderInfo preLayoutInfo,
        @NonNull ItemHolderInfo postLayoutInfo
    ) {
      dispatchAnimationStarted(viewHolder);
      dispatchAnimationFinished(viewHolder);

      return true;
    }

    @Override
    public boolean animatePersistence(
        @NonNull RecyclerView.ViewHolder viewHolder,
        @NonNull ItemHolderInfo preLayoutInfo,
        @NonNull ItemHolderInfo postLayoutInfo
    ) {
      dispatchAnimationStarted(viewHolder);
      dispatchAnimationFinished(viewHolder);

      return true;
    }

    @Override
    public boolean animateChange(
        @NonNull RecyclerView.ViewHolder oldHolder,
        @NonNull RecyclerView.ViewHolder newHolder,
        @NonNull ItemHolderInfo preLayoutInfo,
        @NonNull ItemHolderInfo postLayoutInfo
    ) {
      dispatchAnimationStarted(oldHolder);
      dispatchAnimationFinished(oldHolder);

      dispatchAnimationStarted(newHolder);
      dispatchAnimationFinished(newHolder);

      return true;
    }

    @Override
    public void runPendingAnimations() {
      // Do nothing
    }

    @Override
    public void endAnimation(@NonNull RecyclerView.ViewHolder item) {
      // Do nothing
    }

    @Override
    public void endAnimations() {
      // Do nothing
    }

    @Override
    public boolean isRunning() {
      return false;
    }
}
