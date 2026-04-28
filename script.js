const SUPABASE_URL = "https://xpeflbtwebjazxohtfrm.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwZWZsYnR3ZWJqYXp4b2h0ZnJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNzUyMzQsImV4cCI6MjA5Mjk1MTIzNH0.whSxKh0Wks4Om_vyXE7ByiCKI2mRhGCk_g7vnwirN_o";

const ARTIST_FILTERS = [
  { value: "all", label: "All" },
  { value: "朧サクラ", label: "朧サクラ" },
  { value: "宵サクラ", label: "宵サクラ" },
  { value: "瑠架", label: "瑠架" },
  { value: "yomi", label: "yomi" },
  { value: "other", label: "Other" },
];

const audio = document.querySelector("#audio");
const artistFilters = document.querySelector("#artistFilters");
const coverArt = document.querySelector("#coverArt");
const likeButton = document.querySelector("#likeButton");
const lyricsSection = document.querySelector("#lyricsSection");
const lyricsText = document.querySelector("#lyricsText");
const playCount = document.querySelector("#playCount");
const likeCount = document.querySelector("#likeCount");
const songList = document.querySelector("#songList");
const sunoLink = document.querySelector("#sunoLink");
const trackDescription = document.querySelector("#trackDescription");
const trackTitle = document.querySelector("#trackTitle");

const canUseSupabase =
  window.supabase && !SUPABASE_ANON_KEY.includes("PASTE_YOUR_ANON_PUBLIC_KEY_HERE");
const db = canUseSupabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

let currentSong = null;
let selectedArtist = "all";
let songs = [];
let statsBySongId = new Map();
const countedSongsThisSession = new Set();

function getSongKey(song) {
  return song?.slug || "midnight-litany";
}

function getLikedKey(song) {
  return `${getSongKey(song)}:liked`;
}

function getLocalPlayKey(song) {
  return `${getSongKey(song)}:plays`;
}

function getLocalLikeKey(song) {
  return `${getSongKey(song)}:likes`;
}

function readNumber(key) {
  return Number.parseInt(localStorage.getItem(key) || "0", 10);
}

function writeNumber(key, value) {
  localStorage.setItem(key, String(value));
}

function getArtistLabel(song) {
  return song.artist?.trim() || "Other";
}

function isOtherSong(song) {
  return !song.artist?.trim();
}

function getStats(song) {
  if (!song) return { play_count: 0, like_count: 0 };

  return (
    statsBySongId.get(song.id) || {
      play_count: readNumber(getLocalPlayKey(song)),
      like_count: readNumber(getLocalLikeKey(song)),
    }
  );
}

function setStats(song, stats) {
  if (!song) return;
  statsBySongId.set(song.id, stats);
}

function renderStats(song = currentSong) {
  const stats = getStats(song);
  const liked = localStorage.getItem(getLikedKey(song)) === "true";

  playCount.textContent = stats.play_count.toLocaleString("ja-JP");
  likeCount.textContent = stats.like_count.toLocaleString("ja-JP");
  likeButton.setAttribute("aria-pressed", liked);
  likeButton.querySelector("span").textContent = liked ? "♥" : "♡";
}

function resetCover() {
  coverArt.classList.remove("has-image");
  coverArt.style.backgroundImage = "";
}

function renderSong(song) {
  currentSong = song;
  document.title = `${song.title} | 39ra Garden`;
  trackTitle.textContent = song.title;
  audio.src = song.audio_url;

  const artistText = song.artist ? `${song.artist} / ` : "";
  trackDescription.textContent = `${artistText}Sunoで制作したAI generated track.`;

  resetCover();
  if (song.cover_url) {
    coverArt.classList.add("has-image");
    coverArt.style.backgroundImage = `url("${song.cover_url}")`;
  }

  if (song.suno_url) {
    sunoLink.href = song.suno_url;
    sunoLink.hidden = false;
  } else {
    sunoLink.hidden = true;
  }

  if (song.lyrics) {
    lyricsText.textContent = song.lyrics;
    lyricsSection.hidden = false;
  } else {
    lyricsSection.hidden = true;
  }

  renderStats(song);
  renderSongList();
}

function getFilteredSongs() {
  if (selectedArtist === "all") return songs;
  if (selectedArtist === "other") return songs.filter(isOtherSong);
  return songs.filter((song) => song.artist === selectedArtist);
}

function countByFilter(filter) {
  if (filter.value === "all") return songs.length;
  if (filter.value === "other") return songs.filter(isOtherSong).length;
  return songs.filter((song) => song.artist === filter.value).length;
}

function renderArtistFilters() {
  if (!artistFilters) return;

  artistFilters.replaceChildren();

  ARTIST_FILTERS.forEach((filter) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "artist-filter";
    button.dataset.artist = filter.value;
    button.setAttribute("aria-pressed", String(selectedArtist === filter.value));
    button.textContent = `${filter.label} ${countByFilter(filter)}`;
    button.addEventListener("click", () => {
      selectedArtist = filter.value;
      renderArtistFilters();
      renderSongList();

      const firstSong = getFilteredSongs()[0];
      if (firstSong && !getFilteredSongs().some((song) => song.id === currentSong?.id)) {
        renderSong(firstSong);
      }
    });

    artistFilters.append(button);
  });
}

