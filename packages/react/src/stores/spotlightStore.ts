import { create } from 'zustand';

/**
 * Spotlight mode for FigJam-style presentation
 *
 * When a presenter starts spotlight:
 * - Other users can choose to follow the presenter's viewport
 * - Presenter's cursor is highlighted
 * - Viewport syncs to presenter's view
 */

export interface SpotlightState {
  /** Whether spotlight mode is active */
  isActive: boolean;
  /** User ID of the presenter (null if no spotlight) */
  presenterId: string | null;
  /** Presenter's name */
  presenterName: string | null;
  /** Presenter's color */
  presenterColor: string | null;
  /** Whether local user is following the presenter */
  isFollowing: boolean;
  /** Pending follow request (presenter ID asking local user to follow) */
  pendingRequest: {
    presenterId: string;
    presenterName: string;
    presenterColor: string;
  } | null;

  // Actions
  /** Start spotlight as presenter */
  startSpotlight: (userId: string, userName: string, userColor: string) => void;
  /** Stop spotlight (presenter only) */
  stopSpotlight: () => void;
  /** Receive spotlight start from remote presenter */
  onRemoteSpotlightStart: (presenterId: string, presenterName: string, presenterColor: string) => void;
  /** Receive spotlight stop from remote presenter */
  onRemoteSpotlightStop: () => void;
  /** Accept follow request and start following */
  acceptFollow: () => void;
  /** Decline follow request */
  declineFollow: () => void;
  /** Stop following presenter */
  stopFollowing: () => void;
  /** Clear pending request */
  clearPendingRequest: () => void;
}

export const useSpotlightStore = create<SpotlightState>((set, get) => ({
  isActive: false,
  presenterId: null,
  presenterName: null,
  presenterColor: null,
  isFollowing: false,
  pendingRequest: null,

  startSpotlight: (userId, userName, userColor) => {
    set({
      isActive: true,
      presenterId: userId,
      presenterName: userName,
      presenterColor: userColor,
      isFollowing: false, // Presenter doesn't follow themselves
      pendingRequest: null,
    });
  },

  stopSpotlight: () => {
    set({
      isActive: false,
      presenterId: null,
      presenterName: null,
      presenterColor: null,
      isFollowing: false,
      pendingRequest: null,
    });
  },

  onRemoteSpotlightStart: (presenterId, presenterName, presenterColor) => {
    set({
      isActive: true,
      presenterId,
      presenterName,
      presenterColor,
      isFollowing: false,
      pendingRequest: {
        presenterId,
        presenterName,
        presenterColor,
      },
    });
  },

  onRemoteSpotlightStop: () => {
    set({
      isActive: false,
      presenterId: null,
      presenterName: null,
      presenterColor: null,
      isFollowing: false,
      pendingRequest: null,
    });
  },

  acceptFollow: () => {
    const { pendingRequest } = get();
    if (pendingRequest) {
      set({
        isFollowing: true,
        pendingRequest: null,
      });
    }
  },

  declineFollow: () => {
    set({
      pendingRequest: null,
    });
  },

  stopFollowing: () => {
    set({
      isFollowing: false,
    });
  },

  clearPendingRequest: () => {
    set({
      pendingRequest: null,
    });
  },
}));
