// The record collection for the homepage turntable (music.js).
// Recordings still under copyright play Apple Music's 30-second previews and link to the full song.
// The Canon (U.S. Air Force Band) and Vivaldi (Modena Chamber Orchestra, via Musopen) recordings are public domain and play in full.
export const TRACKS = [
  {
    title: 'Vienna', artist: 'Billy Joel', egg: 'vienna', apple: 158618071,
    src: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/e8/d2/03/e8d203cc-ce97-278b-5abb-c6de33d36d37/mzaf_5153648922176185845.plus.aac.p.m4a',
    link: 'https://music.apple.com/us/album/vienna/158617952?i=158618071',
  },
  {
    title: 'Eleanor Rigby', artist: 'The Beatles', apple: 1441164806,
    src: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/99/09/83/99098388-9516-8d3b-df47-594bf758d1c2/mzaf_1133000424273343422.plus.aac.p.m4a',
    link: 'https://music.apple.com/us/album/eleanor-rigby/1441164670?i=1441164806',
  },
  {
    title: 'Make Your Own Kind of Music', artist: 'Cass Elliot', apple: 1415197764,
    src: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/16/cd/58/16cd58c4-3b40-10fe-2bea-2db82da112a4/mzaf_13689915999233858437.plus.aac.p.m4a',
    link: 'https://music.apple.com/us/album/make-your-own-kind-of-music/1415197628?i=1415197764',
  },
  {
    title: 'Sleeping Beauty Waltz', artist: 'Tchaikovsky', apple: 41503669, by: 'London Symphony Orchestra',
    src: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/d0/63/32/d06332f1-c695-874d-9684-7466828f6644/mzaf_462606505990017079.plus.aac.p.m4a',
    link: 'https://music.apple.com/us/album/sleeping-beauty-waltz/41503674?i=41503669',
  },
  {
    title: 'Canon in D', artist: 'Pachelbel', src: 'assets/music/canon-in-d.mp3', by: 'the U.S. Air Force Band Strolling Strings',
    link: 'https://commons.wikimedia.org/wiki/File:Canon_(2004)_-_Strolling_Strings_-_United_States_Air_Force_Band.mp3',
  },
  {
    title: 'The Four Seasons: Spring', artist: 'Vivaldi', src: 'assets/music/vivaldi-spring.mp3', by: 'the Modena Chamber Orchestra',
    link: 'https://commons.wikimedia.org/wiki/File:The_Modena_Chamber_Orchestra_-_Vivaldi%27s_Spring,_RV_269_-_I._Allegro.ogg',
  },
];

// Apple sometimes moves preview files. Ask for the current address; null if it is unchanged or unreachable.
export async function freshPreview(track) {
  if (!track.apple) return null;
  try {
    const r = await fetch(`https://itunes.apple.com/lookup?id=${track.apple}&country=US`);
    const url = (await r.json()).results?.[0]?.previewUrl;
    return url && url !== track.src ? (track.src = url) : null;
  } catch (e) { return null; }
}
