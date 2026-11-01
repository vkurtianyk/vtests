const view = document.getElementById("view");
document.getElementById("title").textContent = LESSON.title;

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const el = (html) => {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};

// ---------- Маршрут: етапи уроку, відповідь спершу вголос, потім відкрити ----------
function renderRoute() {
  view.innerHTML = `<p class="hint">Підказка «6П» — кожен етап на «П». Перед тим як відкрити етап, скажи вголос, що там кажеш і робиш. Потім перевір себе.</p>`;
  LESSON.stages.forEach((s, i) => {
    const card = el(`
      <div class="card">
        <div class="stage-head">
          <div class="num">${i + 1}</div>
          <div>
            <h2>${s.p}</h2>
            <small>${s.official}</small>
            <div class="hook">${s.hook}</div>
          </div>
        </div>
      </div>`);
    card.querySelector(".stage-head").addEventListener("click", () => {
      const open = card.querySelector(".reveal");
      if (open) { open.remove(); return; }
      const r = el(`<div class="reveal"><p class="say">${s.say}</p><p class="do">${s.do}</p></div>`);
      if (i === 1) r.append(typesStrip());
      if (i === 3) r.append(occlusionDemo());
      if (i === 4) r.append(el(`<ol>${LESSON.steps.map((x) => `<li>${x}</li>`).join("")}</ol>`));
      if (i === 5) r.append(el(`<ol>${LESSON.finalQuestions.map((x) => `<li>${x}</li>`).join("")}</ol>`));
      card.append(r);
    });
    view.append(card);
  });
}

function typesStrip() {
  return el(`<div class="opts">${LESSON.types
    .map((t) => `<figure style="margin:0"><img class="types-img" style="max-height:140px" src="${t.img}" alt="${t.name}"><figcaption>${t.name}</figcaption></figure>`)
    .join("")}</div>`);
}

// Інтерактив: тягни ялинку — коли вона заходить на гору, з’являється загороджування.
function occlusionDemo() {
  const box = el(`
    <div class="demo">
      <img class="sample" src="img/sample.jpg" alt="Зразок">
      <p><b>Спробуй сам:</b> посунь ялинку на гору. Що стає ближчим?</p>
      <svg viewBox="0 0 300 180">
        <rect width="300" height="180" fill="#f6c27a"/>
        <circle cx="230" cy="45" r="22" fill="#f28c28"/>
        <polygon points="40,150 140,40 240,150" fill="#6a6bb8"/>
        <polygon points="120,40 140,40 130,30" fill="#fff"/>
        <rect y="140" width="300" height="40" fill="#7cb85a"/>
        <g id="tree">
          <rect x="-5" y="120" width="10" height="30" fill="#6b4226"/>
          <polygon points="-28,128 0,50 28,128" fill="#2f7a3d"/>
        </g>
      </svg>
      <input type="range" min="20" max="280" value="270" aria-label="Положення ялинки">
      <p class="msg"></p>
    </div>`);
  const tree = box.querySelector("#tree");
  const msg = box.querySelector(".msg");
  const input = box.querySelector("input");
  const update = () => {
    const x = Number(input.value);
    tree.setAttribute("transform", `translate(${x},0)`);
    const overlaps = x > 25 && x < 255;
    msg.innerHTML = overlaps
      ? "<b>Загороджування!</b> Ялинка частково закриває гору — тому здається, що вона ближче, а гора далі."
      : "Ялинка нічого не закриває — глибини не видно.";
  };
  input.addEventListener("input", update);
  update();
  return box;
}

// ---------- Картки: активне пригадування, «Ще раз» повертає картку в кінець ----------
function renderCards() {
  const queue = shuffle(LESSON.cards);
  const total = queue.length;
  let known = 0;

  const show = () => {
    if (queue.length === 0) {
      view.innerHTML = `<div class="card flash"><div class="q">Усі ${total} карток пригадано!</div><div class="row" style="justify-content:center"><button class="main">Ще коло</button></div></div>`;
      view.querySelector("button").onclick = renderCards;
      return;
    }
    const c = queue[0];
    view.innerHTML = `
      <div class="progress"><div style="width:${(known / total) * 100}%"></div></div>
      <p class="hint">Відповідай уголос, ніби ти вже в класі. Потім відкрий. Залишилось: ${queue.length}</p>
      <div class="card flash"><div class="q">${c.q}</div><div class="a"></div></div>
      <div class="row"><button class="main" id="open">Відкрити відповідь</button></div>`;
    view.querySelector("#open").onclick = () => {
      view.querySelector(".a").textContent = c.a;
      view.querySelector(".row").innerHTML = `<button class="main" id="yes">Знаю</button><button class="ghost" id="no">Ще раз</button>`;
      view.querySelector("#yes").onclick = () => { queue.shift(); known++; show(); };
      view.querySelector("#no").onclick = () => { queue.push(queue.shift()); show(); };
    };
  };
  show();
}

