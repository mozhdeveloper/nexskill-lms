export type SequentialLockItem = {
  id: string;
  type: "lesson" | "quiz";
  completed: boolean;
};

export type SequentialLockModule = {
  id: string;
  isSequential: boolean;
  items: SequentialLockItem[];
};

export const getSequentialLockedItemIds = (
  modules: SequentialLockModule[]
): Set<string> => {
  const locked = new Set<string>();
  let earlierSequentialModulesComplete = true;

  for (const module of modules) {
    if (!module.isSequential) {
      continue;
    }

    if (!earlierSequentialModulesComplete) {
      for (const item of module.items) {
        if (!item.completed) {
          locked.add(item.id);
        }
      }
      continue;
    }

    let foundUncompletedItem = false;
    for (const item of module.items) {
      if (foundUncompletedItem && !item.completed) {
        locked.add(item.id);
      }

      if (!item.completed) {
        foundUncompletedItem = true;
      }
    }

    const moduleComplete = module.items.every((item) => item.completed);
    if (!moduleComplete) {
      earlierSequentialModulesComplete = false;
    }
  }

  return locked;
};