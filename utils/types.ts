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

export interface Run {
  scripts: {
    [key: string]: string;
  };
  files?: string[];
}
