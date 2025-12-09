// Tab switching functionality
function switchTab(tabName) {
  // Remove active class from all tabs and content
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active");
  });

  // Add active class to selected tab
  event.target.classList.add("active");
  document.getElementById(`${tabName}-tab`).classList.add("active");
}

// Copy code functionality
function copyCode(button, codeId) {
  const code = document.getElementById(codeId).textContent;

  navigator.clipboard.writeText(code).then(() => {
    const originalText = button.textContent;
    button.textContent = "Copied!";
    button.classList.add("copied");

    setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove("copied");
    }, 2000);
  });
}

// Video filtering
let allVideos = [];
let currentFilter = "all";

function filterVideos(category) {
  currentFilter = category;

  // Update active button
  document.querySelectorAll(".category-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  event.target.classList.add("active");

  // Filter and display videos
  const grid = document.getElementById("videos-grid");
  const filtered =
    category === "all"
      ? allVideos
      : allVideos.filter((v) => v.slug.includes(category));

  displayVideos(filtered);
}

function displayVideos(videos) {
  const grid = document.getElementById("videos-grid");
  grid.innerHTML = "";

  videos.forEach((video) => {
    const card = document.createElement("div");
    card.className = "video-card";
    card.onclick = () => openVideo(video);

    card.innerHTML = `
            <img 
                src="${video.thumbnail.url}" 
                alt="${video.title}"
                class="video-thumbnail"
                loading="lazy"
            />
            <div class="video-info">
                <div class="video-title">${video.title}</div>
                <div class="video-meta">
                    <span class="video-duration">⏱️ ${video.duration_seconds}s</span>
                    <span class="video-fps">🎬 ${video.fps}fps</span>
                </div>
            </div>
        `;

    grid.appendChild(card);
  });
}

function openVideo(video) {
  const url = video.sources[0].url;
  window.open(url, "_blank");
}

// Load videos from API
async function loadVideos() {
  try {
    const response = await fetch("../api/videos.json");
    const data = await response.json();
    allVideos = data.videos;
    displayVideos(allVideos);
    return allVideos;
  } catch (error) {
    console.error("Error loading videos:", error);
    document.getElementById("videos-grid").innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
                Failed to load videos. Please check the API endpoint.
            </div>
        `;
    return [];
  }
}

// Smooth scroll with offset for fixed header
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      const headerOffset = 72;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  });
});

// Header scroll effect
let lastScroll = 0;
window.addEventListener("scroll", () => {
  const header = document.querySelector(".header");
  const currentScroll = window.pageYOffset;

  if (currentScroll > 100) {
    header.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.3)";
  } else {
    header.style.boxShadow = "none";
  }

  lastScroll = currentScroll;
});

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  loadVideos();

  // Add fade-in animation to sections
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll("section").forEach((section) => {
    section.style.opacity = "0";
    section.style.transform = "translateY(20px)";
    section.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    observer.observe(section);
  });
});

// Professional Streaming Functions
let currentStreamVideo = null;

function selectVideo(slug) {
  if (!slug) return;

  const video = allVideos.find((v) => v.slug === slug);
  if (!video) return;

  currentStreamVideo = video;

  // Update player
  const player = document.getElementById("stream-video");
  const overlay = document.getElementById("player-overlay");
  const videoUrl = video.sources[0].url;
  const thumbnailUrl = video.thumbnail.url;

  player.src = videoUrl;
  player.poster = thumbnailUrl;
  overlay.classList.add("hidden");

  // Update player info
  document.getElementById("player-status").textContent = "Loaded";
  document.getElementById("player-quality").textContent =
    video.sources[0].quality || "1080p";
  document.getElementById("player-codec").textContent =
    video.sources[0].codec.toUpperCase();

  // Update URLs
  document.getElementById("video-url").value = videoUrl;
  document.getElementById("thumbnail-url").value = thumbnailUrl;

  // Update embed code
  const embedCode = `<video 
  width="1080" 
  height="1920" 
  controls 
  poster="${thumbnailUrl}"
>
  <source src="${videoUrl}" type="video/mp4">
</video>`;

  document.querySelector("#embed-code code").textContent = embedCode;

  // Update stats
  document.getElementById(
    "stream-duration"
  ).textContent = `${video.duration_seconds}s`;
  document.getElementById("stream-size").textContent = formatFileSize(
    video.size_bytes
  );
  document.getElementById("stream-fps").textContent = `${video.fps} FPS`;

  // Scroll to player
  document
    .getElementById("stream")
    .scrollIntoView({ behavior: "smooth", block: "start" });
}

function copyVideoUrl() {
  const input = document.getElementById("video-url");
  if (!input.value) return;

  navigator.clipboard.writeText(input.value).then(() => {
    showCopyFeedback(event.target);
  });
}

function copyThumbnailUrl() {
  const input = document.getElementById("thumbnail-url");
  if (!input.value) return;

  navigator.clipboard.writeText(input.value).then(() => {
    showCopyFeedback(event.target);
  });
}

function copyEmbedCode() {
  const code = document.querySelector("#embed-code code").textContent;
  if (!code || code.includes("Select a video")) return;

  navigator.clipboard.writeText(code).then(() => {
    showCopyFeedback(event.target);
  });
}

function showCopyFeedback(button) {
  const originalText = button.textContent;
  button.textContent = "Copied!";
  button.style.background = "var(--secondary)";
  button.style.color = "white";

  setTimeout(() => {
    button.textContent = originalText;
    button.style.background = "";
    button.style.color = "";
  }, 2000);
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function populateVideoSelector() {
  const selector = document.getElementById("video-selector");

  allVideos.forEach((video) => {
    const option = document.createElement("option");
    option.value = video.slug;
    option.textContent = `${video.title} (${video.duration_seconds}s)`;
    selector.appendChild(option);
  });
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  loadVideos().then(() => {
    populateVideoSelector();
  });

  // Add fade-in animation to sections
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll("section").forEach((section) => {
    section.style.opacity = "0";
    section.style.transform = "translateY(20px)";
    section.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    observer.observe(section);
  });
});
