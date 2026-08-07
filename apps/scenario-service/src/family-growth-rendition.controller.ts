import type { IncomingMessage, ServerResponse } from "node:http";
import {
  BadRequestException,
  Body,
  type CanActivate,
  Controller,
  type ExecutionContext,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  ServiceUnavailableException,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { familyRenditionRefV1, parseFamilyRenditionRefV1 } from "@the-nurture/db";
import {
  FAMILY_GROWTH_RENDITION_LEASE_TTL_MS,
  mintFamilyRenditionLeaseV1,
  verifyFamilyRenditionLeaseV1,
  type FamilyGrowthRenditionRuntime,
} from "./family-growth-runtime.js";

/**
 * T-009 I5: the rendition exchange (`family_growth_transport@1.0.0` §4/§5).
 * Error taxonomy is the frozen one: 401 `service_unauthorized`,
 * 400 `rendition_ref_invalid`, 404 `rendition_unavailable` (one collapsed
 * answer for unknown/revoked/expired — lifecycle state never leaks here),
 * 503 `rendition_temporarily_unavailable`.
 */

export const FAMILY_GROWTH_RENDITION_RESOLVE_PATH = "/internal/family-growth/renditions/resolve";
export const FAMILY_GROWTH_RENDITION_MEDIA_PATH = "/internal/family-growth/renditions";

export const FAMILY_GROWTH_RENDITION_RUNTIME = "FAMILY_GROWTH_RENDITION_RUNTIME";

@Injectable()
export class FamilyGrowthRenditionAuthGuard implements CanActivate {
  constructor(
    @Inject(FAMILY_GROWTH_RENDITION_RUNTIME)
    private readonly runtime: FamilyGrowthRenditionRuntime,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<IncomingMessage>();
    if (!this.runtime.auth.bearerAuthorized(request.headers.authorization)) {
      throw new UnauthorizedException({ error: "service_unauthorized" });
    }
    return true;
  }
}

@Controller()
@UseGuards(FamilyGrowthRenditionAuthGuard)
export class FamilyGrowthRenditionController {
  constructor(
    @Inject(FAMILY_GROWTH_RENDITION_RUNTIME)
    private readonly runtime: FamilyGrowthRenditionRuntime,
  ) {}

  @Post(FAMILY_GROWTH_RENDITION_RESOLVE_PATH)
  @HttpCode(HttpStatus.OK)
  async resolve(@Body() body: unknown): Promise<{
    url: string;
    expires_at: string;
    content_digest: string;
    mime_type: string;
  }> {
    const ref =
      body && typeof body === "object" && !Array.isArray(body)
        ? (body as { rendition_ref?: unknown }).rendition_ref
        : undefined;
    if (typeof ref !== "string" || !parseFamilyRenditionRefV1(ref)) {
      throw new BadRequestException({ error: "rendition_ref_invalid" });
    }
    const resolved = await this.runtime.resolveRendition(ref);
    if (!resolved) {
      throw new NotFoundException({ error: "rendition_unavailable" });
    }
    if (!this.runtime.leaseKey) {
      throw new ServiceUnavailableException({ error: "rendition_temporarily_unavailable" });
    }
    const expiresAt = new Date(
      this.runtime.now().getTime() + FAMILY_GROWTH_RENDITION_LEASE_TTL_MS,
    );
    const lease = mintFamilyRenditionLeaseV1({
      key: this.runtime.leaseKey,
      assetId: resolved.assetId,
      mediaRevision: resolved.mediaRevision,
      expiresAt,
    });
    return {
      url: `${FAMILY_GROWTH_RENDITION_MEDIA_PATH}/${lease}`,
      expires_at: expiresAt.toISOString(),
      content_digest: resolved.contentDigest,
      mime_type: resolved.contentMimeType,
    };
  }

  @Get(`${FAMILY_GROWTH_RENDITION_MEDIA_PATH}/:lease`)
  async media(
    @Param("lease") lease: string,
    @Req() request: IncomingMessage,
    @Res() response: ServerResponse,
  ): Promise<void> {
    void request;
    if (!this.runtime.leaseKey) {
      throw new ServiceUnavailableException({ error: "rendition_temporarily_unavailable" });
    }
    const verified = verifyFamilyRenditionLeaseV1({
      key: this.runtime.leaseKey,
      token: lease,
      now: this.runtime.now(),
    });
    if (!verified) {
      // Expired and forged leases share the collapsed 404 (§5); a legitimate
      // consumer recovers by re-resolving.
      throw new NotFoundException({ error: "rendition_unavailable" });
    }
    // Re-authorize on every download too: a removal/redaction between
    // resolve and GET must already deny (§4 independent revocation).
    const resolved = await this.runtime.resolveRendition(
      familyRenditionRefV1(verified.assetId, verified.mediaRevision),
    );
    if (!resolved) {
      throw new NotFoundException({ error: "rendition_unavailable" });
    }
    if (!this.runtime.storage) {
      throw new ServiceUnavailableException({ error: "rendition_temporarily_unavailable" });
    }
    let bytes: Uint8Array | null;
    try {
      bytes = await this.runtime.storage.read(resolved.storageRefPayload);
    } catch {
      bytes = null;
    }
    if (!bytes) {
      // An authorized, still-visible rendition whose bytes are unreadable is
      // a backend fault, not a revocation: retriable, never a false 404.
      throw new ServiceUnavailableException({ error: "rendition_temporarily_unavailable" });
    }
    response.statusCode = HttpStatus.OK;
    response.setHeader("content-type", resolved.contentMimeType);
    response.setHeader("content-length", String(bytes.byteLength));
    response.setHeader("cache-control", "no-store");
    response.end(Buffer.from(bytes));
  }
}