function renderSongList() {
  if (!songList) return;

  songList.replaceChildren();

  const filteredSongs = getFilteredSongs();
  if (filteredSongs.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "このアーティストの曲はまだ登録されていません。";
    songList.append(empty);
    return;
  }

  filteredSongs.forEach((song) => {
    const stats = getStats(song);
    const card = document.createElement("button");
    card.type = "button";
    card.className = "song-card";
    card.setAttribute("aria-pressed", String(song.id === currentSong?.id));

    const thumb = document.createElement("span");
    thumb.className = "song-thumb";
    if (song.cover_url) {
      thumb.style.backgroundImage = `url("${song.cover_url}")`;
    }

    const body = document.createElement("span");
    body.className = "song-card-body";

    const artist = document.createElement("small");
    artist.textContent = getArtistLabel(song);

    const title = document.createElement("strong");
    title.textContent = song.title;

    const meta = document.createElement("span");
    meta.textContent = `${stats.play_count.toLocaleString("ja-JP")} plays / ${stats.like_count.toLocaleString("ja-JP")} likes`;

    body.append(artist, title, meta);
    card.append(thumb, body);
    card.addEventListener("click", () => renderSong(song));
    songList.append(card);
  });
}

async function loadSongs() {
  if (!db) {
    const fallbackSong = {
      id: "local-midnight-litany",
      slug: "midnight-litany",
      title: "MIDNIGHT LITANY",
      artist: "朧サクラ",
      audio_url:
        "https://xpeflbtwebjazxohtfrm.supabase.co/storage/v1/object/public/suno/MIDNIGHT%20LITANY.mp3",
      cover_url: null,
      suno_url: null,
      lyrics: null,
    };

    songs = [fallbackSong];
    renderArtistFilters();
    renderSong(fallbackSong);
    return;
  }

  const { data: songRows, error: songsError } = await db
    .from("songs")
    .select("id, slug, title, artist, audio_url, cover_url, suno_url, lyrics, created_at")
    .order("created_at", { ascending: false });

  if (songsError) {
    console.warn(songsError);
    return;
  }

  songs = songRows || [];

  if (songs.length > 0) {
    const { data: statsRows, error: statsError } = await db
      .from("song_stats")
      .select("song_id, play_count, like_count")
      .in(
        "song_id",
        songs.map((song) => song.id),
      );

    if (statsError) {
      console.warn(statsError);
    } else {
      statsBySongId = new Map((statsRows || []).map((stats) => [stats.song_id, stats]));
    }
  }

  renderArtistFilters();

  const initialSong =
    songs.find((song) => song.slug === "midnight-litany") ||
    songs.find((song) => song.artist === "朧サクラ") ||
    songs[0];

  if (initialSong) {
    renderSong(initialSong);
  } else {
    renderSongList();
  }
}

audio.addEventListener("play", () => {
  if (!currentSong || countedSongsThisSession.has(currentSong.id)) return;

  countedSongsThisSession.add(currentSong.id);

  if (db) {
    const playingSong = currentSong;
    db.rpc("increment_play", { target_song_id: playingSong.id }).then(({ data, error }) => {
      if (error) {
        console.warn(error);
        return;
      }

      setStats(playingSong, data);
      if (currentSong?.id === playingSong.id) {
        renderStats(playingSong);
      }
      renderSongList();
    });
    return;
  }

  const nextStats = {
    ...getStats(currentSong),
    play_count: getStats(currentSong).play_count + 1,
  };
  writeNumber(getLocalPlayKey(currentSong), nextStats.play_count);
  setStats(currentSong, nextStats);
  renderStats(currentSong);
  renderSongList();
});

likeButton.addEventListener("click", async () => {
  if (!currentSong) return;

  const likedSong = currentSong;
  const liked = localStorage.getItem(getLikedKey(currentSong)) === "true";
  const nextLiked = !liked;

  if (db) {
    const functionName = nextLiked ? "increment_like" : "decrement_like";
    const { data, error } = await db.rpc(functionName, { target_song_id: likedSong.id });

    if (error) {
      console.warn(error);
      return;
    }

    localStorage.setItem(getLikedKey(likedSong), String(nextLiked));
    setStats(likedSong, data);
    if (currentSong?.id === likedSong.id) {
      renderStats(likedSong);
    }
    renderSongList();
    return;
  }

  const nextStats = {
    ...getStats(currentSong),
    like_count: Math.max(0, getStats(currentSong).like_count + (nextLiked ? 1 : -1)),
  };

  localStorage.setItem(getLikedKey(currentSong), String(nextLiked));
  writeNumber(getLocalLikeKey(currentSong), nextStats.like_count);
  setStats(currentSong, nextStats);
  renderStats(currentSong);
  renderSongList();
});

loadSongs();
