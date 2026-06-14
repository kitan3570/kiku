/**
 * 浏览器原生 Web Speech API — 日语朗读
 *
 * 用法：
 *   import { playJapaneseSpeech } from "../utils/tts";
 *   playJapaneseSpeech("食べる");
 */

/** 播放日语文本。若当前正在播放则先取消 */
export function playJapaneseSpeech(text: string): void {
  const synth = window.speechSynthesis;

  // 如果正在播放或暂停，先清空队列
  if (synth.speaking || synth.pending) {
    synth.cancel();
  }

  // 短延时确保 cancel 生效（部分浏览器需要）
  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.9;   // 稍慢一点，更清晰
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    synth.speak(utterance);
  }, 50);
}
