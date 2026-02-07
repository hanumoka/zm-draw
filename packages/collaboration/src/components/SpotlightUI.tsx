'use client';

import { useSpotlightStore } from '../stores/spotlightStore';

interface SpotlightUIProps {
  /** Local user ID */
  userId: string;
  /** Local user name */
  userName: string;
  /** Local user color */
  userColor: string;
  /** Callback when spotlight starts (to broadcast via Yjs) */
  onSpotlightStart?: () => void;
  /** Callback when spotlight stops (to broadcast via Yjs) */
  onSpotlightStop?: () => void;
}

/**
 * SpotlightUI component for FigJam-style presentation mode
 */
export function SpotlightUI({
  userId,
  userName,
  userColor,
  onSpotlightStart,
  onSpotlightStop,
}: SpotlightUIProps) {
  const {
    isActive,
    presenterId,
    presenterName,
    presenterColor,
    isFollowing,
    pendingRequest,
    startSpotlight,
    stopSpotlight,
    acceptFollow,
    declineFollow,
    stopFollowing,
  } = useSpotlightStore();

  const isPresenter = presenterId === userId;

  const handleToggleSpotlight = () => {
    if (isActive && isPresenter) {
      stopSpotlight();
      onSpotlightStop?.();
    } else if (!isActive) {
      startSpotlight(userId, userName, userColor);
      onSpotlightStart?.();
    }
  };

  return (
    <>
      {/* Spotlight toggle button */}
      <button
        onClick={handleToggleSpotlight}
        disabled={isActive && !isPresenter}
        title={
          isActive
            ? isPresenter
              ? 'Stop presenting'
              : `${presenterName} is presenting`
            : 'Start presenting'
        }
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          backgroundColor: isActive
            ? isPresenter
              ? '#ef4444'
              : 'rgba(0, 0, 0, 0.6)'
            : 'rgba(0, 0, 0, 0.6)',
          border: 'none',
          borderRadius: 6,
          color: 'white',
          fontSize: 12,
          fontWeight: 500,
          cursor: isActive && !isPresenter ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s',
        }}
      >
        <SpotlightIcon />
        {isActive
          ? isPresenter
            ? 'Stop'
            : `${presenterName} presenting`
          : 'Present'}
      </button>

      {/* Following indicator */}
      {isFollowing && presenterName && (
        <div
          style={{
            position: 'fixed',
            top: 60,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            backgroundColor: presenterColor || '#3b82f6',
            borderRadius: 20,
            color: 'white',
            fontSize: 13,
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            zIndex: 1000,
          }}
        >
          <SpotlightIcon size={14} />
          Following {presenterName}
          <button
            onClick={stopFollowing}
            style={{
              marginLeft: 4,
              padding: '2px 8px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: 4,
              color: 'white',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            Stop
          </button>
        </div>
      )}

      {/* Follow request popup */}
      {pendingRequest && !isFollowing && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: 24,
            backgroundColor: 'white',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            zIndex: 1001,
            minWidth: 300,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              margin: '0 auto 16px',
              backgroundColor: pendingRequest.presenterColor,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            {pendingRequest.presenterName.charAt(0).toUpperCase()}
          </div>
          <h3
            style={{
              margin: '0 0 8px',
              fontSize: 16,
              fontWeight: 600,
              color: '#1a1a1a',
            }}
          >
            {pendingRequest.presenterName} started presenting
          </h3>
          <p
            style={{
              margin: '0 0 20px',
              fontSize: 14,
              color: '#6b7280',
            }}
          >
            Would you like to follow their view?
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={declineFollow}
              style={{
                padding: '8px 20px',
                backgroundColor: '#f3f4f6',
                border: 'none',
                borderRadius: 6,
                color: '#374151',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Not now
            </button>
            <button
              onClick={acceptFollow}
              style={{
                padding: '8px 20px',
                backgroundColor: pendingRequest.presenterColor,
                border: 'none',
                borderRadius: 6,
                color: 'white',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Follow
            </button>
          </div>
        </div>
      )}

      {/* Backdrop for follow request */}
      {pendingRequest && !isFollowing && (
        <div
          onClick={declineFollow}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 1000,
          }}
        />
      )}
    </>
  );
}

/** Spotlight icon SVG */
function SpotlightIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}
