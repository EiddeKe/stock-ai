"use client";
import { useState, useEffect } from "react";

export function useMediaQuery() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 768px)");
    const tablet = window.matchMedia("(max-width: 1024px)");

    const update = () => {
      setIsMobile(mobile.matches);
      setIsTablet(tablet.matches);
    };

    update();
    mobile.addEventListener("change", update);
    tablet.addEventListener("change", update);
    return () => {
      mobile.removeEventListener("change", update);
      tablet.removeEventListener("change", update);
    };
  }, []);

  return { isMobile, isTablet };
}
