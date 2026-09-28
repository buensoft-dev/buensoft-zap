import { MODES, SKILLS } from './game.js';

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

export function matchLink(id) {
  return `${location.origin}/?partida=${id}`;
}

export function matchHtml(state) {
  const match = state.match;
  if (!match) return '';
  if (match.phase === 'podium' || state.viewPodium) return podiumHtml(match);
  if (match.phase === 'review') return reviewHtml(match, state);
  return lobbyHtml(state, match);
}

function lobbyHtml(state, match) {
  const mode = MODES.find((item) => item.id === match.modeId)?.label || match.modeId;
  const skill = SKILLS.find((item) => item.id === match.skillId)?.name || '';
  const me = match.players.find((player) => player.userId === state.user?.id);
  const seated = match.players.filter((player) => !player.left);
  const pending = match.invites.filter((invite) => invite.status === 'pending');
  const host = state.user?.id === match.hostId;
  const users = (state.users || []).filter((user) => user.id !== state.user?.id && !match.players.some((player) => player.userId === user.id && !player.left));
  return `
    <div class="overlay">
      <div class="sheet match-sheet">
        <p class="eyebrow">Competencia</p>
        <h2>Ronda ${match.round} de ${match.rounds}</h2>
        <p class="hint">${mode} · ${skill} · ${seated.length} de ${match.seats} jugadores</p>
        <p class="hint">Enlace de invitación</p>
        <div class="invite-link"><code>${matchLink(match.id)}</code><button class="ghost" id="copy-link" type="button">Copiar</button></div>
        <ul class="roster">
          ${seated.map((player) => `
            <li>
              <span>${escapeHtml(player.name)}${player.userId === match.hostId ? ' · anfitrión' : ''}</span>
              <em>${seatStatus(player, match)}</em>
              ${state.user?.id === match.hostId && player.userId !== match.hostId ? `<button class="ghost" data-remove="${player.userId}" type="button">Quitar</button>` : ''}
            </li>
          `).join('')}
          ${pending.map((invite) => `
            <li>
              <span>${escapeHtml(invite.name)}</span>
              <em>Esperando respuesta</em>
              ${state.user?.id === match.hostId ? `<button class="ghost" data-remove="${invite.userId}" type="button">Quitar</button>` : ''}
            </li>
          `).join('')}
          ${match.invites.filter((invite) => invite.status === 'declined').map((invite) => `
            <li class="invite-no">
              <span>${escapeHtml(invite.name)}</span>
              <em>No quiere jugar</em>
              ${state.user?.id === match.hostId ? `<button class="ghost" data-remove="${invite.userId}" type="button">Quitar</button>` : ''}
            </li>
          `).join('')}
        </ul>
        ${state.user?.id === match.hostId ? `
          <label class="menu-label">Invitar de la lista</label>
          <div class="choices">
            ${users.map((user) => `<button class="choice" data-invite="${escapeHtml(user.id)}" data-name="${escapeHtml(user.name)}" type="button">${escapeHtml(user.name)}</button>`).join('') || '<p class="hint">Aún no hay otros jugadores registrados.</p>'}
          </div>
        ` : ''}
        <div class="sheet-actions">
          ${host ? readyControl('INICIAR PARTIDA', me?.ready, `ESPERANDO JUGADORES ${seated.length}/${match.seats}`) : ''}
          <button class="ghost" id="match-leave" type="button">Salir</button>
        </div>
        <p class="hint">${host ? 'Al pulsar Iniciar partida el botón espera a que se unan los jugadores de la sala. Cuando estén todos, la partida empieza sola.' : 'Aquí ves quién ya está en la sala. Cuando el anfitrión inicie y se complete el grupo, la partida empieza sola.'}</p>
      </div>
    </div>
  `;
}

function withLocalWords(match, state) {
  return match.players.map((player) => {
    if (player.userId !== match.you || !state.game) return player;
    const local = state.game.snapshot();
    if (local.words.length <= (player.board?.words || []).length) return player;
    const words = local.words.map((item) => ({ word: item.word, points: item.points, struck: false }));
    return {
      ...player,
      roundScore: words.reduce((sum, item) => sum + item.points, 0),
      board: { ...(player.board || {}), words, grid: local.grid },
    };
  });
}

