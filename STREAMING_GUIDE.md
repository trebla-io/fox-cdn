# Implementação de Tecnologias Avançadas de Streaming

Guia para implementar recursos profissionais de CDN no Fox CDN (estilo Cloudflare Stream)

## 🎯 Tecnologias Implementáveis

### 1. Adaptive Bitrate Streaming (HLS)

**O que é**: Streaming que adapta a qualidade baseado na conexão do usuário.

**Como implementar**:

```bash
# 1. Gerar múltiplas qualidades com FFmpeg
# Para cada vídeo, criar 4 versões:

# 1080p (high quality)
ffmpeg -i input.mp4 -vf scale=1080:1920 -b:v 3500k -maxrate 3850k -bufsize 5000k \
  -c:v libx264 -profile:v high -preset slow \
  videos/mobile-short-01/1080p.mp4

# 720p (medium-high)
ffmpeg -i input.mp4 -vf scale=720:1280 -b:v 2000k -maxrate 2200k -bufsize 3000k \
  -c:v libx264 -profile:v main -preset slow \
  videos/mobile-short-01/720p.mp4

# 480p (medium)
ffmpeg -i input.mp4 -vf scale=480:854 -b:v 1000k -maxrate 1100k -bufsize 1500k \
  -c:v libx264 -profile:v main -preset slow \
  videos/mobile-short-01/480p.mp4

# 360p (low quality)
ffmpeg -i input.mp4 -vf scale=360:640 -b:v 600k -maxrate 660k -bufsize 900k \
  -c:v libx264 -profile:v baseline -preset slow \
  videos/mobile-short-01/360p.mp4
```

```bash
# 2. Criar HLS playlist master
cat > videos/mobile-short-01/master.m3u8 << 'EOF'
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
```

```bash
# 3. Gerar segmentos HLS para cada qualidade
for quality in 1080p 720p 480p 360p; do
  ffmpeg -i videos/mobile-short-01/${quality}.mp4 \
    -c copy -f hls \
    -hls_time 4 \
    -hls_playlist_type vod \
    -hls_segment_filename "videos/mobile-short-01/${quality}_%03d.ts" \
    videos/mobile-short-01/${quality}.m3u8
done
```

### 2. Compressão Avançada de Vídeo

**H.265 (HEVC)** - Melhor compressão (50% menor que H.264):

```bash
ffmpeg -i input.mp4 \
  -c:v libx265 -preset slow -crf 28 \
  -c:a aac -b:a 128k \
  output_h265.mp4
```

**AV1** - Compressão de última geração:

```bash
ffmpeg -i input.mp4 \
  -c:v libsvtav1 -crf 35 -preset 6 \
  -c:a libopus -b:a 128k \
  output_av1.mp4
```

**VP9** - Google codec (bom para web):

```bash
ffmpeg -i input.mp4 \
  -c:v libvpx-vp9 -crf 30 -b:v 0 \
  -c:a libopus -b:a 128k \
  output_vp9.webm
```

### 3. Thumbnail Sprites (Preview on Hover)

Gerar sprite sheet de thumbnails:

```bash
# Extrair 1 frame por segundo
ffmpeg -i input.mp4 -vf "fps=1,scale=160:90,tile=10x10" \
  thumbnails/mobile-short-01/sprite.jpg

# Gerar VTT file para controle
cat > thumbnails/mobile-short-01/sprites.vtt << 'EOF'
WEBVTT

00:00.000 --> 00:01.000
sprite.jpg#xywh=0,0,160,90

00:01.000 --> 00:02.000
sprite.jpg#xywh=160,0,160,90

00:02.000 --> 00:03.000
sprite.jpg#xywh=320,0,160,90
EOF
```

### 4. Player com HLS.js

Atualizar HTML para usar HLS.js:

```html
<!-- Adicionar biblioteca -->
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>

<video id="stream-video" class="video-player" controls></video>

<script>
  const video = document.getElementById("stream-video");
  const videoSrc =
    "https://trebla-io.github.io/fox-cdn/videos/mobile-short-01/master.m3u8";

  if (Hls.isSupported()) {
    const hls = new Hls({
      maxBufferLength: 30,
      maxMaxBufferLength: 60,
      enableWorker: true,
      lowLatencyMode: false,
    });

    hls.loadSource(videoSrc);
    hls.attachMedia(video);

    // Event listeners
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      console.log("HLS manifest loaded, qualities:", hls.levels);
    });

    hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
      const level = hls.levels[data.level];
      console.log("Quality changed to:", level.height + "p");
      document.getElementById("player-quality").textContent =
        level.height + "p";
    });
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    // Safari nativo
    video.src = videoSrc;
  }
</script>
```

### 5. Controle Manual de Qualidade

```javascript
// UI para seleção de qualidade
function createQualitySelector(hls) {
  const levels = hls.levels;
  const selector = document.createElement("select");

  // Auto quality
  const autoOption = document.createElement("option");
  autoOption.value = -1;
  autoOption.textContent = "Auto";
  selector.appendChild(autoOption);

  // Qualidades específicas
  levels.forEach((level, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `${level.height}p`;
    selector.appendChild(option);
  });

  selector.addEventListener("change", (e) => {
    hls.currentLevel = parseInt(e.target.value);
  });

  return selector;
}
```

