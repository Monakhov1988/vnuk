import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const BLUE = "#3b82f6";
const DARK_BLUE = "#1e3a5f";
const LIGHT_BLUE = "#dbeafe";
const DARK = "#1e293b";
const GRAY = "#64748b";
const WHITE = "#ffffff";
const ORANGE = "#f97316";

const FONT_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";
const FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";
const FONT_SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf";
const FONT_SERIF_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const doc = new PDFDocument({
  size: "A4",
  margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
  info: {
    Title: "Внучок — AI-помощник для ваших родителей",
    Author: "Внучок",
    Subject: "Презентация продукта",
  },
});

const outputPath = path.join(process.cwd(), "client", "public", "vnuchok-presentation.pdf");
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

function drawPageBackground(color: string = WHITE) {
  doc.save();
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill(color);
  doc.restore();
}

function drawAccentBar(y: number, width: number = 60, color: string = BLUE) {
  doc.save();
  doc.rect(MARGIN, y, width, 4).fill(color);
  doc.restore();
}

function drawBullet(x: number, y: number, emoji: string, title: string, description: string) {
  doc.font(FONT_REGULAR).fontSize(14).fillColor(DARK);
  doc.text(emoji, x, y, { width: 30 });
  doc.font(FONT_BOLD).fontSize(12).fillColor(DARK);
  doc.text(title, x + 30, y, { width: CONTENT_WIDTH - 30 });
  const titleHeight = doc.heightOfString(title, { width: CONTENT_WIDTH - 30 });
  doc.font(FONT_REGULAR).fontSize(10.5).fillColor(GRAY);
  doc.text(description, x + 30, y + titleHeight + 2, { width: CONTENT_WIDTH - 30 });
  const descHeight = doc.heightOfString(description, { width: CONTENT_WIDTH - 30 });
  return titleHeight + descHeight + 12;
}

function drawStep(x: number, y: number, number: string, text: string) {
  doc.save();
  doc.circle(x + 16, y + 16, 16).fill(BLUE);
  doc.font(FONT_BOLD).fontSize(14).fillColor(WHITE);
  doc.text(number, x + 6, y + 6, { width: 20, align: "center" });
  doc.restore();

  doc.font(FONT_REGULAR).fontSize(12).fillColor(DARK);
  doc.text(text, x + 44, y + 4, { width: CONTENT_WIDTH - 54 });
  const h = doc.heightOfString(text, { width: CONTENT_WIDTH - 54 });
  return Math.max(40, h + 16);
}

// =================== PAGE 1: COVER ===================
drawPageBackground(DARK_BLUE);

doc.save();
doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill(DARK_BLUE);
doc.restore();

doc.save();
doc.circle(PAGE_WIDTH - 80, 120, 200).fill("#2a4f7f");
doc.circle(80, PAGE_HEIGHT - 100, 150).fill("#2a4f7f");
doc.restore();

let y = 240;
doc.font(FONT_SERIF_BOLD).fontSize(42).fillColor(WHITE);
doc.text("Внучок", MARGIN, y, { width: CONTENT_WIDTH, align: "center" });

y += 60;
doc.font(FONT_REGULAR).fontSize(16).fillColor(LIGHT_BLUE);
doc.text("AI-помощник для ваших родителей", MARGIN, y, { width: CONTENT_WIDTH, align: "center" });

y += 50;
doc.save();
doc.rect(PAGE_WIDTH / 2 - 30, y, 60, 3).fill(ORANGE);
doc.restore();

y += 30;
doc.font(FONT_SERIF).fontSize(14).fillColor("#b0c4de");
doc.text("Спокойствие для вас.\nЗабота и компаньон для мамы и папы.", MARGIN, y, {
  width: CONTENT_WIDTH,
  align: "center",
  lineGap: 6,
});

y = PAGE_HEIGHT - 100;
doc.font(FONT_REGULAR).fontSize(10).fillColor("#7a99bf");
doc.text("Telegram-бот  •  Голосовые сообщения  •  Веб-дашборд", MARGIN, y, {
  width: CONTENT_WIDTH,
  align: "center",
});

// =================== PAGE 2: PROBLEM ===================
doc.addPage();
drawPageBackground();

y = 60;
doc.font(FONT_SERIF_BOLD).fontSize(28).fillColor(DARK_BLUE);
doc.text("Знакомо?", MARGIN, y, { width: CONTENT_WIDTH });

y += 45;
drawAccentBar(y);
y += 18;

