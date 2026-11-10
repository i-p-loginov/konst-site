/*
 * Генератор паттернов страниц темы «Константа».
 *
 * Контент страниц описан здесь как дерево блоков Gutenberg и сериализуется
 * штатным сериализатором @wordpress/blocks — так разметка гарантированно
 * валидна и открывается в редакторе без ошибок «блок повреждён».
 *
 * Запуск:  cd wp-theme/tools && npm install && npm run build
 * Результат: wp-theme/konstanta/patterns/page-*.php
 *
 * Плейсхолдеры в тексте:
 *   {{T}} — URL папки темы (картинки, иконки)
 *   {{H}} — URL главной страницы сайта (ссылки между страницами)
 */
require('global-jsdom/register');
window.matchMedia =
  window.matchMedia ||
  (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
const fs = require('fs');
const path = require('path');

const origError = console.error;
console.error = (...a) => {
  if (String(a[0]).includes('memo:')) return;
  origError(...a);
};
const { registerCoreBlocks } = require('@wordpress/block-library');
const { createBlock: cb, serialize, parse } = require('@wordpress/blocks');
registerCoreBlocks();
const { registerBlockType } = require('@wordpress/blocks');
// динамические блоки темы: на клиенте сохраняют только комментарий
for (const n of ['konstanta/branch-map', 'konstanta/request-form']) {
  registerBlockType(n, { apiVersion: 3, title: n, category: 'widgets', attributes: {}, edit: () => null, save: () => null });
}

/* ---------- helpers ---------- */
const cls = (...c) => c.filter(Boolean).join(' ');
const group = (className, inner, tagName = 'div', extra = {}) =>
  cb('core/group', { tagName, className, layout: { type: 'default' }, ...extra }, inner);
const section = (className, inner, extra = {}) => group(className, inner, 'section', extra);
const container = (inner, more) => group(cls('container', more), inner);
const p = (content, className) => cb('core/paragraph', { content, className });
const h = (level, content, className) => cb('core/heading', { level, content, className });
const btn = (text, url, style = 'primary', extra = {}) =>
  cb('core/button', { text, url, className: `is-style-${style}`, ...extra });
const buttons = (items, className) =>
  cb('core/buttons', { className: cls('btn-group', className) }, items);
const list = (items, className) =>
  cb('core/list', { className }, items.map((t) => cb('core/list-item', { content: t })));
const img = (url, alt, className, extra = {}) =>
  cb('core/image', { url, alt, className, ...extra });
const H = (slug) => `{{H}}${slug ? slug + '/' : ''}`;
const T = (rel) => `{{T}}/assets/${rel}`;

const pageHero = (crumb, title, lead) =>
  section('page-hero', [
    container([
      p(`<a href="${H()}">Главная</a> / ${crumb}`, 'breadcrumb'),
      h(1, title),
      p(lead),
    ]),
  ]);

const header = (eyebrow, title, lead, centered) =>
  group(cls('section-header', centered && 'centered', 'reveal'), [
    eyebrow && p(eyebrow, 'section-eyebrow'),
    h(2, title),
    lead && p(lead, 'section-lead'),
  ].filter(Boolean));

const card = (num, title, items, image, light) =>
  group(cls('service-card', light && 'service-card-light', 'reveal'), [
    image && img(T(image[0]), image[1], 'service-media'),
    group('service-card-body', [p(num, 'service-num'), h(3, title), list(items)]),
  ].filter(Boolean), 'article');

const ctaBand = (title, text, btnList) =>
  group('cta-band reveal', [
    group('', [h(2, title), p(text)]),
    buttons(btnList, 'cta-band-actions'),
  ]);

const visualBand = (image, title, text, btnList) =>
  section('visual-band reveal', [
    group('visual-band-inner', [h(2, title), p(text), buttons(btnList)]),
  ], { style: { background: { backgroundImage: { url: T(image), source: 'file' }, backgroundSize: 'cover', backgroundPosition: '50% 50%' } } });

/* ---------- общие данные ---------- */
const DIRECTIONS = [
  ['01', 'Проверки коммерческих приборов учёта', [
    'Работаем по агентскому договору с АО «ЛОЭСК»',
    'Проводим плановые и внеплановые проверки приборов учёта у потребителей',
    'Оформляем результаты проверок и взаимодействуем с потребителями по их итогам',
  ], ['images/service-docs.jpg', 'Оформление результатов проверки прибора учёта']],
  ['02', 'Эксплуатация интеллектуальных приборов учёта', [
    'Обслуживаем интеллектуальные приборы учёта АО «ЛОЭСК»',
    'Обеспечиваем их работоспособность и передачу показаний',
    'Устраняем неисправности и заменяем вышедшее из строя оборудование',
  ], ['images/service-meter.jpg', 'Интеллектуальные приборы учёта']],
  ['03', 'Учёт на «верхней границе» (АИИС КУЭ)', [
    'Эксплуатируем приборы учёта на границах с сетями смежных субъектов рынка',
    'Поддерживаем работу автоматизированной информационно-измерительной системы коммерческого учёта электроэнергии',
    'Обеспечиваем достоверность данных для расчётов за электроэнергию',
  ], ['images/service-power.jpg', 'Электрооборудование подстанции']],
  ['04', 'Установка приборов учёта', [
    'Устанавливаем приборы учёта при технологическом присоединении',
    'Выполняем работы по инвестиционным программам АО «ЛОЭСК» и АО «РЭС»',
    'Вводим приборы в эксплуатацию и подключаем к системе учёта',
  ], ['images/service-connect.jpg', 'Линии электропередачи']],
];
const directionsGrid = (light) =>
  group('services-grid', DIRECTIONS.map(([n, t, i, im]) => card(n, t, i, im, light)));

const PRIVATE = [
  ['05', 'Подготовка документов и подача заявок', [
    'Разъясняем, какие документы нужны и как их правильно заполнить',
    'Проверяем комплект и подаём заявку в сетевую организацию',
    'Объясняем нюансы увеличения мощности именно для вашего объекта',
  ]],
  ['06', 'Технологическое присоединение', [
    'Сопровождаем все этапы до фактического включения',
    'Выполняем технические условия в границах ответственности клиента',
    'Устанавливаем и вводим в эксплуатацию прибор учёта',
  ]],
  ['07', 'Увеличение электрической мощности', [
    'Анализируем текущую схему и потребность в мощности',
    'Готовим решение «от заявки до договора энергоснабжения»',
    'Работаем с категориями надёжности 1, 2 и 3',
  ]],
  ['08', 'Замена счётчиков на интеллектуальные', [
    'Открываем доступ к ночному тарифу и экономии',
    'Показания передаются автоматически — без ручных съёмов',
    'Снижаем риск ошибок и споров по учёту',
  ]],
];

const REQ = 'ИНН 5190174883 · КПП 781301001 · ОГРН 1075190021884';
const ADDR = '197110, г. Санкт-Петербург, наб. Песочная, д. 42, литера А, помещ. 3-Н';
const CEO = 'Приходько Денис Юрьевич';

/* ---------- страницы ---------- */
const pages = {};

pages.home = {
  title: 'Главная', slug: 'glavnaya',
  blocks: [
    section('hero', [
      group('hero-inner', [
        p('Официальный партнёр АО «ЛОЭСК»', 'hero-partner'),
        h(1, 'Константа', 'hero-brand'),
        p('Энергосервис и учёт электроэнергии', 'hero-slogan-bar'),
        p('Проверяем, обслуживаем и устанавливаем приборы учёта электроэнергии у потребителей, присоединённых к сетям АО «ЛОЭСК». Подразделения — по всей Ленинградской области.', 'hero-lead'),
        buttons([btn('Получить консультацию', H('kontakty')), btn('Направления работы', H('uslugi'), 'line-light')]),
      ]),
    ]),
    section('section', [
      container([
        group('partner-strip reveal', [
          p('Работаем от лица', 'partner-label'),
          p('АО «ЛОЭСК»', 'partner-name'),
          p('Взаимодействуем с потребителями и смежными субъектами рынка от лица Ленинградской областной электросетевой компании по вопросам учёта электроэнергии.', 'partner-text'),
        ]),
      ]),
    ]),
    section('section section-primary', [
      container([
        header('Направления работы', '<span class="section-title-accent">Учёт электроэнергии от лица АО «ЛОЭСК»</span>',
          'Взаимодействуем с потребителями и смежными субъектами рынка по всем вопросам, связанным с учётом электроэнергии, в рамках четырёх договоров.'),
        directionsGrid(false),
        buttons([btn('Подробнее о направлениях', H('uslugi'))], 'reveal mt-lg'),
      ]),
    ]),
    section('section section-surface', [
      container([
        header('Частным клиентам', 'Владельцам загородных домов',
          'Помогаем подключить дом или увеличить мощность. Чтобы получить электроэнергию, нужно пройти три этапа — можно самостоятельно, а можно поручить процесс нам под ключ.'),
        group('steps', [
          ['step-1.svg', 'Подать заявку', 'Обратиться в сетевую организацию и корректно оформить комплект документов.'],
          ['step-2.svg', 'Оплатить мощность', 'Внести плату за запрашиваемую мощность согласно условиям сетевой компании.'],
          ['step-3.svg', 'Выполнить ТУ', 'Исполнить технические условия в границах своей ответственности и получить электроэнергию.'],
        ].map(([ic, t, d]) => group('step reveal', [img(T('icons/' + ic), '', 'step-icon'), h(3, t), p(d)], 'article'))),
        p('Самостоятельно — бесплатно через сетевую организацию. С <strong>КОНСТАНТОЙ</strong> — быстрее и спокойнее: берём на себя документы, взаимодействие с сетевой организацией и работы.', 'muted-note reveal mt-lg'),
        buttons([btn('Доверить нам под ключ', H('kontakty'), 'secondary')], 'reveal mt-md'),
      ]),
    ]),
    visualBand('images/band-house.jpg', 'Для владельцев загородных домов',
      'Подключаем участки и увеличиваем мощность без лишней волокиты — с понятным планом и сопровождением до включения.',
      [btn('Обсудить объект', H('kontakty'))]),
    section('section', [
      container([
        ctaBand('Работаем по Ленинградской области',
          'Подразделения Общества представлены по всей области — это позволяет оперативно выезжать и выполнять работы по запросу. Выберите ваше отделение на карте.',
          [btn('Открыть карту', H('geografiya')), btn('Связаться с нами', H('kontakty'), 'line-light')]),
      ]),
    ]),
    section('section section-surface', [
      container([
        header('Почему мы', 'Прозрачно, по правилам, до результата',
          'Знаем регламенты сетевой организации изнутри, работаем строго по договорам с АО «ЛОЭСК» и действующему законодательству — без «серых» схем.', true),
        buttons([btn('О компании', H('o-kompanii'), 'secondary'), btn('Оставить заявку', H('kontakty'), 'line')], 'reveal is-centered'),
      ]),
    ]),
  ],
};

pages.uslugi = {
  title: 'Услуги', slug: 'uslugi',
  blocks: [
    pageHero('Услуги', 'Услуги', 'Проверки, эксплуатация и установка приборов учёта электроэнергии по договорам с АО «ЛОЭСК», а также подключение и увеличение мощности для частных клиентов.'),
    section('section', [
      container([
        header('По договорам с АО «ЛОЭСК»', 'Энергосервис и учёт электроэнергии',
          'Основная задача Общества — взаимодействие с потребителями и смежными субъектами рынка от лица АО «ЛОЭСК» по всем вопросам, связанным с учётом электроэнергии.'),
        directionsGrid(true),
      ]),
    ]),
    section('section section-surface', [
      container([
        header('Частным клиентам', 'Подключение и увеличение мощности под ключ',
          'Помогаем владельцам домов и бизнесу пройти технологическое присоединение без лишней волокиты.'),
        group('services-grid', PRIVATE.map(([n, t, i]) => card(n, t, i, null, true))),
      ]),
    ]),
    section('section', [
      container([
        header('Для сотрудников и кандидатов', 'Результаты специальной оценки условий труда',
          'ООО «Константа» проводит СОУТ рабочих мест в соответствии с законодательством РФ и публикует сводные результаты.'),
        buttons([btn('Смотреть результаты СОУТ', H('sout'), 'secondary')], 'reveal'),
      ]),
    ]),
    section('section', [
      container([
        ctaBand('Не знаете, с чего начать?',
          'Оставьте заявку — по вопросам учёта, проверки прибора или подключения объекта. Разберём ситуацию и предложим понятный план действий.',
          [btn('Получить консультацию', H('kontakty'))]),
      ]),
    ]),
  ],
};

pages.about = {
  title: 'О компании', slug: 'o-kompanii',
  blocks: [
    pageHero('О компании', 'О компании', 'Энергосервисная компания, работающая с потребителями от лица АО «ЛОЭСК» по вопросам учёта электроэнергии.'),
    section('section', [
      group('container about-split', [
        group('prose reveal', [
          h(2, 'Энергосервис и учёт электроэнергии'),
          p('ООО «Константа» — энергосервисная компания, оказывающая комплекс услуг, связанных с проверками, эксплуатацией и установкой систем учёта электрической энергии потребителей, присоединённых к распределительным сетям АО «ЛОЭСК».'),
          p('Основная задача Общества — взаимодействие с потребителями и смежными субъектами рынка от лица АО «ЛОЭСК» по всем вопросам, связанным с учётом электроэнергии. Подразделения Общества представлены на территории всей Ленинградской области, что позволяет оперативно реагировать и выполнять работы по запросу заказчика в рамках:'),
          list([
            'агентского договора — взаимодействие с потребителями по проверкам коммерческих приборов учёта;',
            'договора эксплуатации интеллектуальных приборов учёта АО «ЛОЭСК»;',
            'договора эксплуатации приборов учёта на «верхней границе» (система АИИС КУЭ);',
            'договора на установку приборов учёта в рамках технологического присоединения и инвестиционных программ АО «ЛОЭСК» и АО «РЭС».',
          ], 'feature-list'),
          p('Кроме того, помогаем владельцам домов и бизнесу с подключением к электросетям и увеличением мощности под ключ.'),
          h(2, 'Реквизиты'),
          p(`Полное наименование: Общество с ограниченной ответственностью «Константа».<br>${REQ}<br>Юридический адрес: ${ADDR}<br>Генеральный директор: ${CEO}`),
          h(2, 'Официальный партнёр АО «ЛОЭСК»'),
          p('Работаем от лица Ленинградской областной электросетевой компании на основании заключённых договоров. Это обязывает нас к высокому качеству работ, соблюдению регламентов и прозрачности для потребителей.'),
          h(2, 'Наш подход'),
          list([
            'Оперативно выезжаем: подразделения работают по всей Ленинградской области',
            'Действуем строго в рамках договоров и регламентов АО «ЛОЭСК»',
            'Корректно оформляем результаты проверок и работ',
            'Добиваемся достоверного учёта — в интересах и потребителя, и сетевой компании',
          ], 'feature-list'),
        ]),
        img(T('images/ev-charge.jpg'), 'Современное энергоснабжение', 'about-photo reveal'),
      ]),
    ]),
    visualBand('images/about-handshake.jpg', 'Надёжный партнёр сетевой компании и потребителей',
      'Отвечаем за учёт электроэнергии на всей территории области — от проверки счётчика до работы системы АИИС КУЭ.',
      [btn('Оставить заявку', H('kontakty'))]),
    section('section section-surface', [
      container([
        header('Документы и карьера', 'Открытость для сотрудников и кандидатов',
          'Публикуем результаты специальной оценки условий труда и актуальные вакансии.'),
        buttons([btn('Результаты СОУТ', H('sout'), 'secondary'), btn('Вакансии на hh.ru', H('vakansii'), 'line')], 'reveal'),
      ]),
    ]),
    section('section', [
      container([
        ctaBand('Есть вопрос по учёту или подключению?',
          'Опишите ситуацию и укажите адрес объекта — свяжемся и подскажем, что делать дальше.',
          [btn('Связаться', H('kontakty')), btn('Зона присутствия', H('geografiya'), 'line-light')]),
      ]),
    ]),
  ],
};

pages.geo = {
  title: 'География', slug: 'geografiya',
  blocks: [
    pageHero('География', 'География присутствия', 'Зона покрытия ООО «Константа» — отделения и участки по утверждённой структуре Общества. Выберите отделение на карте или в списке.'),
    section('section', [
      container([
        cb('konstanta/branch-map', {}),
        p('Карта схематическая. Участки показаны в составе головного отделения и визуально выделены на карте и в списке. Приозерского, Подпорожского и Ломоносовского отделений в зоне покрытия нет.', 'muted-note small reveal mt-md'),
      ]),
    ]),
  ],
};

pages.jobs = {
  title: 'Вакансии', slug: 'vakansii',
  blocks: [
    pageHero('Вакансии', 'Вакансии', 'Присоединяйтесь к команде ООО «Константа» — работаем в зоне электросетевого комплекса Ленинградской области.'),
    section('section', [
      container([
        ctaBand('Актуальные вакансии на hh.ru',
          'Открытые позиции публикуем на официальной странице работодателя HeadHunter. Следите за обновлениями и откликайтесь напрямую на hh.ru.',
          [btn('Открыть вакансии на hh.ru', 'https://hh.ru/search/vacancy?text=%D0%9E%D0%9E%D0%9E+%22%D0%9A%D0%BE%D0%BD%D1%81%D1%82%D0%B0%D0%BD%D1%82%D0%B0%22&area=2', 'primary', { linkTarget: '_blank', rel: 'noopener noreferrer' })]),
        group('prose reveal mt-xl', [
          h(2, 'Кому будет интересно'),
          list([
            'Специалистам технического блока и электромонтажных работ',
            'Контролёрам и специалистам по приборам учёта',
            'Офисным сотрудникам и специалистам сопровождения',
          ], 'feature-list'),
        ]),
      ]),
    ]),
  ],
};

const contact = (label, value, small) =>
  group('contact-card', [p(label, 'contact-label'), p(value, cls('contact-value', small && 'is-small'))]);

pages.contacts = {
  title: 'Контакты', slug: 'kontakty',
  blocks: [
    pageHero('Контакты', 'Контакты', 'Напишите или позвоните — ответим по вопросам учёта электроэнергии, проверки и замены приборов учёта, подключения и увеличения мощности.'),
    section('section', [
      group('container contacts-grid', [
        group('reveal', [
          contact('Организация', 'ООО «Константа»'),
          contact('Юридический адрес', ADDR, true),
          contact('Реквизиты', 'ИНН 5190174883<br>КПП 781301001<br>ОГРН 1075190021884', true),
          contact('Руководитель', CEO, true),
          contact('Регион работы', 'Санкт-Петербург и Ленинградская область'),
          p('Телефон и email для связи уточняются — пока оставьте заявку через форму, мы ответим.', 'muted-note mt-md'),
        ]),
        cb('konstanta/request-form', {}),
      ]),
    ], { anchor: 'zayavka' }),
  ],
};

pages.sout = {
  title: 'Результаты СОУТ', slug: 'sout',
  blocks: [
    pageHero('Результаты СОУТ', 'Результаты специальной оценки условий труда', 'ООО «Константа» публикует сводные данные о проведении специальной оценки условий труда (СОУТ) рабочих мест.'),
    section('section', [
      container([
        p('Специальная оценка условий труда проводится в соответствии с Федеральным законом от 28.12.2013 № 426-ФЗ «О специальной оценке условий труда».'),
        h(2, 'Сводные результаты'),
        cb('core/table', {
          className: 'sout-table',
          head: [{ cells: [{ content: 'Показатель', tag: 'th' }, { content: 'Значение', tag: 'th' }] }],
          body: [
            'Количество рабочих мест, на которых проведена СОУТ',
            'Рабочие места с оптимальными и допустимыми условиями труда (классы 1 и 2)',
            'Рабочие места с вредными и опасными условиями труда (классы 3 и 4)',
          ].map((t) => ({ cells: [{ content: t, tag: 'td' }, { content: 'Уточняется', tag: 'td' }] })),
        }),
        p(`Актуальные сводные ведомости и карты СОУТ будут размещены на этой странице после предоставления документов профильными специалистами. По запросу материалы можно получить через <a href="${H('kontakty')}">форму обратной связи</a>.`, 'muted-note mt-md'),
        buttons([btn('О компании', H('o-kompanii'), 'line'), btn('Связаться', H('kontakty'), 'secondary')], 'mt-md'),
      ], 'legal'),
    ]),
  ],
};

const legal = [
  ['1. Общие положения', [
    'Настоящая Политика определяет порядок обработки и защиты персональных данных пользователей сайта ООО «Константа» (далее — Оператор).',
    `<strong>Оператор:</strong> Общество с ограниченной ответственностью «Константа».<br><strong>ОГРН:</strong> 1075190021884<br><strong>ИНН / КПП:</strong> 5190174883 / 781301001<br><strong>Адрес:</strong> ${ADDR}<br><strong>Генеральный директор:</strong> ${CEO}`,
  ]],
  ['2. Какие данные мы обрабатываем', ['Имя, номер телефона, адрес электронной почты, сведения об объекте и иные данные, которые вы добровольно указываете в форме заявки или при обращении.']],
  ['3. Цели обработки', [['Обработка обращений и заявок', 'Консультирование по услугам Оператора', 'Исполнение договорных обязательств', 'Улучшение работы сайта (в том числе с использованием cookie)']]],
  ['4. Правовые основания', ['Обработка осуществляется на основании согласия субъекта персональных данных и применимого законодательства Российской Федерации, в том числе Федерального закона № 152-ФЗ «О персональных данных».']],
  ['5. Хранение и защита', ['Оператор принимает необходимые организационные и технические меры для защиты персональных данных от неправомерного доступа и раскрытия.']],
  ['6. Права субъекта', ['Вы вправе запросить уточнение, блокирование или уничтожение своих персональных данных, отозвать согласие на обработку, обратившись к Оператору по адресу, указанному в настоящей Политике, или через форму на сайте.']],
  ['7. Cookie', ['Сайт может использовать файлы cookie для обеспечения корректной работы и аналитики. Вы можете ограничить использование cookie в настройках браузера.']],
  ['8. Контакты Оператора', [`ООО «Константа», ${ADDR}. Обращения по вопросам персональных данных принимаются через <a href="${H('kontakty')}">форму на странице контактов</a>.`]],
];
pages.privacy = {
  title: 'Политика обработки персональных данных', slug: 'privacy',
  blocks: [
    pageHero('Политика ПДн', 'Политика обработки персональных данных', 'ООО «Константа» (ИНН 5190174883, ОГРН 1075190021884)'),
    section('section', [
      container(legal.flatMap(([t, parts]) => [h(2, t), ...parts.map((x) => (Array.isArray(x) ? list(x) : p(x)))]), 'legal'),
    ]),
  ],
};

/* ---------- шапка и подвал ---------- */
const logo = (tagClass) =>
  group('logo', [
    img(T('brand/logo-mark.svg'), 'Константа', 'logo-mark', { width: '42px', height: '42px', href: H(), linkDestination: 'custom' }),
    group('logo-words', [
      cb('core/site-title', { level: 0, className: 'logo-text' }),
      cb('core/site-tagline', { className: cls('logo-tag', tagClass) }),
    ]),
  ]);

const parts = {
  header: {
    title: 'Шапка сайта',
    blocks: [
      group('site-header', [
        group('container header-inner', [
          logo(),
          cb('core/navigation', { overlayMenu: 'mobile', className: 'nav', layout: { type: 'flex', justifyContent: 'center' } }),
          group('header-cta', [
            p(`<a href="${H('kontakty')}">ООО «Константа»</a>`, 'header-phone'),
            buttons([btn('Оставить заявку', H('kontakty'))]),
          ]),
        ]),
      ], 'header'),
    ],
  },
  footer: {
    title: 'Подвал сайта',
    blocks: [
      group('site-footer', [
        container([
          group('footer-grid', [
            group('footer-brand', [
              logo(),
              p('Энергосервис и учёт электроэнергии: проверки, эксплуатация и установка приборов учёта в Ленинградской области.'),
            ]),
            group('footer-col', [
              h(4, 'Разделы'),
              list([
                ['uslugi', 'Услуги'], ['o-kompanii', 'О компании'], ['geografiya', 'География'],
                ['vakansii', 'Вакансии'], ['sout', 'Результаты СОУТ'], ['kontakty', 'Контакты'],
              ].map(([s, t]) => `<a href="${H(s)}">${t}</a>`)),
            ]),
            group('footer-col', [
              h(4, 'Связь'),
              list(['ООО «Константа»', 'ИНН 5190174883 · ОГРН 1075190021884', '197110, СПб, наб. Песочная, д. 42, лит. А, пом. 3-Н']),
            ]),
          ]),
          group('footer-bottom', [
            p('© 2026 ООО «Константа». ИНН 5190174883'),
            p(`<a href="${H('privacy')}">Политика обработки персональных данных</a>`),
          ]),
        ]),
      ], 'footer'),
      group('cookie-banner', [
        group('container cookie-inner', [
          p(`Сайт использует файлы cookie, чтобы работать стабильнее. Продолжая пользоваться сайтом, вы соглашаетесь с <a href="${H('privacy')}">политикой обработки данных</a>.`),
          buttons([btn('Принимаю', '#', 'primary')]),
        ]),
      ], 'div', { ariaLabel: 'Уведомление о cookie' }),
    ],
  },
};

/* ---------- запись паттернов ---------- */
const out = path.resolve(__dirname, '../konstanta/patterns');
fs.mkdirSync(out, { recursive: true });
let bad = 0;
for (const [key, pg] of Object.entries(pages)) {
  const html = serialize(pg.blocks);
  // проверка: всё, что сериализовали, должно парситься как валидное
  const walk = (bs) => bs.forEach((b) => {
    if (b.name && !b.name.startsWith('konstanta/') && !b.isValid) {
      bad++;
      origError('INVALID', key, b.name, b.validationIssues?.[0]?.args?.slice(0, 3));
    }
    walk(b.innerBlocks || []);
  });
  walk(parse(html));
  const php = html
    .replace(/\{\{T\}\}/g, "<?php echo esc_url( get_theme_file_uri() ); ?>")
    .replace(/\{\{H\}\}/g, "<?php echo esc_url( home_url( '/' ) ); ?>");
  const head = `<?php
/**
 * Title: Страница «${pg.title}»
 * Slug: konstanta/page-${pg.slug}
 * Categories: konstanta-pages
 * Block Types: core/post-content
 * Post Types: page
 * Viewport Width: 1280
 * Description: Полное содержимое страницы «${pg.title}». Сгенерировано wp-theme/tools/build-patterns.cjs.
 */
?>
`;
  fs.writeFileSync(path.join(out, `page-${pg.slug}.php`), head + php + '\n');
  console.log('written', `page-${pg.slug}.php`);
}
for (const [key, pt] of Object.entries(parts)) {
  const html = serialize(pt.blocks);
  const walk = (bs) => bs.forEach((b) => {
    if (b.name && !b.isValid) { bad++; origError('INVALID', key, b.name); }
    walk(b.innerBlocks || []);
  });
  walk(parse(html));
  const php = html
    .replace(/\{\{T\}\}/g, "<?php echo esc_url( get_theme_file_uri() ); ?>")
    .replace(/\{\{H\}\}/g, "<?php echo esc_url( home_url( '/' ) ); ?>");
  fs.writeFileSync(path.join(out, `${key}.php`), `<?php
/**
 * Title: ${pt.title}
 * Slug: konstanta/${key}
 * Inserter: no
 * Description: Содержимое части шаблона «${pt.title}». Сгенерировано wp-theme/tools/build-patterns.cjs.
 */
?>
` + php + '\n');
  console.log('written', `${key}.php`);
}
if (bad) {
  origError(`${bad} invalid blocks`);
  process.exit(1);
}
