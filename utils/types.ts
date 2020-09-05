interface DenoPluginConfig {
  name: string;
  enable: boolean;
  importmap?: string;
}

export interface TsInfoConfig {
  denoTsconfigFile: null | undefined | boolean;

  pluginInstalled: null | undefined | boolean;

  denoPluginConf: DenoPluginConfig | {};

  tsconfigOk: boolean;

  tsconfig: {
    compilerOptions: {
      plugins: any[] | [DenoPluginConfig];
    };
  };

  msg: string;
}

export interface importsInfo {
  [key: string]: {
    [key: string]: {
      url: {
        value: string;
      };
      hash?: {
        value: string;
      };
    };
  };
}

export interface importMap {
  imports: {
    [key: string]: string;
  };
  hash?: {
    [key: string]: string;
  };
}

export interface Deps {
  meta: {
    [key: string]: {
      url: string;
      hash: string;
    };
  };
}