const problems = [
  {
    text: "Мама живёт одна, а вы далеко. Переживаете — всё ли в порядке?",
  },
  {
    text: "Папа забывает принять таблетки. Вы напоминаете по телефону, но не всегда дозваниваетесь.",
  },
  {
    text: "Родителям звонят «из банка» и просят код из СМС. Вы узнаёте об этом постфактум.",
  },
  {
    text: "Мама скучает, ей не с кем поговорить днём. Вы хотите помочь, но работа не отпускает.",
  },
  {
    text: "Показания счётчиков, запись к врачу, давление — всё это сложно для родителей, но важно.",
  },
];

for (const problem of problems) {
  doc.font(FONT_REGULAR).fontSize(13).fillColor(DARK);
  const bullet = "   •   ";
  doc.text(bullet + problem.text, MARGIN, y, {
    width: CONTENT_WIDTH,
    lineGap: 3,
  });
  y += doc.heightOfString(bullet + problem.text, { width: CONTENT_WIDTH }) + 14;
}

y += 20;
doc.save();
doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 80, 8).fill("#fef3c7");
doc.restore();
doc.font(FONT_SERIF).fontSize(14).fillColor("#92400e");
doc.text(
  "Вы хотите быть рядом, даже когда это невозможно.\nВнучок поможет.",
  MARGIN + 20,
  y + 22,
  { width: CONTENT_WIDTH - 40, align: "center", lineGap: 6 }
);

// =================== PAGE 3: SOLUTION ===================
doc.addPage();
drawPageBackground();

y = 60;
doc.font(FONT_SERIF_BOLD).fontSize(28).fillColor(DARK_BLUE);
doc.text("Что такое Внучок?", MARGIN, y, { width: CONTENT_WIDTH });

y += 45;
drawAccentBar(y);
y += 18;

doc.font(FONT_REGULAR).fontSize(13).fillColor(DARK);
doc.text(
  "Внучок — это умный AI-помощник в Telegram, который общается с вашими родителями как заботливый внук. Он доступен 24/7, понимает голосовые сообщения и всегда терпелив.",
  MARGIN,
  y,
  { width: CONTENT_WIDTH, lineGap: 4 }
);

y += 70;

const solutionPoints = [
  ["Для родителя (65+)", "Компаньон, который всегда на связи. Напомнит про лекарства, подскажет рецепт, расскажет погоду, поддержит разговор. Простой интерфейс — просто пишите в Telegram как обычному человеку."],
  ["Для вас (35-50)", "Спокойствие и контроль. Видите, принял ли мама таблетки. Получаете алерт, если что-то не так. Не нужно звонить 5 раз в день — Внучок рядом."],
  ["Голосовые сообщения", "Родителям не нужно печатать — достаточно отправить голосовое. Внучок поймёт и ответит тоже голосом. Как разговор с настоящим внуком."],
];

for (const [title, desc] of solutionPoints) {
  doc.save();
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 90, 6).lineWidth(1).stroke(LIGHT_BLUE);
  doc.restore();

  doc.font(FONT_BOLD).fontSize(13).fillColor(BLUE);
  doc.text(title, MARGIN + 16, y + 14, { width: CONTENT_WIDTH - 32 });

  doc.font(FONT_REGULAR).fontSize(11).fillColor(GRAY);
  doc.text(desc, MARGIN + 16, y + 32, { width: CONTENT_WIDTH - 32, lineGap: 2 });

  y += 100;
}

// =================== PAGE 4: FEATURES (part 1) ===================
doc.addPage();
drawPageBackground();

y = 60;
doc.font(FONT_SERIF_BOLD).fontSize(28).fillColor(DARK_BLUE);
doc.text("Возможности", MARGIN, y, { width: CONTENT_WIDTH });

y += 45;
drawAccentBar(y);
y += 18;

const features1 = [
  ["💊", "Напоминания о лекарствах", "Настройте расписание — Внучок напомнит вовремя. Если лекарство не принято — сообщит вам."],
  ["❤️", "Дневник давления", "Родитель говорит цифры — Внучок записывает. Вы видите график в личном кабинете."],
  ["🍳", "Рецепты и кулинария", "«Как приготовить борщ?» — Внучок подберёт пошаговый рецепт, адаптированный для простой кухни."],
  ["🌤", "Погода и советы по одежде", "Подскажет погоду и что надеть: «Сегодня +5, надень тёплую куртку и шапку!»"],
  ["🛡", "Защита от мошенников", "Если родителю позвонят из «банка» — Внучок немедленно скажет: «Стоп! Это мошенники!» и предупредит вас."],
];

for (const [emoji, title, desc] of features1) {
  const h = drawBullet(MARGIN, y, emoji, title, desc);
  y += h + 4;
}

