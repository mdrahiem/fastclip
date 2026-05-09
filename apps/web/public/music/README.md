# Default Music for We Are Hiring Videos

Place a royalty-free music track here named `default.mp3` (15-20 seconds recommended).

## Suggested Sources

- [Incompetech](https://incompetech.com/) - Upbeat, corporate tracks
- [Free Music Archive](https://freemusicarchive.org/)
- [Pixabay Music](https://pixabay.com/music/)

## Requirements

- **Duration**: 15-20 seconds (will be used for 15-second videos)
- **Format**: MP3
- **License**: Creative Commons 0 or royalty-free for commercial use
- **Vibe**: Upbeat, motivational, corporate-friendly

## To Generate Test Audio

```bash
ffmpeg -f lavfi -i anullsrc=r=48000:cl=mono -t 15 -q:a 9 -acodec libmp3lame default.mp3
```

This creates a 15-second silent MP3 file for testing.
