const DIALOGUES = [
  {scene:'聊天接话', prompt:'¿Qué tal tu día?', cue:'说今天有点忙，不过一切顺利，再问对方今天怎么样。', reply:'Un poco ajetreado, pero bien. ¿Y el tuyo?', zh:'有点忙，不过还不错。你今天呢？'},
  {scene:'聊天接话', prompt:'Al final no fui al concierto.', cue:'表示意外，再问为什么没去。', reply:'¿Ah, no? ¿Y qué pasó?', zh:'啊，没去吗？怎么回事？'},
  {scene:'聊天接话', prompt:'¿Ya has visto esa serie?', cue:'说看了一点，还没看完。', reply:'He visto un par de episodios, pero todavía no la he terminado.', zh:'我看了两集，不过还没看完。'},
  {scene:'聊天接话', prompt:'Hay un sitio nuevo cerca de aquí.', cue:'表示感兴趣，问对方去过没有。', reply:'¡Ah, qué bien! ¿Ya has ido?', zh:'啊，太好了！你去过了吗？'},
  {scene:'聊天接话', prompt:'¿Qué haces normalmente los domingos?', cue:'说你通常在家休息，有时也出去走走。', reply:'Normalmente descanso en casa, pero a veces salgo a dar una vuelta.', zh:'我通常在家休息，不过有时也出去转转。'},
  {scene:'约见和改时间', prompt:'¿Te apetece quedar esta tarde?', cue:'答应，并问几点方便。', reply:'Sí, me apetece. ¿A qué hora te viene bien?', zh:'好啊。你几点方便？'},
  {scene:'约见和改时间', prompt:'¿Quedamos a las seis?', cue:'说明六点来不及，提议七点见。', reply:'A las seis no me da tiempo. ¿Te va bien a las siete?', zh:'六点我来不及。七点你方便吗？'},
  {scene:'约见和改时间', prompt:'Ya estoy en la entrada. ¿Dónde estás?', cue:'告诉对方你在路上，大概十分钟到。', reply:'Estoy de camino. Llego en unos diez minutos.', zh:'我在路上，大概十分钟到。'},
  {scene:'约见和改时间', prompt:'Al final no puedo ir hoy. Lo siento.', cue:'说没事，问对方明天行不行。', reply:'No pasa nada. ¿Y mañana te viene bien?', zh:'没事。明天你方便吗？'},
  {scene:'约见和改时间', prompt:'¿Te recojo en casa o nos vemos allí?', cue:'说直接在那儿见更方便。', reply:'Mejor nos vemos allí. Me queda cerca.', zh:'还是直接在那儿见吧。离我比较近。'},
  {scene:'电话和消息', prompt:'Hola, ¿tienes un minuto?', cue:'说现在不方便，晚点回电话。', reply:'Ahora no puedo hablar. ¿Te llamo en un rato?', zh:'我现在不方便说话。待会儿给你回电话好吗？'},
  {scene:'电话和消息', prompt:'No encuentro el sitio. ¿Me ayudas?', cue:'说你马上发定位。', reply:'Claro, ahora mismo te mando mi ubicación.', zh:'当然，我现在就把定位发给你。'},
  {scene:'电话和消息', prompt:'¿Has visto el mensaje del grupo?', cue:'说还没看，让对方先说说发生了什么。', reply:'Todavía no. ¿Qué ha pasado?', zh:'还没呢。发生什么了？'},
  {scene:'电话和消息', prompt:'¿Me oyes? Aquí casi no tengo cobertura.', cue:'说听不清，提议先发消息。', reply:'No te oigo bien. Mándame un mensaje y hablamos luego.', zh:'我听不清。你给我发个消息，晚点咱们再聊。'},
  {scene:'帮忙和婉拒', prompt:'¿Te importa si abro la ventana?', cue:'说不介意，你也觉得热。', reply:'No, para nada. Yo también tengo calor.', zh:'完全不介意，我也觉得热。'},
  {scene:'帮忙和婉拒', prompt:'¿Me echas una mano con esto?', cue:'同意帮忙，问需要你做什么。', reply:'Sí, claro. ¿Qué necesitas que haga?', zh:'当然。你需要我做什么？'},
  {scene:'帮忙和婉拒', prompt:'¿Te apuntas a cenar con nosotros?', cue:'礼貌拒绝，说明今天已经有安排，并说下次再约。', reply:'Me encantaría, pero hoy ya tengo planes. ¿La próxima?', zh:'我很想去，不过今天已经有安排了。下次一起？'},
  {scene:'帮忙和婉拒', prompt:'¿Te espero o voy tirando?', cue:'让对方先走，你马上跟上。', reply:'Ve tú, que te alcanzo enseguida.', zh:'你先走，我马上跟上。'},
  {scene:'吃饭和办事', prompt:'¿Para tomar aquí o para llevar?', cue:'说要打包，顺便问能不能刷卡。', reply:'Para llevar, por favor. ¿Puedo pagar con tarjeta?', zh:'麻烦打包。可以刷卡吗？'},
  {scene:'吃饭和办事', prompt:'¿Todo bien? ¿Os traigo algo más?', cue:'说吃得很好，麻烦结账。', reply:'Sí, todo muy bien. ¿Nos traes la cuenta, por favor?', zh:'挺好的。能麻烦你给我们结账吗？'},
  {scene:'吃饭和办事', prompt:'Perdona, ¿eres la última persona de la fila?', cue:'告诉对方是，你也在等结账。', reply:'Sí, estoy esperando para pagar.', zh:'是的，我在排队等结账。'},
  {scene:'吃饭和办事', prompt:'¿Te queda bien esa chaqueta?', cue:'说有点紧，询问有没有大一码的。', reply:'Me queda un poco justa. ¿Hay una talla más grande?', zh:'我穿着有点紧。有大一码的吗？'},
  {scene:'关心和道别', prompt:'Hoy estoy un poco de bajón.', cue:'表示关心，问是不是想聊聊。', reply:'Vaya, lo siento. ¿Quieres hablar de ello?', zh:'唉，听到这个我很难过。你想聊聊吗？'},
  {scene:'关心和道别', prompt:'Bueno, me tengo que ir ya.', cue:'说很高兴见到对方，请对方到家说一声。', reply:'Me ha encantado verte. Dime algo cuando llegues a casa.', zh:'见到你真开心。到家跟我说一声。'},
];

