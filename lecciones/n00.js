/* Nivel 0 · Lección 0: el alfabeto y la pronunciación.
   reading: el diálogo y los ejercicios van sin transliteración (hay que leer cirílico);
   hide: Masha dice la palabra y no se ve escrita hasta que eliges la correcta;
   addAlphabet: al terminarla, las 33 letras entran al repaso. */
LEVELS.unshift({ id: 0, ru: "Алфави'т", es: 'Antes de empezar', note: 'Las letras, los sonidos y el acento.' });
LESSONS.unshift({
  id: 'l0', level: 0, ru: "Алфави'т", es: 'El alfabeto y la pronunciación',
  reading: true, addAlphabet: true,
  scene: 'Antes de la primera clase. Masha comparte su pantalla: una pizarra con 33 letras. Algunas parecen latinas. No te fíes.',
  intro: 'Clase cero: leer. El cirílico parece un código secreto, pero en una hora lo lees. Despacio, pero lo lees. Hoy no verás la transliteración: vas a leer de verdad.',
  dialog: [
    { ru: "Приве'т!", es: '¡Hola! Antes de hablar, hay que leer. Son 33 letras. Tranquilo: muchas ya las conoces.', e: 'smirk' },
    { u: [["Приве'т!", '¡Hola!', 'Bien. Acabas de leer tu primera palabra rusa: П-Р-И-В-Е-Т. Ni te diste cuenta.'], ["Пока'!", '¡Chao!', 'No, no. No te vas. Apenas empezamos.']] },
    { n: 'Las amigas: А, К, М, О, Т se leen como en español.' },
    { ru: "Кот.", es: 'Escucha: ¿qué palabra digo? Significa «gato».', hide: true },
    { u: [["Кот", 'kot'], ["Ток", 'tok', 'Esa es ТОК: al revés. Escucha otra vez: К-О-Т.'], ["Так", 'tak', 'Esa es ТАК: tiene А, no О.']] },
    { ru: "Ма'ма.", es: '¿Y esta? Es «mamá».', hide: true },
    { u: [["Ма'ма", 'mama'], ["Ка'ма", 'kama', 'Empieza con К, que es k. «Mamá» empieza con М.'], ["Мо'та", 'mota', 'Mira la segunda letra: es О. «Mamá» lleva А.']] },
    { n: 'Las traicioneras: parecen latinas, pero no lo son. В = v, Н = n, Р = r, С = s, У = u, Х = j, Е = ie.' },
    { ru: "Нос.", es: 'Escucha. Es «nariz». Cuidado: Н es n.', hide: true },
    { u: [["Нос", 'nos'], ["Нот", 'not', 'Termina en Т. «Nariz» termina en С, que es s.'], ["Рос", 'ros', 'Р es r. «Nariz» empieza con Н: n.']] },
    { ru: "Рука'.", es: '¿Y esta? Es «mano». Р es r, У es u.', hide: true },
    { u: [["Рука'", 'ruká'], ["Пука'", 'puká', 'П es p. «Mano» empieza con Р: r.'], ["Ру'ха", 'rúja', 'Х es j. Aquí va К: k.']] },
    { ru: "Хорошо'.", es: 'Una difícil. Es «bien». Х suena como la j española.', hide: true },
    { u: [["Хорошо'", 'jarashó'], ["Корошо'", 'karashó', 'Empieza con Х, que es j: «jarashó».'], ["Хороша'", 'jarashá', 'Mira el final: О, no А.']] },
    { n: 'Las nuevas: Ж (zh), Ш (sh), Щ (sh larga), Ч (ch), Ц (ts), Ы (i profunda), Я (ya), Ю (yu), Ё (yo), Й (i breve).' },
    { ru: "Чай.", es: 'Mi palabra favorita. Es «té». Ч es ch.', hide: true },
    { u: [["Чай", 'chai'], ["Шай", 'shai', 'Ш es sh. «Té» es con Ч: ch.'], ["Цай", 'tsai', 'Ц es ts. «Té» es con Ч.']] },
    { ru: "Я.", es: 'Esta es una sola letra. Es «yo».', hide: true },
    { u: [["Я", 'ya'], ["Ю", 'yu', 'Ю es yu. «Yo» es Я: ya.'], ["Ы", 'y', 'Ы es esa i rara del fondo de la garganta. «Yo» es Я.']] },
    { ru: "Пельме'нь.", es: 'Por último, mi gato. La Ь no suena: ablanda la letra de antes.', hide: true },
    { u: [["Пельме'нь", 'pelmién'], ["Пельме'н", 'pelmén', 'Le falta la Ь, el signo blando, al final.'], ["Пелме'нь", 'pelmén', 'Falta la Ь después de Л.']] },
    { ru: "Молоко'.", es: 'El secreto final: se escribe «moloko», pero suena «malakó». La О sin acento suena casi como A.', e: 'smirk' },
    { u: [["Молоко'", 'leche', 'Se escribe con О y suena «malakó». Esa es la trampa del ruso.'], ["Малако'", 'malakó', 'Así suena, pero no se escribe así. Se escribe con О: молоко.']] },
    { ru: "Молоде'ц. Тепе'рь ты чита'ешь по-ру'сски.", es: 'Bien hecho. Ahora lees en ruso. Despacio, pero lees.', e: 'pleased' },
    { u: [["Спаси'бо!", '¡Gracias!', 'De nada. Las 33 letras van a tu repaso. Te las preguntaré hasta que las sueñes.']] },
  ],
  phrases: [
    ["ма'ма", 'mamá', 'М = m, А = a. Como en español.'],
    ["кот", 'gato', 'К = k, О = o, Т = t.'],
    ["нос", 'nariz', 'Н es n (no h). С es s (no c).'],
    ["рука'", 'mano', 'Р es r. У es u.'],
    ["хорошо'", 'bien', 'Х es la j española. Suena «jarashó».'],
    ["чай", 'té', 'Ч = ch. Й = i breve.'],
    ["я", 'yo', 'Я = ya.'],
    ["нет", 'no', 'Е suena «ie»: «niet».'],
    ["молоко'", 'leche', 'Se escribe moloko, suena «malakó».'],
    ["хлеб", 'pan', 'La Б final suena p: «jliep».'],
  ],
  grammar: {
    id: 'g0', title: 'Cómo suena el ruso',
    body: `<p><b>Las amigas</b>, como en español: [[А]] a · [[К]] k · [[М]] m · [[О]] o · [[Т]] t · [[Э]] e</p>
<p><b>Las traicioneras</b>, que parecen latinas: [[В]] v · [[Н]] n · [[Р]] r · [[С]] s · [[У]] u · [[Х]] j · [[Е]] ie</p>
<p><b>Las nuevas</b>: [[Б]] b · [[Г]] g (de «gato») · [[Д]] d · [[Ж]] zh · [[З]] z · [[И]] i · [[Й]] i breve · [[Л]] l · [[П]] p · [[Ф]] f · [[Ц]] ts · [[Ч]] ch · [[Ш]] sh · [[Щ]] sh larga · [[Ы]] i profunda · [[Ю]] yu · [[Я]] ya · [[Ё]] yo</p>
<p><b>Los signos</b>, que no suenan solos: [[Ь]] ablanda la consonante de antes ([[Пельме'нь]]) y [[Ъ]] separa ([[подъе'зд]]).</p>
<p><b>Tres reglas de pronunciación:</b></p>
<p>1. Cada palabra tiene <b>una sílaba fuerte</b>. En este curso la marco con tilde: [[молоко']], [[ма'ма]]. Los rusos no la escriben.</p>
<p>2. La <b>О sin acento suena casi A</b>: [[молоко']] suena «malakó», [[хорошо']] suena «jarashó». Y la Е sin acento suena casi I: [[сестра']] suena «sistrá».</p>
<p>3. Al final de la palabra, las consonantes <b>se ensordecen</b>: [[хлеб]] suena «jliep», [[год]] suena «got».</p>`,
    drills: [
      { p: '«Н» suena como…', o: ['n', 'h', 'i'], x: 'Н es la n. La h no existe en ruso.' },
      { p: '«Р» suena como…', o: ['r', 'p', 'b'], x: 'Р es la r, vibrante como en español.' },
      { p: '«Х» suena como…', o: ['la j española', 'la x', 'la k'], x: 'Х = j: хлеб, «jliep».' },
      { p: '«В» suena como…', o: ['v (labios y dientes)', 'b', 'u'], x: 'В es la v, con los dientes sobre el labio.' },
      { p: '¿Cuál de estas es «chai» (té)?', o: ["чай", "шай", "цай"], x: 'Ч = ch.' },
      { p: '¿Cuál de estas es «da» (sí)?', o: ["да", "ба", "га"], x: 'Д = d.' },
      { p: '«молоко́» se pronuncia…', o: ['malakó', 'molokó', 'mólako'], x: 'La О sin acento suena casi A.' },
      { p: '«хлеб» (pan) suena al final…', o: ['con p: «jliep»', 'con b: «jlieb»', 'con f: «jlief»'], x: 'Al final de palabra, Б se ensordece: p.' },
    ],
  },
  outro: 'Clase cero terminada. Ya lees cirílico. Las 33 letras van a tu repaso: te las iré preguntando. Mañana, la primera conversación de verdad.',
});