function reviewHtml(match, state) {
  const players = withLocalWords(match, state);
  const me = players.find((player) => player.userId === match.you);
  const boards = players.filter((player) => !player.left || player.board).map((player) => `
    <article class="mini">
      <header><strong>${escapeHtml(player.name)}</strong><span>${player.roundScore || 0} pts</span></header>
      <ol>
        ${(player.board?.words || []).map((item) => `<li class="${item.struck ? 'struck' : ''}"><span>${item.word}</span><em>${item.struck ? 0 : item.points}</em></li>`).join('') || '<li>Sin palabras</li>'}
      </ol>
    </article>
  `).join('');
  const ranked = players.filter((player) => !player.left).sort((a, b) => b.total + b.roundScore - (a.total + a.roundScore));
  return `
    <div class="overlay">
      <div class="sheet match-sheet">
        <p class="eyebrow">Fin de la ronda ${match.round}</p>
        <h2>${match.finisher ? `${escapeHtml(match.finisher.name)} terminó primero` : 'Ronda cerrada'}</h2>
        <div class="minis">${boards}</div>
        <ol class="tops">
          ${ranked.map((player, index) => `<li><span>${index + 1}</span><span>${escapeHtml(player.name)}</span><strong>${(player.total || 0) + (player.roundScore || 0)}</strong><em>esta ronda ${player.roundScore || 0}</em></li>`).join('')}
        </ol>
        ${freshMarksHtml(state)}
        <div class="sheet-actions">
          ${match.round >= match.rounds ? `
            <button class="primary" id="match-ready" type="button">VER PODIO</button>
            ${replayControls(match)}
          ` : `
            ${readyControl('SIGUIENTE RONDA', me?.ready)}
          `}
          <button class="ghost" id="match-leave" type="button">Salir</button>
        </div>
        <p class="hint">${match.round >= match.rounds ? 'Puedes ver el podio sin esperar a los demás. Volver a jugar empieza cuando todos los que siguen en la partida lo pulsan.' : 'Las palabras repetidas entre jugadores se tachan y no suman. Si alguien se sale o pasa un minuto sin jugar, los demás pueden seguir. Cuando ya pulsaste, el botón queda en espera.'}</p>
      </div>
    </div>
  `;
}

function readyControl(label, waiting, waitingLabel = 'ESPERANDO A LOS DEMÁS') {
  if (waiting) return `<button class="primary is-waiting" id="match-ready" type="button" disabled>${waitingLabel}</button>`;
  return `<button class="primary" id="match-ready" type="button">${label}</button>`;
}

function seatStatus(player, match) {
  if (player.userId === match.hostId) return player.ready ? 'Listo · esperando' : 'Anfitrión';
  return 'En la sala';
}

function medal(place) {
  const colors = { 1: ['#ffe14a', '#c9892a'], 2: ['#f4f7fb', '#8ea0b5'], 3: ['#e7a06a', '#8a4b24'] };
  const [face, ribbon] = colors[place] || colors[3];
  return `<svg class="medal" viewBox="0 0 80 100" aria-hidden="true"><path d="M24 4h10l6 18 6-18h10l-14 36h-4z" fill="${ribbon}"/><circle cx="40" cy="58" r="24" fill="${face}" stroke="#3a2508" stroke-width="3"/><text x="40" y="66" text-anchor="middle" font-size="22" font-family="Georgia, serif" fill="#3a2508">${place}</text></svg>`;
}

function shownTotal(match, player) {
  if (match.phase === 'podium') return player.total || 0;
  return (player.total || 0) + (player.roundScore || 0);
}

function replayControls(match) {
  const me = match.players.find((player) => player.userId === match.you);
  return `
    <button class="ghost" id="match-replay" type="button" ${me?.replay ? 'disabled' : ''}>VOLVER A JUGAR</button>
    ${me?.replay ? '<p class="hint">Esperando a que los demás pulsen Volver a jugar.</p>' : ''}
  `;
}

