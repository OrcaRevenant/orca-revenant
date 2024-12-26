import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { ResponseUtil } from "../utils/response.util";

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((data) => ResponseUtil.success(data)),
            catchError((err) => {
                throw err;
            }),
        );
    }
}
