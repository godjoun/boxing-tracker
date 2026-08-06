function getLessonEmbedUrl(videoUrl) {
  if (!videoUrl) return null;

  const youtubeMatch = videoUrl.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/
  );

  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }

  return null;
}

export default function LessonVideoPlayer({ videoUrl, title }) {
  if (!videoUrl) {
    return null;
  }

  const embedUrl = getLessonEmbedUrl(videoUrl);

  if (embedUrl) {
    return (
      <div className="curriculum-lesson-embed">
        <iframe
          src={embedUrl}
          title={title || "강의 영상"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <video
      className="curriculum-lesson-video"
      src={videoUrl}
      controls
      playsInline
      preload="metadata"
    />
  );
}
