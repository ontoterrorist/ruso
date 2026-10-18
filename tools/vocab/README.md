# Cómo se armó la lista de 6000 palabras

1. `lemas.py`: toma las formas más frecuentes del ruso de `wordfreq`, las lematiza con `pymorphy3` (repartiendo la frecuencia entre los lemas posibles) y descarta nombres propios, abreviaturas y cifras.
2. `acento.py`: pone una primera marca de acento con `espeak-ng` (ruso 1.51).
3. La traducción, la clase, la nota, el ejemplo y la revisión de cada acento se hicieron a mano por tandas de 700 (`in/partK.tsv` → `out/partK.jsonl`); `check.py K` revisa cada tanda: acentos (una marca por palabra de dos o más sílabas, ninguna en monosílabos ni con ё), campos completos y que el ejemplo contenga la palabra.
4. `build_vocab.py`: une las tandas, quita las descartadas y las repetidas, se queda con las 6000 más frecuentes, busca la posición de la palabra en su ejemplo (para el ejercicio de completar) y escribe `vocab/palabras.js`.

Requiere `pip install wordfreq pymorphy3 pymorphy3-dicts-ru`.