// =================== PAGE 5: FEATURES (part 2) ===================
doc.addPage();
drawPageBackground();

y = 60;
doc.font(FONT_SERIF_BOLD).fontSize(28).fillColor(DARK_BLUE);
doc.text("Ещё возможности", MARGIN, y, { width: CONTENT_WIDTH });

y += 45;
drawAccentBar(y);
y += 18;

const features2 = [
  ["📸", "Показания счётчиков по фото", "Сфотографируйте счётчик — Внучок распознает цифры и запишет показания."],
  ["🎭", "Развлечения", "Загадки, стихи, открытки, молитвы, истории — Внучок не даст скучать."],
  ["📖", "Книга жизни", "Внучок расспрашивает о прошлом и записывает воспоминания. Бесценная семейная история."],
  ["🚨", "Экстренные алерты", "Если родитель говорит «мне плохо» или «пахнет газом» — вы получите мгновенное уведомление."],
  ["🧠", "Память", "Внучок запоминает имена внуков, привычки, любимые блюда — и использует в разговоре."],
  ["🔍", "Поиск информации", "Расписание поликлиники, пенсионные вопросы, новости — Внучок найдёт и объяснит простым языком."],
];

for (const [emoji, title, desc] of features2) {
  const h = drawBullet(MARGIN, y, emoji, title, desc);
  y += h + 4;
}

// =================== PAGE 6: HOW IT WORKS ===================
doc.addPage();
drawPageBackground();

y = 60;
doc.font(FONT_SERIF_BOLD).fontSize(28).fillColor(DARK_BLUE);
doc.text("Как это работает", MARGIN, y, { width: CONTENT_WIDTH });

y += 45;
drawAccentBar(y);
y += 18;

doc.font(FONT_REGULAR).fontSize(12).fillColor(GRAY);
doc.text("Простая схема: три участника, одна цель — забота.", MARGIN, y, { width: CONTENT_WIDTH });
y += 30;

const participants = [
  {
    title: "Родитель",
    subtitle: "Общается в Telegram",
    desc: "Пишет или говорит голосом. Получает напоминания, советы, рецепты. Просто, как переписка с внуком.",
    color: BLUE,
  },
  {
    title: "Внучок (AI)",
    subtitle: "Работает 24/7",
    desc: "Понимает русскую речь, помнит контекст, заботится. Определяет опасность и мгновенно реагирует.",
    color: ORANGE,
  },
  {
    title: "Вы (ребёнок)",
    subtitle: "Видите дашборд",
    desc: "Статус лекарств, график давления, лента событий. Получаете алерты, если что-то не так. Управляете напоминаниями.",
    color: "#10b981",
  },
];

for (const p of participants) {
  doc.save();
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 85, 6).fill("#f8fafc");
  doc.rect(MARGIN, y, 5, 85).fill(p.color);
  doc.restore();

  doc.font(FONT_BOLD).fontSize(14).fillColor(DARK);
  doc.text(p.title, MARGIN + 18, y + 12, { width: CONTENT_WIDTH - 36 });

  doc.font(FONT_REGULAR).fontSize(10).fillColor(p.color);
  doc.text(p.subtitle, MARGIN + 18, y + 30, { width: CONTENT_WIDTH - 36 });

  doc.font(FONT_REGULAR).fontSize(11).fillColor(GRAY);
  doc.text(p.desc, MARGIN + 18, y + 46, { width: CONTENT_WIDTH - 36, lineGap: 2 });

  y += 95;
}

y += 20;
doc.save();
doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 50, 6).fill(LIGHT_BLUE);
doc.restore();
doc.font(FONT_SERIF).fontSize(12).fillColor(DARK_BLUE);
doc.text(
  "Родитель общается — вы спокойны. Всё автоматически.",
  MARGIN + 16,
  y + 16,
  { width: CONTENT_WIDTH - 32, align: "center" }
);

// =================== PAGE 7: HOW TO CONNECT ===================
doc.addPage();
drawPageBackground();

y = 60;
doc.font(FONT_SERIF_BOLD).fontSize(28).fillColor(DARK_BLUE);
doc.text("Как подключиться", MARGIN, y, { width: CONTENT_WIDTH });

y += 45;
drawAccentBar(y, 60, ORANGE);
y += 18;

doc.font(FONT_BOLD).fontSize(14).fillColor(DARK);
doc.text("Для родителя (через Telegram):", MARGIN, y, { width: CONTENT_WIDTH });
y += 28;

