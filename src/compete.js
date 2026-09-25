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
  if (match.phase === 'podium') return podiumHtml(match);
  if (match.phase === 'review') return reviewHtml(match);
  return lobbyHtml(state, match);
}

function lobbyHtml(state, match) {
  const mode = MODES.find((item) => item.id === match.modeId)?.label || match.modeId;
  const skill = SKILLS.find((item) => item.id === match.skillId)?.name || '';
  const me = match.players.find((player) => player.userId === state.user?.id);
  const pending = match.invites.filter((invite) => invite.status === 'pending');
  const users = (state.users || []).filter((user) => user.id !== state.user?.id && !match.players.some((player) => player.userId === user.id && !player.left));
  return `
    <div class="overlay">
      <div class="sheet match-sheet">
        <p class="eyebrow">Competencia</p>
        <h2>Ronda ${match.round} de ${match.rounds}</h2>
        <p class="hint">${mode} · ${skill} · hasta ${match.seats} jugadores</p>
        <p class="hint">Enlace de invitación</p>
        <div class="invite-link"><code>${matchLink(match.id)}</code><button class="ghost" id="copy-link" type="button">Copiar</button></div>
        <ul class="roster">
          ${match.players.filter((player) => !player.left).map((player) => `
            <li>
              <span>${escapeHtml(player.name)}${player.userId === match.hostId ? ' · anfitrión' : ''}</span>
              <em>${player.ready ? 'Listo' : 'En sala'}</em>
              ${state.user?.id === match.hostId && player.userId !== match.hostId ? `<button class="ghost" data-remove="${player.userId}" type="button">Quitar</button>` : ''}
            </li>
          `).join('')}
          ${pending.map((invite) => `
            <li>
              <span>${escapeHtml(invite.name)}</span>
              <em>Invitado</em>
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
          <button class="primary" id="match-ready" type="button" ${me?.ready ? 'disabled' : ''}>INICIAR JUEGO</button>
          <button class="ghost" id="match-leave" type="button">Salir</button>
        </div>
        <p class="hint">El juego empieza cuando todos los que están en la sala pulsan Iniciar. Si falta un invitado, el anfitrión puede quitar esa invitación.</p>
      </div>
    </div>
  `;
}

function reviewHtml(match) {
  const boards = match.players.filter((player) => !player.left || player.board).map((player) => `
    <article class="mini">
      <header><strong>${escapeHtml(player.name)}</strong><span>${player.roundScore || 0} pts</span></header>
      <ol>
        ${(player.board?.words || []).map((item) => `<li class="${item.struck ? 'struck' : ''}"><span>${item.word}</span><em>${item.struck ? 0 : item.points}</em></li>`).join('') || '<li>Sin palabras</li>'}
      </ol>
    </article>
  `).join('');
  const ranked = [...match.players].filter((player) => !player.left).sort((a, b) => b.total + b.roundScore - (a.total + a.roundScore));
  return `
    <div class="overlay">
      <div class="sheet match-sheet">
        <p class="eyebrow">Fin de la ronda ${match.round}</p>
        <h2>${match.finisher ? `${escapeHtml(match.finisher.name)} terminó primero` : 'Ronda cerrada'}</h2>
        <div class="minis">${boards}</div>
        <ol class="tops">
          ${ranked.map((player, index) => `<li><span>${index + 1}</span><span>${escapeHtml(player.name)}</span><strong>${(player.total || 0) + (player.roundScore || 0)}</strong><em>esta ronda ${player.roundScore || 0}</em></li>`).join('')}
        </ol>
        <div class="sheet-actions">
          <button class="primary" id="match-ready" type="button">SIGUIENTE RONDA</button>
          <button class="ghost" id="match-leave" type="button">Salir</button>
        </div>
        <p class="hint">Las palabras repetidas entre jugadores se tachan y no suman. Todos los que siguen en la partida deben pulsar Siguiente ronda.</p>
      </div>
    </div>
  `;
}

function podiumHtml(match) {
  const top = [...match.players].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name)).slice(0, 3);
  const order = [top[1], top[0], top[2]].filter(Boolean);
  return `
    <div class="overlay">
      <div class="sheet match-sheet podium-sheet">
        <p class="eyebrow">Competencia terminada</p>
        <h2>El podio</h2>
        <div class="podium">
          ${order.map((player) => {
            const place = top.indexOf(player) + 1;
            return `<div class="podium-place place-${place}"><strong>${place}º</strong><span>${escapeHtml(player.name)}</span><em>${player.total}</em></div>`;
          }).join('')}
        </div>
        <button class="primary" id="match-home" type="button">Página principal</button>
      </div>
    </div>
  `;
}

export function historyHtml(rows) {
  if (!rows?.length) return '<p class="hint">Todavía no hay competencias guardadas.</p>';
  return rows.map((match) => {
    const players = match.players || [];
    const winner = players[0];
    const list = players.map((player) => `<li><span>${player.place || ''}</span><span>${escapeHtml(player.name)}</span><strong>${player.total || 0}</strong></li>`).join('');
    return `
      <article class="history-card">
        <h3>${escapeHtml(winner?.name || 'Partida')} · ${winner?.total || 0} pts</h3>
        <p class="hint">${match.rounds || 1} rondas</p>
        <ol class="tops">${list}</ol>
      </article>
    `;
  }).join('');
}

export async function postBoard(state, finish) {
  if (!state.match?.id || !state.game) return;
  const snapshot = state.game.snapshot();
  const response = await fetch(`/api/matches/${state.match.id}/board`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...snapshot, finish }),
  });
  if (response.ok) state.match = await response.json();
}
