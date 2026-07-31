import {
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
  RequestTimeoutException,
} from "@nestjs/common";
import type { Observable } from "rxjs";
import { throwError, TimeoutError } from "rxjs";
import { catchError, timeout } from "rxjs/operators";

export class RequestTimeoutInterceptor implements NestInterceptor {
  constructor(private readonly timeoutMs: number) {}

  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      timeout(this.timeoutMs),
      catchError((error: unknown) =>
        error instanceof TimeoutError
          ? throwError(
              () =>
                new RequestTimeoutException({ error: "request_timeout" }),
            )
          : throwError(() => error),
      ),
    );
  }
}