const steps = [
  "Откройте Telegram на телефоне",
  "Найдите бота по имени (ссылку даст ваш ребёнок)",
  'Нажмите кнопку "Начать" или напишите  /start',
  "Напишите  /register  и своё имя.\nНапример:  /register Мария",
  "Готово! Можно общаться — пишите или отправляйте голосовые!",
];

for (let i = 0; i < steps.length; i++) {
  const h = drawStep(MARGIN, y, String(i + 1), steps[i]);
  y += h + 8;
}

y += 20;
doc.save();
doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 100, 6).fill("#f0fdf4");
doc.restore();

doc.font(FONT_BOLD).fontSize(12).fillColor("#166534");
doc.text("Привязка к ребёнку (необязательно на тесте):", MARGIN + 16, y + 12, { width: CONTENT_WIDTH - 32 });
doc.font(FONT_REGULAR).fontSize(11).fillColor("#15803d");
doc.text(
  "После регистрации бот покажет код привязки (6 символов). Ребёнок вводит этот код в веб-дашборде — и видит статус родителя, получает алерты.",
  MARGIN + 16,
  y + 32,
  { width: CONTENT_WIDTH - 32, lineGap: 3 }
);

y += 120;
doc.font(FONT_BOLD).fontSize(13).fillColor(DARK);
doc.text("Что попробовать:", MARGIN, y, { width: CONTENT_WIDTH });
y += 22;

const tryList = [
  '"Привет!" — просто поболтать',
  '"Какая погода?" — узнать погоду',
  '"Как приготовить шарлотку?" — получить рецепт',
  '"Загадай загадку" — развлечение',
  'Отправить голосовое сообщение — Внучок ответит голосом',
  'Сфотографировать счётчик — Внучок распознает показания',
];

for (const item of tryList) {
  doc.font(FONT_REGULAR).fontSize(11).fillColor(GRAY);
  doc.text("  •  " + item, MARGIN + 10, y, { width: CONTENT_WIDTH - 20 });
  y += 18;
}

// =================== PAGE 8: SAFETY + CONTACT ===================
doc.addPage();
drawPageBackground();

y = 60;
doc.font(FONT_SERIF_BOLD).fontSize(28).fillColor(DARK_BLUE);
doc.text("Безопасность", MARGIN, y, { width: CONTENT_WIDTH });

y += 45;
drawAccentBar(y);
y += 18;

const safetyPoints = [
  ["Не ставит диагнозов", "Внучок никогда не говорит «у вас инсульт» или «это сердечный приступ». При любых жалобах на здоровье рекомендует обратиться к врачу или звонить 112."],
  ["Защита от мошенников", "Если кто-то просит код из СМС или перевести деньги — Внучок немедленно предупреждает и отправляет алерт ребёнку."],
  ["112 — единый номер", "Во всех экстренных ситуациях Внучок рекомендует 112 — единый номер экстренных служб, работает с любого телефона."],
  ["Данные защищены", "Переписка хранится в защищённой базе данных. Внучок не передаёт данные третьим лицам."],
  ["Не повторяет личные данные", "Номера карт, коды, пароли — Внучок никогда не повторяет их в переписке."],
];

for (const [title, desc] of safetyPoints) {
  doc.font(FONT_BOLD).fontSize(12).fillColor(DARK);
  doc.text("✓  " + title, MARGIN, y, { width: CONTENT_WIDTH });
  const tH = doc.heightOfString("✓  " + title, { width: CONTENT_WIDTH });
  doc.font(FONT_REGULAR).fontSize(10.5).fillColor(GRAY);
  doc.text(desc, MARGIN + 20, y + tH + 2, { width: CONTENT_WIDTH - 20, lineGap: 2 });
  const dH = doc.heightOfString(desc, { width: CONTENT_WIDTH - 20 });
  y += tH + dH + 16;
}

y += 30;

doc.save();
doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 100, 8).fill(DARK_BLUE);
doc.restore();

doc.font(FONT_SERIF_BOLD).fontSize(18).fillColor(WHITE);
doc.text("Обратная связь", MARGIN + 20, y + 16, { width: CONTENT_WIDTH - 40, align: "center" });

doc.font(FONT_REGULAR).fontSize(12).fillColor(LIGHT_BLUE);
doc.text(
  "Это тестовая версия. Нам очень важно ваше мнение!\nНапишите, что понравилось и что можно улучшить.",
  MARGIN + 20,
  y + 44,
  { width: CONTENT_WIDTH - 40, align: "center", lineGap: 4 }
);

doc.end();

stream.on("finish", () => {
  console.log(`PDF created: ${outputPath}`);
  console.log(`Size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);
});
