# Campaign image library

Drop the Spring '27 Kodak campaign images in **this folder**. Anything placed
here becomes selectable by sales reps on their bookings — no code change needed.

## How to add images

1. Copy the image files into this folder.
2. Commit and push to `main`.
3. Vercel redeploys, and the images appear in the portal automatically.

## Requirements

- **Formats:** `.jpg`, `.jpeg`, `.png` or `.webp`
- **Filename becomes the label** shown to reps, so name them readably:
  `kodak-red-jacket-portrait.jpg` shows as *"Kodak red jacket portrait"*.
  Use hyphens or underscores between words; avoid spaces.
- **Size:** export at roughly **1600 px on the longest edge**, which lands around
  200–350 KB per file. The picker shows the whole library at once, so a rep
  downloads every image in this folder the moment they open it. Full-resolution
  files from the shoot are ~3 MB each and make that unusable on a phone.
- **Orientation:** the picker shows them in a 4:3 thumbnail. Portrait images
  work, they are just letterboxed.

## Removing an image

Delete the file and push. Bookings that had it selected keep the filename on
record, and HQ sees it flagged as missing in the admin view.
