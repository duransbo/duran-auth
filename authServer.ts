import { serve } from "https://deno.land/std@0.90.0/http/server.ts";
import { load } from "https://deno.land/std/dotenv/mod.ts";
import { renderFileToString } from "https://deno.land/x/dejs@0.10.3/mod.ts";
import { getAccessToken, getProfileInfo } from "./googleLogin.ts"

const env = await load();
const clientId = env["CLIENT_ID"];
const clientSecret = env["CLIENT_SECRET"];
const redirectUrl = env["REDIRECT_URL"];

let google_oauth_url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
google_oauth_url.searchParams.set("scope", "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email");
google_oauth_url.searchParams.set("redirect_uri", redirectUrl);
google_oauth_url.searchParams.set("response_type", "code");
google_oauth_url.searchParams.set("client_id", clientId);
google_oauth_url.searchParams.set("access_type", "online");

console.info("auth server listening on port 8000");
const server = serve({ port: 8000 });

for await (const request of server) {
    let request_url = new URL(request.url, "https://duran-auth.deno.dev:8000");
   
    switch(request_url.pathname) {
    	case "/":
    		// send google oauth url to the template
    		let html = await renderFileToString("views/index.html", { google_oauth_url: google_oauth_url.toString() });
    		request.respond({ status: 200, body: html });
    		break;

    	case "/google-auth":
    		try {
    			let access_token = await getAccessToken(clientId, clientSecret, redirectUrl, request_url.searchParams.get("code"));
    			let profile_info = await getProfileInfo(access_token);
    			
    			// send profile info to the template
    			let html = await renderFileToString("views/google-auth.html", { profile_info: profile_info });
	    		request.respond({ status: 200, body: html });
    		}
			catch(error) {
				// send error message to the template
				let html = await renderFileToString("views/google-auth.html", { error: error.message });
	    		request.respond({ status: 200, body: html });
			}

    		break;
    }
}