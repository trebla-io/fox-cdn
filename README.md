# Fox Video CDN

A static CDN-style project that hosts video files and exposes JSON "API" endpoints via GitHub Pages.

## 📁 Project Structure

```
/
├── api/
│   ├── videos.json       # Complete video metadata catalog
│   ├── feed.json         # Ordered video feed
│   └── playlists.json    # Playlist definitions
├── videos/
│   ├── mobile-short-01/
│   │   ├── video.mp4
│   │   └── thumbnail.jpg
│   ├── mobile-short-02/
│   │   ├── video.mp4
│   │   └── thumbnail.jpg
│   └── ... (10 videos total)
└── README.md
```

## 🎥 Video Collection

This CDN hosts **10 vertical videos** optimized for mobile viewing, organized by length:

### Short Videos (< 10s)

| Slug            | Duration | FPS | Size    | Quality |
| --------------- | -------- | --- | ------- | ------- |
| mobile-short-01 | 5.9s     | 30  | 3.6 MB  | 1080p   |
| mobile-short-02 | 7.9s     | 30  | 13.3 MB | 1080p   |
| mobile-short-03 | 8.8s     | 25  | 5.3 MB  | 1080p   |
| mobile-short-04 | 7.5s     | 30  | 6.2 MB  | 1080p   |

### Medium Videos (10-35s)

| Slug             | Duration | FPS | Size    | Quality |
| ---------------- | -------- | --- | ------- | ------- |
| mobile-medium-01 | 32.1s    | 30  | 20.3 MB | 1080p   |
| mobile-medium-02 | 11.9s    | 60  | 44.7 MB | 1080p   |
| mobile-medium-03 | 11.9s    | 30  | 17.9 MB | 1080p   |
| mobile-medium-04 | 21.1s    | 25  | 14.0 MB | 1080p   |

### Long Videos (> 25s)

| Slug           | Duration | FPS | Size    | Quality |
| -------------- | -------- | --- | ------- | ------- |
| mobile-long-01 | 67.8s    | 25  | 30.3 MB | 1080p   |
| mobile-long-02 | 27.7s    | 24  | 16.4 MB | 1080p   |

## 🚀 Usage

### Fetch All Videos

```typescript
async function fetchVideos() {
  const res = await fetch(
    "https://trebla-io.github.io/fox-cdn/api/videos.json"
  );
  if (!res.ok) throw new Error("Failed to fetch videos");

  const data = await res.json();
  return data.videos;
}
```

### Fetch Video Feed

```typescript
async function fetchFeed() {
  const res = await fetch("https://trebla-io.github.io/fox-cdn/api/feed.json");
  const data = await res.json();
  return data.feed;
}
```

### Fetch Playlists

```typescript
async function fetchPlaylists() {
  const res = await fetch(
    "https://trebla-io.github.io/fox-cdn/api/playlists.json"
  );
  const data = await res.json();
  return data.playlists;
}
```

### Play a Specific Video

```typescript
async function getVideo(slug: string) {
  const videos = await fetchVideos();
  const video = videos.find((v) => v.slug === slug);

  if (!video) throw new Error(`Video not found: ${slug}`);

  return {
    videoUrl: video.sources[0].url,
    thumbnailUrl: video.thumbnail.url,
    title: video.title,
    duration: video.duration_seconds,
  };
}
```

## 📋 API Endpoints

All endpoints are static JSON files served via GitHub Pages:

| Endpoint              | Description                                               |
| --------------------- | --------------------------------------------------------- |
| `/api/videos.json`    | Complete catalog with video metadata, sources, thumbnails |
| `/api/feed.json`      | Ordered list of video slugs for feed display              |
| `/api/playlists.json` | Curated playlist collections                              |

## 🔗 URL Patterns

### Videos

```
https://trebla-io.github.io/fox-cdn/videos/<slug>/video.mp4
```

Example: `https://trebla-io.github.io/fox-cdn/videos/mobile-short-01/video.mp4`

### Thumbnails

```
https://trebla-io.github.io/fox-cdn/videos/<slug>/thumbnail.jpg
```

