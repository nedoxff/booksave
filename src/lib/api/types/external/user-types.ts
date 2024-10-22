import type { RawUser } from "./common-types";

export type RawGetSelfUserResponse = {
  data: {
    viewer: {
      userResult: {
        result: RawUser;
      };
    };
  };
};

export type RawGetUserResponse = {
  data: {
    user_result?: {
      result?: RawUser;
    };
  };
};
