import { timingSafeEqual } from "node:crypto";
import type { FastifyInstance } from "fastify";
import {
  NurtureScenarioBindingError,
  type ScenarioBindingOwnerAuthorizer,
} from "@the-nurture/scenario/binding-owner";
import {
  formatScenarioBindingAuthorizeResponse,
  parseScenarioBindingAuthorizeBody,
  SCENARIO_BINDING_ERROR_STATUS,
  SCENARIO_BINDING_OWNER_PATH,
} from "@the-nurture/scenario/binding-owner-http";

export function registerScenarioBindingOwnerRoute(
  fastify: FastifyInstance,
  options: {
    authorizer?: ScenarioBindingOwnerAuthorizer;
    internalServiceToken?: string;
  },
): void {
  fastify.post(SCENARIO_BINDING_OWNER_PATH, async (req, reply) => {
    if (!options.authorizer || !options.internalServiceToken) {
      return reply.code(503).send({ error: "binding_owner_disabled" });
    }
    if (!bearerAuthorized(req.headers.authorization, options.internalServiceToken)) {
      return reply.code(401).send({ error: "service_auth_required" });
    }
    try {
      const receipt = await options.authorizer.authorize(
        parseScenarioBindingAuthorizeBody(req.body),
      );
      return reply.send(formatScenarioBindingAuthorizeResponse(receipt));
    } catch (error) {
      if (error instanceof NurtureScenarioBindingError) {
        return reply
          .code(SCENARIO_BINDING_ERROR_STATUS[error.code])
          .send({ error: error.code });
      }
      return reply.code(500).send({ error: "owner_authorization_unavailable" });
    }
  });
}

function bearerAuthorized(
  header: string | undefined,
  token: string,
): boolean {
  if (!header || !header.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(header.slice("Bearer ".length), "utf8");
  const expected = Buffer.from(token, "utf8");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
