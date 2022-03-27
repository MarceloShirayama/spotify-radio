## Project Architecture

### Server

- service: everything that is a business rule or processing;
- controller: intermediate the presentation layer and the business layer;
- routes: presentation layer;
- server: responsible for creating the server, but does not instance it;
- index: instances the server and exposes it to the web (infrastructure side);
- config: everything that is static in the project.
