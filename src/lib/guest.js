// src/lib/guest.js
export function setGuestBrowsing(flag = true) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("guest_browsing", flag ? "1" : "0");
  } catch (e) {
    // ignore localStorage errors
  }
}

export function isGuestBrowsing() {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("guest_browsing") === "1";
  } catch (e) {
    return false;
  }
}

export function clearGuestBrowsing() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("guest_browsing");
  } catch (e) {}
}
