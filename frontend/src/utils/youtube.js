// Accepts youtu.be/watch/embed/shorts URLs (with or without extra query params) and
// returns a playable embed URL, or null if the input isn't a recognizable YouTube link.
export const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
};
