---
status: partial
phase: 03-check-ins-goals
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md]
started: 2026-04-13T11:25:00Z
updated: 2026-04-13T11:25:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill the dev server if running. Run `npm run dev`. The server boots without errors and the app loads at localhost:3000. You can navigate to the dashboard and settings pages.
result: pass

### 2. Bottom Nav Layout
expected: The bottom navigation bar shows 5 slots in this order: Home, Feed, [green circular FAB button], Streaks, Settings. The center button is larger than the other icons, emerald green, and pops out above the nav bar with a camera icon.
result: pass

### 3. FAB Opens Camera
expected: Tapping the green FAB button navigates to a full-screen camera view. The bottom nav disappears. The rear camera activates (showing what's in front of you). A close/back button is visible in the top-left corner.
result: pass

### 4. Rear Camera Capture & Flip
expected: Tapping the white shutter button at the bottom captures the rear photo. The camera then automatically flips to the front-facing (selfie) camera and a large "3... 2... 1..." countdown appears on screen.
result: issue
reported: "Camera order should be reversed — selfie camera first, then rear camera"
severity: major

### 5. Selfie Auto-Capture & Composite Preview
expected: After the countdown reaches 0, the selfie is automatically captured. You then see a preview showing: the rear photo filling the screen with your selfie as a small thumbnail in the top-left corner (with rounded corners and a white border). Two buttons appear at the bottom: "Retake" (outline) and "Submit" (filled green).
result: blocked
blocked_by: physical-device
reason: "Requires dual-camera phone to test full capture flow"

### 6. Retake Flow
expected: Tapping "Retake" restarts the entire camera flow from the beginning -- rear camera activates again and you can capture a new photo.
result: blocked
blocked_by: physical-device
reason: "Requires dual-camera phone to test full capture flow"

### 7. Submit Check-in
expected: Tapping "Submit" shows a loading spinner on the button. After a moment, you are navigated back to the dashboard. (Note: requires Supabase Storage bucket "check-in-photos" to be set up with RLS policies.)
result: blocked
blocked_by: physical-device
reason: "Requires dual-camera phone to test full capture flow and Supabase Storage bucket setup"

### 8. Weekly Goal Stepper on Settings
expected: Go to Settings. If you're in a challenge, you see a "Weekly Goal" card with the question "How many days per week do you want to work out?". It shows minus (-) and plus (+) buttons around a large number. The range is 1-7. Default is 3.
result: pass

### 9. Goal Stepper Interaction
expected: Tapping plus increases the goal (up to 7). Tapping minus decreases it (down to 1). At the limits (1 or 7), the corresponding button appears disabled. The number updates immediately (optimistic update).
result: pass

### 10. Day Dots Progress on Dashboard
expected: The dashboard shows a card with 7 dots labeled M T W T F S S (Monday through Sunday). If you've checked in today, today's dot is filled emerald green. Unfilled dots are dark/navy. Today's dot has a subtle ring highlight. A progress count like "1/3 days" appears to the right.
result: pass

### 11. Streak Counter on Dashboard
expected: Below the day dots, a streak counter is visible. If you have consecutive completed weeks, it shows a fire emoji and text like "2 week streak". If no streak, it shows a muted message or nothing.
result: pass

## Summary

total: 11
passed: 7
issues: 1
pending: 0
skipped: 0
blocked: 3

## Gaps

- truth: "Camera should start with selfie (front) camera first, then flip to rear camera"
  status: failed
  reason: "User reported: camera order should be reversed — selfie first, then rear"
  severity: major
  test: 4
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
