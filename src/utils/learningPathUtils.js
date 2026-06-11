export function getPathWithSearch(pathname = '', search = '') {
  return `${pathname}${search || ''}`;
}

export function isLearningPathTaskActive(currentActiveTask, pathname = '', search = '') {
  return Boolean(
    currentActiveTask?.path && getPathWithSearch(pathname, search).includes(currentActiveTask.path),
  );
}

export function finishLearningPathTask({
  currentActiveTask,
  completeTask,
  navigate,
  redirectTo = '/tiny-steps',
}) {
  if (!currentActiveTask) {
    return false;
  }

  completeTask(currentActiveTask.id);
  // setActiveTask(null); // Keep it active to restore popup in map
  navigate(redirectTo);
  return true;
}

export function exitLearningPathTask({
  currentActiveTask,
  pathname = '',
  search = '',
  navigate,
  redirectTo = '/tiny-steps',
  fallback = -1,
}) {
  if (isLearningPathTaskActive(currentActiveTask, pathname, search)) {
    // setActiveTask(null); // Keep it active to restore popup in map
    navigate(redirectTo);
    return true;
  }

  if (fallback !== null) {
    navigate(fallback);
  }
  return false;
}
