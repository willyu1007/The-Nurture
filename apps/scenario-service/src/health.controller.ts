import { Controller, Get } from "@nestjs/common";

@Controller()
export class HealthController {
  @Get("/health")
  health(): Readonly<{ ok: true }> {
    return { ok: true };
  }
}
