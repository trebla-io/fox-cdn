#!/bin/bash

# Fox CDN - Advanced Streaming Setup
# This script implements Cloudflare Stream-like features

set -e

echo "🦊 Fox CDN - Professional Streaming Setup"
echo "=========================================="
echo ""

# Check dependencies
echo "Checking dependencies..."
command -v ffmpeg >/dev/null 2>&1 || { echo "❌ FFmpeg not found. Install with: brew install ffmpeg"; exit 1; }
echo "✓ FFmpeg installed"
echo ""

# Configuration
VIDEO_DIR="videos"
THUMB_DIR="thumbnails"
QUALITIES=("1080p:1080:1920:3500k" "720p:720:1280:2000k" "480p:480:854:1000k" "360p:360:640:600k")

# Function to create master HLS playlist
create_master_playlist() {
  local folder=$1
  local master_file="$folder/master.m3u8"
  
  cat > "$master_file" << 'EOF'
#EXTM3U
#EXT-X-VERSION:3

#EXT-X-STREAM-INF:BANDWIDTH=3850000,RESOLUTION=1080x1920,CODECS="avc1.640028"
1080p.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=2200000,RESOLUTION=720x1280,CODECS="avc1.4d401f"
720p.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=1100000,RESOLUTION=480x854,CODECS="avc1.4d401f"
480p.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=660000,RESOLUTION=360x640,CODECS="avc1.42c01e"
360p.m3u8
EOF
  
  echo "  ✓ Created master.m3u8"
}

# Function to process a single video
process_video() {
  local video_folder=$1
  local video_name=$(basename "$video_folder")
  local original="$video_folder/video.mp4"
  
  if [ ! -f "$original" ]; then
    echo "⚠️  Skipping $video_name (no video.mp4 found)"
    return
  fi
  
  echo "📹 Processing: $video_name"
  
  # Generate multiple qualities
  for quality_spec in "${QUALITIES[@]}"; do
    IFS=':' read -r label width height bitrate <<< "$quality_spec"
    
    local output="$video_folder/${label}.mp4"
    local m3u8="$video_folder/${label}.m3u8"
    
    echo "  🎬 Generating $label (${width}x${height} @ ${bitrate})..."
    
    # Generate MP4 with specific quality
    ffmpeg -i "$original" \
      -vf "scale=${width}:${height}" \
      -b:v "$bitrate" \
      -maxrate "$((${bitrate%k} + 350))k" \
      -bufsize "$((${bitrate%k} * 2))k" \
      -c:v libx264 \
      -profile:v high \
      -preset slow \
      -movflags +faststart \
      -c:a aac -b:a 128k \
      -y "$output" \
      -loglevel error -stats
    
    # Generate HLS segments
    ffmpeg -i "$output" \
      -c copy \
      -f hls \
      -hls_time 4 \
      -hls_playlist_type vod \
      -hls_segment_filename "$video_folder/${label}_%03d.ts" \
      -y "$m3u8" \
      -loglevel error
    
    echo "  ✓ $label complete"
  done
  
  # Create master playlist
  create_master_playlist "$video_folder"
  
  # Generate thumbnail sprite
  local sprite_dir="$THUMB_DIR/$video_name"
  mkdir -p "$sprite_dir"
  
  echo "  🖼️  Generating thumbnail sprite..."
  ffmpeg -i "$original" \
    -vf "fps=1,scale=160:90,tile=10x10" \
    -frames:v 1 \
    -y "$sprite_dir/sprite.jpg" \
    -loglevel error
  
  echo "  ✓ Sprite complete"
  
  # Generate H.265 version (better compression)
  echo "  🗜️  Generating H.265 version..."
  ffmpeg -i "$original" \
    -c:v libx265 \
    -preset slow \
    -crf 28 \
    -c:a aac -b:a 128k \
    -y "$video_folder/h265.mp4" \
    -loglevel error -stats
  
  echo "  ✓ H.265 complete"
  echo "  ✅ $video_name processed successfully!"
  echo ""
}

# Main execution
echo "Starting video processing..."
echo ""

# Process all videos
for video_folder in "$VIDEO_DIR"/*/; do
  if [ -d "$video_folder" ]; then
    process_video "$video_folder"
  fi
done

echo "=========================================="
echo "✅ All videos processed!"
echo ""
echo "Next steps:"
echo "1. Test HLS streaming in docs/index.html"
echo "2. Deploy to GitHub Pages"
echo "3. Optional: Setup Cloudflare CDN for better performance"
echo ""
