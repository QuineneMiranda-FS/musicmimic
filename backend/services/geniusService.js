"use strict";

const axios = require("axios");
const cheerio = require("cheerio");

async function getLyrics(title, artist) {
  try {
    console.log(`[Genius] getting lyrics for: ${title} - ${artist}`);
    const searchUrl = `https://api.genius.com/search?q=${encodeURIComponent(`${title} ${artist}`)}&access_token=${process.env.GENIUS_ACCESS_TOKEN}`;
    const geniusSearch = await axios.get(searchUrl);

    const geniusHit = geniusSearch.data?.response?.hits?.[0]?.result;
    if (!geniusHit?.path) {
      return {
        lyricsText: "No lyrics found on Genius for this track.",
        geniusUrl: null,
      };
    }

    const geniusUrl = geniusHit.url || null;
    const lyricPage = await axios.get(`https://genius.com${geniusHit.path}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...",
      },
    });

    const $ = cheerio.load(lyricPage.data);
    $(
      ".SongDescription__Content, .HeaderBio__Description, button[class*='ReadMore'], a[class*='ReadMore']",
    ).remove();

    let scrapedLyrics = "";

    $('[class^="Lyrics__Container"], [data-lyrics-container="true"]').each(
      (_, el) => {
        let htmlContent =
          $(el)
            .html()
            ?.replace(/<br\s*\/?>/gi, "\n")
            .replace(/<\/p>|<\/div>/gi, "\n") || "";
        scrapedLyrics += cheerio.load(htmlContent).text() + "\n";
      },
    );

    if (!scrapedLyrics.trim()) {
      $(".lyrics").each((_, el) => {
        let htmlContent =
          $(el)
            .html()
            ?.replace(/<br\s*\/?>/gi, "\n") || "";
        scrapedLyrics += cheerio.load(htmlContent).text() + "\n";
      });
    }

    scrapedLyrics = cleanLyricsText(scrapedLyrics);

    return {
      lyricsText: scrapedLyrics
        ? scrapedLyrics.substring(0, 1500)
        : "No lyrics found on Genius for this track.",
      geniusUrl,
    };
  } catch (err) {
    console.warn("[Genius Scraping Error]:", err.message);
    return {
      lyricsText: "No lyrics found on Genius for this track.",
      geniusUrl: null,
    };
  }
}

function cleanLyricsText(text) {
  return text
    .replace(/^\d+\s+Contributors?[\s\S]*?(?=Lyrics)/gi, "")
    .replace(/^.*?\bLyrics\b\s*/i, "")
    .replace(/You might also like[\s\S]*/gi, "")
    .replace(/Read\s*More/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

module.exports = { getLyrics };
