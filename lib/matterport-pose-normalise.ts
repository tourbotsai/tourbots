/**
 * Normalise Matterport Showcase SDK Camera.pose payload for storage (matches tour_points shape).
 */
export function normaliseMatterportPoseForTracking(pose: unknown): {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number };
} {
  if (!pose || typeof pose !== 'object') {
    return { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0 } };
  }

  const p = pose as { position?: unknown; rotation?: unknown };
  const pos = p.position && typeof p.position === 'object' ? (p.position as Record<string, unknown>) : {};
  const rot = p.rotation && typeof p.rotation === 'object' ? (p.rotation as Record<string, unknown>) : {};

  const num = (v: unknown): number =>
    typeof v === 'number' && Number.isFinite(v) ? v : 0;

  return {
    position: {
      x: num(pos.x),
      y: num(pos.y),
      z: num(pos.z),
    },
    rotation: {
      x: num(rot.x),
      y: num(rot.y),
    },
  };
}
