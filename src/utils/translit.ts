const translitMap: Record<string, string> = {
  A: 'А', B: 'Б', C: 'К', D: 'Д', E: 'Е', F: 'Ф', G: 'Г',
  H: 'Х', I: 'И', J: 'Ж', K: 'К', L: 'Л', M: 'М', N: 'Н',
  O: 'О', P: 'П', Q: 'К', R: 'Р', S: 'С', T: 'Т', U: 'У',
  V: 'В', W: 'В', X: 'КС', Y: 'Й', Z: 'З',
  YA: 'Я', YO: 'Ё', YE: 'Е', SH: 'Ш', CH: 'Ч', TS: 'Ц'
};

export function transliterate(input: string): string {
  return input.toUpperCase()
    .replace(/YA/g, 'Я')
    .replace(/YO/g, 'Ё')
    .replace(/YE/g, 'Е')
    .replace(/SH/g, 'Ш')
    .replace(/CH/g, 'Ч')
    .replace(/TS/g, 'Ц')
    .split('')
    .map(char => translitMap[char] || char)
    .join('');
}
