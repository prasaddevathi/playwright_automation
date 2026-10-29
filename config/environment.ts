export type Environment = 'dev' | 'qa' | 'stage';

export interface EnvironmentConfig {
  env: Environment;
  baseUrl: string;
  apiUrl: string;
  username: string;
  password: string;
}

function resolveEnvironment(): Environment {
  const raw = (process.env.ENV ?? 'dev').toLowerCase();
  if (raw === 'dev' || raw === 'qa' || raw === 'stage') {
    return raw;
  }
  throw new Error(`Unsupported ENV "${raw}". Expected one of: dev, qa, stage.`);
}

function requireEnvVar(name: string, env: Environment): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}" for ENV="${env}". ` +
        `Copy .env.example to .env (or .env.${env}) and fill it in.`,
    );
  }
  return value;
}

const env = resolveEnvironment();

export const config: EnvironmentConfig = {
  env,
  baseUrl: requireEnvVar('BASE_URL', env),
  apiUrl: requireEnvVar('API_URL', env),
  username: requireEnvVar('USERNAME', env),
  password: requireEnvVar('PASSWORD', env),
};
