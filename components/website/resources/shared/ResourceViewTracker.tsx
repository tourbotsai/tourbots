"use client";

import { useEffect } from "react";

interface ResourceViewTrackerProps {
  resourceId: string;
  resourceType: "blogs" | "guides";
}

export function ResourceViewTracker({ resourceId, resourceType }: ResourceViewTrackerProps) {
  useEffect(() => {
    if (!resourceId) return;

    fetch(`/api/public/resources/${resourceType}/views/${resourceId}`, {
      method: "POST",
    }).catch((error) => {
      console.warn(`Failed to increment ${resourceType} views:`, error);
    });
  }, [resourceId, resourceType]);

  return null;
}