function freshMarksHtml(state) {
  const report = state?.marksReport;
  if (!report) return '';
  const bits = [];
  if (report.beaten.combo) bits.push(`combo x${report.current.combo}`);
  if (report.beaten.word) bits.push(report.current.word);
  if (report.beaten.zaps) bits.push(`${report.current.zaps} ZAP`);
  if (!bits.length) return '';
  return `<p class="marks-fresh">Nuevo récord: ${bits.map((item) => escapeHtml(item)).join(' · ')}</p>`;
}

function nearPodium(match) {
  const me = match.players.find((player) => player.userId === match.you);
  if (!me) return 0;
  const ranked = [...match.players].filter((player) => !player.left)
    .sort((a, b) => shownTotal(match, b) - shownTotal(match, a) || a.name.localeCompare(b.name));
  const first = ranked[0];
  if (!first || first.userId === me.userId) return 0;
  const gap = shownTotal(match, first) - shownTotal(match, me);
  return gap > 0 && gap <= 150 ? gap : 0;
}

function podiumHtml(match) {
  const ranked = [...match.players].sort((a, b) => shownTotal(match, b) - shownTotal(match, a) || a.name.localeCompare(b.name));
  const top = ranked.slice(0, 3);
  const order = [top[1], top[0], top[2]].filter(Boolean);
  const gap = nearPodium(match);
  return `
    <div class="overlay">
      <div class="sheet match-sheet podium-sheet">
        <p class="eyebrow">Competencia terminada</p>
        <h2>El podio</h2>
        <div class="podium">
          ${order.map((player) => {
            const place = top.indexOf(player) + 1;
            const label = place === 1 ? '1er lugar' : place === 2 ? '2do lugar' : '3er lugar';
            return `<div class="podium-place place-${place}">${medal(place)}<strong>${label}</strong><span>${escapeHtml(player.name)}</span><em>${shownTotal(match, player)}</em></div>`;
          }).join('')}
        </div>
        ${gap ? `<div class="near-miss"><div><p>Te faltaron</p><strong>${gap}</strong></div>${replayControls(match)}</div>` : ''}
        <div class="sheet-actions">
          ${gap ? '' : replayControls(match)}
          <button class="primary" id="match-home" type="button">Página principal</button>
        </div>
      </div>
    </div>
  `;
}

function historyTitle(match) {
  const rounds = Number(match.rounds) || 1;
  const players = match.players?.length || 0;
  const mode = match.modeId === 'en-es' ? 'Inglés-Español' : 'Español-Inglés';
  const skill = SKILLS.find((item) => item.id === Number(match.skillId))?.name || 'Principiante';
  const date = new Date(match.playedAt || Date.now());
  const stamp = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  return `${rounds} ${rounds === 1 ? 'Ronda' : 'Rondas'} - ${players} jugadores - ${mode} - ${skill} - ${stamp}`;
}

export function historyHtml(rows) {
  if (!rows?.length) return '<p class="hint">Todavía no hay competencias guardadas.</p>';
  return rows.map((match, index) => {
    const top = (match.players || []).slice(0, 3);
    const places = top.map((player, place) => `<li><span>${place + 1}</span><span>${escapeHtml(player.name)}</span><strong>${player.total || 0}</strong></li>`).join('');
    return `
      <details class="history-card" ${index === 0 ? 'open' : ''}>
        <summary>${escapeHtml(historyTitle(match))}</summary>
        <ol class="tops">${places}</ol>
      </details>
    `;
  }).join('');
}

let boardPost = 0;

export async function postBoard(state, finish) {
  if (!state.match?.id || !state.game) return;
  const ticket = ++boardPost;
  const snapshot = state.game.snapshot();
  const response = await fetch(`/api/matches/${state.match.id}/board`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...snapshot, finish }),
  });
  if (!response.ok || ticket !== boardPost) return;
  state.match = await response.json();
  state.matchStamp = JSON.stringify(state.match);
}
