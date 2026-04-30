// Utility to sum lesson durations for a module
export function getModuleDuration(module: any, durationMap: Map<string, number>) {
  if (!module.lessons || module.lessons.length === 0) return undefined;
  
  // De-duplicate lesson IDs to prevent doubling if lessons are linked multiple times
  const uniqueLessonIds = [...new Set(
    module.lessons
      .filter((l: any) => l.type === 'lesson')
      .map((l: any) => l.id)
  )];

  const totalSeconds = uniqueLessonIds.reduce((sum, id) => sum + (durationMap.get(id) || 0), 0);
  
  if (totalSeconds <= 0) return undefined;
  
  // Format as mm:ss
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
