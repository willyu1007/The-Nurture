import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  Injectable,
} from "@nestjs/common";
import { SafeExceptionFilter } from "./safe-exception.filter.js";

type PrivateResponse = {
  headersSent?: boolean;
  setHeader(name: string, value: string): void;
};

@Catch()
@Injectable()
export class PrivateResponseExceptionFilter implements ExceptionFilter {
  constructor(private readonly safeExceptionFilter: SafeExceptionFilter) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<PrivateResponse>();
    if (!response.headersSent) {
      response.setHeader("Cache-Control", "private, no-store");
      response.setHeader("Pragma", "no-cache");
    }
    this.safeExceptionFilter.catch(exception, host);
  }
}
