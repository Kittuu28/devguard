import { createRemoteJWKSet, jwtVerify } from "jose";

const { Auth, HTTPException } = require("@langchain/langgraph-sdk/auth");

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;

const JWKS = createRemoteJWKSet(
  new URL(`https://${AUTH0_DOMAIN}/.well-known/jwks.json`)
);

const auth = new Auth();

auth.authenticate(async (request: Request) => {
  const authHeader = request.headers.get("Authorization");
  const xApiKeyHeader = request.headers.get("x-api-key");

  if (!authHeader && !xApiKeyHeader) {
    throw new HTTPException(401, { message: "Invalid auth header provided." });
  }

  let token = xApiKeyHeader || authHeader;
  if (token && token.startsWith("Bearer ")) {
    token = token.substring(7);
  }

  if (!token) {
    throw new HTTPException(401, { message: "Authorization header format must be Bearer <token>" });
  }

  try {
    console.log("🔑 Verifying token issuer:", `https://${AUTH0_DOMAIN}/`);
    console.log("🔑 Token preview:", token.substring(0, 50));

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://${AUTH0_DOMAIN}/`,
    });

    console.log("✅ Token verified, sub:", payload.sub);

    return {
      identity: payload.sub!,
      permissions: typeof payload.scope === "string" ? payload.scope.split(" ") : [],
      auth_type: "auth0",
      getRawAccessToken: () => token,
      ...payload,
    };
  } catch (jwtError) {
    console.log("❌ JWT error:", jwtError);
    throw new HTTPException(401, { message: "Invalid Authorization token provided." });
  }
});

export { auth as authHandler };