export const cleanExerciseName = (name: string): string => name.trim().replace(/\s+/g, ' ');

export const normalizeExerciseName = (name: string): string =>
  cleanExerciseName(name).toLowerCase();

export const escapeLikePattern = (value: string): string =>
  value.replace(/[\\%_]/g, (char) => `\\${char}`);