// ---------- Порядок: натискай пункти в правильній послідовності ----------
function renderOrder() {
  const rounds = [
    { title: "Склади етапи уроку по порядку", items: LESSON.stages.map((s) => s.p) },
    { title: "Склади кроки практичної роботи («від далекого до близького»)", items: LESSON.steps },
  ];
  let r = 0;
  let mistakes = 0;

  const play = () => {
    const { title, items } = rounds[r];
    let next = 0;
    view.innerHTML = `<p class="hint">${title}</p><ul class="placed"></ul><div class="pick"></div>`;
    const placed = view.querySelector(".placed");
    const pick = view.querySelector(".pick");
    shuffle(items).forEach((text) => {
      const b = el(`<button>${text}</button>`);
      b.onclick = () => {
        if (text !== items[next]) {
          mistakes++;
          b.classList.remove("no"); void b.offsetWidth; b.classList.add("no");
          return;
        }
        next++;
        placed.append(el(`<li>${next}. ${text}</li>`));
        b.remove();
        if (next === items.length) finish();
      };
      pick.append(b);
    });
  };

  const finish = () => {
    const last = r === rounds.length - 1;
    const btn = el(`<button class="main">${last ? "Почати знову" : "Далі"}</button>`);
    btn.onclick = last ? renderOrder : () => { r++; play(); };
    view.append(el(`<p><b>Готово!</b> Помилок: ${mistakes}.</p>`), btn);
  };
  play();
}

// ---------- Пейзажі: впізнай вид за картиною ----------
function renderTypes() {
  const order = shuffle(LESSON.types);
  let i = 0;
  const show = () => {
    if (i === order.length) {
      view.innerHTML = `<div class="card flash"><div class="q">Усі чотири види впізнано!</div><p>Гори, Море, Місто, Село.</p><div class="row" style="justify-content:center"><button class="main">Ще раз</button></div></div>`;
      view.querySelector("button").onclick = renderTypes;
      return;
    }
    const t = order[i];
    view.innerHTML = `<p class="hint">Який це вид пейзажу? Саме ці картини ти показуєш дітям на етапі «Пригадуємо».</p>
      <img class="types-img" src="${t.img}" alt="Картина"><div class="opts pick"></div>`;
    const opts = view.querySelector(".opts");
    LESSON.types.forEach((o) => {
      const b = el(`<button>${o.name}</button>`);
      b.onclick = () => {
        if (o.name !== t.name) { b.classList.remove("no"); void b.offsetWidth; b.classList.add("no"); return; }
        b.classList.add("ok");
        setTimeout(() => { i++; show(); }, 600);
      };
      opts.append(b);
    });
  };
  show();
}

// ---------- Шпаргалка: одна сторінка, можна надрукувати ----------
function renderSheet() {
  view.innerHTML = `
    <div class="card sheet">
      <div class="row no-print" style="margin-top:0"><button class="main" onclick="print()">Надрукувати</button></div>
      <h2>${LESSON.title}</h2>
      <p><b>Мета:</b> ${LESSON.goal}<br><b>Обладнання:</b> ${LESSON.equipment}</p>
      <h2>6П — хід уроку</h2>
      <ol>${LESSON.stages.map((s) => `<li><b>${s.p}</b> — ${s.say}</li>`).join("")}</ol>
      <h2>Ключові визначення</h2>
      <ul>
        <li><b>Пейзаж</b> — жанр, у якому зображують природу: гори, ліси, річки, поля та небо.</li>
        <li><b>Види:</b> гірський, морський, міський, сільський.</li>
        <li><b>Загороджування</b> — один предмет частково закриває інший.</li>
        <li><b>Передній план</b> — більше й чіткіше. <b>Задній план</b> — менше, світліше, менше деталей.</li>
      </ul>
      <h2>Практична робота</h2>
      <img class="sample" src="img/sample.jpg" alt="Зразок">
      <ol>${LESSON.steps.map((x) => `<li>${x}</li>`).join("")}</ol>
      <h2>Підсумкові запитання</h2>
      <ol>${LESSON.finalQuestions.map((x) => `<li>${x}</li>`).join("")}</ol>
    </div>`;
}

const tabs = { route: renderRoute, cards: renderCards, order: renderOrder, types: renderTypes, sheet: renderSheet };
document.querySelectorAll("nav button").forEach((b) => {
  b.addEventListener("click", () => {
    document.querySelectorAll("nav button").forEach((x) => x.classList.toggle("active", x === b));
    tabs[b.dataset.tab]();
  });
});
renderRoute();
