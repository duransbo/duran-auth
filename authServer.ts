import { load } from "https://deno.land/std@0.183.0/dotenv/mod.ts";
import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import { getAccessToken, getProfileInfo } from "./googleLogin.ts";

const env = await load();
const clientId = env["CLIENT_ID"] || Deno.env.get("CLIENT_ID");
const clientSecret = env["CLIENT_SECRET"] || Deno.env.get("CLIENT_SECRET");
const redirectURL = env["REDIRECT_URL"] || Deno.env.get("REDIRECT_URL");


const google_oauth_url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
google_oauth_url.searchParams.set("scope", "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email");
google_oauth_url.searchParams.set("redirect_uri", redirectURL || "");
google_oauth_url.searchParams.set("response_type", "code");
google_oauth_url.searchParams.set("client_id", clientId || "");
google_oauth_url.searchParams.set("access_type", "online");

async function render(filePath: string, contextType: string) {
	const file = await Deno.readFile(filePath);

	return new Response(file, {
		headers: { "content-type": contextType }
	});
}

async function router(request: Request): Promise<Response> {
	const url = new URL(request.url, "https://duran-auth.deno.dev");

	switch(url.pathname) {
		case "/":
			//return Response.redirect(google_oauth_url.toString(), 307);
			return new Response(`<a href="${google_oauth_url.toString()}">Login with Google</a>`, {
				headers: { "content-type": "text/html" }
			});
		case "/google-auth":
			const access_token = await getAccessToken(clientId, clientSecret, redirectURL, url.searchParams.get("code"));
			const profile_info = await getProfileInfo(access_token);

			const json = {
				id : profile_info['id'],
				name : profile_info['name'],
				mail : profile_info['mail']
			};

			return new Response(`<script>window.opener.postMessage(${JSON.stringify(json)}, "http://192.168.15.5:7000");</script>`, {
				headers: { "content-type": "text/html" }
			});
		default:
			return render("index.html", "text/html");
	}

	
}

serve(router, { port : 8000 });