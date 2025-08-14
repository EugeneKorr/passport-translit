let corrections: { eng: string, rus: string }[] = [];

export function logCorrection(eng: string, rus: string) {
  corrections.push({ eng, rus });
}

export function getCorrection(eng: string): string | undefined {
  return corrections.find(c => c.eng === eng)?.rus;
}
