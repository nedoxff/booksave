import type { RawUser } from "./common_types";

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
