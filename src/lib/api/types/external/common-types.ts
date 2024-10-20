export type RawTweet = {
	__typename: "Tweet";
	rest_id: string;
	view_count_info: {
		count?: string;
		state: string;
	};
	legacy: {
		conversation_id_str: string;
		created_at: string;
		display_text_range: number[];
		entities: RawTextEntities & {
			media?: RawTweetMedia[];
		};
		extended_entities?: {
			media?: RawTweetMedia[];
		};
		favorite_count: number;
		favorited: boolean;
		full_text: string;
		is_quote_status: boolean;
		lang: string;
		possibly_sensitive?: boolean;
		possible_sensitive_editable?: boolean;
		quote_count: number;
		reply_count: number;
		retweet_count: number;
		retweeted: boolean;
		user_id_str: string;
		bookmarked: boolean;
		bookmark_count: number;
		retweeted_status_result?: {
			result: RawTweet;
		};
	};
	note_tweet?: {
		is_expandable: boolean;
		note_tweet_results: {
			result: {
				id: string;
				text: string;
				entity_set: RawTextEntities;
			};
		};
	};
	core: {
		user_results: {
			result: RawUser;
		};
	};
	quoted_status_result?: {
		result: RawTweet;
	};
	quick_promote_eligibility: {
		eligibility: string;
	};
	conversation_muted: boolean;
	is_translatable?: boolean;
};

export type RawTextEntities = {
	hashtags: {
		indices: number[];
		text: string;
	}[];
	user_mentions: {
		id_str: string;
		name: string;
		screen_name: string;
		indices: number[];
	}[];
	urls: {
		display_url: string;
		expanded_url: string;
		indices: number[];
		url: string;
	}[];
};

export type RawUser = {
	__typename: "User";
	rest_id: string;
	is_blue_verified: boolean;
	profile_image_shape?: string;
	legacy: {
		can_dm: boolean;
		can_media_tag: boolean;
		following?: boolean;
		want_retweets?: boolean;
		advertiser_account_service_levels?: string[];
		advertiser_account_type: string;
		analytics_type: string;
		created_at: string;
		description: string;
		entities: {
			description: RawTextEntities;
		};
		fast_followers_count: number;
		favourites_count: number;
		followers_count: number;
		friends_count: number;
		geo_enabled: boolean;
		has_custom_timelines: boolean;
		has_extended_profile: boolean;
		id_str: string;
		is_translator: boolean;
		location: string;
		media_count: number;
		name: string;
		normal_followers_count: number;
		pinned_tweet_ids_str: string[];
		profile_background_color: string;
		profile_banner_url?: string;
		profile_image_url_https?: string;
		profile_interstitial_type: string;
		profile_link_color: string;
		protected: boolean;
		screen_name: string;
		statuses_count: number;
		translator_type_enum: string;
		url?: string;
		verified: boolean;
	};
	super_follow_eligible?: boolean;
	super_followed_by?: boolean;
	super_folowing?: boolean;
	private_super_following?: boolean;
	exclusive_tweet_following?: boolean;
};

export type RawTweetMedia = {
	allow_download_status?: {
		allow_download: boolean;
	};
	display_url: string;
	expanded_url: string;
	ext_media_availability?: {
		status: string;
	};
	sizes: Record<
		string,
		{
			h: number;
			w: number;
			resize?: string;
		}
	>;
	id_str: string;
	indices: number[];
	media_key: string;
	media_results?: {
		result: {
			media_key: string;
		};
	};
	media_url_https: string;
	original_info: {
		height: number;
		width: number;
	};
	type: string;
	url: string;
	additional_media_info?: {
		monetizable?: boolean;
		source_user?: {
			user_results: {
				result: RawUser;
			};
		};
	};
	video_info?: {
		aspect_ratio: number[];
		duration_millis: number;
		variants: {
			bitrate?: number;
			content_type: string;
			url: string;
		}[];
	};
};
