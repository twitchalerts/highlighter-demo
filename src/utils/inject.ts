const runningServices: Record<string, unknown> = {};

// The init function initializes the service with the given constructor arguments (if any).
export function init<TService, TArgs extends any[] = []>(
  ServiceClass: new (...args: TArgs) => TService,
  ...constructorArgs: TArgs
): TService {
  const key = ServiceClass.name;

  if (!runningServices[key]) {
    runningServices[key] = new ServiceClass(...constructorArgs);
  }

  return runningServices[key] as TService;
}

// The inject function retrieves an already initialized service.
export function inject<TService>(ServiceClass: new (...args: any[]) => TService): TService {
  const key = ServiceClass.name;

  const service = runningServices[key];
  if (!service) {
    throw new Error(`Service not initialized: ${ServiceClass.name}`);
  }

  return service as TService;
}