Example: `https://trebla-io.github.io/fox-cdn/videos/mobile-short-01/thumbnail.jpg`

### API

```
https://trebla-io.github.io/fox-cdn/api/<endpoint>.json
```

Example: `https://trebla-io.github.io/fox-cdn/api/videos.json`

## 🛠️ Deployment

### GitHub Pages Setup

1. **Enable GitHub Pages** in repository settings

   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main` (or your default branch)
   - Folder: `/ (root)`

2. **Commit and Push**

   ```bash
   git add .
   git commit -m "Setup Fox video CDN"
   git push origin main
   ```

3. **Access Your CDN**
   - Your CDN will be live at: `https://trebla-io.github.io/fox-cdn/`
   - API endpoints: `https://trebla-io.github.io/fox-cdn/api/videos.json`

## 📦 JSON Schema

### videos.json

```json
{
  "version": 1,
  "updated_at": "ISO 8601 timestamp",
  "videos": [
    {
      "id": "string",
      "slug": "string",
      "title": "string",
      "description": "string",
      "orientation": "vertical",
      "duration_seconds": number,
      "fps": number,
      "size_bytes": number,
      "tags": ["string"],
      "sources": [{
        "quality": "1080p",
        "codec": "h264",
        "bitrate_kbps": number,
        "url": "string"
      }],
      "thumbnail": {
        "url": "string",
        "width": number,
        "height": number
      },
      "meta": {
        "provider": "github-cdn",
        "loop": boolean,
        "mute_default": boolean
      }
    }
  ]
}
```

### feed.json

```json
{
  "version": 1,
  "feed": [
    { "video_id": "slug-name", "position": number }
  ]
}
```

### playlists.json

```json
{
  "playlists": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "videos": ["slug-1", "slug-2"]
    }
  ]
}
```

## 🎯 Features

- ✅ Static file hosting (no backend required)
- ✅ JSON-based "API" endpoints
- ✅ Organized video catalog with metadata
- ✅ Auto-generated thumbnails from video frames
- ✅ Real metadata extracted using ffprobe
- ✅ Feed management for video ordering
- ✅ Playlist support for content curation
- ✅ Mobile-optimized vertical videos (1080x1920)
- ✅ Organized by video-specific folders
- ✅ GitHub Pages deployment ready
- ✅ CORS-friendly (public CDN)

## 📝 Technical Details

- All video files use **H.264 codec** for broad compatibility
- Videos are optimized for mobile **(1080x1920 vertical format)**
- Thumbnails auto-generated at 2-second mark, **480px width**
- JSON files contain accurate metadata from ffprobe
- File sizes range from **3.6MB to 44.7MB** per video
- Frame rates: **24fps, 25fps, 30fps, and 60fps**
- Each video lives in its own folder: `/videos/slug-name/`

## 🔄 Adding New Videos

To add new videos:

1. **Create video folder**

   ```bash
   mkdir -p videos/my-new-video
   ```

2. **Add video file**

   ```bash
   cp source-video.mp4 videos/my-new-video/video.mp4
   ```

3. **Generate thumbnail** (at 2-second mark, 480px width)

   ```bash
   ffmpeg -i videos/my-new-video/video.mp4 \
     -ss 00:00:02 -vframes 1 \
     -vf "scale=480:-1" \
     videos/my-new-video/thumbnail.jpg
   ```

4. **Extract metadata**

   ```bash
   ffprobe -v error \
     -show_entries format=duration,size,bit_rate \
     -show_entries stream=width,height,r_frame_rate,codec_name \
     -of json videos/my-new-video/video.mp4
   ```

5. **Update `api/videos.json`** with new video metadata

6. **Update `api/feed.json`** to include new video slug

7. **Optionally add to playlists** in `api/playlists.json`

8. **Update the `updated_at` timestamp** in `videos.json`

---

**Repository**: [trebla-io/fox-cdn](https://github.com/trebla-io/fox-cdn)  
**Built for GitHub Pages** • Static CDN • No Backend Required
