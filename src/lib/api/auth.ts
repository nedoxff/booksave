import { Buffer } from "buffer";
import { TwitterAuthorization } from "./types/internal/TwitterAuthorization";
import { Cookies } from "wxt/browser";

const OAUTH_TOKEN_ENDPOINT = "https://api.x.com/oauth2/token";
export const CONSUMER_AUTH_USERNAME: string = "3nVuSoBZnx6U4vzUxf5w";
export const CONSUMER_AUTH_PASSWORD: string =
    "Bcs59EFbbsdF6Sl9Ng71smgStWEGwXXKSjYvPVt7qys";
const FALLBACK_TOKEN = "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";

const getBearerToken = async (): Promise<string> => {
    console.info("attempting to get the bearer token");

    const authorization = `Basic ${Buffer.from(`${CONSUMER_AUTH_USERNAME}:${CONSUMER_AUTH_PASSWORD}`).toString('base64')}`;
    const response = await fetch(OAUTH_TOKEN_ENDPOINT, {
		method: "POST",
		body: "grant_type=client_credentials",
        credentials: "omit",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
			Authorization: authorization,
		},
	});

    if(!response.ok) {
        console.warn("failed to receive a new bearer token. falling back to the default one");
        return FALLBACK_TOKEN;
    }

    const body = await response.json();
    if(body.token_type !== "bearer") {
        console.warn(`expected token_type to be 'bearer', received '${body.token_type}'. falling back to the default bearer token`);
        return FALLBACK_TOKEN;
    }

    return body.access_token;
}

const getCookieValue = async (name: string): Promise<Cookies.Cookie | null> => {
    return await browser.cookies.get({name: name, url: "https://x.com"});
}

export const getAuthorizationData = async (): Promise<TwitterAuthorization | null> => {
    const authToken = await getCookieValue("auth_token");
    const securityToken = await getCookieValue("ct0");
    const userId = await getCookieValue("twid");
    if(authToken === null || securityToken === null || userId === null) {
        return null;
    }

    const bearerToken = await getBearerToken();
    return {
        authToken: authToken.value,
        securityToken: securityToken.value,
        userId: userId.value.replaceAll("u%3D", ""),
        bearerToken: `Bearer ${bearerToken}`
    } satisfies TwitterAuthorization;
}