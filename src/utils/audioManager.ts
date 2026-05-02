class AudioManager {
  private jumpSnd: HTMLAudioElement;
  private crashSnd: HTMLAudioElement;
  private randomScoreSounds: HTMLAudioElement[];
  
  // Các biến cho hệ thống nhạc mới
  private menuBgm: HTMLAudioElement;
  private rainbowFirst: HTMLAudioElement;
  private rainbowPlaylist: HTMLAudioElement[];
  
  // Biến kiểm soát luồng nhạc (để tắt đi khi chết)
  private sequenceTimeout: ReturnType<typeof setTimeout> | null = null;
  private currentSequenceAudio: HTMLAudioElement | null = null;

  constructor() {
    this.jumpSnd = new Audio('/sounds/freesound_community-flappy_whoosh-43099.mp3');
    this.jumpSnd.volume = 0.5;

    this.crashSnd = new Audio('/sounds/do-ngu-do-an-hai.mp3');
    this.crashSnd.volume = 0.8;

    this.randomScoreSounds = [
      new Audio('/sounds/fahhhhh.mp3'),
      new Audio('/sounds/fahhhhh_zaX5nvm.mp3')
    ];
    this.randomScoreSounds.forEach(snd => snd.volume = 0.6);

    // 1. Nhạc Menu chờ
    this.menuBgm = new Audio('/sounds/nhac-xo-so.mp3');
    this.menuBgm.loop = true; // Lặp lại liên tục
    this.menuBgm.volume = 0.4;

    // 2. Nhạc mốc 10 điểm
    this.rainbowFirst = new Audio('/sounds/mo-dun-thooc-kinh-do.mp3');
    this.rainbowFirst.volume = 0.7;

    // 3. Playlist nhạc chạy đuổi nhau mỗi 10s
    this.rainbowPlaylist = [
      new Audio('/sounds/trinh-la-gi.mp3'),
      new Audio('/sounds/tap-trung-vao-su-nghiep.mp3'),
      new Audio('/sounds/hachimi-chimici-mambo.mp3'),
      new Audio('/sounds/outro-song_oqu8zAg.mp3'),
      new Audio('/sounds/tam-trang.mp3'),
      new Audio('/sounds/loi-toi_TnbhdTR.mp3'),
      new Audio('/sounds/banh-bao-banh-bao-day.mp3'),
      new Audio('/sounds/Am_thanh_meme_con_may_thich_kieu_gi_may_nhay_vao_may_an_tao_di_tiktok-www_tiengdong_com.mp3'),
      new Audio('/sounds/low-cortisol-song.mp3'),
      new Audio('/sounds/dreamcore.mp3'),
      new Audio('/sounds/tu-tu-tu-du-max-verstappen.mp3'),
      new Audio('/sounds/Johnny-Dak.mp3'),
      new Audio('/sounds/Anh-yeu-em-nhieu-VL.mp3'),
      new Audio('/sounds/Anh-em-bi-chem.-Tao-bo-chay.mp3'),
      new Audio('/sounds/outro-song_oqu8zAg.mp3'),
      new Audio('/sounds/Day-no-phai-the-chu-li-thang-nay-kha-va-gioi.mp3'),
      new Audio('/sounds/Vu-nao-Banh-ma.mp3')
    ];
    this.rainbowPlaylist.forEach(snd => snd.volume = 0.7);
  }

  // --- HỆ THỐNG NHẠC MENU ---
  playMenuMusic() {
    this.menuBgm.play().catch(() => {});
  }

  stopMenuMusic() {
    this.menuBgm.pause();
    this.menuBgm.currentTime = 0;
  }

  // --- HỆ THỐNG ÂM THANH GAMEPLAY ---
  playJump() {
    const clone = this.jumpSnd.cloneNode() as HTMLAudioElement;
    clone.volume = this.jumpSnd.volume;
    clone.play().catch(() => {});
  }

  playCrash() {
    this.crashSnd.currentTime = 0;
    this.crashSnd.play().catch(() => {});
  }

  playScoreSound() {
    const randomIndex = Math.floor(Math.random() * this.randomScoreSounds.length);
    const selectedSound = this.randomScoreSounds[randomIndex];
    const clone = selectedSound.cloneNode() as HTMLAudioElement;
    clone.volume = selectedSound.volume;
    clone.play().catch(() => {});
  }

  // --- HỆ THỐNG CHUỖI NHẠC CẦU VỒNG (PLAYLIST MỖI 10 GIÂY) ---
  startRainbowSequence() {
    this.stopSequence(); // Tắt nhạc đang phát nếu có

    // Phát bài mở màn (mốc 10 điểm)
    this.rainbowFirst.currentTime = 0;
    this.rainbowFirst.play().catch(() => {});
    this.currentSequenceAudio = this.rainbowFirst;

    // Đặt đồng hồ đếm 10 giây sau sẽ chuyển bài đầu tiên trong list
    this.sequenceTimeout = setTimeout(() => {
      this.playNextInPlaylist(0);
    }, 10000);
  }

  private playNextInPlaylist(index: number) {
    if (this.currentSequenceAudio) this.currentSequenceAudio.pause();

    // Dùng modulo (%) để tự động quay lại vòng lặp bài đầu tiên khi hết list
    const safeIndex = index % this.rainbowPlaylist.length;
    const nextAudio = this.rainbowPlaylist[safeIndex];

    nextAudio.currentTime = 0;
    nextAudio.play().catch(() => {});
    this.currentSequenceAudio = nextAudio;

    // Tiếp tục hẹn giờ 10 giây cho bài tiếp theo
    this.sequenceTimeout = setTimeout(() => {
      this.playNextInPlaylist(safeIndex + 1);
    }, 10000);
  }

  stopSequence() {
    // RẤT QUAN TRỌNG: Xóa bộ đếm giờ nếu người chơi chết
    if (this.sequenceTimeout) {
      clearTimeout(this.sequenceTimeout);
      this.sequenceTimeout = null;
    }
    if (this.currentSequenceAudio) {
      this.currentSequenceAudio.pause();
      this.currentSequenceAudio = null;
    }
    this.rainbowFirst.pause();
  }
}

export const audio = new AudioManager();