### 6. Lazy Loading e Preload

```javascript
// Precarregar apenas metadata
<video preload="metadata">

// Intersection Observer para lazy load
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const video = entry.target;
      if (video.dataset.src) {
        video.src = video.dataset.src;
        video.load();
        observer.unobserve(video);
      }
    }
  });
});

document.querySelectorAll('video[data-src]').forEach(video => {
  observer.observe(video);
});
```

### 7. Analytics e Metrics

```javascript
// Tracking de visualizações
const player = document.getElementById("stream-video");

player.addEventListener("play", () => {
  console.log("Video started");
  // Track: video_play
});

player.addEventListener("ended", () => {
  console.log("Video completed");
  // Track: video_complete
});

player.addEventListener("timeupdate", () => {
  const progress = (player.currentTime / player.duration) * 100;
  // Track milestones: 25%, 50%, 75%, 100%
});

// Buffering metrics
player.addEventListener("waiting", () => {
  console.log("Buffering started");
});

player.addEventListener("canplay", () => {
  console.log("Buffering ended");
});
```

### 8. CDN Caching Headers

Criar arquivo `.htaccess` ou configurar no GitHub Pages:

```
# Cache de vídeos por 1 ano
<FilesMatch "\.(mp4|webm|m3u8|ts)$">
  Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>

# Cache de thumbnails por 1 mês
<FilesMatch "\.(jpg|jpeg|png)$">
  Header set Cache-Control "public, max-age=2592000"
</FilesMatch>

# Cache de JSON por 1 hora
<FilesMatch "\.json$">
  Header set Cache-Control "public, max-age=3600"
</FilesMatch>
```

## 📊 Estrutura Final de Pastas

```
fox-cdn/
├── videos/
│   ├── mobile-short-01/
│   │   ├── master.m3u8        # HLS master playlist
│   │   ├── 1080p.m3u8         # Playlist 1080p
│   │   ├── 1080p_000.ts       # Segmentos HLS
│   │   ├── 1080p_001.ts
│   │   ├── 720p.m3u8
│   │   ├── 720p_000.ts
│   │   ├── 480p.m3u8
│   │   ├── 480p_000.ts
│   │   ├── 360p.m3u8
│   │   ├── 360p_000.ts
│   │   ├── original.mp4       # Vídeo original
│   │   └── h265.mp4           # Versão HEVC comprimida
│   └── ...
├── thumbnails/
│   ├── mobile-short-01/
│   │   ├── sprite.jpg         # Sprite sheet
│   │   ├── sprites.vtt        # VTT para preview
│   │   └── thumbnail.jpg      # Thumbnail principal
│   └── ...
└── docs/
    └── player.html            # Player com HLS.js
```

## 🚀 Script de Automação

Criar script para processar todos os vídeos:

```bash
#!/bin/bash
# process_all_videos.sh

VIDEO_DIR="videos"
QUALITIES=("1080p:3500k" "720p:2000k" "480p:1000k" "360p:600k")

for video_folder in "$VIDEO_DIR"/*/; do
  video_name=$(basename "$video_folder")
  original="$video_folder/video.mp4"

  echo "Processing $video_name..."

  # Gerar múltiplas qualidades
  for quality in "${QUALITIES[@]}"; do
    IFS=':' read -r res bitrate <<< "$quality"

    # Extrair dimensões
    if [[ $res == "1080p" ]]; then scale="1080:1920"
    elif [[ $res == "720p" ]]; then scale="720:1280"
    elif [[ $res == "480p" ]]; then scale="480:854"
    else scale="360:640"
    fi

    echo "  Generating $res..."
    ffmpeg -i "$original" -vf "scale=$scale" \
      -b:v "$bitrate" -maxrate "$((${bitrate%k} + 200))k" \
      -c:v libx264 -preset slow -y \
      "$video_folder/${res}.mp4" 2>/dev/null

    # Gerar HLS
    ffmpeg -i "$video_folder/${res}.mp4" -c copy -f hls \
      -hls_time 4 -hls_playlist_type vod \
      -hls_segment_filename "$video_folder/${res}_%03d.ts" \
      "$video_folder/${res}.m3u8" 2>/dev/null
  done

  # Gerar master playlist
  create_master_playlist "$video_folder"

  # Gerar sprite
  ffmpeg -i "$original" -vf "fps=1,scale=160:90,tile=10x10" \
    "thumbnails/$video_name/sprite.jpg" 2>/dev/null

  echo "  ✓ Complete!"
done
```

## 💰 Economia de Banda

Com essas otimizações:

- **HLS adaptativo**: -30% de banda (qualidade automática)
- **H.265 codec**: -50% de tamanho vs H.264
- **Sprite thumbnails**: -95% vs thumbs individuais
- **Caching**: -80% de requests repetidos

## 🎯 Próximos Passos Recomendados

1. **Implementar HLS** para os vídeos mais acessados primeiro
2. **Gerar H.265** para dispositivos modernos
3. **Criar sprites** para preview hover
4. **Adicionar analytics** de viewing
5. **Configurar CDN** (Cloudflare grátis) para melhor cache

Quer que eu implemente alguma dessas tecnologias agora?
