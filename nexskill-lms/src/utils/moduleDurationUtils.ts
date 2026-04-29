// Utility to sum lesson durations for a module
export function getModuleDuration(module, durationMap) {
  if (!module.lessons || module.lessons.length === 0) return undefined;
  const totalSeconds = module.lessons
    .filter((l) => l.type === 'lesson')
    .reduce((sum, lesson) => sum + (durationMap.get(lesson.id) || 0), 0);
  if (totalSeconds <= 0) return undefined;
  // Format as mm:ss
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