let replyQueue = DIALOGUES;
let replyIndex = 0;

function initReplies() {
  const select = document.getElementById('replyCategory');
  const categories = ['全部', ...new Set(DIALOGUES.map(dialogue => dialogue.scene))];
  select.replaceChildren(...categories.map(category => new Option(category, category)));
  setReplyCategory(select.value);
}

function setSentencePracticeMode(replies) {
  leavePracticeSection();
  for (const [mode, active] of [['reply', replies], ['sentence', !replies]]) {
    const button = document.getElementById(mode + 'ModeBtn');
    button.setAttribute('aria-pressed', active);
    button.classList.toggle('btn-primary', active);
    button.classList.toggle('btn-outline', !active);
  }
  document.getElementById('replyPractice').hidden = !replies;
  document.getElementById('singleSentencePractice').hidden = replies;
}

function setReplyCategory(category) {
  leavePracticeSection();
  replyQueue = category === '全部' ? DIALOGUES : DIALOGUES.filter(dialogue => dialogue.scene === category);
  replyIndex = 0;
  showReply();
}

function showReply() {
  const item = replyQueue[replyIndex];
  document.getElementById('replyCounter').textContent = `${replyIndex + 1} / ${replyQueue.length}`;
  document.getElementById('replyPromptText').textContent = item.prompt;
  document.getElementById('replyCue').textContent = item.cue;
  document.getElementById('replySpanish').textContent = item.reply;
  document.getElementById('replyChinese').textContent = item.zh;
  document.getElementById('replyTranscript').textContent = '';
  document.getElementById('replyMicBtn').hidden = !supportsRecognition();
  document.getElementById('replyMicHint').textContent = supportsRecognition() ? '' : '可以先直接开口，再查看参考回答。';
  toggleReplyPrompt(false);
  revealReply(false);
}

function toggleReplyPrompt(show = document.getElementById('replyPromptText').hidden) {
  document.getElementById('replyPromptText').hidden = !show;
  const button = document.getElementById('promptTextBtn');
  button.setAttribute('aria-expanded', show);
  button.textContent = show ? '收起原句' : '看原句';
}

function revealReply(show = document.getElementById('replyAnswer').hidden) {
  document.getElementById('replyAnswer').hidden = !show;
  const button = document.getElementById('replyShow');
  button.setAttribute('aria-expanded', show);
  button.textContent = show ? '收起参考回答' : '看参考回答';
}

function moveReply(step) {
  leavePracticeSection();
  replyIndex = (replyIndex + step + replyQueue.length) % replyQueue.length;
  showReply();
}

function playReplyLine(line) {
  const text = replyQueue[replyIndex][line];
  const hint = document.getElementById('replyMicHint');
  hint.textContent = '';
  speak(text, played => {
    if (!played) hint.textContent = line === 'prompt'
      ? '暂时无法播放，点「看原句」继续练习。'
      : '暂时无法播放，可以先朗读上面的参考回答。';
  });
}

function toggleReplyMic() {
  if (isRecording) finishRecording();
  else startRecording('replyResult');
}

function handleReplyResult(result) {
  recordStudyDay();
  saveState();
  document.getElementById('replyTranscript').textContent = '识别到「' + result + '」';
}
