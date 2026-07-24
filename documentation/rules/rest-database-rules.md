---
description: REST controller, route grouping, dependency wiring, and REST client rules.
---

# REST and Database Wiring Rules

These rules apply to NestJS controllers under `apps/server/src` and their matching
files under `apps/server/rest-client`.

## Grouped routes use a module decorator

Every route group must have a decorator in the owning module's `decorators`
directory. The decorator centralizes the route prefix:

```ts
// decorators/intakes-controller.ts
export const IntakesController = () => Controller('intakes')
```

Controllers in that group use `@IntakesController()` instead of repeating
`@Controller('intakes')`.

## One controller represents one application action

Create one controller class per use case or REST action. A controller must only:

- receive and extract HTTP input;
- translate that input into the use-case request;
- execute the use case;
- return its result.

Validation, domain decisions, database queries, and mapping persisted rows do not
belong in controllers.

## Controllers instantiate use cases once

A controller constructor receives the dependencies required by its use case and
manually instantiates a private, readonly use-case field:

```ts
@IntakesController()
export class ListClientIntakesController {
  private readonly useCase: ListClientIntakesUseCase

  constructor(
    @Inject(INTAKE_REPOSITORIES.intakes)
    intakesRepository: IntakesRepository,
  ) {
    this.useCase = new ListClientIntakesUseCase(intakesRepository)
  }

  @Get('clients/:clientId')
  handle(@Param('clientId') clientId: string) {
    return this.useCase.execute({ clientId })
  }
}
```

Do not inject a use-case class through NestJS and do not instantiate it inside
`handle`. The constructor receives use-case dependencies, not the use case itself.

Repositories must be injected through the module token and typed with the core
interface. Never inject a concrete Drizzle repository into a controller. Shared
providers such as `DatetimeProvider` are regular constructor dependencies.

## Request body types come from the use case

When a controller receives a body, declare only a local `RequestBody` type and
derive it from the use-case `execute` method:

```ts
type RequestBody = Parameters<RegisterIntakeUseCase['execute']>[0]
```

Use it directly in the body parameter:

```ts
handle(@Body() body: RequestBody) {
  return this.useCase.execute(body)
}
```

If a use-case request also contains route or query parameters, derive
`RequestBody` with `Omit` and assemble the complete request in `handle`. Do not
duplicate a request DTO shape that already exists in the use case.

Do not declare aliases such as `RequestParams`, `RequestQuery`, or
`ControllerRequest` merely to rename primitive route inputs. Type those parameters
directly unless a framework DTO is required for validation or transformation.

## Routes reflect resource ownership

Use nested route segments when listing a resource by its owner. For client
intakes, the route is:

```http
GET /intakes/clients/:clientId
```

The route-group prefix remains first, followed by the owner collection and its
identifier. Keep path names plural for collections.

## Every route group has a REST client file

Each controller route group must have a matching `.rest` file under:

```text
apps/server/rest-client/<module>/<route-group>.rest
```

For the `intakes` group, use:

```text
apps/server/rest-client/intake/intakes.rest
```

The file must cover every controller route in that group. Define the base URL and
reusable identifiers once, separate requests with `###`, and give each request a
clear label.

Include the actual method, route parameters, required headers, and a representative
JSON body. Keep the examples synchronized whenever a controller route or request
shape changes.

## Server imports use aliases

Imports between files inside `apps/server/src` must use the `@/` prefix. External
package imports such as `@nestjs/common` and `@hms/core/...` keep their package
paths.

## Shared errors use one global REST handler

The server must register one global error handler during bootstrap. The handler
belongs under `apps/server/src/shared/rest/filters` and must map core shared
errors to HTTP status codes without putting HTTP concerns in `packages/core`:

- `NotFoundError` becomes `404`;
- `ConflictError` becomes `409`;
- other `AppError` instances become `500`.

The response shape is stable and contains `statusCode`, `title`, `message`,
`timestamp`, and `path`. Unknown errors must return a generic internal-error
message and must not expose implementation or database details.
