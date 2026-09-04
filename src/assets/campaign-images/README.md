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
- **Size:** keep each file under ~2 MB. They are bundled into the app, so very
  large files slow the portal down for everyone.
- **Orientation:** the picker shows them in a 4:3 thumbnail. Portrait images
  work, they are just letterboxed.

## Removing an image

Delete the file and push. Bookings that had it selected keep the filename on
record, and HQ sees it flagged as missing in the admin view.
